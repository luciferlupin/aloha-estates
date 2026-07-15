import React, { useState, useEffect } from 'react';
import { Task, User, CRMStore, Client } from '../services/store';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Calendar, 
  User as UserIcon, 
  AlertCircle,
  Clock,
  Filter
} from 'lucide-react';

interface TasksProps {
  currentUser: User;
}

export const Tasks: React.FC<TasksProps> = ({ currentUser }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filter, setFilter] = useState<'my' | 'all' | 'pending' | 'completed'>('all');
  
  // Task form state
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [taskClientId, setTaskClientId] = useState('');
  const [taskCategory, setTaskCategory] = useState<Task['category']>('Client Call');
  const [error, setError] = useState<string | null>(null);

  // Review states
  const [feedbackText, setFeedbackText] = useState('');
  const [activeFeedbackTaskId, setActiveFeedbackTaskId] = useState<string | null>(null);

  useEffect(() => {
    const loadTasksData = () => {
      setTasks(CRMStore.getTasks());
      const users = CRMStore.getUsers();
      setTeam(users);
      setClients(CRMStore.getClients());
    };

    loadTasksData();
    
    // Set initial assignment to first agent or current user
    const users = CRMStore.getUsers();
    const agents = users.filter(u => u.role === 'agent');
    if (agents.length > 0) {
      setAssignedToId(agents[0].id);
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
      setError('Please fill in all task parameters.');
      return;
    }

    CRMStore.addTask(
      description, 
      assignedToId, 
      priority, 
      dueDate, 
      taskClientId || undefined, 
      taskCategory
    );
    setTasks(CRMStore.getTasks());
    
    // Reset Form
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setTaskClientId('');
    setTaskCategory('Client Call');
  };

  const handleToggleCompleted = (taskId: string) => {
    CRMStore.toggleTaskCompleted(taskId);
    setTasks(CRMStore.getTasks());
  };

  const handleUpdateTaskStatus = (taskId: string, status: Task['status']) => {
    CRMStore.updateTaskStatus(taskId, status);
    setTasks(CRMStore.getTasks());
  };

  const handleAddFeedbackSubmit = (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    CRMStore.updateTaskStatus(taskId, undefined, feedbackText);
    setTasks(CRMStore.getTasks());
    setFeedbackText('');
    setActiveFeedbackTaskId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Delete this task?')) {
      CRMStore.deleteTask(taskId);
      setTasks(CRMStore.getTasks());
    }
  };

  // Filter logic
  const filteredTasks = tasks.filter(t => {
    if (filter === 'my') return t.assignedToId === currentUser.id;
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true; // 'all'
  });

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
            Task Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Assign client checkups, review listings tasks, and track workflow completion.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: currentUser.role === 'superadmin' ? '1fr 2fr' : '1fr', gap: '2rem' }}>
        
        {/* Left Side: Create Task Form (Superadmin Only) */}
        {currentUser.role === 'superadmin' && (
          <div className="premium-card" style={{ height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Assign New Task
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-0.75rem' }}>
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
                gap: '0.5rem'
              }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Task Description</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Schedule photoshoot for Worli villa"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Assignee</label>
                <select 
                  className="form-input"
                  value={assignedToId}
                  onChange={e => setAssignedToId(e.target.value)}
                >
                  {team.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role === 'superadmin' ? 'Founder' : 'Agent'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label>Linked Client (Optional)</label>
                  <select 
                    className="form-input"
                    value={taskClientId}
                    onChange={e => setTaskClientId(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="">No Client Linked</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Task Category</label>
                  <select 
                    className="form-input"
                    value={taskCategory}
                    onChange={e => setTaskCategory(e.target.value as any)}
                    style={{ fontSize: '0.85rem' }}
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
                <label>Priority Rating</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`btn-secondary`}
                      style={{
                        flex: 1,
                        fontSize: '0.8rem',
                        padding: '0.5rem',
                        textTransform: 'uppercase',
                        borderColor: priority === p ? 'var(--accent-black)' : 'var(--border-color)',
                        backgroundColor: priority === p ? 'var(--accent-black)' : 'var(--bg-primary)',
                        color: priority === p ? 'var(--bg-primary)' : 'var(--text-primary)'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Create Task
              </button>
            </form>
          </div>
        )}

        {/* Right Side: Task Listings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Filters Bar */}
          <div className="premium-card" style={{ padding: '1rem 1.5rem', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} /> Filters
            </span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {([
                { id: 'all', label: 'All Tasks' },
                { id: 'my', label: 'Assigned to Me' },
                { id: 'pending', label: 'Pending' },
                { id: 'completed', label: 'Completed' }
              ] as const).map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`btn-secondary`}
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    borderColor: filter === f.id ? 'var(--accent-black)' : 'var(--border-color)',
                    backgroundColor: filter === f.id ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                    fontWeight: filter === f.id ? 600 : 500
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Task Grid items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredTasks.length === 0 ? (
              <div className="premium-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No tasks matches the filter criteria.
              </div>
            ) : (
              filteredTasks.map(task => (
                <div key={task.id} className="premium-card" style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  opacity: task.completed && task.status === 'approved' ? 0.8 : 1,
                  borderLeft: task.priority === 'high' ? '4px solid var(--accent-red)' : 
                              task.priority === 'medium' ? '4px solid var(--accent-orange)' : '4px solid var(--border-color)'
                }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-black" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                        {task.category || 'Other'}
                      </span>
                      {task.clientName && (
                        <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>
                          Client: <strong>{task.clientName}</strong>
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className={`badge ${
                        task.status === 'approved' ? 'badge-green' :
                        task.status === 'rejected' ? 'badge-red' :
                        task.status === 'completed' ? 'badge-black' :
                        task.status === 'in_progress' ? 'badge-orange' : 'badge-gray'
                      }`} style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600 }}>
                        {task.status || 'Pending'}
                      </span>
                      
                      {currentUser.role === 'superadmin' && (
                        <button 
                          onClick={() => handleDeleteTask(task.id)} 
                          className="btn-icon"
                          title="Delete Task"
                          style={{ padding: '0.15rem' }}
                        >
                          <Trash2 size={14} style={{ color: 'var(--accent-red)' }} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Task Description */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '0.2rem' }}>
                    <input 
                      type="checkbox" 
                      className="workflow-checkbox"
                      checked={task.completed || task.status === 'approved'}
                      disabled={task.status === 'approved'}
                      onChange={() => handleToggleCompleted(task.id)}
                      style={{ marginTop: '0.15rem' }}
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
                          <UserIcon size={12} /> Assigned to: <strong>{task.assignedToName}</strong>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={12} /> Due: <strong>{new Date(task.dueDate).toLocaleDateString()}</strong>
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
                      <strong>Founder Feedback:</strong> {task.feedback}
                    </div>
                  )}

                  {/* Operational workflow actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--bg-tertiary)', paddingTop: '0.6rem', marginTop: '0.4rem' }}>
                    
                    {/* Agent Status progression selectors */}
                    {task.assignedToId === currentUser.id && task.status !== 'approved' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Update Progress:</span>
                        <select 
                          value={task.status || 'pending'} 
                          onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as any)}
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'none' }}
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
                              style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', backgroundColor: 'var(--accent-green)', borderColor: 'var(--accent-green)', borderRadius: '6px' }}
                            >
                              Approve Task
                            </button>
                            <button 
                              onClick={() => handleUpdateTaskStatus(task.id, 'rejected')}
                              className="btn-danger"
                              style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}
                            >
                              Reject & Request Changes
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => setActiveFeedbackTaskId(activeFeedbackTaskId === task.id ? null : task.id)}
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                          >
                            {activeFeedbackTaskId === task.id ? 'Hide Feedback Form' : 'Write Feedback'}
                          </button>
                        </div>

                        {/* Direct Feedback composer */}
                        {activeFeedbackTaskId === task.id && (
                          <form onSubmit={(e) => handleAddFeedbackSubmit(e, task.id)} style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.25rem' }}>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="e.g. Check the client budget parameters before site visit..." 
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              style={{ fontSize: '0.75rem', padding: '0.4rem', flex: 1 }}
                              required
                            />
                            <button type="submit" className="btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}>
                              Save Comment
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
