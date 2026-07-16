import React, { useState, useEffect } from 'react';
import { User, ActivityLog, CRMStore } from '../services/store';
import { 
  ArrowLeft,
  Clock, 
  Search, 
  Filter, 
  Users, 
  MessageSquare, 
  CheckSquare, 
  Activity, 
  Trash2,
  UserCheck,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface CompanyActivityProps {
  currentUser: User;
  onNavigate: (view: string, context?: any) => void;
}

export const CompanyActivity: React.FC<CompanyActivityProps> = ({ currentUser: _currentUser, onNavigate }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadData = () => {
    setLogs(CRMStore.getLogs());
    setTeamMembers(CRMStore.getUsers());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // Categorize log function
  const getLogCategory = (action: string) => {
    const text = action.toLowerCase();
    if (text.includes('check-in') || text.includes('check-out') || text.includes('shift') || text.includes('logged')) {
      return { label: 'Shift Update', category: 'shift', icon: Clock, color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' };
    }
    if (text.includes('client') || text.includes('pipeline') || text.includes('status') || text.includes('lead') || text.includes('comment') || text.includes('note')) {
      return { label: 'Client Pipeline', category: 'client', icon: Users, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' };
    }
    if (text.includes('task') || text.includes('checklist') || text.includes('todo') || text.includes('assigned task')) {
      return { label: 'Task Center', category: 'task', icon: CheckSquare, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.08)' };
    }
    if (text.includes('whatsapp') || text.includes('wa') || text.includes('template') || text.includes('sent')) {
      return { label: 'WhatsApp Sync', category: 'whatsapp', icon: MessageSquare, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.08)' };
    }
    return { label: 'General Operations', category: 'general', icon: Activity, color: 'var(--accent-black)', bg: 'var(--bg-secondary)' };
  };

  // Simulate random company activities for demonstration
  const handleSimulateActivities = () => {
    const mockActions = [
      { name: 'Aarav Mehta', action: 'Checked-in for Morning shift roster.' },
      { name: 'Ananya Sharma', action: 'Updated status for client Devendra Shah to Negotiation.' },
      { name: 'Vikram Malhotra', action: 'Set follow-up reminder for client Sunita Rao.' },
      { name: 'Ananya Sharma', action: 'Sent WhatsApp template [Viewing Follow-up] to Vikram Goel.' },
      { name: 'Rohan Gupta', action: 'Checked-off assigned task [Prepare Worli Site Tour Brochure].' },
      { name: 'Aarav Mehta', action: 'Added viewing notes comment on client Rajiv Singhania dossier.' },
      { name: 'Prabal (Founder)', action: 'Simulated Meta campaign lead acquisition.' },
      { name: 'Rohan Gupta', action: 'Checked-in for Afternoon shift roster.' },
      { name: 'Ananya Sharma', action: 'De-provisioned agent check-in list.' }
    ];

    // Add them in sequence
    mockActions.forEach((mock, idx) => {
      setTimeout(() => {
        CRMStore.addLog(mock.name, mock.action);
        loadData();
      }, idx * 150);
    });
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear the operations audit history?')) {
      localStorage.setItem('aloha_crm_logs', JSON.stringify([]));
      loadData();
    }
  };

  // Filter logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAgent = filterAgent === 'all' || log.userName === filterAgent;
    
    const catObj = getLogCategory(log.action);
    const matchesCategory = filterCategory === 'all' || catObj.category === filterCategory;
    
    const matchesDate = !filterDate || new Date(log.timestamp).toLocaleDateString() === new Date(filterDate).toLocaleDateString();

    return matchesSearch && matchesAgent && matchesCategory && matchesDate;
  });

  // Analytics metrics calculations
  const todayStr = new Date().toLocaleDateString();
  const logsToday = logs.filter(l => new Date(l.timestamp).toLocaleDateString() === todayStr);
  
  const activeAgentsCount = teamMembers.filter(u => u.role === 'agent' && u.checkedIn).length;
  
  // Find top performer (the agent with most actions logged today)
  const agentCounts: { [key: string]: number } = {};
  logsToday.forEach(l => {
    if (l.userName !== 'Founder' && l.userName !== 'Prabal (Founder)') {
      agentCounts[l.userName] = (agentCounts[l.userName] || 0) + 1;
    }
  });
  let topAgent = 'None';
  let maxCount = 0;
  Object.keys(agentCounts).forEach(agent => {
    if (agentCounts[agent] > maxCount) {
      maxCount = agentCounts[agent];
      topAgent = agent;
    }
  });

  const clientActionsCount = logsToday.filter(l => {
    const cat = getLogCategory(l.action).category;
    return cat === 'client' || cat === 'whatsapp';
  }).length;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header View */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => onNavigate('dashboard')} className="btn-icon" title="Back to Dashboard">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="luxury-title" style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--accent-black)' }}>
              Founder Operations Portal
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              Real-time company audit trailing, staff check-ins, and pipeline event timelines.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleSimulateActivities}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--accent-black)', color: 'var(--accent-black)' }}
          >
            <Sparkles size={15} /> Simulate Activities
          </button>
          <button 
            onClick={handleClearLogs}
            className="btn-danger"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Trash2 size={15} /> Reset Audits
          </button>
        </div>
      </div>

      {/* Analytics KPI Dashboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* Metric 1 */}
        <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Actions Logged (Today)
            </span>
            <Activity size={16} style={{ color: 'var(--accent-black)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-black)' }}>
              {logsToday.length}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              total audit points
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Active Agents on Shift
            </span>
            <UserCheck size={16} style={{ color: '#10b981' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981' }}>
              {activeAgentsCount}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              checked-in currently
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Most Active Agent (Today)
            </span>
            <TrendingUp size={16} style={{ color: '#6366f1' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-black)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }} title={topAgent}>
              {topAgent}
            </span>
            {maxCount > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600 }}>
                ({maxCount} ops)
              </span>
            )}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Client Touchpoints (Today)
            </span>
            <MessageSquare size={16} style={{ color: '#06b6d4' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#06b6d4' }}>
              {clientActionsCount}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              updates & WA syncs
            </span>
          </div>
        </div>

      </div>

      {/* Team Shift & Roster Overwatch Console */}
      <div className="premium-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'white' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--accent-black)' }}>
            Team Shift & Roster Overwatch
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
            Monitor real-time agent shifts, check-in status, daily action volumes, and override shift state overrides.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {teamMembers.filter(m => m.role === 'agent').length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>No agents registered in the database directory.</p>
          ) : (
            <div className="grid-2" style={{ gap: '1.25rem' }}>
              {teamMembers.filter(m => m.role === 'agent').map(agent => {
                const agentLogsCount = logsToday.filter(l => l.userName === agent.name).length;
                return (
                  <div key={agent.id} className="premium-card" style={{ 
                    padding: '1.25rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    transition: 'all 0.25s ease'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--accent-black)', fontSize: '0.95rem' }}>{agent.name}</span>
                        <span className={`badge ${agent.checkedIn ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                          {agent.checkedIn ? 'ON DUTY' : 'OFFLINE'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{agent.email}</span>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.4rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          <span style={{ fontWeight: 500 }}>Last Clock-In:</span> {agent.lastCheckIn ? new Date(agent.lastCheckIn).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          <span style={{ fontWeight: 500 }}>Last Clock-Out:</span> {agent.lastCheckOut ? new Date(agent.lastCheckOut).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block' }}>
                          Ops Today
                        </span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: agentLogsCount > 0 ? '#6366f1' : 'var(--text-secondary)' }}>
                          {agentLogsCount} actions
                        </span>
                      </div>

                      <button 
                        onClick={() => {
                          CRMStore.toggleCheckIn(agent.id);
                          loadData();
                        }}
                        className={`btn-${agent.checkedIn ? 'secondary' : 'primary'}`}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}
                      >
                        {agent.checkedIn ? 'Force Clock Out' : 'Force Clock In'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Querying Filter Panel */}
      <div className="premium-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Search bar */}
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text"
              placeholder="Search by keyword, agent or description..."
              className="form-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
            />
          </div>

          {/* Filter toggler */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: showFilters ? 'var(--accent-black)' : 'var(--border-color)' }}
          >
            <Filter size={14} /> Filters {showFilters ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div className="grid-4 fade-in" style={{ gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            
            {/* Filter by Agent */}
            <div className="form-group">
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Filter by Agent</label>
              <select className="form-input" value={filterAgent} onChange={e => setFilterAgent(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.8rem' }}>
                <option value="all">All Personnel</option>
                {Array.from(new Set(logs.map(l => l.userName))).map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>

            {/* Filter by Category */}
            <div className="form-group">
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Action Segment</label>
              <select className="form-input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.8rem' }}>
                <option value="all">All Segments</option>
                <option value="shift">Shift & Roster</option>
                <option value="client">Client & Pipeline</option>
                <option value="task">Tasks & Checklists</option>
                <option value="whatsapp">WhatsApp Outreach</option>
                <option value="general">General Operations</option>
              </select>
            </div>

            {/* Filter by Date */}
            <div className="form-group">
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Action Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={filterDate} 
                onChange={e => setFilterDate(e.target.value)} 
                style={{ padding: '0.35rem', fontSize: '0.8rem' }}
              />
            </div>

            {/* Reset option */}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterAgent('all');
                  setFilterCategory('all');
                  setFilterDate('');
                }}
                className="btn-secondary"
                style={{ width: '100%', padding: '0.45rem', fontSize: '0.8rem', justifyContent: 'center' }}
              >
                Clear Query Filters
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Audit Timeline Streams */}
      <div className="premium-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'white' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600 }}>
          Real-time Audit Trail Timeline
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          
          {filteredLogs.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No audit logs captured matching your current filter queries.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
              
              {/* Vertical connector line */}
              <div style={{
                position: 'absolute',
                left: '20px',
                top: '12px',
                bottom: '12px',
                width: '2px',
                backgroundColor: 'var(--border-color)',
                zIndex: 0
              }}></div>

              {filteredLogs.map((log) => {
                const catInfo = getLogCategory(log.action);
                const Icon = catInfo.icon;
                
                return (
                  <div key={log.id} style={{ display: 'flex', gap: '1.5rem', zIndex: 1, position: 'relative' }}>
                    
                    {/* Icon container */}
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      border: `2px solid ${catInfo.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: catInfo.color,
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <Icon size={16} />
                    </div>

                    {/* Content Box */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, paddingTop: '0.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--accent-black)', fontSize: '0.9rem' }}>
                            {log.userName}
                          </span>
                          
                          {/* Role Badge */}
                          <span className={`badge ${
                            log.userName.includes('Founder') || log.userName.includes('Prabal') ? 'badge-black' : 'badge-gray'
                          }`} style={{ fontSize: '0.55rem', padding: '0.05rem 0.25rem', textTransform: 'uppercase' }}>
                            {log.userName.includes('Founder') || log.userName.includes('Prabal') ? 'Founder' : 'Agent'}
                          </span>

                          {/* Action category tag */}
                          <span style={{
                            fontSize: '0.65rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            color: catInfo.color,
                            backgroundColor: catInfo.bg,
                            fontWeight: 500
                          }}>
                            {catInfo.label}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '0.15rem', lineHeight: '1.4' }}>
                        {log.action}
                      </p>
                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>
      </div>

    </div>
  );
};
