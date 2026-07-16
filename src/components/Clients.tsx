import React, { useState, useEffect } from 'react';
import { Client, User, CRMStore, WhatsAppTemplate } from '../services/store';
import { 
  Users, 
  Search, 
  Plus, 
  SlidersHorizontal, 
  Grid, 
  List, 
  Sparkles, 
  Bell, 
  Trash2,
  Calendar,
  X,
  Phone,
  Mail,
  Home,
  DollarSign
} from 'lucide-react';

interface ClientsProps {
  currentUser: User;
  onNavigate: (view: string, context?: any) => void;
}

export const Clients: React.FC<ClientsProps> = ({ currentUser, onNavigate }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  
  // Notification alert when lead is simulated
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const loadClientsData = () => {
      setClients(CRMStore.getClients());
      const allUsers = CRMStore.getUsers();
      setAgents(allUsers.filter(u => u.role === 'agent'));
    };

    loadClientsData();

    // Storage Sync
    window.addEventListener('storage', loadClientsData);
    return () => window.removeEventListener('storage', loadClientsData);
  }, [currentUser]);

  const handleSimulateLead = () => {
    const newLead = CRMStore.simulateMetaLead();
    setClients(CRMStore.getClients());
    setNotification(`New Meta Lead Synced: ${newLead.name} (${newLead.propertyInterest})`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleUpdateStatus = (clientId: string, status: Client['status']) => {
    CRMStore.updateClientStatus(clientId, status, currentUser.name);
    setClients(CRMStore.getClients());
  };

  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    e.dataTransfer.setData('text/plain', clientId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Client['status']) => {
    e.preventDefault();
    const clientId = e.dataTransfer.getData('text/plain');
    if (clientId) {
      handleUpdateStatus(clientId, status);
    }
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client record?')) {
      CRMStore.deleteClient(clientId, currentUser.name);
      setClients(CRMStore.getClients());
    }
  };

  // Set reminder page sync

  // Filter clients
  const filteredClients = clients.filter(c => {
    const query = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.propertyInterest.toLowerCase().includes(query) ||
      c.assignedAgentName.toLowerCase().includes(query) ||
      c.status.toLowerCase().includes(query)
    );
  });

  const columns: { id: Client['status']; label: string }[] = [
    { id: 'lead', label: 'Meta Campaigns Lead' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'viewing', label: 'Property Viewing' },
    { id: 'negotiation', label: 'Negotiations' },
    { id: 'closed', label: 'Closed Deal' }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Notification banner */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 3100,
          backgroundColor: 'var(--accent-black)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <Sparkles size={18} style={{ color: 'var(--accent-orange)' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Meta Sync Notification</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{notification}</div>
          </div>
        </div>
      )}

      {/* Header Panel */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.5rem'
      }}>
        <div>
          <h1 className="luxury-title" style={{ fontSize: '2.25rem', fontWeight: 600, color: 'var(--accent-black)' }}>
            Clients Portfolio
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Manage lead generation pipelines, property assignments, and VIP transactions.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleSimulateLead} 
            className="btn-secondary" 
            style={{ 
              border: '1px solid var(--accent-black)', 
              color: 'var(--accent-black)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Sparkles size={16} /> Simulate Facebook Lead
          </button>
          <button onClick={() => onNavigate('add-client')} className="btn-primary">
            <Plus size={16} /> Add Luxury Client
          </button>
        </div>
      </div>

      {/* Filter and View toggles */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-secondary)'
          }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search name, property, agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
          />
        </div>

        {/* View toggles */}
        <div style={{
          display: 'flex',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-primary)'
        }}>
          <button
            onClick={() => setViewMode('kanban')}
            style={{
              padding: '0.5rem 0.85rem',
              border: 'none',
              backgroundColor: viewMode === 'kanban' ? 'var(--bg-secondary)' : 'transparent',
              color: viewMode === 'kanban' ? 'var(--accent-black)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Grid size={14} /> Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '0.5rem 0.85rem',
              border: 'none',
              backgroundColor: viewMode === 'list' ? 'var(--bg-secondary)' : 'transparent',
              color: viewMode === 'list' ? 'var(--accent-black)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <List size={14} /> List View
          </button>
        </div>
      </div>

      {/* Main Workspace View */}
      {viewMode === 'kanban' ? (
        <div className="kanban-board">
          {columns.map(col => {
            const colClients = filteredClients.filter(c => c.status === col.id);
            return (
              <div key={col.id} className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
                <div className="kanban-header">
                  <span>{col.label}</span>
                  <span className="kanban-count">{colClients.length}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '600px', paddingRight: '2px' }}>
                  {colClients.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      No clients
                    </div>
                  ) : (
                    colClients.map(client => (
                      <div key={client.id} className="kanban-card" draggable={true} onDragStart={(e) => handleDragStart(e, client.id)} onClick={() => onNavigate('client-details', { clientId: client.id })}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span className="kanban-card-title text-truncate" style={{ maxWidth: '140px' }}>{client.name}</span>
                          <div style={{ display: 'flex', gap: '0.2rem' }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onNavigate('client-details', { clientId: client.id }); }}
                              className="btn-icon" 
                              style={{ padding: '0.2rem' }}
                              title="Client Workspace & WhatsApp"
                            >
                              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style={{ color: 'var(--accent-green)' }}>
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.644 1.97 14.178.95c-5.443 0-9.859 4.37-9.863 9.8-.001 1.83.488 3.619 1.416 5.176l-.988 3.606 3.692-.958zm12.333-6.626c-.33-.164-1.953-.952-2.253-1.061-.3-.11-.518-.164-.736.164-.218.329-.844 1.061-1.034 1.28-.19.219-.38.247-.71.082-.33-.164-1.393-.506-2.653-1.619-.98-.862-1.642-1.928-1.834-2.256-.192-.328-.02-.505.145-.668.148-.147.33-.383.495-.575.165-.192.22-.328.33-.548.11-.219.055-.41-.028-.574-.082-.164-.736-1.751-1.008-2.403-.265-.637-.53-.55-.736-.56-.189-.01-.408-.01-.626-.01-.218 0-.573.081-.873.41-.3.328-1.146 1.108-1.146 2.7 0 1.59 1.173 3.125 1.336 3.344.164.22 2.308 3.475 5.59 4.877.78.332 1.39.53 1.867.68.784.246 1.498.211 2.062.127.629-.094 1.953-.787 2.226-1.546.272-.76.272-1.411.19-1.547-.082-.136-.3-.218-.63-.382z"/>
                              </svg>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate('client-details', { clientId: client.id });
                              }}
                              className="btn-icon" 
                              style={{ padding: '0.2rem' }}
                              title="Set follow-up reminder"
                            >
                              <Bell size={12} style={{ color: client.reminderDate ? 'var(--accent-orange)' : 'inherit' }} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                              className="btn-icon" 
                              style={{ padding: '0.2rem' }}
                              title="Delete profile"
                            >
                              <Trash2 size={12} style={{ color: 'var(--accent-red)' }} />
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Home size={10} /> {client.propertyInterest}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            <DollarSign size={10} /> {client.budget}
                          </span>
                        </div>

                        {client.reminderDate && (
                          <div style={{
                            backgroundColor: 'rgba(255, 149, 0, 0.08)',
                            border: '1px solid rgba(255, 149, 0, 0.15)',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            color: 'var(--accent-orange)'
                          }}>
                            <strong>Reminder:</strong> {client.reminderText}
                          </div>
                        )}

                        <div className="kanban-card-meta" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>
                            {client.assignedAgentName}
                          </span>
                          
                          {/* Navigation stages picker */}
                          <select 
                            value={client.status} 
                            onChange={(e) => handleUpdateStatus(client.id, e.target.value as Client['status'])}
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                              fontSize: '0.7rem', 
                              padding: '0.1rem', 
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              background: 'none'
                            }}
                          >
                            <option value="lead">Lead</option>
                            <option value="contacted">Contacted</option>
                            <option value="viewing">Viewing</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Mode Table */
        <div className="premium-table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Client Details</th>
                <th>Status</th>
                <th>Property Interest</th>
                <th>Budget</th>
                <th>Assigned Agent</th>
                <th>Active Reminder</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No luxury clients found matching your search.
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr key={client.id} style={{ cursor: 'pointer' }} onClick={() => onNavigate('client-details', { clientId: client.id })}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{client.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0.2rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={10} /> {client.email}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={10} /> {client.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        client.status === 'closed' ? 'badge-green' :
                        client.status === 'negotiation' ? 'badge-orange' :
                        client.status === 'viewing' ? 'badge-black' : 'badge-gray'
                      }`} style={{ textTransform: 'uppercase' }}>
                        {client.status}
                      </span>
                    </td>
                    <td>{client.propertyInterest}</td>
                    <td style={{ fontWeight: 600 }}>{client.budget}</td>
                    <td>{client.assignedAgentName}</td>
                    <td>
                      {client.reminderDate ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-orange)' }}>
                          <div>{new Date(client.reminderDate).toLocaleDateString()}</div>
                          <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{client.reminderText}"</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None set</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onNavigate('client-details', { clientId: client.id }); }}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px', color: 'var(--accent-green)', borderColor: 'rgba(52, 199, 89, 0.2)' }}
                          title="WhatsApp Follow-up"
                        >
                          <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" style={{ marginRight: '0.25rem' }}>
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.644 1.97 14.178.95c-5.443 0-9.859 4.37-9.863 9.8-.001 1.83.488 3.619 1.416 5.176l-.988 3.606 3.692-.958zm12.333-6.626c-.33-.164-1.953-.952-2.253-1.061-.3-.11-.518-.164-.736.164-.218.329-.844 1.061-1.034 1.28-.19.219-.38.247-.71.082-.33-.164-1.393-.506-2.653-1.619-.98-.862-1.642-1.928-1.834-2.256-.192-.328-.02-.505.145-.668.148-.147.33-.383.495-.575.165-.192.22-.328.33-.548.11-.219.055-.41-.028-.574-.082-.164-.736-1.751-1.008-2.403-.265-.637-.53-.55-.736-.56-.189-.01-.408-.01-.626-.01-.218 0-.573.081-.873.41-.3.328-1.146 1.108-1.146 2.7 0 1.59 1.173 3.125 1.336 3.344.164.22 2.308 3.475 5.59 4.877.78.332 1.39.53 1.867.68.784.246 1.498.211 2.062.127.629-.094 1.953-.787 2.226-1.546.272-.76.272-1.411.19-1.547-.082-.136-.3-.218-.63-.382z"/>
                          </svg>
                          Workspace
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('client-details', { clientId: client.id });
                          }}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                        >
                          <Bell size={12} /> Reminder
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                          className="btn-danger"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
