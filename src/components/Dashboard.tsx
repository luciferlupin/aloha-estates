import React, { useState, useEffect } from 'react';
import { User, Client, Task, CRMStore, ActivityLog } from '../services/store';
import { 
  CheckSquare, 
  Plus, 
  TrendingUp, 
  Users, 
  Megaphone, 
  Clock, 
  ArrowUpRight,
  PlusCircle,
  Eye,
  X,
  Search,
  Sparkles,
  Activity,
  BarChart3
} from 'lucide-react';

interface DashboardProps {
  currentUser: User;
  onNavigate: (view: string, context?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, onNavigate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [greeting, setGreeting] = useState('');
  
  // Interactive premium Apple-style chart states
  const [chartMetric, setChartMetric] = useState<'sales' | 'leads'>('sales');
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);

  // Drill-down details views

  const handleClearReminder = (clientId: string) => {
    CRMStore.setClientReminder(clientId, null, null, currentUser.name);
    // Reload state
    setClients(CRMStore.getClients());
  };

  const handleSnoozeReminder = (clientId: string, currentRemDate: string) => {
    const newDate = new Date(currentRemDate);
    newDate.setDate(newDate.getDate() + 1);
    const client = CRMStore.getClients().find(c => c.id === clientId);
    CRMStore.setClientReminder(clientId, newDate.toISOString(), client?.reminderText || '', currentUser.name);
    // Reload state
    setClients(CRMStore.getClients());
  };

  const handleToggleAgentCheckIn = (agentId: string) => {
    CRMStore.toggleCheckIn(agentId);
    // Reload state
    setTeam(CRMStore.getUsers());
    setLogs(CRMStore.getLogs().slice(0, 5));
  };

  useEffect(() => {
    const loadDashboardData = () => {
      setTasks(CRMStore.getTasks());
      setClients(CRMStore.getClients());
      setLogs(CRMStore.getLogs().slice(0, 5));
      setTeam(CRMStore.getUsers());
    };

    loadDashboardData();

    // Determine greeting
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting('Good morning');
    else if (hrs < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Real-time storage sync
    window.addEventListener('storage', loadDashboardData);
    return () => window.removeEventListener('storage', loadDashboardData);
  }, []);

  // Filter tasks assigned to current user
  const myTasks = tasks.filter(t => t.assignedToId === currentUser.id);
  const pendingTasks = myTasks.filter(t => !t.completed);

  const handleToggleTask = (taskId: string) => {
    const updated = CRMStore.toggleTaskCompleted(taskId);
    if (updated) {
      setTasks(CRMStore.getTasks());
      setLogs(CRMStore.getLogs().slice(0, 5));
    }
  };

  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    CRMStore.addTask(
      newTaskText,
      currentUser.id,
      'medium',
      new Date(Date.now() + 86400000).toISOString().split('T')[0] // tomorrow
    );
    setNewTaskText('');
    setTasks(CRMStore.getTasks());
    setLogs(CRMStore.getLogs().slice(0, 5));
  };

  // Metrics calculation
  const totalSalesVolume = '₹212 Cr';
  const pipelineCount = clients.length;
  const activeNegotiations = clients.filter(c => c.status === 'negotiation' || c.status === 'viewing').length;
  const activeTeamCount = team.filter(t => t.checkedIn).length;
  // Filter client reminders based on active user role
  const clientReminders = clients.filter(c => {
    if (!c.reminderDate) return false;
    if (currentUser.role === 'superadmin') return true;
    return c.assignedAgentId === currentUser.id;
  });

  // Custom Chart Data: Sales performance over 6 months
  const chartData = [
    { month: 'Feb', sales: 4.2, leads: 22 },
    { month: 'Mar', sales: 6.8, leads: 38 },
    { month: 'Apr', sales: 5.5, leads: 32 },
    { month: 'May', sales: 9.2, leads: 54 },
    { month: 'Jun', sales: 11.5, leads: 68 },
    { month: 'Jul', sales: 14.8, leads: 82 }
  ];

