import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, CRMStore } from '../services/store';
import { MessageSquare, Send, ShieldAlert, Users, Sparkles, Trash2, X } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface ChatProps {
  currentUser: User;
}

export const Chat: React.FC<ChatProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeChannel, setActiveChannel] = useState<string>(() => {
    return sessionStorage.getItem('active_chat_channel') || 'aloha-hq';
  });
  const [team, setTeam] = useState<User[]>([]);
  const [deletedForMeIds, setDeletedForMeIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`aloha_deleted_for_me_${currentUser.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [selectedMessageForDelete, setSelectedMessageForDelete] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isUserNearBottom = useRef(true);

  const getDMRecipientName = () => {
    if (!activeChannel.startsWith('dm_')) return '';
    const parts = activeChannel.split('_');
    const otherId = parts[1] === currentUser.id ? parts[2] : parts[1];
    const otherUser = team.find(u => u.id === otherId);
    return otherUser ? otherUser.name : 'Private Chat';
  };

  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
      if (data && !error) {
        setMessages(data.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id || 'system',
          senderName: m.sender_name,
          senderRole: m.sender_role,
          text: m.text,
          timestamp: m.created_at,
          channel: m.channel
        })));
      }
    } catch (e) {
      console.warn('Failed to fetch Chat history from Supabase:', e);
    }
  };

  const handleDeleteForMe = (messageId: string) => {
    const updated = [...deletedForMeIds, messageId];
    setDeletedForMeIds(updated);
    localStorage.setItem(`aloha_deleted_for_me_${currentUser.id}`, JSON.stringify(updated));
    CRMStore.addLog(currentUser.name, `Deleted a chat message for self`);
  };

  const handleDeleteForEveryone = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      
      setMessages(prev => prev.filter(m => m.id !== messageId));
      CRMStore.addLog(currentUser.name, `Deleted a chat message for everyone`);
    } catch (err) {
      console.error('Failed to delete message for everyone:', err);
      alert('Failed to delete message for everyone. Please try again.');
    }
  };

  useEffect(() => {
    setTeam(CRMStore.getUsers());
    fetchChatHistory();

    // Clean up any existing channel with the same name first to prevent duplicates
    try {
      const activeChannelInst = supabase.channel('realtime-chat-room');
      if (activeChannelInst) {
        supabase.removeChannel(activeChannelInst);
      }
    } catch (e) {
      // ignore
    }

    const chatSubscription = supabase
      .channel('realtime-chat-room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const dbMsg = payload.new;
          const newMsg = {
            id: dbMsg.id,
            senderId: dbMsg.sender_id || 'system',
            senderName: dbMsg.sender_name,
            senderRole: dbMsg.sender_role,
            text: dbMsg.text,
            timestamp: dbMsg.created_at,
            channel: dbMsg.channel
          };

          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setMessages(prev => prev.filter(m => m.id !== deletedId));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatSubscription);
    };
  }, [activeChannel]);

  const filteredMessages = messages.filter(
    m => m.channel === activeChannel && !deletedForMeIds.includes(m.id)
  );

  const scrollToBottom = (smooth: boolean = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
    }
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const threshold = 100; // pixels from bottom
      isUserNearBottom.current = scrollHeight - scrollTop - clientHeight < threshold;
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (isUserNearBottom.current) {
      scrollToBottom(true);
    }
  }, [filteredMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText('');

    const tempId = 'msg_' + Math.random().toString(36).substr(2, 9);
    const newMsg: ChatMessage = {
      id: tempId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text,
      timestamp: new Date().toISOString(),
      channel: activeChannel
    };

    // Optimistically update UI
    setMessages(prev => [...prev, newMsg]);

    try {
      // Save directly to Supabase messages table
      const { error } = await supabase.from('messages').insert({
        id: tempId,
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        sender_role: currentUser.role,
        text,
        channel: activeChannel
      });

      if (error) {
        throw error;
      }
      CRMStore.addLog(currentUser.name, `Sent chat message in #${activeChannel}: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
    } catch (err) {
      console.error('Failed to send real-time message:', err);
      // Rollback on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(text);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1rem'
      }}>
        <h1 className="luxury-title" style={{ fontSize: '2.25rem', fontWeight: 600, color: 'var(--accent-black)' }}>
          General Boardroom Chat
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
          Broadcasting secure team chat across Aloha Estates agencies.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '1.5rem', height: '550px' }} className="chat-layout">
        
        {/* Chat interface */}
        <div className="chat-container">
          <div className="chat-header">
            <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} /> {activeChannel.startsWith('dm_') ? `Chat with ${getDMRecipientName()}` : `#${activeChannel}`}
            </span>
            <span className="badge badge-green" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span className="status-dot active"></span> Encrypted Channels
            </span>
          </div>

          <div className="chat-messages" ref={messagesContainerRef}>
            {filteredMessages.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-secondary)',
                gap: '0.5rem'
              }}>
                <MessageSquare size={36} strokeWidth={1} />
                <span style={{ fontSize: '0.85rem' }}>
                  {activeChannel.startsWith('dm_') 
                    ? `No direct messages with ${getDMRecipientName()} yet.` 
                    : `No messages in #${activeChannel} yet.`}
                </span>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMyMessage = msg.senderId === currentUser.id;
                return (
                  <div 
                    key={msg.id} 
                    className={`message-bubble ${isMyMessage ? 'outgoing' : 'incoming'}`}
                  >
                    <div className={`message-sender ${isMyMessage ? 'outgoing' : 'incoming'}`}>
                      {msg.senderName}
                      <span className={`badge ${
                        msg.senderRole === 'superadmin' ? 'badge-black' : 'badge-gray'
                      }`} style={{ 
                        fontSize: '0.55rem', 
                        padding: '0.05rem 0.3rem', 
                        textTransform: 'uppercase',
                        borderColor: isMyMessage ? 'rgba(255,255,255,0.3)' : 'var(--border-color)',
                        backgroundColor: isMyMessage ? 'rgba(255,255,255,0.1)' : 'var(--bg-secondary)',
                        color: isMyMessage ? '#fff' : 'inherit'
                      }}>
                        {msg.senderRole === 'superadmin' ? 'Founder' : 'Agent'}
                      </span>
                    </div>
                  {selectedMessageForDelete?.id === msg.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.25rem 0', minWidth: '180px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.9 }}>Delete Message?</span>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <button 
                          type="button" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleDeleteForMe(msg.id); 
                            setSelectedMessageForDelete(null); 
                          }}
                          className="btn-secondary"
                          style={{ 
                            padding: '0.15rem 0.4rem', 
                            fontSize: '0.7rem', 
                            backgroundColor: isMyMessage ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                            borderColor: isMyMessage ? 'rgba(255,255,255,0.4)' : 'var(--border-color)',
                            color: isMyMessage ? 'white' : 'inherit'
                          }}
                        >
                          For Me
                        </button>
                        {(msg.senderId === currentUser.id || currentUser.role === 'superadmin') && (
                          <button 
                            type="button" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleDeleteForEveryone(msg.id); 
                              setSelectedMessageForDelete(null); 
                            }}
                            className="btn-primary"
                            style={{ 
                              padding: '0.15rem 0.4rem', 
                              fontSize: '0.7rem', 
                              backgroundColor: isMyMessage ? '#fff' : 'var(--accent-black)',
                              color: isMyMessage ? 'var(--accent-black)' : '#fff',
                              borderColor: isMyMessage ? '#fff' : 'var(--accent-black)'
                            }}
                          >
                            For Everyone
                          </button>
                        )}
                        <button 
                          type="button" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedMessageForDelete(null); 
                          }}
                          className="btn-secondary"
                          style={{ 
                            padding: '0.15rem 0.4rem', 
                            fontSize: '0.7rem',
                            border: 'none',
                            background: 'none',
                            color: isMyMessage ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>{msg.text}</div>
                  )}
                    <div className="message-timestamp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMessageForDelete(msg);
                        }} 
                        className="delete-message-btn"
                        title="Delete message"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-area">
            <input
              type="text"
              className="form-input"
              placeholder={`Send message to #${activeChannel}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{ fontSize: '0.9rem' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.75rem' }}>
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Sidebar Info - Channels and Active Members */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="chat-sidebar">
          
          <div className="premium-card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Active Workspace</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div 
                onClick={() => setActiveChannel('aloha-hq')}
                style={{
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: activeChannel === 'aloha-hq' ? 'var(--bg-secondary)' : 'transparent',
                  fontSize: '0.8rem',
                  fontWeight: activeChannel === 'aloha-hq' ? 600 : 500,
                  color: 'var(--accent-black)',
                  cursor: 'pointer',
                  border: activeChannel === 'aloha-hq' ? '1px solid var(--border-color)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                # aloha-hq-broadcasting
              </div>
              <div 
                onClick={() => setActiveChannel('marketing-leads')}
                style={{
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: activeChannel === 'marketing-leads' ? 'var(--bg-secondary)' : 'transparent',
                  fontSize: '0.8rem',
                  fontWeight: activeChannel === 'marketing-leads' ? 600 : 500,
                  color: 'var(--accent-black)',
                  cursor: 'pointer',
                  border: activeChannel === 'marketing-leads' ? '1px solid var(--border-color)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                # marketing-meta-leads
              </div>
              <div 
                onClick={() => setActiveChannel('deals-vault')}
                style={{
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: activeChannel === 'deals-vault' ? 'var(--bg-secondary)' : 'transparent',
                  fontSize: '0.8rem',
                  fontWeight: activeChannel === 'deals-vault' ? 600 : 500,
                  color: 'var(--accent-black)',
                  cursor: 'pointer',
                  border: activeChannel === 'deals-vault' ? '1px solid var(--border-color)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                # closing-deals-vault
              </div>
            </div>
          </div>

          {/* Direct Messages (DMs) */}
          <div className="premium-card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={14} /> Direct Messages (DMs)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {team.filter(u => u.id !== currentUser.id).map(member => {
                const sortedIds = [currentUser.id, member.id].sort();
                const dmChannelId = `dm_${sortedIds[0]}_${sortedIds[1]}`;
                const isActive = activeChannel === dmChannelId;
                return (
                  <div 
                    key={member.id}
                    onClick={() => setActiveChannel(dmChannelId)}
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderRadius: '6px',
                      backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 600 : 500,
                      color: 'var(--accent-black)',
                      cursor: 'pointer',
                      border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{member.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem' }}>
                      <span className={`status-dot ${member.checkedIn ? 'active' : 'inactive'}`} style={{ width: '6px', height: '6px' }}></span>
                      <span style={{ color: member.checkedIn ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {member.checkedIn ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="premium-card" style={{ padding: '1rem', flex: 1 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={14} style={{ color: 'var(--accent-orange)' }} /> Interactive AI Sandbox
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.4' }}>
              This chat board simulates full team activity. Sending messages triggers instant replies from the team to mock high-velocity real estate operations.
            </p>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              alignItems: 'flex-start',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}>
              <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>Multi-window sync is supported. If logged in elsewhere, messages update instantly.</span>
            </div>
          </div>

        </div>

      </div>



    </div>
  );
};
