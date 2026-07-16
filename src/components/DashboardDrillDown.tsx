import React, { useState, useEffect } from 'react';
import { CRMStore, Client, User } from '../services/store';
import { ArrowLeft, Search, Sparkles, TrendingUp, Users, Megaphone, Clock } from 'lucide-react';

interface DashboardDrillDownProps {
  type: 'sales' | 'pipeline' | 'meta' | 'agents' | 'funnel' | 'source';
  meta?: any;
  onBack: () => void;
  currentUser: User;
}

export const DashboardDrillDown: React.FC<DashboardDrillDownProps> = ({ type, meta, onBack, currentUser }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = () => {
    setClients(CRMStore.getClients());
    setTeam(CRMStore.getUsers());
  };

  useEffect(() => {
    loadData();
  }, [type, meta]);

  const handleToggleAgentCheckIn = (agentId: string) => {
    CRMStore.toggleCheckIn(agentId);
    loadData();
  };

  const handleUpdateClientStatus = (clientId: string, newStatus: Client['status']) => {
    CRMStore.updateClientStatus(clientId, newStatus, currentUser.name);
    loadData();
  };

  const handleSimulateWebhookLead = () => {
    const newL = CRMStore.simulateMetaLead();
    loadData();
    alert(`⚡ Mock Webhook Triggered!\nNew Meta Lead Registered: ${newL.name}\nAssigned Agent: ${newL.assignedAgentName}`);
  };

  // Helper to parse crores
  const parseBudgetValue = (budgetStr: string): number => {
    if (!budgetStr) return 0;
    const numbers = budgetStr.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      const nums = numbers.map(Number);
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    }
    return 0;
  };

  // Calculations
  const closedClients = clients.filter(c => c.status === 'closed');
  const totalClosedVal = closedClients.reduce((acc, c) => acc + parseBudgetValue(c.budget), 0);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '0.5rem' }} title="Back to Dashboard">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="luxury-title" style={{ fontSize: '2.25rem', fontWeight: 600, color: 'var(--accent-black)', margin: 0 }}>
            {type === 'sales' && 'Closed Sales Revenue Volume (YTD)'}
            {type === 'pipeline' && 'Active Client Pipeline'}
            {type === 'meta' && 'Facebook Meta Campaigns Integration'}
            {type === 'agents' && 'Aloha Estates Agent Directory'}
            {type === 'funnel' && `Funnel Stage: ${meta?.stage.toUpperCase()}`}
            {type === 'source' && `Acquisition Source: ${meta?.source}`}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            {type === 'sales' && 'Chronological log of won deals and company closed volume.'}
            {type === 'pipeline' && 'Roster of active luxury buyers and sellers currently in discussion.'}
            {type === 'meta' && 'Meta ad spend, lead conversions, impressions, and live sync panel.'}
            {type === 'agents' && 'Roster check-in states, shifted hours, and checked-in logs.'}
            {type === 'funnel' && `Detailed active pipelines matching the funnel stage ${meta?.stage.toUpperCase()}.`}
            {type === 'source' && `Segmented view of lead conversion performance originating from ${meta?.source}.`}
          </p>
        </div>
      </div>

      {/* Main Card Content */}
      <div className="premium-card" style={{ maxWidth: '850px', backgroundColor: 'white', padding: '2rem' }}>
        
        {/* 1. SALES DRILLDOWN */}
        {type === 'sales' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Client</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Property Interest</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Budget / Deal Value</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Assigned Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {closedClients.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No closed transactions recorded.</td>
                    </tr>
                  ) : (
                    closedClients.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                        <td style={{ padding: '0.8rem 1rem', fontWeight: 600 }}>{c.name}</td>
                        <td style={{ padding: '0.8rem 1rem' }}>{c.propertyInterest}</td>
                        <td style={{ padding: '0.8rem 1rem', textAlign: 'right', fontWeight: 700 }}>{c.budget}</td>
                        <td style={{ padding: '0.8rem 1rem' }}>{c.assignedAgentName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0.5rem', fontWeight: 700, fontSize: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <span>Total Volume (YTD):</span>
              <span>₹{totalClosedVal} Cr</span>
            </div>
          </div>
        )}

        {/* 2. PIPELINE DRILLDOWN */}
        {type === 'pipeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', border: '1px solid var(--border-color)', padding: '0.5rem 0.75rem', borderRadius: '6px', maxWidth: '400px' }}>
              <Search size={16} style={{ color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Search active pipeline by name or property..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem' }}
              />
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Client</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Property Interest</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Pipeline Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Budget</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Assigned Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {clients
                    .filter(c => c.status !== 'closed')
                    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.propertyInterest.toLowerCase().includes(searchTerm.toLowerCase()))
                    .length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No active clients match search.</td>
                      </tr>
                    ) : (
                      clients
                        .filter(c => c.status !== 'closed')
                        .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.propertyInterest.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(c => (
                          <tr key={c.id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                            <td style={{ padding: '0.8rem 1rem', fontWeight: 600 }}>{c.name}</td>
                            <td style={{ padding: '0.8rem 1rem' }}>{c.propertyInterest}</td>
                            <td style={{ padding: '0.8rem 1rem' }}>
                              <select 
                                value={c.status} 
                                onChange={(e) => handleUpdateClientStatus(c.id, e.target.value as any)}
                                style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                              >
                                <option value="lead">Lead</option>
                                <option value="contacted">Contacted</option>
                                <option value="viewing">Viewing</option>
                                <option value="negotiation">Negotiation</option>
                                <option value="closed">Closed (Won)</option>
                              </select>
                            </td>
                            <td style={{ padding: '0.8rem 1rem', textAlign: 'right', fontWeight: 600 }}>{c.budget}</td>
                            <td style={{ padding: '0.8rem 1rem' }}>{c.assignedAgentName}</td>
                          </tr>
                        ))
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. META CAMPAIGNS DRILLDOWN */}
        {type === 'meta' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Campaign Spend (YTD)</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '0.25rem' }}>${CRMStore.getCampaignData().spend.toLocaleString()}</div>
              </div>
              <div style={{ border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Impressions</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '0.25rem' }}>{CRMStore.getCampaignData().impressions.toLocaleString()}</div>
              </div>
              <div style={{ border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Sync CTR (Clicks)</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '0.25rem' }}>{CRMStore.getCampaignData().ctr}%</div>
              </div>
              <div style={{ border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Cost Per Lead (Avg)</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '0.25rem' }}>${CRMStore.getCampaignData().costPerLead}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                onClick={handleSimulateWebhookLead}
                className="btn-primary"
                style={{ justifyContent: 'center', width: '100%', padding: '0.85rem', fontSize: '0.9rem' }}
              >
                <Sparkles size={16} /> Force Facebook Lead Sync Webhook
              </button>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                * Simulate incoming Facebook webhook payload. This will instantly push a new lead into Supabase.
              </p>
            </div>
          </div>
        )}

        {/* 4. AGENTS ROSTER DIRECTORY */}
        {type === 'agents' && (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Agent</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Email Address</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Checked In</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Last Shift Activity</th>
                  {currentUser.role === 'superadmin' && <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Admin Toggle</th>}
                </tr>
              </thead>
              <tbody>
                {team.map(member => (
                  <tr key={member.id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                    <td style={{ padding: '0.8rem 1rem', fontWeight: 600 }}>{member.name}</td>
                    <td style={{ padding: '0.8rem 1rem' }}>{member.email}</td>
                    <td style={{ padding: '0.8rem 1rem', textAlign: 'center' }}>
                      <span className={`badge ${member.checkedIn ? 'badge-green' : 'badge-gray'}`}>
                        {member.checkedIn ? 'Active' : 'Offline'}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {member.checkedIn 
                        ? `Check-in: ${member.lastCheckIn ? new Date(member.lastCheckIn).toLocaleTimeString() : 'N/A'}`
                        : `Check-out: ${member.lastCheckOut ? new Date(member.lastCheckOut).toLocaleTimeString() : 'N/A'}`}
                    </td>
                    {currentUser.role === 'superadmin' && (
                      <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleToggleAgentCheckIn(member.id)}
                          className="btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          Toggle
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. FUNNEL STAGE DRILLDOWN */}
        {type === 'funnel' && (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Client</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Property Interest</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Budget</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Assigned Agent</th>
                </tr>
              </thead>
              <tbody>
                {clients.filter(c => c.status === meta?.stage).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No clients found in this stage.</td>
                  </tr>
                ) : (
                  clients.filter(c => c.status === meta?.stage).map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                      <td style={{ padding: '0.8rem 1rem', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '0.8rem 1rem' }}>{c.propertyInterest}</td>
                      <td style={{ padding: '0.8rem 1rem', textAlign: 'right', fontWeight: 700 }}>{c.budget}</td>
                      <td style={{ padding: '0.8rem 1rem' }}>{c.assignedAgentName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. SOURCE CHANNEL DRILLDOWN */}
        {type === 'source' && (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Client</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Property Interest</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Pipeline Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Budget</th>
                </tr>
              </thead>
              <tbody>
                {clients.filter(c => c.source === meta?.source).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No clients found from this source.</td>
                  </tr>
                ) : (
                  clients.filter(c => c.source === meta?.source).map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                      <td style={{ padding: '0.8rem 1rem', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '0.8rem 1rem' }}>{c.propertyInterest}</td>
                      <td style={{ padding: '0.8rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>{c.status}</td>
                      <td style={{ padding: '0.8rem 1rem', textAlign: 'right', fontWeight: 700 }}>{c.budget}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};
