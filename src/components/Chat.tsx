import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, CRMStore } from '../services/store';
import { MessageSquare, Send, ShieldAlert, Users, Sparkles } from 'lucide-react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = () => {
    setMessages(CRMStore.getMessages());
  };

  const getDMRecipientName = () => {
    if (!activeChannel.startsWith('dm_')) return '';
    const parts = activeChannel.split('_');
    const otherId = parts[1] === currentUser.id ? parts[2] : parts[1];
    const otherUser = team.find(u => u.id === otherId);
    return otherUser ? otherUser.name : 'Private Chat';
  };

  useEffect(() => {
    const handleSync = () => {
      loadMessages();
      setTeam(CRMStore.getUsers());
    };

    handleSync();
    sessionStorage.removeItem('active_chat_channel');
    
    // Set interval to poll messages in localStorage (handles chat syncing if open in multiple tabs)
    const interval = setInterval(handleSync, 1500);
    
    window.addEventListener('storage', handleSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const filteredMessages = messages.filter(
    m => m.channel === activeChannel
  );

  useEffect(() => {
    // Auto scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText('');

    CRMStore.sendMessage(currentUser.id, text, activeChannel);
    loadMessages();
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

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '1.5rem', height: '550px' }}>
        
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

          <div className="chat-messages">
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
                    <div>{msg.text}</div>
                    <div className="message-timestamp">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="premium-card" style={{ padding: '1.25rem' }}>
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
          <div className="premium-card" style={{ padding: '1.25rem' }}>
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

          <div className="premium-card" style={{ padding: '1.25rem', flex: 1 }}>
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
