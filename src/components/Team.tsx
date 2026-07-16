import React, { useState, useEffect } from 'react';
import { User, ActivityLog, CRMStore, Client, Task } from '../services/store';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Check, 
  AlertCircle,
  Clock,
  Briefcase,
  DollarSign,
  TrendingUp,
  FileText,
  X,
  PlusCircle,
  MessageSquare
} from 'lucide-react';

interface TeamProps {
  currentUser: User;
  onNavigate: (view: string, context?: any) => void;
}

export const Team: React.FC<TeamProps> = ({ currentUser, onNavigate }) => {
  const [members, setMembers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Monitoring states
  
  // New member form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = () => {
    setMembers(CRMStore.getUsers());
    setLogs(CRMStore.getLogs());
    setClients(CRMStore.getClients());
    setTasks(CRMStore.getTasks());
  };

  useEffect(() => {
    loadData();

    // Storage Sync
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 5) {
      setError('Password must be at least 5 characters.');
      return;
    }

    const res = CRMStore.addTeamMember(name, email, password);
    if (res.success) {
      setSuccess(`Successfully added ${name} to Aloha Estates CRM!`);
      setName('');
      setEmail('');
      setPassword('');
      loadData();
    } else {
      setError(res.error || 'Failed to add team member.');
    }
  };

  const handleDeleteMember = (e: React.MouseEvent, memberId: string, memberName: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to de-provision agent ${memberName}? This will revoke their CRM access immediately.`)) {
      const success = CRMStore.deleteTeamMember(memberId);
      if (success) {
        loadData();
      }
    }
  };

  // Compute metrics for each team member
  const getMemberMetrics = (userId: string) => {
    const assignedClients = clients.filter(c => c.assignedAgentId === userId);
    const assignedTasks = tasks.filter(t => t.assignedToId === userId);
    const closedDeals = assignedClients.filter(c => c.status === 'closed').length;
    const completedTasks = assignedTasks.filter(t => t.completed).length;

    // Dummy sales based on closed deals
    const salesVolume = closedDeals * 8 + (userId === '1' ? 82 : userId === '2' ? 24 : 15); // mock metrics

    return {
      clientsCount: assignedClients.length,
      closedCount: closedDeals,
      tasksCount: assignedTasks.length,
      tasksCompleted: completedTasks,
      salesVolume: `₹${salesVolume} Cr`
    };
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.5rem'
      }}>
        <div>
          <h1 className="luxury-title" style={{ fontSize: '2.25rem', fontWeight: 600, color: 'var(--accent-black)' }}>
            Team Workspace
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Coordinate roles, view check-in timelines, and track agent sales metrics.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: currentUser.role === 'superadmin' ? '1fr 2fr' : '1fr', gap: '2rem' }}>
        
        {/* Left column: Add Team Member (Superadmin Only) */}
        {currentUser.role === 'superadmin' && (
          <div className="premium-card" style={{ height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={18} /> Provision Team Access
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-0.75rem' }}>
              Register new agent credentials to enable workspace login.
            </p>

            {error && (
              <div style={{
                backgroundColor: 'rgba(255, 59, 48, 0.08)',
                color: 'var(--accent-red)',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{
                backgroundColor: 'rgba(52, 199, 89, 0.08)',
                color: 'var(--accent-green)',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Check size={14} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Agent Name</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    required
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Work Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    required
                    type="email" 
                    className="form-input" 
                    placeholder="john@alohaestates.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Set Workspace Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    required
                    type="password" 
                    className="form-input" 
                    placeholder="Min 5 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Add to Roster
              </button>
            </form>
          </div>
        )}

        {/* Right column: Roster Directory & Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Team performance directory */}
          <div className="premium-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Roster Directory & KPI Performance</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-0.75rem' }}>
              Summary of total sales volume closed, pipelines assigned and status logs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {members.map(member => {
                const metrics = getMemberMetrics(member.id);
                return (
                  <div key={member.id} className="premium-card" style={{
                    padding: '1.25rem',
                    flexDirection: 'column',
                    gap: '1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }} onClick={() => {
                    onNavigate('agent-detail', { agentId: member.id, fromView: 'team' });
                  }}>
                    {/* Top Row: User details */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600
                        }}>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{member.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{member.email}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                        <span className={`badge ${member.role === 'superadmin' ? 'badge-black' : 'badge-gray'}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                          {member.role === 'superadmin' ? 'Founder & CEO' : 'Real Estate Agent'}
                        </span>
                        
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                          <span className={`status-dot ${member.checkedIn ? 'active' : 'inactive'}`}></span>
                          {member.checkedIn ? 'Checked In' : 'Checked Out'}
                        </span>

                        {currentUser.role === 'superadmin' && member.role !== 'superadmin' && (
                          <button 
                            onClick={(e) => handleDeleteMember(e, member.id, member.name)}
                            className="btn-secondary"
                            style={{ 
                              padding: '0.15rem 0.4rem', 
                              fontSize: '0.65rem', 
                              borderRadius: '4px',
                              borderColor: 'rgba(255, 59, 48, 0.3)',
                              color: 'var(--accent-red)',
                              backgroundColor: 'rgba(255, 59, 48, 0.03)',
                              marginTop: '0.25rem'
                            }}
                          >
                            De-provision
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Metrics Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '1rem',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '0.75rem',
                      textAlign: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                          <DollarSign size={10} /> Sales Closed
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.15rem' }}>{metrics.salesVolume}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                          <Briefcase size={10} /> Client Pipeline
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.15rem' }}>{metrics.clientsCount}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                          <FileText size={10} /> Tasks Done
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.15rem' }}>
                          {metrics.tasksCompleted}/{metrics.tasksCount}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                          <Clock size={10} /> Last Login
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {member.lastCheckIn ? new Date(member.lastCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Extended Checked In Activity Log */}
          <div className="premium-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} /> Roster Activity Timeline
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-0.75rem' }}>
              Chronological log of shift check-ins, check-outs, and database operations.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '300px', paddingRight: '4px' }}>
              {logs.map(log => (
                <div key={log.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--border-color)',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-black)' }}></div>
                    <span>
                      <strong>{log.userName}</strong>: {log.action}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>



    </div>
  );
};
