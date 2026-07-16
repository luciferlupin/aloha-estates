import React, { useState, useEffect } from 'react';
import { CRMStore, User, Client, Task } from '../services/store';
import { ArrowLeft, Clock, User as UserIcon, CheckCircle, AlertCircle } from 'lucide-react';

interface AgentDetailPageProps {
  agentId: string;
  onBack: () => void;
  currentUser: User;
}

export const AgentDetailPage: React.FC<AgentDetailPageProps> = ({ agentId, onBack, currentUser }) => {
  const [agent, setAgent] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const parseBudgetValue = (budgetStr: string): number => {
    if (!budgetStr) return 0;
    const numbers = budgetStr.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      const nums = numbers.map(Number);
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    }
    return 0;
  };

  const loadData = () => {
    const users = CRMStore.getUsers();
    const foundAgent = users.find(u => u.id === agentId);
    if (foundAgent) {
      setAgent(foundAgent);
      
      const allClients = CRMStore.getClients();
      setClients(allClients.filter(c => c.assignedAgentId === foundAgent.id));
      
      const allTasks = CRMStore.getTasks();
      setTasks(allTasks.filter(t => t.assignedToId === foundAgent.id));
    }
  };

  useEffect(() => {
    loadData();
  }, [agentId]);

  if (!agent) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Agent profile not found.</p>
        <button onClick={onBack} className="btn-primary">Back</button>
      </div>
    );
  }

  const handleToggleCheckIn = () => {
    CRMStore.toggleCheckIn(agent.id);
    loadData();
  };

  // Performance calculations
  const closedClients = clients.filter(c => c.status === 'closed');
  const totalValueClosed = closedClients.reduce((acc, c) => acc + parseBudgetValue(c.budget), 0);
  const conversionRate = clients.length > 0 ? Math.round((closedClients.length / clients.length) * 100) : 0;
  const activeReminders = clients.filter(c => c.reminderDate).length;

  const isEditable = currentUser.role === 'superadmin' || currentUser.id === agent.id;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '0.5rem' }} title="Back">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="luxury-title" style={{ fontSize: '2.25rem', fontWeight: 600, color: 'var(--accent-black)', margin: 0 }}>
            {agent.name} — Performance Detail
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            {agent.role === 'superadmin' ? 'Founder Profile' : 'Luxury Sales Agent Performance Board'}
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '1.5rem' }}>
        
        {/* LEFT COLUMN: Agent details Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 600
              }}>
                {agent.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{agent.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{agent.email}</span>
              </div>
              <span className={`badge ${agent.checkedIn ? 'badge-green' : 'badge-gray'}`} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                {agent.checkedIn ? 'Active Now' : 'Offline'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Roster Role:</span>
                <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{agent.role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Last Check-in:</span>
                <span>{agent.lastCheckIn ? new Date(agent.lastCheckIn).toLocaleString() : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Last Check-out:</span>
                <span>{agent.lastCheckOut ? new Date(agent.lastCheckOut).toLocaleString() : 'N/A'}</span>
              </div>
            </div>

            {isEditable && (
              <button 
                onClick={handleToggleCheckIn}
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '0.65rem' }}
              >
                <Clock size={16} /> Force {agent.checkedIn ? 'Check-out' : 'Check-in'}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Performance Reports, Clients and Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Performance KPIs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
            <div className="premium-card" style={{ padding: '1rem', textAlign: 'center', backgroundColor: 'white' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Leads</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem' }}>{clients.length}</div>
            </div>
            <div className="premium-card" style={{ padding: '1rem', textAlign: 'center', backgroundColor: 'white' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Closed Deals</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem' }}>{closedClients.length}</div>
            </div>
            <div className="premium-card" style={{ padding: '1rem', textAlign: 'center', backgroundColor: 'white' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Conversion Rate</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem' }}>{conversionRate}%</div>
            </div>
            <div className="premium-card" style={{ padding: '1rem', textAlign: 'center', backgroundColor: 'white' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Closed Volume</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem' }}>₹{totalValueClosed} Cr</div>
            </div>
          </div>

          {/* Assigned Clients list */}
          <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'white' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserIcon size={16} /> Assigned Client Pipeline ({clients.length})
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.5rem 0.25rem' }}>Client</th>
                    <th style={{ padding: '0.5rem 0.25rem' }}>Property Interest</th>
                    <th style={{ padding: '0.5rem 0.25rem' }}>Status</th>
                    <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No clients assigned.</td>
                    </tr>
                  ) : (
                    clients.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--bg-tertiary)' }}>
                        <td style={{ padding: '0.65rem 0.25rem', fontWeight: 600 }}>{c.name}</td>
                        <td style={{ padding: '0.65rem 0.25rem' }}>{c.propertyInterest}</td>
                        <td style={{ padding: '0.65rem 0.25rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>{c.status}</td>
                        <td style={{ padding: '0.65rem 0.25rem', textAlign: 'right', fontWeight: 700 }}>{c.budget}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assigned Tasks list */}
          <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'white' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle size={16} /> Checklist Tasks ({tasks.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {tasks.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No checklist tasks assigned.</p>
              ) : (
                tasks.map(t => (
                  <div key={t.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    backgroundColor: t.completed ? 'var(--bg-secondary)' : 'var(--bg-primary)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                      {t.completed ? <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} /> : <AlertCircle size={16} style={{ color: 'var(--text-secondary)' }} />}
                      <span style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? 'var(--text-secondary)' : 'inherit' }}>
                        {t.description}
                      </span>
                    </div>
                    <span className={`badge ${
                      t.priority === 'high' ? 'badge-red' : 
                      t.priority === 'medium' ? 'badge-orange' : 'badge-gray'
                    }`} style={{ fontSize: '0.65rem' }}>
                      {t.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