  // SVG Chart Dimensions
  const chartWidth = 500;
  const chartHeight = 180;
  const padding = 30;

  // Compute SVG Points for selected metric
  const maxVal = chartMetric === 'sales' ? 16 : 90;
  const points = chartData.map((d, index) => {
    const x = padding + (index * (chartWidth - 2 * padding)) / (chartData.length - 1);
    const value = chartMetric === 'sales' ? d.sales : d.leads;
    const y = chartHeight - padding - (value * (chartHeight - 2 * padding)) / maxVal;
    return { x, y, value, ...d };
  });

  // Render smooth bezier path from points
  const getBezierPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const pathD = getBezierPath(points);

  // Area under the path for gradient fill
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : '';

  // Helper to convert budget strings to numeric crores
  const parseBudgetValue = (budgetStr: string): number => {
    if (!budgetStr) return 0;
    const numbers = budgetStr.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      const nums = numbers.map(Number);
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    }
    return 0;
  };

  // Pipeline stage valuation
  const stageValues = {
    lead: 0,
    contacted: 0,
    viewing: 0,
    negotiation: 0,
    closed: 0
  };
  clients.forEach(c => {
    const val = parseBudgetValue(c.budget);
    if (c.status in stageValues) {
      stageValues[c.status as keyof typeof stageValues] += val;
    }
  });

  // Source acquisition breakdown
  const sourceCounts = {
    'Meta Ads': 0,
    'Referral': 0,
    'Website': 0,
    'Outbound': 0,
    'Walk-in': 0
  };
  clients.forEach(c => {
    const src = (c.source || 'Walk-in') as keyof typeof sourceCounts;
    if (src in sourceCounts) {
      sourceCounts[src] += 1;
    }
  });

  // Agent conversions leaderboard
  const agentPerformance = team.map(member => {
    const memberClients = clients.filter(c => c.assignedAgentId === member.id);
    const closed = memberClients.filter(c => c.status === 'closed');
    const totalValueClosed = closed.reduce((acc, c) => acc + parseBudgetValue(c.budget), 0);
    const conversionRate = memberClients.length > 0 ? Math.round((closed.length / memberClients.length) * 100) : 0;
    const activeReminders = memberClients.filter(c => c.reminderDate).length;
    
    return {
      ...member,
      totalClients: memberClients.length,
      closedCount: closed.length,
      conversionRate,
      totalValueClosed,
      activeReminders
    };
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.5rem',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div>
          <h1 className="luxury-title" style={{ fontSize: '2.25rem', fontWeight: 600, color: 'var(--accent-black)' }}>
            {greeting}, {currentUser.name.split(' ')[0]}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Here is your workspace overview for Aloha Estates. Current Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', width: '100%' }}>
          {currentUser.role === 'superadmin' && (
            <>
              <button onClick={() => onNavigate('analytics')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--accent-black)', color: 'var(--accent-black)' }}>
                <BarChart3 size={16} /> Company Analytics
              </button>
              <button onClick={() => onNavigate('activity')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--accent-black)', color: 'var(--accent-black)' }}>
                <Activity size={16} /> Operations Portal
              </button>
            </>
          )}
          <button onClick={() => onNavigate('clients')} className="btn-secondary">
            <Plus size={16} /> New Client
          </button>
          {currentUser.role === 'superadmin' && (
            <button onClick={() => onNavigate('tasks')} className="btn-primary">
              <PlusCircle size={16} /> Assign Task
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4" style={{ gap: '1rem' }}>
        
        <div 
          className="premium-card interactive-card" 
          onClick={() => onNavigate('dashboard-drilldown', { type: 'sales' })}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sales Volume (YTD)
            </span>
            <TrendingUp size={16} style={{ color: 'var(--accent-black)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{totalSalesVolume}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
              <ArrowUpRight size={12} /> +18.4%
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Overall company transactions closed</span>
        </div>

        <div 
          className="premium-card interactive-card" 
          onClick={() => onNavigate('dashboard-drilldown', { type: 'pipeline' })}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Client Pipeline
            </span>
            <Users size={16} style={{ color: 'var(--accent-black)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{pipelineCount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {activeNegotiations} Active viewings/negotiations
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total leads and active buyers</span>
        </div>

        <div 
          className="premium-card interactive-card" 
          onClick={() => onNavigate('dashboard-drilldown', { type: 'meta' })}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Meta Leads Status
            </span>
            <Megaphone size={16} style={{ color: 'var(--accent-black)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {CRMStore.getCampaignData().leads}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
              <ArrowUpRight size={12} /> Sync Online
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Real-time syncing Facebook campaigns</span>
        </div>

        <div 
          className="premium-card interactive-card" 
          onClick={() => onNavigate('dashboard-drilldown', { type: 'agents' })}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Agents
            </span>
            <Clock size={16} style={{ color: 'var(--accent-black)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{activeTeamCount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              out of {team.length} registered
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Currently checked-in agents</span>
        </div>

      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '1.5rem' }} className="dashboard-main-layout">
        
        {/* Left Side: Analytics & Daily Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Company Performance Chart - Superadmin Only */}
          {currentUser.role === 'superadmin' ? (
            <div className="premium-card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Company Performance Analytics</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {chartMetric === 'sales' ? 'Monthly Transaction Revenue Closed (in ₹ Crores)' : 'Monthly Digital Meta Campaign Leads Synced'}
                  </p>
                </div>
                
                {/* Apple-style Toggle Switch */}
                <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <button 
                    onClick={() => setChartMetric('sales')}
                    className="btn-secondary"
                    style={{
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.7rem',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: chartMetric === 'sales' ? 'var(--accent-black)' : 'transparent',
                      color: chartMetric === 'sales' ? '#fff' : 'var(--text-primary)',
                      fontWeight: 600
                    }}
                  >
                    Revenue
                  </button>
                  <button 
                    onClick={() => setChartMetric('leads')}
                    className="btn-secondary"
                    style={{
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.7rem',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: chartMetric === 'leads' ? 'var(--accent-black)' : 'transparent',
                      color: chartMetric === 'leads' ? '#fff' : 'var(--text-primary)',
                      fontWeight: 600
                    }}
                  >
                    Leads
                  </button>
                </div>
              </div>
              
              <div style={{ position: 'relative', height: `${chartHeight}px`, marginTop: '1.25rem' }} className="chart-container">
                {/* Floating Apple Interactive Popover Overlay */}
                {hoveredPointIdx !== null && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: points[hoveredPointIdx].x > chartWidth / 2 ? '15px' : 'auto',
                    right: points[hoveredPointIdx].x <= chartWidth / 2 ? '15px' : 'auto',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.8rem',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 10,
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.15rem'
                  }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {points[hoveredPointIdx].month} Report
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-black)' }}>
                      {chartMetric === 'sales' ? `₹${points[hoveredPointIdx].sales} Cr Volume` : `${points[hoveredPointIdx].leads} Meta Leads`}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                      {hoveredPointIdx > 0 
                        ? `+${(((points[hoveredPointIdx].value - points[hoveredPointIdx - 1].value) / points[hoveredPointIdx - 1].value) * 100).toFixed(0)}% Growth`
                        : 'Base Reference Month'}
                    </span>
                  </div>
                )}

                <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible', minWidth: '300px' }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#000000" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                    const y = padding + val * (chartHeight - 2 * padding);
                    return (
                      <line 
                        key={idx} 
                        x1={padding} 
                        y1={y} 
                        x2={chartWidth - padding} 
                        y2={y} 
                        stroke="var(--border-color)" 
                        strokeWidth={0.5} 
                        strokeDasharray="2 4" 
                      />
                    );
                  })}

                  {/* Area Fill */}
                  <path d={areaD} fill="url(#chartGrad)" />

                  {/* Line Draw */}
                  <path d={pathD} fill="none" stroke="var(--accent-black)" strokeWidth={2.2} />

                  {/* Vertical Hover Cursor Line */}
                  {hoveredPointIdx !== null && (
                    <line 
                      x1={points[hoveredPointIdx].x} 
                      y1={padding} 
                      x2={points[hoveredPointIdx].x} 
                      y2={chartHeight - padding} 
                      stroke="rgba(0,0,0,0.15)" 
                      strokeWidth={1.2} 
                      strokeDasharray="3 3" 
                    />
                  )}

                  {/* Data Points */}
                  {points.map((p, idx) => {
                    const isHovered = hoveredPointIdx === idx;
                    return (
                      <g key={idx}>
                        {isHovered ? (
                          <>
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r={8} 
                              fill="none" 
                              stroke="var(--accent-black)" 
                              strokeWidth={1} 
                              className="pulse-halo"
                            />
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r={4} 
                              fill="var(--accent-black)" 
                            />
                          </>
                        ) : (
                          <circle 
                            cx={p.x} 
                            cy={p.y} 
                            r={3} 
                            fill="var(--accent-black)" 
                            stroke="var(--bg-primary)" 
                            strokeWidth={1} 
                          />
                        )}
                        
                        {/* Static values only displayed when not hovering, to avoid overlapping */}
                        {hoveredPointIdx === null && (
                          <text 
                            x={p.x} 
                            y={p.y - 10} 
                            textAnchor="middle" 
                            fontSize="8.5" 
                            fontWeight="600" 
                            fill="var(--text-primary)"
                          >
                            {chartMetric === 'sales' ? `₹${p.sales}C` : `${p.leads}L`}
                          </text>
                        )}

                        {/* Label on X Axis */}
                        <text 
                          x={p.x} 
                          y={chartHeight - 10} 
                          textAnchor="middle" 
                          fontSize="9" 
                          fontWeight={isHovered ? '700' : '500'} 
                          fill={isHovered ? 'var(--text-primary)' : 'var(--text-secondary)'}
                        >
                          {p.month}
                        </text>
                      </g>
                    );
                  })}

                  {/* Transparent Interactive Hover Column Rectangles */}
                  {points.map((p, idx) => {
                    const colWidth = (chartWidth - 2 * padding) / (chartData.length - 1);
                    const hoverX = p.x - colWidth / 2;
                    return (
                      <rect
                        key={idx}
                        x={hoverX}
                        y={0}
                        width={colWidth}
                        height={chartHeight}
                        fill="transparent"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredPointIdx(idx)}
                        onMouseLeave={() => setHoveredPointIdx(null)}
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          ) : (
            // Agents dashboard greeting / performance stats
            <div className="premium-card" style={{ 
              background: 'linear-gradient(135deg, #1d1d1f 0%, #000000 100%)', 
              color: 'white',
              justifyContent: 'center',
              padding: '2rem'
            }}>
              <h2 className="luxury-title" style={{ fontSize: '1.5rem', fontWeight: 500, color: 'white' }}>
                Aloha Agent Workspace
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
                Track your active tasks and follow up with leads in the Clients pipeline. Always check in when starting your shift to notify founder Prabal Luthra of your active status.
              </p>
              <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{myTasks.length}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Total Tasks Assigned</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{pendingTasks.length}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Pending Actions</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{clients.filter(c => c.assignedAgentId === currentUser.id).length}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Assigned Clients</div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Checklist */}
          <div className="premium-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>My Daily Workflow</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Checklist of active items assigned to you</p>
              </div>
              <span className="badge badge-gray">{pendingTasks.length} pending</span>
            </div>

            <form onSubmit={handleAddQuickTask} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Add private workflow item..." 
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                <Plus size={16} />
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {myTasks.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  No tasks on your workflow. Add a quick item above to get started.
                </div>
              ) : (
                myTasks.map(task => (
                  <div key={task.id} className={`workflow-item ${task.completed ? 'completed' : ''}`}>
                    <input 
                      type="checkbox" 
                      className="workflow-checkbox" 
                      checked={task.completed} 
                      onChange={() => handleToggleTask(task.id)}
                    />
                    <div className="workflow-text">{task.description}</div>
                    <span className={`badge ${
                      task.priority === 'high' ? 'badge-red' : 
                      task.priority === 'medium' ? 'badge-orange' : 'badge-gray'
                    }`} style={{ fontSize: '0.65rem' }}>
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Client Follow-up Reminders */}
          <div className="premium-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Client Follow-up Reminders</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Scheduled calls and premium property site visits</p>
              </div>
              <span className="badge badge-orange">{clientReminders.length} active</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {clientReminders.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  No upcoming client reminders scheduled.
                </div>
              ) : (
                clientReminders.map(client => (
                  <div key={client.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)'
                  }}>
                    <div style={{
                      backgroundColor: 'rgba(255, 149, 0, 0.1)',
                      color: 'var(--accent-orange)',
                      padding: '0.4rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '2px'
                    }}>
                      <Clock size={14} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <div style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{client.name} — <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{client.propertyInterest}</span></span>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button
                            type="button"
                            onClick={() => handleSnoozeReminder(client.id, client.reminderDate!)}
                            style={{
                              fontSize: '0.65rem',
                              padding: '0.15rem 0.35rem',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-primary)',
                              cursor: 'pointer',
                              color: 'var(--text-primary)'
                            }}
                          >
                            Snooze
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClearReminder(client.id)}
                            style={{
                              fontSize: '0.65rem',
                              padding: '0.15rem 0.35rem',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-primary)',
                              cursor: 'pointer',
                              color: 'var(--accent-orange, #d97706)'
                            }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        "{client.reminderText}"
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Due: {new Date(client.reminderDate!).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {currentUser.role === 'superadmin' && <span>Agent: {client.assignedAgentName}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Team Status & Live Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Active Team Check-in */}
          <div className="premium-card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Team Status</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-0.75rem' }}>Real-time check-in tracker</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {team.map(member => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div 
                    onClick={() => onNavigate('agent-detail', { agentId: member.id, fromView: 'dashboard' })}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                    title="View Agent profile"
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="hover-underline" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{member.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {member.role === 'superadmin' ? 'Founder' : 'Real Estate Agent'}
                      </div>
                    </div>
                  </div>
                  <div 
                    onClick={() => {
                      if (currentUser.role === 'superadmin' || currentUser.id === member.id) {
                        handleToggleAgentCheckIn(member.id);
                      }
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.4rem', 
                      fontSize: '0.75rem',
                      cursor: (currentUser.role === 'superadmin' || currentUser.id === member.id) ? 'pointer' : 'default',
                      userSelect: 'none',
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)'
                    }}
                    title={currentUser.role === 'superadmin' || currentUser.id === member.id ? "Click to toggle check-in status" : ""}
                  >
                    <span className={`status-dot ${member.checkedIn ? 'active' : 'inactive'}`}></span>
                    <span style={{ color: member.checkedIn ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {member.checkedIn ? 'Active' : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="premium-card" style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Company Activity Feed</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-0.75rem' }}>Recent team interactions</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              {logs.map(log => (
                <div key={log.id} style={{
                  fontSize: '0.8rem',
                  borderLeft: '2px solid var(--accent-black)',
                  paddingLeft: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.15rem'
                }}>
                  <div style={{ color: 'var(--text-primary)' }}>
                    <strong>{log.userName}</strong> {log.action}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Superadmin Founder Monitoring Console */}
      {currentUser.role === 'superadmin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem' }}>
          
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <h2 className="luxury-title" style={{ fontSize: '1.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={20} /> Founder Monitoring & Business Conversion Console
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Chronological pipeline valuations, lead capture metrics, and agent performance reports.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem' }} className="monitoring-grid">
            
            {/* Left Side: Pipeline Valuations & Source breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Funnel Valuations */}
              <div className="premium-card">
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Active Pipeline Funnel Valuation</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-0.75rem' }}>Total property value at each deal stage</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {Object.entries(stageValues).map(([stage, value]) => (
                    <div 
                      key={stage} 
                      onClick={() => onNavigate('dashboard-drilldown', { type: 'funnel', meta: { stage } })}
                      className="interactive-row-item"
                      style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', cursor: 'pointer', padding: '0.35rem 0.5rem', borderRadius: '6px', margin: '0 -0.5rem' }}
                      title={`Click to view clients in ${stage}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-secondary)' }}>{stage}</span>
                        <span style={{ fontWeight: 700 }}>₹{value} Cr</span>
                      </div>
                      {/* Segment bar */}
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, (value / 250) * 100)}%`,
                          backgroundColor: stage === 'closed' ? 'var(--accent-green)' : 'var(--accent-black)',
                          borderRadius: '3px'
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source Acquisition breakdown */}
              <div className="premium-card">
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Lead Acquisition Channels</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-0.75rem' }}>Marketing campaign channel performance</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {Object.entries(sourceCounts).map(([source, count]) => {
                    const total = clients.length || 1;
                    const percent = Math.round((count / total) * 100);
                    return (
                      <div 
                        key={source} 
                        onClick={() => onNavigate('dashboard-drilldown', { type: 'source', meta: { source } })}
                        className="interactive-row-item"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', cursor: 'pointer', padding: '0.4rem 0.5rem', borderRadius: '6px', margin: '0 -0.5rem' }}
                        title={`Click to view clients from ${source}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-black)' }}></span>
                          <span className="hover-underline">{source}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', fontWeight: 600 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{count} leads</span>
                          <span>{percent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Side: Agent Performance Board */}
            <div className="premium-card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Agent Conversion Leaderboard</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-0.75rem' }}>Key conversion statistics and check-in times</p>
              
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.5rem 0.25rem' }}>Agent</th>
                      <th style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>Leads</th>
                      <th style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>Closed</th>
                      <th style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>Conv. %</th>
                      <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>Revenue Volume</th>
                      <th style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>Reminders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentPerformance.map(agent => (
                      <tr 
                        key={agent.id} 
                        onClick={() => onNavigate('agent-detail', { agentId: agent.id, fromView: 'dashboard' })}
                        style={{ borderBottom: '1px solid var(--bg-tertiary)', cursor: 'pointer' }}
                        className="interactive-row"
                        title="Click to view detailed agent performance"
                      >
                        <td style={{ padding: '0.75rem 0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span className={`status-dot ${agent.checkedIn ? 'active' : 'inactive'}`} style={{ width: '6px', height: '6px' }}></span>
                            <span className="hover-underline" style={{ fontWeight: 600 }}>{agent.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 0.25rem', textAlign: 'center' }}>{agent.totalClients}</td>
                        <td style={{ padding: '0.75rem 0.25rem', textAlign: 'center' }}>{agent.closedCount}</td>
                        <td style={{ padding: '0.75rem 0.25rem', textAlign: 'center', fontWeight: 600 }}>{agent.conversionRate}%</td>
                        <td style={{ padding: '0.75rem 0.25rem', textAlign: 'right', fontWeight: 700 }}>₹{agent.totalValueClosed} Cr</td>
                        <td style={{ padding: '0.75rem 0.25rem', textAlign: 'center' }}>
                          <span style={{ color: agent.activeReminders > 0 ? 'var(--accent-orange)' : 'inherit', fontWeight: agent.activeReminders > 0 ? 600 : 400 }}>
                            {agent.activeReminders}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
