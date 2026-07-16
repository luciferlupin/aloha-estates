import React, { useState, useEffect } from 'react';
import { Task, User, CRMStore, Client } from '../services/store';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Calendar, 
  User as UserIcon, 
  AlertCircle,
  Search,
  ChevronRight,
  Inbox,
  ThumbsUp,
  Award
} from 'lucide-react';

interface TasksProps {
  currentUser: User;
  onNavigate?: (view: string, context?: any) => void;
}

export const Tasks: React.FC<TasksProps> = ({ currentUser, onNavigate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Advanced filters
  const [filterType, setFilterType] = useState<'my' | 'all' | 'pending' | 'completed' | 'review'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  // Task form states
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [taskClientId, setTaskClientId] = useState('');
  const [taskCategory, setTaskCategory] = useState<Task['category']>('Client Call');
  const [error, setError] = useState<string | null>(null);

  // Review & Feedback
  const [feedbackText, setFeedbackText] = useState('');
  const [activeFeedbackTaskId, setActiveFeedbackTaskId] = useState<string | null>(null);

  const loadTasksData = () => {
    setTasks(CRMStore.getTasks());
    const users = CRMStore.getUsers();
    setTeam(users);
    setClients(CRMStore.getClients());
  };

  useEffect(() => {
    loadTasksData();
    
    // Set initial assignment to first agent or current user
    const users = CRMStore.getUsers();
    const agentsList = users.filter(u => u.role === 'agent');
    if (agentsList.length > 0) {
      setAssignedToId(agentsList[0].id);
    } else if (users.length > 0) {
      setAssignedToId(users[0].id);
    }

    // Storage Sync
    window.addEventListener('storage', loadTasksData);
    return () => window.removeEventListener('storage', loadTasksData);
  }, []);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim() || !assignedToId || !dueDate) {
      setError('Please specify description, assignee, and due date.');
      return;
    }

    const agent = team.find(u => u.id === assignedToId);
    CRMStore.addTask(
      description, 
      assignedToId, 
      priority, 
      dueDate, 
      taskClientId || undefined, 
      taskCategory,
      currentUser.name
    );
    
    // Logging action
    CRMStore.addLog(currentUser.name, `Assigned task "${description}" to ${agent?.name || 'Agent'}`);

    setTasks(CRMStore.getTasks());
    
    // Reset form
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setTaskClientId('');
    setTaskCategory('Client Call');
  };

  const handleToggleCompleted = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    CRMStore.toggleTaskCompleted(taskId, currentUser.name);
    
    if (task) {
      const completionText = !task.completed ? 'completed' : 'incomplete';
      CRMStore.addLog(currentUser.name, `Marked task "${task.description}" as ${completionText.toUpperCase()}`);
    }
    
    setTasks(CRMStore.getTasks());
  };

  const handleUpdateTaskStatus = (taskId: string, status: Task['status']) => {
    const task = tasks.find(t => t.id === taskId);
    CRMStore.updateTaskStatus(taskId, status, undefined, currentUser.name);
    
    if (task && status) {
      CRMStore.addLog(currentUser.name, `Updated task "${task.description}" status to ${status.toUpperCase()}`);
    }
    
    setTasks(CRMStore.getTasks());
  };

  const handleAddFeedbackSubmit = (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    const task = tasks.find(t => t.id === taskId);
    CRMStore.updateTaskStatus(taskId, undefined, feedbackText, currentUser.name);
    
    if (task) {
      CRMStore.addLog(currentUser.name, `Added feedback to task "${task.description}": "${feedbackText.substring(0, 30)}..."`);
    }

    setTasks(CRMStore.getTasks());
    setFeedbackText('');
    setActiveFeedbackTaskId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (window.confirm('Are you sure you want to delete this task?')) {
      CRMStore.deleteTask(taskId);
      if (task) {
        CRMStore.addLog(currentUser.name, `Deleted task assignment: "${task.description}"`);
      }
      setTasks(CRMStore.getTasks());
    }
  };

  // 1. Interactive calculations for Analytics Cards
  const todayStr = new Date().toLocaleDateString();
  const pendingTasksCount = tasks.filter(t => !t.completed).length;
  const highPriorityTasksCount = tasks.filter(t => t.priority === 'high' && !t.completed).length;
  const reviewTasksCount = tasks.filter(t => t.status === 'completed' && !t.completed).length;
  const myPendingTasksCount = tasks.filter(t => t.assignedToId === currentUser.id && !t.completed).length;

  // 2. Filter logic
  const filteredTasks = tasks.filter(t => {
    // Role filter
    if (filterType === 'my') {
      if (t.assignedToId !== currentUser.id) return false;
    } else if (filterType === 'pending') {
      if (t.completed) return false;
    } else if (filterType === 'completed') {
      if (!t.completed) return false;
    } else if (filterType === 'review') {
      if (t.status !== 'completed' || t.completed) return false;
    }

    // Dropdown filters
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (assigneeFilter !== 'all' && t.assignedToId !== assigneeFilter) return false;

    // Search bar filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(term);
      const matchAgent = t.assignedToName.toLowerCase().includes(term);
      const matchClient = t.clientName?.toLowerCase().includes(term) || false;
      const matchCat = t.category?.toLowerCase().includes(term) || false;
      if (!matchDesc && !matchAgent && !matchClient && !matchCat) return false;
    }

    return true;
  });

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
        <div>
          <h1 className="luxury-title" style={{ fontSize: '2.25rem', fontWeight: 600, color: 'var(--accent-black)' }}>
            Task & Roster Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Coordinate workflows, assign luxury viewings checklists, and review active team completions.
          </p>
        </div>
      </div>

      {/* Task Center Analytics Summary Cards */}
      <div className="grid-4">
        
        {/* Card 1: My Pending Tasks */}
        <div className="premium-card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              My Pending Tasks
            </span>
            <Inbox size={16} style={{ color: 'var(--accent-black)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700 }}>{myPendingTasksCount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>assigned to me</span>
          </div>
        </div>

        {/* Card 2: Company-wide Pending */}
        <div className="premium-card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Active Tasks (Total)
            </span>
            <CheckSquare size={16} style={{ color: '#6366f1' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#6366f1' }}>{pendingTasksCount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>open actions</span>
          </div>
        </div>

        {/* Card 3: Urgent / High Priority */}
        <div className="premium-card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              High Priority Tasks
            </span>
            <AlertCircle size={16} style={{ color: 'var(--accent-red)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-red)' }}>{highPriorityTasksCount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>require immediate check</span>
          </div>
        </div>

        {/* Card 4: Awaiting Approval (Useful for Founder) */}
        <div className="premium-card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Awaiting Approval
            </span>
            <Award size={16} style={{ color: '#10b981' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>{reviewTasksCount}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>awaiting review</span>
          </div>
        </div>

      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: currentUser.role === 'superadmin' ? '1fr 2fr' : '1fr', gap: '2rem' }}>
        
        {/* Left Side: Create Task Form (Superadmin Only) */}
        {currentUser.role === 'superadmin' && (
          <div className="premium-card" style={{ height: 'fit-content', border: '1px solid var(--border-color)', backgroundColor: 'white', position: 'sticky', top: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Assign New Task
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Create and coordinate operations for agents.
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
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Task Description</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Schedule photoshoot for Worli villa"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ fontSize: '0.85rem', padding: '0.45rem' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Assignee</label>
                <select 
                  className="form-input"
                  value={assignedToId}
                  onChange={e => setAssignedToId(e.target.value)}
                  style={{ fontSize: '0.85rem', padding: '0.4rem' }}
                >
                  {team.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role === 'superadmin' ? 'Founder' : 'Agent'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Linked Client (Optional)</label>
                  <select 
                    className="form-input"
                    value={taskClientId}
                    onChange={e => setTaskClientId(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                  >
                    <option value="">No Client Linked</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Task Category</label>
                  <select 
                    className="form-input"
                    value={taskCategory}
                    onChange={e => setTaskCategory(e.target.value as any)}
                    style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                  >
                    <option value="Client Call">Client Call</option>
                    <option value="Site Viewing">Site Viewing</option>
                    <option value="Contract Prep">Contract Prep</option>
                    <option value="Brochure Delivery">Brochure Delivery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Priority Rating</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className="btn-secondary"
                      style={{
                        flex: 1,
                        fontSize: '0.75rem',
                        padding: '0.4rem',
                        textTransform: 'uppercase',
                        borderColor: priority === p ? 'var(--accent-black)' : 'var(--border-color)',
                        backgroundColor: priority === p ? 'var(--accent-black)' : 'var(--bg-primary)',
                        color: priority === p ? 'white' : 'var(--text-primary)'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Due Date</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  style={{ fontSize: '0.85rem', padding: '0.35rem' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.55rem', fontSize: '0.85rem', justifyContent: 'center' }}>
                Create Task
              </button>
            </form>
          </div>
        )}

        {/* Right Side: Task Listings & Search Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Advanced Query & Filters Panel */}
          <div className="premium-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'white', border: '1px solid var(--border-color)' }}>
            
            {/* Search Input Bar & Category Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search tasks..." 
                  className="form-input" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '2.5rem', fontSize: '0.8rem', height: '34px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
                {([
                  { id: 'all', label: 'All' },
                  { id: 'my', label: 'Assigned to Me' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'review', label: 'Needs Review' },
                  { id: 'completed', label: 'Completed' }
                ] as const).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id)}
                    className="btn-secondary"
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      borderColor: filterType === f.id ? 'var(--accent-black)' : 'var(--border-color)',
                      backgroundColor: filterType === f.id ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      fontWeight: filterType === f.id ? 600 : 500
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdown filters for Assignee and Priority */}
            <div className="grid-3" style={{ gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Priority:</span>
                <select 
                  className="form-input" 
                  value={priorityFilter} 
                  onChange={e => setPriorityFilter(e.target.value)}
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', height: '28px', background: 'none' }}
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Assignee:</span>
                <select 
                  className="form-input" 
                  value={assigneeFilter} 
                  onChange={e => setAssigneeFilter(e.target.value)}
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', height: '28px', background: 'none' }}
                >
                  <option value="all">All Agents</option>
                  {team.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setPriorityFilter('all');
                    setAssigneeFilter('all');
                  }}
                  className="btn-secondary"
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', height: '28px' }}
                >
                  Clear Filters
                </button>
              </div>

            </div>

          </div>

          {/* Task Grid items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredTasks.length === 0 ? (
              <div className="premium-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', backgroundColor: 'white' }}>
                No tasks match the filter criteria.
              </div>
            ) : (
              filteredTasks.map(task => (
                <div key={task.id} className="premium-card" style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  backgroundColor: 'white',
                  opacity: task.completed && task.status === 'approved' ? 0.75 : 1,
                  borderLeft: task.priority === 'high' ? '4px solid var(--accent-red)' : 
                              task.priority === 'medium' ? '4px solid var(--accent-orange)' : '4px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease'
                }}>
                  
                  {/* Category Tags & Delete Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="badge badge-black" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                        {task.category || 'Other'}
                      </span>
                      {task.clientName && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (task.clientId && onNavigate) onNavigate('client-details', { clientId: task.clientId }); 
                          }}
                          className="badge badge-gray" 
                          style={{ 
                            fontSize: '0.65rem', 
                            border: '1px solid var(--border-color)', 
                            cursor: 'pointer', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.2rem',
                            padding: '0.1rem 0.4rem',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '4px'
                          }}
                          title="Click to view client details dossier"
                        >
                          Client: <strong>{task.clientName}</strong> <ChevronRight size={10} />
                        </button>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className={`badge ${
                        task.status === 'approved' ? 'badge-green' :
                        task.status === 'rejected' ? 'badge-red' :
                        task.status === 'completed' ? 'badge-black' :
                        task.status === 'in_progress' ? 'badge-orange' : 'badge-gray'
                      }`} style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600 }}>
                        {task.status === 'completed' ? 'Completed (Awaiting Review)' : task.status || 'Pending'}
                      </span>
                      
                      {currentUser.role === 'superadmin' && (
                        <button 
                          onClick={() => handleDeleteTask(task.id)} 
                          className="btn-icon"
                          title="Delete Task"
                          style={{ padding: '0.2rem' }}
                        >
                          <Trash2 size={14} style={{ color: 'var(--accent-red)' }} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Task Description & Assignee */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <input 
                      type="checkbox" 
                      className="workflow-checkbox"
                      checked={task.completed || task.status === 'approved'}
                      disabled={task.status === 'approved'}
                      onChange={() => handleToggleCompleted(task.id)}
                      style={{ marginTop: '0.15rem', cursor: task.status === 'approved' ? 'not-allowed' : 'pointer' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                      <span style={{ 
                        fontSize: '0.95rem', 
                        fontWeight: 600,
                        textDecoration: (task.completed || task.status === 'approved') ? 'line-through' : 'none',
                        color: (task.completed || task.status === 'approved') ? 'var(--text-secondary)' : 'var(--text-primary)'
                      }}>
                        {task.description}
                      </span>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <UserIcon size={12} /> Assignee: <strong>{task.assignedToName}</strong>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={12} /> Due Date: <strong style={{ color: (new Date(task.dueDate).toLocaleDateString() === todayStr && !task.completed) ? 'var(--accent-red)' : 'inherit' }}>{new Date(task.dueDate).toLocaleDateString()}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback display */}
                  {task.feedback && (
                    <div style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: 'var(--text-primary)',
                      fontStyle: 'italic',
                      lineHeight: '1.4',
                      marginTop: '0.2rem'
                    }}>
                      <strong>Founder Revision Feedback:</strong> {task.feedback}
                    </div>
                  )}

                  {/* Actions & Feedback trigger */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem', marginTop: '0.4rem' }}>
                    
                    {/* Agent progress update selection */}
                    {task.assignedToId === currentUser.id && task.status !== 'approved' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Update Progress:</span>
                        <select 
                          value={task.status || 'pending'} 
                          onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as any)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed (Send for Review)</option>
                        </select>
                      </div>
                    )}

                    {/* Founder Review actions & Feedback composer */}
                    {currentUser.role === 'superadmin' && (
                      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '0.5rem' }}>
                        
                        {/* Approval / Rejection buttons */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleUpdateTaskStatus(task.id, 'approved')}
                              className="btn-primary"
                              style={{ 
                                padding: '0.35rem 0.75rem', 
                                fontSize: '0.75rem', 
                                backgroundColor: '#10b981', 
                                borderColor: '#10b981', 
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem'
                              }}
                            >
                              <ThumbsUp size={12} /> Approve Task
                            </button>
                            <button 
                              onClick={() => handleUpdateTaskStatus(task.id, 'rejected')}
                              className="btn-danger"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}
                            >
                              Request Changes
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => setActiveFeedbackTaskId(activeFeedbackTaskId === task.id ? null : task.id)}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                          >
                            {activeFeedbackTaskId === task.id ? 'Hide Feedback' : 'Write Feedback'}
                          </button>
                        </div>

                        {/* Direct Feedback composer */}
                        {activeFeedbackTaskId === task.id && (
                          <form onSubmit={(e) => handleAddFeedbackSubmit(e, task.id)} style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.25rem' }}>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="Add feedback to request edits (e.g. Please verify budget details)..." 
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              style={{ fontSize: '0.75rem', padding: '0.4rem', flex: 1 }}
                              required
                            />
                            <button type="submit" className="btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}>
                              Save Feedback
                            </button>
                          </form>
                        )}

                      </div>
                    )}

                  </div>

                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
