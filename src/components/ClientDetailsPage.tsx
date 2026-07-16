import React, { useState, useEffect } from 'react';
import { CRMStore, Client, User, WhatsAppTemplate } from '../services/store';
import { ArrowLeft, Calendar, Clock, MessageSquare, Send, Sparkles, User as UserIcon, Users, CheckCircle, ShieldAlert } from 'lucide-react';

interface ClientDetailsPageProps {
  clientId: string;
  onBack: () => void;
  currentUser: User;
}

export const ClientDetailsPage: React.FC<ClientDetailsPageProps> = ({ clientId, onBack, currentUser }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  
  // Detail Editor States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Client['status']>('lead');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [budget, setBudget] = useState('');
  const [propertyInterest, setPropertyInterest] = useState('');
  const [source, setSource] = useState<Client['source']>('Direct' as any);
  const [priority, setPriority] = useState<Client['priority']>('warm');
  const [clientType, setClientType] = useState<Client['clientType']>('buyer');
  
  // Comment State
  const [commentText, setCommentText] = useState('');
  
  // Reminder States
  const [reminderDate, setReminderDate] = useState('');
  const [reminderText, setReminderText] = useState('');
  
  // WhatsApp States
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [whatsappPreview, setWhatsappPreview] = useState('');

  const loadData = () => {
    const clients = CRMStore.getClients();
    const c = clients.find(item => item.id === clientId);
    if (c) {
      setClient(c);
      setName(c.name);
      setEmail(c.email);
      setPhone(c.phone);
      setStatus(c.status);
      setAssignedAgentId(c.assignedAgentId);
      setBudget(c.budget);
      setPropertyInterest(c.propertyInterest);
      setSource(c.source);
      setPriority(c.priority);
      setClientType(c.clientType);
      
      if (c.reminderDate) {
        // Convert to local datetime-local format: YYYY-MM-DDTHH:mm
        const dateObj = new Date(c.reminderDate);
        const tzoffset = dateObj.getTimezoneOffset() * 60000; //offset in milliseconds
        const localISOTime = (new Date(dateObj.getTime() - tzoffset)).toISOString().slice(0, 16);
        setReminderDate(localISOTime);
      } else {
        setReminderDate('');
      }
      setReminderText(c.reminderText || '');
    }
  };

  useEffect(() => {
    loadData();
    setAgents(CRMStore.getUsers().filter(u => u.role === 'agent'));
    setTemplates(CRMStore.getWhatsAppTemplates());
  }, [clientId]);

  // Update WhatsApp Preview when template or client details change
  useEffect(() => {
    if (!selectedTemplateId || !client) {
      setWhatsappPreview('');
      return;
    }
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    let text = template.text;
    text = text.replace('{{clientName}}', client.name);
    text = text.replace('{{agentName}}', client.assignedAgentName || 'your agent');
    text = text.replace('{{interest}}', client.propertyInterest);
    text = text.replace('{{budget}}', client.budget);
    setWhatsappPreview(text);
  }, [selectedTemplateId, client, templates]);

  if (!client) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Luxury client profile not found.</p>
        <button onClick={onBack} className="btn-primary">Back to Directory</button>
      </div>
    );
  }

  const handleUpdateDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedAgent = CRMStore.getUsers().find(u => u.id === assignedAgentId);
    
    CRMStore.updateClient(client.id, {
      name,
      email,
      phone,
      status,
      assignedAgentId,
      assignedAgentName: assignedAgent ? assignedAgent.name : 'Unassigned',
      budget,
      propertyInterest,
      source,
      priority,
      clientType
    }, currentUser.name);
    
    alert('Client details saved successfully.');
    loadData();
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    CRMStore.addClientComment(client.id, commentText, currentUser.name);
    setCommentText('');
    loadData();
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderDate || !reminderText.trim()) {
      alert('Please specify both reminder date and description.');
      return;
    }

    CRMStore.setClientReminder(client.id, new Date(reminderDate).toISOString(), reminderText, currentUser.name);
    alert('Reminder scheduled.');
    loadData();
  };

  const handleClearReminder = () => {
    CRMStore.setClientReminder(client.id, null, null, currentUser.name);
    alert('Reminder cleared.');
    loadData();
  };

  const handleSnoozeReminder = () => {
    if (!client.reminderDate) return;
    const current = new Date(client.reminderDate);
    current.setDate(current.getDate() + 1);
    CRMStore.setClientReminder(client.id, current.toISOString(), client.reminderText || 'Follow up', currentUser.name);
    alert('Reminder snoozed for 24 hours.');
    loadData();
  };

  const handleSendWhatsAppMock = () => {
    if (!whatsappPreview) return;
    
    // Log WhatsApp action to timeline
    const timelineEventText = `WhatsApp Follow-up Message Sent via templates portal ("${templates.find(t => t.id === selectedTemplateId)?.name}")`;
    const newTimeline = [
      {
        id: 'ev_' + Math.random().toString(36).substr(2, 9),
        type: 'whatsapp_sent' as const,
        text: timelineEventText,
        timestamp: new Date().toISOString(),
        userName: currentUser.name
      },
      ...(client.timeline || [])
    ];

    CRMStore.updateClient(client.id, { timeline: newTimeline });
    CRMStore.addLog(currentUser.name, `Sent WhatsApp template [${templates.find(t => t.id === selectedTemplateId)?.name}] to client ${client.name}`);
    
    // Show mock notification
    alert(`[WhatsApp Client Gateway - Sync Successful]\nMessage sent to ${client.phone}:\n\n"${whatsappPreview}"`);
    
    // Clear selection
    setSelectedTemplateId('');
    loadData();
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.05rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexShrink: 0 }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '0.5rem' }} title="Back">
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`badge ${
              priority === 'hot' ? 'badge-red' :
              priority === 'warm' ? 'badge-orange' : 'badge-gray'
            }`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
              {priority}
            </span>
            <span className="badge badge-black" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
              {clientType}
            </span>
          </div>
          <h1 className="luxury-title" style={{ fontSize: '2.1rem', fontWeight: 600, color: 'var(--accent-black)', margin: '0.15rem 0 0' }}>
            {client.name} — Client Workspace
          </h1>
        </div>
      </div>

      {/* 3-Column CRM Grid Layout */}
      <div className="grid-3" style={{ gridTemplateColumns: '1.2fr 1.6fr 1.2fr', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT COLUMN: Profile Details Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.2rem' }}>
          <div className="premium-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
              <UserIcon size={14} /> Profile Information
            </h3>
            
            <form onSubmit={handleUpdateDetails} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Full Name</label>
                <input required type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} style={{ padding: '0.45rem', fontSize: '0.8rem' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Email Address</label>
                <input required type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '0.45rem', fontSize: '0.8rem' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Phone Number</label>
                <input required type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: '0.45rem', fontSize: '0.8rem' }} />
              </div>
              
              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Assigned Agent</label>
                <select className="form-input" value={assignedAgentId} onChange={e => setAssignedAgentId(e.target.value)} style={{ padding: '0.45rem', fontSize: '0.8rem' }}>
                  <option value="">Unassigned</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2" style={{ gap: '0.5rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Budget</label>
                  <input required type="text" className="form-input" value={budget} onChange={e => setBudget(e.target.value)} style={{ padding: '0.45rem', fontSize: '0.8rem' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Priority</label>
                  <select className="form-input" value={priority} onChange={e => setPriority(e.target.value as any)} style={{ padding: '0.45rem', fontSize: '0.8rem' }}>
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="cold">Cold</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Property Interest</label>
                <input required type="text" className="form-input" value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} style={{ padding: '0.45rem', fontSize: '0.8rem' }} />
              </div>

              <div className="grid-2" style={{ gap: '0.5rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Status</label>
                  <select className="form-input" value={status} onChange={e => setStatus(e.target.value as any)} style={{ padding: '0.45rem', fontSize: '0.8rem' }}>
                    <option value="lead">Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="viewing">Viewing</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Source</label>
                  <select className="form-input" value={source} onChange={e => setSource(e.target.value as any)} style={{ padding: '0.45rem', fontSize: '0.8rem' }}>
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="Referral">Referral</option>
                    <option value="Website">Website</option>
                    <option value="Outbound">Outbound</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                Save Profile Changes
              </button>
            </form>
          </div>
        </div>

        {/* MIDDLE COLUMN: Notes / comments & timeline log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.2rem' }}>
          
          {/* Add Note Form */}
          <div className="premium-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
              <MessageSquare size={14} /> Interaction Notes & Comments
            </h3>
            
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
              <textarea
                required
                className="form-input"
                placeholder="Log call summary, client feedback, negotiation updates..."
                rows={2}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                style={{ fontSize: '0.8rem', resize: 'vertical', fontFamily: 'inherit' }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.5rem' }}>
                <Send size={16} />
              </button>
            </form>

            {/* Comments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', maxHeight: '180px', overflowY: 'auto' }}>
              {client.comments?.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>No interaction comments logged yet.</p>
              ) : (
                client.comments?.map((c, i) => (
                  <div key={i} style={{ border: '1px solid var(--border-color)', padding: '0.6rem 0.75rem', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '0.15rem' }}>
                      <span>{c.author}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{new Date(c.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div>"{c.text}"</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Interactive Timeline Feed */}
          <div className="premium-card" style={{ flex: 1, padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
              <Clock size={14} /> Client Timeline History
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '250px' }}>
              {client.timeline?.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No events recorded.</p>
              ) : (
                client.timeline?.map((evt, idx) => (
                  <div key={evt.id || idx} style={{
                    borderLeft: evt.type === 'whatsapp_sent' ? '2px solid var(--accent-green, #10b981)' : '2px solid var(--accent-black)',
                    paddingLeft: '0.65rem',
                    fontSize: '0.75rem'
                  }}>
                    <div style={{ color: 'var(--text-primary)' }}>
                      <strong>{evt.userName}</strong>: {evt.text}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>
                      {new Date(evt.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Follow-up Reminder & WhatsApp Templates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.2rem' }}>
          
          {/* Reminder Card */}
          <div className="premium-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
              <Calendar size={14} /> Follow-up Reminder
            </h3>

            {client.reminderDate ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ backgroundColor: 'rgba(255, 149, 0, 0.08)', border: '1px dashed var(--accent-orange)', padding: '0.6rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 600 }}>Due: {new Date(client.reminderDate).toLocaleString()}</div>
                  <div style={{ marginTop: '0.2rem', color: 'var(--text-primary)' }}>"{client.reminderText}"</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button type="button" onClick={handleSnoozeReminder} className="btn-secondary" style={{ padding: '0.4rem', fontSize: '0.7rem', justifyContent: 'center' }}>Snooze 1 Day</button>
                  <button type="button" onClick={handleClearReminder} className="btn-secondary" style={{ padding: '0.4rem', fontSize: '0.7rem', justifyContent: 'center', color: '#dc2626' }}>Dismiss</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveReminder} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 600 }}>Due Date & Time</label>
                  <input required type="datetime-local" className="form-input" value={reminderDate} onChange={e => setReminderDate(e.target.value)} style={{ padding: '0.35rem', fontSize: '0.75rem' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 600 }}>Task Note</label>
                  <input required type="text" className="form-input" placeholder="Call client back, arrange site tour..." value={reminderText} onChange={e => setReminderText(e.target.value)} style={{ padding: '0.35rem', fontSize: '0.75rem' }} />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '0.45rem', fontSize: '0.75rem', justifyContent: 'center' }}>
                  Set Reminder
                </button>
              </form>
            )}
          </div>

          {/* WhatsApp Card */}
          <div className="premium-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ color: '#10b981' }}>
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.644 1.97 14.178.95c-5.443 0-9.859 4.37-9.863 9.8-.001 1.83.488 3.619 1.416 5.176l-.988 3.606 3.692-.958zm12.333-6.626c-.33-.164-1.953-.952-2.253-1.061-.3-.11-.518-.164-.736.164-.218.329-.844 1.061-1.034 1.28-.19.219-.38.247-.71.082-.33-.164-1.393-.506-2.653-1.619-.98-.862-1.928-1.834-2.256-.192-.328-.02-.505.145-.668.148-.147.33-.383.495-.575.165-.192.22-.328.33-.548.11-.219.055-.41-.028-.574-.082-.164-.736-1.751-1.008-2.403-.265-.637-.53-.55-.736-.56-.189-.01-.408-.01-.626-.01-.218 0-.573.081-.873.41-.3.328-1.146 1.108-1.146 2.7 0 1.59 1.173 3.125 1.336 3.344.164.22 2.308 3.475 5.59 4.877.78.332 1.39.53 1.867.68.784.246 1.498.211 2.062.127.629-.094 1.953-.787 2.226-1.546.272-.76.272-1.411.19-1.547-.082-.136-.3-.218-.63-.382z"/>
              </svg> WhatsApp Campaign Sync
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.7rem', fontWeight: 600 }}>Message Template</label>
                <select className="form-input" value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} style={{ padding: '0.35rem', fontSize: '0.75rem' }}>
                  <option value="">Select a template...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {whatsappPreview && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600 }}>Filled Template Preview</label>
                    <div style={{
                      backgroundColor: '#e7f8f2',
                      border: '1px solid #ccefe3',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.75rem',
                      color: '#1f2937',
                      lineHeight: '1.4',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {whatsappPreview}
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={handleSendWhatsAppMock} 
                    className="btn-primary" 
                    style={{ 
                      padding: '0.45rem', 
                      fontSize: '0.75rem', 
                      justifyContent: 'center',
                      backgroundColor: '#10b981',
                      borderColor: '#10b981'
                    }}
                  >
                    Send Template Message
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
