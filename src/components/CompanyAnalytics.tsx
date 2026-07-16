import React, { useState, useEffect } from 'react';
import { User, Client, Task, CRMStore, ActivityLog } from '../services/store';
import { 
  ArrowLeft, 
  Users, 
  CheckSquare, 
  Activity, 
  DollarSign, 
  Clock, 
  PlusCircle,
  Award,
  ArrowUpRight
} from 'lucide-react';

interface CompanyAnalyticsProps {
  currentUser: User;
  onNavigate: (view: string, context?: any) => void;
}

export const CompanyAnalytics: React.FC<CompanyAnalyticsProps> = ({ currentUser, onNavigate }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [agents, setAgents] = useState<User[]>([]);

  // Task assignment form states
  const [newTaskText, setNewTaskText] = useState('');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = () => {
    setClients(CRMStore.getClients());
    setTasks(CRMStore.getTasks());
    setLogs(CRMStore.getLogs());
    setAgents(CRMStore.getUsers().filter(u => u.role === 'agent'));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // Budget parser helper
  const parseBudgetValue = (budgetStr: string): number => {
    if (!budgetStr) return 0;
    const numbers = budgetStr.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      const nums = numbers.map(Number);
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    }
    return 0;
  };

  // 1. Calculations & Metrics
  const todayStr = new Date().toLocaleDateString();
  
  // Leads today
  const leadsToday = clients.filter(c => {
    if (!c.createdAt) return false;
    return new Date(c.createdAt).toLocaleDateString() === todayStr;
  });

  // Closed deals today
  const closedToday = logs.filter(l => 
    new Date(l.timestamp).toLocaleDateString() === todayStr && 
    l.action.toLowerCase().includes('status to closed')
  ).length;

  // Active negotiations budget volume
  const negotiationClients = clients.filter(c => c.status === 'negotiation' || c.status === 'viewing');
  const activePipelineValue = negotiationClients.reduce((acc, c) => acc + parseBudgetValue(c.budget), 0);

  // Today's Work: total operations logged today
  const operationsToday = logs.filter(l => new Date(l.timestamp).toLocaleDateString() === todayStr);

  // Tasks due today
  const tasksDueToday = tasks.filter(t => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate).toLocaleDateString() === todayStr;
  });
  const completedTasksToday = tasksDueToday.filter(t => t.completed).length;
  const pendingTasksToday = tasksDueToday.filter(t => !t.completed).length;

  // Funnel conversion pipeline breakdown
  const funnelStages = {
    lead: clients.filter(c => c.status === 'lead'),
    contacted: clients.filter(c => c.status === 'contacted'),
    viewing: clients.filter(c => c.status === 'viewing'),
    negotiation: clients.filter(c => c.status === 'negotiation'),
    closed: clients.filter(c => c.status === 'closed')
  };

  const totalClients = clients.length || 1;
  const funnelPercentages = {
    lead: Math.round((funnelStages.lead.length / totalClients) * 100),
    contacted: Math.round((funnelStages.contacted.length / totalClients) * 100),
    viewing: Math.round((funnelStages.viewing.length / totalClients) * 100),
    negotiation: Math.round((funnelStages.negotiation.length / totalClients) * 100),
    closed: Math.round((funnelStages.closed.length / totalClients) * 100)
  };

  // Lead Tier Distribution
  const budgetTiers = {
    ultra: clients.filter(c => parseBudgetValue(c.budget) >= 10).length,
    elite: clients.filter(c => {
      const v = parseBudgetValue(c.budget);
      return v >= 5 && v < 10;
    }).length,
    premium: clients.filter(c => parseBudgetValue(c.budget) < 5).length
  };

  // Lead Acquisition source counts
  const sourcePerformance = {
    meta: clients.filter(c => c.source === 'Meta Ads').length,
    website: clients.filter(c => c.source === 'Website').length,
    referral: clients.filter(c => c.source === 'Referral').length,
    outbound: clients.filter(c => c.source === 'Outbound' || c.source === 'Walk-in').length
  };
  const maxSourceVal = Math.max(sourcePerformance.meta, sourcePerformance.website, sourcePerformance.referral, sourcePerformance.outbound, 1);

  // Quick task delegation
  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !assignedAgentId) {
      alert('Please specify the task description and assign it to an agent.');
      return;
    }

    const agent = agents.find(u => u.id === assignedAgentId);
    CRMStore.addTask(
      newTaskText,
      assignedAgentId,
      priority,
      dueDate,
      undefined,
      undefined,
      currentUser.name
    );

    // Logging assignment
    CRMStore.addLog(currentUser.name, `Assigned task "${newTaskText}" to ${agent?.name || 'Agent'}`);

    alert('Task successfully assigned to agent.');
    setNewTaskText('');
    setAssignedAgentId('');
    loadData();
  };

  // Compute greeting hour
  const getGreetingText = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning, Prabal';
    if (hrs < 17) return 'Good Afternoon, Prabal';
    return 'Good Evening, Prabal';
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Executive Header Greeting */}
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
            <h1 className="luxury-title" style={{ fontSize: '2.2rem', fontWeight: 600, color: 'var(--accent-black)' }}>
              {getGreetingText()}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              Corporate analytics control deck for Aloha Estates. Operational briefing summary for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => onNavigate('activity')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={15} /> Live Operations Audit
          </button>
        </div>
      </div>

      {/* Morning Briefing Summary Box */}
      <div className="premium-card" style={{ 
        padding: '1.5rem 2rem', 
        background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fbbf24' }}>
              Aloha Estates Executive Summary
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 500 }}>
            {leadsToday.length > 0 ? `We have received ${leadsToday.length} new luxury client leads today.` : 'No new leads acquired yet today. Campaign syncer is scanning Meta Ads.'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#a1a1aa', lineHeight: 1.5 }}>
            Currently, {agents.filter(a => a.checkedIn).length} agents are active on duty. There are {pendingTasksToday} pending checklist tasks scheduled for completion before the end of the shift duration.
          </p>
        </div>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          minWidth: '200px'
        }}>
          <span style={{ fontSize: '0.7rem', color: '#a1a1aa', textTransform: 'uppercase', fontWeight: 600 }}>Active Pipeline Valuation</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'white', margin: '0.2rem 0' }}>₹{activePipelineValue} Cr</div>
          <span style={{ fontSize: '0.65rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <ArrowUpRight size={12} /> {negotiationClients.length} deals in viewing/negotiation
          </span>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid-4">
        
        {/* Card 1: Leads Generated */}
        <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'white', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              New Leads (Today)
            </span>
            <Users size={16} style={{ color: 'var(--accent-black)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-black)' }}>{leadsToday.length}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>registered today</span>
          </div>
        </div>

        {/* Card 2: Closed Deals */}
        <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'white', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Closed Transactions (Today)
            </span>
            <DollarSign size={16} style={{ color: '#10b981' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{closedToday}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>deals finalized today</span>
          </div>
        </div>

        {/* Card 3: Todays Work (Logged operations) */}
        <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'white', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Operations Volume (Today)
            </span>
            <Activity size={16} style={{ color: '#6366f1' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#6366f1' }}>{operationsToday.length}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>staff CRM interactions</span>
          </div>
        </div>

        {/* Card 4: Daily Task Completion Ratios */}
        <div className="premium-card" style={{ padding: '1.5rem', backgroundColor: 'white', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Shift Tasks Ratios
            </span>
            <CheckSquare size={16} style={{ color: '#06b6d4' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#06b6d4' }}>
              {completedTasksToday}/{tasksDueToday.length}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              ({pendingTasksToday} pending)
            </span>
          </div>
        </div>

      </div>

      {/* Two-Column Grid: Funnel & Sources Performance vs Task Center & Delegation */}
      <div className="grid-2" style={{ gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: Funnel Conversion & Budget Tiers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Pipeline Conversion Ratios */}
          <div className="premium-card" style={{ padding: '1.75rem', backgroundColor: 'white' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              Pipeline Funnel Conversion Ratios
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Leads Registered', count: funnelStages.lead.length, pct: funnelPercentages.lead, color: 'var(--text-secondary)' },
                { label: 'Agent Contacted', count: funnelStages.contacted.length, pct: funnelPercentages.contacted, color: '#6366f1' },
                { label: 'Site Viewings Roster', count: funnelStages.viewing.length, pct: funnelPercentages.viewing, color: '#06b6d4' },
                { label: 'Negotiations Open', count: funnelStages.negotiation.length, pct: funnelPercentages.negotiation, color: '#fbbf24' },
                { label: 'Deals Finalized / Closed', count: funnelStages.closed.length, pct: funnelPercentages.closed, color: '#10b981' }
              ].map((stage, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 500 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{stage.label}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{stage.count} clients ({stage.pct}%)</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stage.pct}%`, backgroundColor: stage.color, borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Tier Classification & Source Breakdown */}
          <div className="premium-card" style={{ padding: '1.75rem', backgroundColor: 'white' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              Acquisition Sources & Portfolios
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              {/* Budget Tiers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Portfolio Tiers</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>Ultra-Luxury (≥ ₹10 Cr)</span>
                    <span style={{ fontWeight: 600 }}>{budgetTiers.ultra}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>Elite (₹5 - ₹10 Cr)</span>
                    <span style={{ fontWeight: 600 }}>{budgetTiers.elite}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>Premium (&lt; ₹5 Cr)</span>
                    <span style={{ fontWeight: 600 }}>{budgetTiers.premium}</span>
                  </div>
                </div>
              </div>

              {/* Source Distribution */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Lead Channels</span>
                
                {[
                  { label: 'Meta Ads', value: sourcePerformance.meta },
                  { label: 'Website', value: sourcePerformance.website },
                  { label: 'Referrals', value: sourcePerformance.referral },
                  { label: 'Outbound', value: sourcePerformance.outbound }
                ].map((src, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                      <span>{src.label}</span>
                      <span style={{ fontWeight: 600 }}>{src.value}</span>
                    </div>
                    <div style={{ height: '4px', backgroundColor: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(src.value / maxSourceVal) * 100}%`, backgroundColor: 'var(--accent-black)', borderRadius: '2px' }}></div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Today's Tasks & Urgent Delegation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Urgent Task Delegation form */}
          <div className="premium-card" style={{ padding: '1.75rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
              <PlusCircle size={18} style={{ color: 'var(--accent-black)' }} />
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600 }}>
                Delegate Roster Task
              </h3>
            </div>

            <form onSubmit={handleAssignTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Task Description</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Conduct follow-up tour with Devendra Shah..."
                  value={newTaskText}
                  onChange={e => setNewTaskText(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '0.45rem' }}
                />
              </div>

              <div className="grid-2" style={{ gap: '1rem' }}>
                
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Assign To Agent</label>
                  <select 
                    className="form-input" 
                    value={assignedAgentId} 
                    onChange={e => setAssignedAgentId(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                  >
                    <option value="">Select agent...</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Priority Urgency</label>
                  <select 
                    className="form-input" 
                    value={priority} 
                    onChange={e => setPriority(e.target.value as any)}
                    style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

              </div>

              <div className="grid-2" style={{ gap: '1rem', alignItems: 'flex-end' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Due Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '0.35rem' }}
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ height: '36px', fontSize: '0.8rem', justifyContent: 'center' }}>
                  Assign Task
                </button>
              </div>

            </form>
          </div>

          {/* Today's Tasks Roster List */}
          <div className="premium-card" style={{ padding: '1.75rem', backgroundColor: 'white' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
              Checked Checklist Tasks Due Today
            </h3>

            {tasksDueToday.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                No checklist tasks scheduled due today.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tasksDueToday.map(task => (
                  <div key={task.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.75rem 1rem', 
                    backgroundColor: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 500, 
                        color: 'var(--accent-black)',
                        textDecoration: task.completed ? 'line-through' : 'none',
                        opacity: task.completed ? 0.6 : 1
                      }}>
                        {task.description}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Agent: {task.assignedToName}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className={`badge ${
                        task.priority === 'high' ? 'badge-red' : task.priority === 'medium' ? 'badge-orange' : 'badge-gray'
                      }`} style={{ fontSize: '0.55rem', padding: '0.05rem 0.25rem' }}>
                        {task.priority}
                      </span>

                      <span className={`badge ${
                        task.completed ? 'badge-green' : 'badge-gray'
                      }`} style={{ fontSize: '0.55rem', padding: '0.05rem 0.25rem' }}>
                        {task.completed ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Agents Productivity Overview */}
      <div className="premium-card" style={{ padding: '2rem', backgroundColor: 'white' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.25rem' }}>
          Agent Operations & Pipeline Distribution
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Agent</th>
                <th style={{ padding: '0.75rem 1rem' }}>Shift Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Actions Today</th>
                <th style={{ padding: '0.75rem 1rem' }}>Assigned Clients</th>
                <th style={{ padding: '0.75rem 1rem' }}>Pipeline Value</th>
                <th style={{ padding: '0.75rem 1rem' }}>Tasks Pending</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(agent => {
                const agentClients = clients.filter(c => c.assignedAgentId === agent.id);
                const agentTasks = tasks.filter(t => t.assignedToId === agent.id && !t.completed);
                const agentLogs = operationsToday.filter(l => l.userName === agent.name).length;
                const agentPipelineVal = agentClients.reduce((acc, c) => acc + parseBudgetValue(c.budget), 0);

                return (
                  <tr key={agent.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--accent-black)' }}>{agent.name}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: agent.checkedIn ? '#10b981' : '#d1d5db' 
                        }}></span>
                        {agent.checkedIn ? 'Checked In' : 'Offline'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{agentLogs} ops</td>
                    <td style={{ padding: '1rem' }}>{agentClients.length} buyers</td>
                    <td style={{ padding: '1rem', color: 'var(--accent-green)', fontWeight: 600 }}>₹{agentPipelineVal} Cr</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${agentTasks.length > 0 ? 'badge-orange' : 'badge-green'}`} style={{ fontSize: '0.7rem' }}>
                        {agentTasks.length} pending
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
