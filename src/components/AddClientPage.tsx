import React, { useState, useEffect } from 'react';
import { CRMStore, User } from '../services/store';
import { ArrowLeft } from 'lucide-react';

interface AddClientPageProps {
  onBack: () => void;
}

export const AddClientPage: React.FC<AddClientPageProps> = ({ onBack }) => {
  const [agents, setAgents] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'lead' | 'contacted' | 'viewing' | 'negotiation' | 'closed'>('lead');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [budget, setBudget] = useState('');
  const [propertyInterest, setPropertyInterest] = useState('');
  const [source, setSource] = useState<'Meta Ads' | 'Referral' | 'Website' | 'Outbound' | 'Walk-in'>('Meta Ads');
  const [priority, setPriority] = useState<'hot' | 'warm' | 'cold'>('warm');
  const [clientType, setClientType] = useState<'buyer' | 'seller'>('buyer');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setAgents(CRMStore.getUsers().filter(u => u.role === 'agent'));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !budget.trim() || !propertyInterest.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    const assignedAgent = CRMStore.getUsers().find(u => u.id === assignedAgentId);
    
    CRMStore.addClient({
      name,
      email,
      phone,
      status,
      assignedAgentId,
      assignedAgentName: assignedAgent ? assignedAgent.name : 'Unassigned',
      notes,
      budget,
      propertyInterest,
      source,
      priority,
      clientType,
      reminderDate: null,
      reminderText: null,
      comments: [],
      timeline: []
    });

    onBack();
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '0.5rem' }} title="Back to Clients">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="luxury-title" style={{ fontSize: '2.25rem', fontWeight: 600, color: 'var(--accent-black)', margin: 0 }}>
            Add Luxury Client Profile
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Register a premium real estate lead or client workspace.
          </p>
        </div>
      </div>

      <div className="premium-card" style={{ maxWidth: '750px', backgroundColor: 'white', padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-2" style={{ gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Client Full Name *</label>
              <input required type="text" className="form-input" placeholder="e.g. Vikram Malhotra" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Email Address *</label>
              <input required type="email" className="form-input" placeholder="e.g. vikram@malhotragroup.in" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="grid-2" style={{ gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Phone Number *</label>
              <input required type="text" className="form-input" placeholder="e.g. +91 98110 54321" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Assigned Agent</label>
              <select className="form-input" value={assignedAgentId} onChange={e => setAssignedAgentId(e.target.value)}>
                <option value="">Unassigned</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2" style={{ gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Property Interest *</label>
              <input required type="text" className="form-input" placeholder="e.g. Worli Sea-Facing Duplex" value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Budget / Deal Value *</label>
              <input required type="text" className="form-input" placeholder="e.g. ₹38 Cr" value={budget} onChange={e => setBudget(e.target.value)} />
            </div>
          </div>

          <div className="grid-3" style={{ gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Acquisition Channel</label>
              <select className="form-input" value={source} onChange={e => setSource(e.target.value as any)}>
                <option value="Meta Ads">Meta Ads</option>
                <option value="Referral">Referral</option>
                <option value="Website">Website</option>
                <option value="Outbound">Outbound</option>
                <option value="Walk-in">Walk-in</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Priority Level</label>
              <select className="form-input" value={priority} onChange={e => setPriority(e.target.value as any)}>
                <option value="hot">🔥 Hot</option>
                <option value="warm">⚡ Warm</option>
                <option value="cold">❄️ Cold</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Pipeline Status</label>
              <select className="form-input" value={status} onChange={e => setStatus(e.target.value as any)}>
                <option value="lead">Lead</option>
                <option value="contacted">Contacted</option>
                <option value="viewing">Viewing</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed">Closed (Deal Won)</option>
              </select>
            </div>
          </div>

          <div className="grid-2" style={{ gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Client Profile Type</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type="radio" checked={clientType === 'buyer'} onChange={() => setClientType('buyer')} style={{ cursor: 'pointer' }} />
                  Buyer / Lessee
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type="radio" checked={clientType === 'seller'} onChange={() => setClientType('seller')} style={{ cursor: 'pointer' }} />
                  Seller / Lessor
                </label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Initial Notes / Client Requirements</label>
            <textarea 
              className="form-input" 
              placeholder="Provide client preferences, requirements, location details, etc." 
              rows={4} 
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              style={{ fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onBack} className="btn-secondary" style={{ padding: '0.65rem 1.25rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
              Create Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
