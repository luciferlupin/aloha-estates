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
}

export const Clients: React.FC<ClientsProps> = ({ currentUser }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // New Client form states
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [newAgentId, setNewAgentId] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newSource, setNewSource] = useState<'Meta Ads' | 'Referral' | 'Website' | 'Outbound' | 'Walk-in'>('Meta Ads');
  const [newPriority, setNewPriority] = useState<'hot' | 'warm' | 'cold'>('warm');
  const [newClientType, setNewClientType] = useState<'buyer' | 'seller'>('buyer');

  // Reminder form states
  const [reminderDate, setReminderDate] = useState('');
  const [reminderText, setReminderText] = useState('');

  // WhatsApp Integration states
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedClientForWA, setSelectedClientForWA] = useState<Client | null>(null);
  const [waTemplates, setWATemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [waCustomText, setWaCustomText] = useState('');

  // Client Details modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<Client | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Editing Client details state
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editPropertyInterest, setEditPropertyInterest] = useState('');
  const [editPriority, setEditPriority] = useState<'hot' | 'warm' | 'cold'>('warm');
  const [editSource, setEditSource] = useState<'Meta Ads' | 'Referral' | 'Website' | 'Outbound' | 'Walk-in'>('Meta Ads');
  const [editClientType, setEditClientType] = useState<'buyer' | 'seller'>('buyer');
  const [editStatus, setEditStatus] = useState<Client['status']>('lead');
  const [editAgentId, setEditAgentId] = useState('');

  // Notification alert when lead is simulated
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const loadClientsData = () => {
      setClients(CRMStore.getClients());
      const allUsers = CRMStore.getUsers();
      setAgents(allUsers.filter(u => u.role === 'agent'));
      setWATemplates(CRMStore.getWhatsAppTemplates());
      
      if (selectedClientForDetails) {
        const freshDetails = CRMStore.getClients().find(c => c.id === selectedClientForDetails.id);
        if (freshDetails) {
          setSelectedClientForDetails(freshDetails);
        }
      }
    };

    loadClientsData();

    // Default assigned agent to current user if agent
    const allUsers = CRMStore.getUsers();
    if (currentUser.role === 'agent') {
      setNewAgentId(currentUser.id);
    } else if (allUsers.length > 0) {
      setNewAgentId(allUsers[0].id);
    }

    // Storage Sync
    window.addEventListener('storage', loadClientsData);
    return () => window.removeEventListener('storage', loadClientsData);
  }, [currentUser, selectedClientForDetails]);

  const handleSimulateLead = () => {
    const newLead = CRMStore.simulateMetaLead();
    setClients(CRMStore.getClients());
    setNotification(`New Meta Lead Synced: ${newLead.name} (${newLead.propertyInterest})`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPhone) return;

    const assignedAgent = CRMStore.getUsers().find(u => u.id === newAgentId) || currentUser;

    CRMStore.addClient({
      name: newName,
      email: newEmail,
      phone: newPhone,
      status: 'lead',
      assignedAgentId: newAgentId,
      assignedAgentName: assignedAgent.name,
      notes: newNotes,
      budget: newBudget,
      propertyInterest: newInterest,
      reminderDate: null,
      reminderText: null,
      source: newSource,
      priority: newPriority,
      clientType: newClientType,
      comments: [],
      timeline: []
    });

    setClients(CRMStore.getClients());
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewBudget('');
    setNewInterest('');
    setNewNotes('');
    setNewSource('Meta Ads');
    setNewPriority('warm');
    setNewClientType('buyer');
    if (currentUser.role === 'superadmin' && agents.length > 0) {
      setNewAgentId(agents[0].id);
    }
  };

  const handleUpdateStatus = (clientId: string, status: Client['status']) => {
    CRMStore.updateClientStatus(clientId, status);
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

  const handleOpenWhatsAppModal = (client: Client) => {
    setSelectedClientForWA(client);
    const templates = CRMStore.getWhatsAppTemplates();
    setWATemplates(templates);
    
    if (templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
      const parsedText = parseWATemplate(templates[0].text, client);
      setWaCustomText(parsedText);
    }
    
    setShowWhatsAppModal(true);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const temp = waTemplates.find(t => t.id === templateId);
    if (temp && selectedClientForWA) {
      const parsedText = parseWATemplate(temp.text, selectedClientForWA);
      setWaCustomText(parsedText);
    }
  };

  const parseWATemplate = (templateText: string, client: Client): string => {
    return templateText
      .replace(/{{clientName}}/g, client.name)
      .replace(/{{agentName}}/g, client.assignedAgentName)
      .replace(/{{interest}}/g, client.propertyInterest)
      .replace(/{{budget}}/g, client.budget);
  };

  const handleSendWhatsApp = () => {
    if (!selectedClientForWA || !waCustomText) return;
    
    const cleanPhone = selectedClientForWA.phone.replace(/[^0-9]/g, '');
    let finalPhone = cleanPhone;
    if (cleanPhone.length === 10) {
      finalPhone = '91' + cleanPhone;
    }
    
    const waUrl = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(waCustomText)}`;
    window.open(waUrl, '_blank');
    
    CRMStore.addLog(currentUser.name, `Sent WhatsApp follow-up to client ${selectedClientForWA.name}`);
    setShowWhatsAppModal(false);
  };

  const handleOpenDetailsModal = (client: Client) => {
    setSelectedClientForDetails(client);
    setShowDetailsModal(true);
    setIsEditingClient(false);
    
    // Initialize edit fields
    setEditName(client.name);
    setEditEmail(client.email);
    setEditPhone(client.phone);
    setEditBudget(client.budget);
    setEditPropertyInterest(client.propertyInterest);
    setEditPriority(client.priority);
    setEditSource(client.source);
    setEditClientType(client.clientType);
    setEditStatus(client.status);
    setEditAgentId(client.assignedAgentId);
  };

  const handleUpdateClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForDetails) return;

    const updated = CRMStore.updateClient(selectedClientForDetails.id, {
      name: editName,
      email: editEmail,
      phone: editPhone,
      budget: editBudget,
      propertyInterest: editPropertyInterest,
      priority: editPriority,
      source: editSource,
      clientType: editClientType,
      status: editStatus,
      assignedAgentId: editAgentId
    });

    if (updated) {
      setClients(CRMStore.getClients());
      setSelectedClientForDetails(updated);
      setIsEditingClient(false);
    }
  };

  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForDetails || !newCommentText.trim()) return;

    const updated = CRMStore.addClientComment(selectedClientForDetails.id, newCommentText, currentUser.name);
    if (updated) {
      setClients(CRMStore.getClients());
      setSelectedClientForDetails(updated);
      setNewCommentText('');
    }
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client record?')) {
      CRMStore.deleteClient(clientId);
      setClients(CRMStore.getClients());
    }
  };

  const handleSetReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !reminderDate || !reminderText) return;

    CRMStore.setClientReminder(selectedClient.id, new Date(reminderDate).toISOString(), reminderText);
    setClients(CRMStore.getClients());
    setShowReminderModal(false);
    setReminderDate('');
    setReminderText('');
    setSelectedClient(null);
  };

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
          zIndex: 1000,
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
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
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
                      <div key={client.id} className="kanban-card" draggable={true} onDragStart={(e) => handleDragStart(e, client.id)} onClick={() => handleOpenDetailsModal(client)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span className="kanban-card-title">{client.name}</span>
                          <div style={{ display: 'flex', gap: '0.2rem' }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenWhatsAppModal(client); }}
                              className="btn-icon" 
                              style={{ padding: '0.2rem' }}
                              title="WhatsApp Follow-up"
                            >
                              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style={{ color: 'var(--accent-green)' }}>
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.644 1.97 14.178.95c11.548.95c-5.443 0-9.859 4.37-9.863 9.8-.001 1.83.488 3.619 1.416 5.176l-.988 3.606 3.692-.958zm12.333-6.626c-.33-.164-1.953-.952-2.253-1.061-.3-.11-.518-.164-.736.164-.218.329-.844 1.061-1.034 1.28-.19.219-.38.247-.71.082-.33-.164-1.393-.506-2.653-1.619-.98-.862-1.642-1.928-1.834-2.256-.192-.328-.02-.505.145-.668.148-.147.33-.383.495-.575.165-.192.22-.328.33-.548.11-.219.055-.41-.028-.574-.082-.164-.736-1.751-1.008-2.403-.265-.637-.53-.55-.736-.56-.189-.01-.408-.01-.626-.01-.218 0-.573.081-.873.41-.3.328-1.146 1.108-1.146 2.7 0 1.59 1.173 3.125 1.336 3.344.164.22 2.308 3.475 5.59 4.877.78.332 1.39.53 1.867.68.784.246 1.498.211 2.062.127.629-.094 1.953-.787 2.226-1.546.272-.76.272-1.411.19-1.547-.082-.136-.3-.218-.63-.382z"/>
                              </svg>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClient(client);
                                setShowReminderModal(true);
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
                  <tr key={client.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenDetailsModal(client)}>
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
                          onClick={(e) => { e.stopPropagation(); handleOpenWhatsAppModal(client); }}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px', color: 'var(--accent-green)', borderColor: 'rgba(52, 199, 89, 0.2)' }}
                          title="WhatsApp Follow-up"
                        >
                          <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" style={{ marginRight: '0.25rem' }}>
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.644 1.97 14.178.95c11.548.95c-5.443 0-9.859 4.37-9.863 9.8-.001 1.83.488 3.619 1.416 5.176l-.988 3.606 3.692-.958zm12.333-6.626c-.33-.164-1.953-.952-2.253-1.061-.3-.11-.518-.164-.736.164-.218.329-.844 1.061-1.034 1.28-.19.219-.38.247-.71.082-.33-.164-1.393-.506-2.653-1.619-.98-.862-1.642-1.928-1.834-2.256-.192-.328-.02-.505.145-.668.148-.147.33-.383.495-.575.165-.192.22-.328.33-.548.11-.219.055-.41-.028-.574-.082-.164-.736-1.751-1.008-2.403-.265-.637-.53-.55-.736-.56-.189-.01-.408-.01-.626-.01-.218 0-.573.081-.873.41-.3.328-1.146 1.108-1.146 2.7 0 1.59 1.173 3.125 1.336 3.344.164.22 2.308 3.475 5.59 4.877.78.332 1.39.53 1.867.68.784.246 1.498.211 2.062.127.629-.094 1.953-.787 2.226-1.546.272-.76.272-1.411.19-1.547-.082-.136-.3-.218-.63-.382z"/>
                          </svg>
                          WhatsApp
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClient(client);
                            setShowReminderModal(true);
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

      {/* Modal 1: Add Client */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="premium-card fade-in" style={{ maxWidth: '500px', width: '90%', padding: '2rem', gap: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>Add Luxury Client Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="btn-icon"><X size={18} /></button>
            </div>

            <form onSubmit={handleAddClientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Client Full Name *</label>
                <input required type="text" className="form-input" placeholder="e.g. Liam Neeson" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input required type="email" className="form-input" placeholder="liam@gmail.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input required type="text" className="form-input" placeholder="+91 98765..." value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                </div>
              </div>
              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label>Budget Range</label>
                  <input type="text" className="form-input" placeholder="e.g. ₹15 - 20 Cr" value={newBudget} onChange={e => setNewBudget(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Property Interest</label>
                  <input type="text" className="form-input" placeholder="e.g. Penthouse, Worli" value={newInterest} onChange={e => setNewInterest(e.target.value)} />
                </div>
              </div>

              {currentUser.role === 'superadmin' && (
                <div className="form-group">
                  <label>Assign to Agent</label>
                  <select className="form-input" value={newAgentId} onChange={e => setNewAgentId(e.target.value)}>
                    {CRMStore.getUsers().map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid-3" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label>Lead Source</label>
                  <select className="form-input" value={newSource} onChange={e => setNewSource(e.target.value as any)}>
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="Referral">Referral</option>
                    <option value="Website">Website</option>
                    <option value="Outbound">Outbound</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select className="form-input" value={newPriority} onChange={e => setNewPriority(e.target.value as any)}>
                    <option value="warm">Warm</option>
                    <option value="hot">Hot</option>
                    <option value="cold">Cold</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Profile Type</label>
                  <select className="form-input" value={newClientType} onChange={e => setNewClientType(e.target.value as any)}>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Consultation Notes</label>
                <textarea className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Provide initial requirements..." value={newNotes} onChange={e => setNewNotes(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Set Reminder */}
      {showReminderModal && selectedClient && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="premium-card fade-in" style={{ maxWidth: '400px', width: '90%', padding: '2rem', gap: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} /> Client Reminder
              </h3>
              <button onClick={() => setShowReminderModal(false)} className="btn-icon"><X size={18} /></button>
            </div>

            <form onSubmit={handleSetReminderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Set a follow-up date and description for <strong>{selectedClient.name}</strong>.
              </p>
              
              <div className="form-group">
                <label>Reminder Date & Time</label>
                <input required type="datetime-local" className="form-input" value={reminderDate} onChange={e => setReminderDate(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Follow-up Description</label>
                <textarea required className="form-input" style={{ minHeight: '80px', resize: 'none' }} placeholder="e.g. Call to discuss pricing feedback..." value={reminderText} onChange={e => setReminderText(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    CRMStore.setClientReminder(selectedClient.id, null, null);
                    setClients(CRMStore.getClients());
                    setShowReminderModal(false);
                  }} 
                  className="btn-danger" 
                  style={{ border: 'none', background: 'none', paddingLeft: 0, paddingRight: 0, marginRight: 'auto' }}
                >
                  Clear Reminder
                </button>
                <button type="button" onClick={() => setShowReminderModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Set Reminder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: WhatsApp Templates Portal */}
      {showWhatsAppModal && selectedClientForWA && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="premium-card fade-in" style={{ maxWidth: '500px', width: '90%', padding: '2rem', gap: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ color: 'var(--accent-green)' }}>
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.644 1.97 14.178.95c11.548.95c-5.443 0-9.859 4.37-9.863 9.8-.001 1.83.488 3.619 1.416 5.176l-.988 3.606 3.692-.958zm12.333-6.626c-.33-.164-1.953-.952-2.253-1.061-.3-.11-.518-.164-.736.164-.218.329-.844 1.061-1.034 1.28-.19.219-.38.247-.71.082-.33-.164-1.393-.506-2.653-1.619-.98-.862-1.642-1.928-1.834-2.256-.192-.328-.02-.505.145-.668.148-.147.33-.383.495-.575.165-.192.22-.328.33-.548.11-.219.055-.41-.028-.574-.082-.164-.736-1.751-1.008-2.403-.265-.637-.53-.55-.736-.56-.189-.01-.408-.01-.626-.01-.218 0-.573.081-.873.41-.3.328-1.146 1.108-1.146 2.7 0 1.59 1.173 3.125 1.336 3.344.164.22 2.308 3.475 5.59 4.877.78.332 1.39.53 1.867.68.784.246 1.498.211 2.062.127.629-.094 1.953-.787 2.226-1.546.272-.76.272-1.411.19-1.547-.082-.136-.3-.218-.63-.382z"/>
                </svg>
                WhatsApp Client Follow-up
              </h3>
              <button onClick={() => setShowWhatsAppModal(false)} className="btn-icon"><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>Recipient: <strong>{selectedClientForWA.name}</strong></span>
                <span>Phone: <strong>{selectedClientForWA.phone}</strong></span>
              </div>

              <div className="form-group">
                <label>Select WhatsApp Template</label>
                <select 
                  className="form-input" 
                  value={selectedTemplateId} 
                  onChange={e => handleTemplateChange(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  {waTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.category.toUpperCase()}] {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Message Content (Auto-compiled & Editable)</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '130px', fontSize: '0.85rem', lineHeight: '1.5', resize: 'vertical' }} 
                  value={waCustomText} 
                  onChange={e => setWaCustomText(e.target.value)}
                />
              </div>

              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-secondary)',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <strong>Dynamic Tags replaced:</strong> Client Name, Agent Name, Property Interest, and Budget.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowWhatsAppModal(false)} className="btn-secondary">Cancel</button>
                <button 
                  type="button" 
                  onClick={handleSendWhatsApp} 
                  className="btn-primary"
                  style={{ backgroundColor: 'var(--accent-green)', borderColor: 'var(--accent-green)' }}
                >
                  Send on WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal 4: Comprehensive Client Details Workspace */}
      {showDetailsModal && selectedClientForDetails && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="premium-card fade-in" style={{ maxWidth: '850px', width: '95%', padding: '2rem', gap: '1.5rem', backgroundColor: 'white', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <span className={`badge ${
                  selectedClientForDetails.priority === 'hot' ? 'badge-red' :
                  selectedClientForDetails.priority === 'warm' ? 'badge-orange' : 'badge-gray'
                }`} style={{ textTransform: 'uppercase', fontSize: '0.65rem', marginBottom: '0.25rem' }}>
                  {selectedClientForDetails.priority} Priority
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600 }}>
                  {selectedClientForDetails.name}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className={`badge ${
                  selectedClientForDetails.status === 'closed' ? 'badge-green' : 'badge-black'
                }`} style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  Stage: {selectedClientForDetails.status}
                </span>
                <button onClick={() => setShowDetailsModal(false)} className="btn-icon"><X size={18} /></button>
              </div>
            </div>

            {/* Split layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '2rem' }}>
              {/* Left Column: Core Metadata */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: '1px solid var(--border-color)', paddingRight: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Client Dossier</h4>
                  {!isEditingClient && (
                    <button 
                      onClick={() => setIsEditingClient(true)}
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px' }}
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
                
                {isEditingClient ? (
                  <form onSubmit={handleUpdateClientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
                    <div className="form-group" style={{ marginBottom: '0.1rem' }}>
                      <label style={{ fontSize: '0.7rem', marginBottom: '0.05rem' }}>Client Name</label>
                      <input 
                        type="text" 
                        required 
                        className="form-input" 
                        value={editName} 
                        onChange={e => setEditName(e.target.value)} 
                        style={{ padding: '0.35rem', fontSize: '0.8rem' }} 
                      />
                    </div>
                    <div className="grid-2" style={{ gap: '0.5rem', marginBottom: '0.1rem' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '0.7rem', marginBottom: '0.05rem' }}>Email</label>
                        <input 
                          type="email" 
                          required 
                          className="form-input" 
                          value={editEmail} 
                          onChange={e => setEditEmail(e.target.value)} 
                          style={{ padding: '0.35rem', fontSize: '0.8rem' }} 
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '0.7rem', marginBottom: '0.05rem' }}>Phone</label>
                        <input 
                          type="text" 
                          required 
                          className="form-input" 
                          value={editPhone} 
                          onChange={e => setEditPhone(e.target.value)} 
                          style={{ padding: '0.35rem', fontSize: '0.8rem' }} 
                        />
                      </div>
                    </div>
                    <div className="grid-2" style={{ gap: '0.5rem', marginBottom: '0.1rem' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '0.7rem', marginBottom: '0.05rem' }}>Budget</label>
                        <input 
                          type="text" 
                          required 
                          className="form-input" 
                          value={editBudget} 
                          onChange={e => setEditBudget(e.target.value)} 
                          style={{ padding: '0.35rem', fontSize: '0.8rem' }} 
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '0.7rem', marginBottom: '0.05rem' }}>Property Interest</label>
                        <input 
                          type="text" 
                          required 
                          className="form-input" 
                          value={editPropertyInterest} 
                          onChange={e => setEditPropertyInterest(e.target.value)} 
                          style={{ padding: '0.35rem', fontSize: '0.8rem' }} 
                        />
                      </div>
                    </div>
                    <div className="grid-2" style={{ gap: '0.5rem', marginBottom: '0.1rem' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '0.7rem', marginBottom: '0.05rem' }}>Priority</label>
                        <select 
                          className="form-input" 
                          value={editPriority} 
                          onChange={e => setEditPriority(e.target.value as any)} 
                          style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                        >
                          <option value="hot">Hot</option>
                          <option value="warm">Warm</option>
                          <option value="cold">Cold</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '0.7rem', marginBottom: '0.05rem' }}>Source</label>
                        <select 
                          className="form-input" 
                          value={editSource} 
                          onChange={e => setEditSource(e.target.value as any)} 
                          style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                        >
                          <option value="Meta Ads">Meta Ads</option>
                          <option value="Referral">Referral</option>
                          <option value="Website">Website</option>
                          <option value="Outbound">Outbound</option>
                          <option value="Walk-in">Walk-in</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid-2" style={{ gap: '0.5rem', marginBottom: '0.1rem' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '0.7rem', marginBottom: '0.05rem' }}>Client Type</label>
                        <select 
                          className="form-input" 
                          value={editClientType} 
                          onChange={e => setEditClientType(e.target.value as any)} 
                          style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                        >
                          <option value="buyer">Buyer</option>
                          <option value="seller">Seller</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '0.7rem', marginBottom: '0.05rem' }}>Pipeline Stage</label>
                        <select 
                          className="form-input" 
                          value={editStatus} 
                          onChange={e => setEditStatus(e.target.value as any)} 
                          style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                        >
                          <option value="lead">Lead</option>
                          <option value="contacted">Contacted</option>
                          <option value="viewing">Viewing</option>
                          <option value="negotiation">Negotiation</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>
                    {currentUser.role === 'superadmin' && (
                      <div className="form-group" style={{ marginBottom: '0.2rem' }}>
                        <label style={{ fontSize: '0.7rem', marginBottom: '0.05rem' }}>Re-assign Agent Owner</label>
                        <select 
                          className="form-input" 
                          value={editAgentId} 
                          onChange={e => setEditAgentId(e.target.value)} 
                          style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                        >
                          {agents.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                      <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem' }}>Save</button>
                      <button type="button" onClick={() => setIsEditingClient(false)} className="btn-secondary" style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem' }}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Property Interest:</span>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.15rem' }}>{selectedClientForDetails.propertyInterest}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Budget Allocation:</span>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.15rem' }}>{selectedClientForDetails.budget}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', borderTop: '1px solid var(--bg-tertiary)', paddingTop: '0.75rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Source:</span>
                        <div style={{ fontWeight: 600, marginTop: '0.1rem' }}>{selectedClientForDetails.source || 'Direct'}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Profile Type:</span>
                        <div style={{ fontWeight: 600, textTransform: 'capitalize', marginTop: '0.1rem' }}>{selectedClientForDetails.clientType || 'buyer'}</div>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--bg-tertiary)', paddingTop: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Assigned Owner:</span>
                      <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{selectedClientForDetails.assignedAgentName}</div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--bg-tertiary)', paddingTop: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Contact Details:</span>
                      <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Mail size={12} /> {selectedClientForDetails.email}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Phone size={12} /> {selectedClientForDetails.phone}</span>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--bg-tertiary)', paddingTop: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Initial Notes:</span>
                      <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', fontStyle: 'italic', lineHeight: '1.4' }}>
                        "{selectedClientForDetails.notes || 'No registration notes entered.'}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick WhatsApp Actions in Modal */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <button 
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleOpenWhatsAppModal(selectedClientForDetails);
                    }}
                    className="btn-primary"
                    style={{ width: '100%', backgroundColor: 'var(--accent-green)', borderColor: 'var(--accent-green)', gap: '0.5rem' }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.644 1.97 14.178.95c11.548.95c-5.443 0-9.859 4.37-9.863 9.8-.001 1.83.488 3.619 1.416 5.176l-.988 3.606 3.692-.958zm12.333-6.626c-.33-.164-1.953-.952-2.253-1.061-.3-.11-.518-.164-.736.164-.218.329-.844 1.061-1.034 1.28-.19.219-.38.247-.71.082-.33-.164-1.393-.506-2.653-1.619-.98-.862-1.642-1.928-1.834-2.256-.192-.328-.02-.505.145-.668.148-.147.33-.383.495-.575.165-.192.22-.328.33-.548.11-.219.055-.41-.028-.574-.082-.164-.736-1.751-1.008-2.403-.265-.637-.53-.55-.736-.56-.189-.01-.408-.01-.626-.01-.218 0-.573.081-.873.41-.3.328-1.146 1.108-1.146 2.7 0 1.59 1.173 3.125 1.336 3.344.164.22 2.308 3.475 5.59 4.877.78.332 1.39.53 1.867.68.784.246 1.498.211 2.062.127.629-.094 1.953-.787 2.226-1.546.272-.76.272-1.411.19-1.547-.082-.136-.3-.218-.63-.382z"/>
                    </svg>
                    Send WhatsApp Follow-up
                  </button>
                </div>
              </div>

              {/* Right Column: Timelines & Comments */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Notes Feed */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Agent Interactions & Comments</h4>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '0.75rem'
                  }}>
                    {!selectedClientForDetails.comments || selectedClientForDetails.comments.length === 0 ? (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                        No agent comments filed for this client yet.
                      </div>
                    ) : (
                      selectedClientForDetails.comments.map((c, i) => (
                        <div key={i} style={{ fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                            <span>{c.author}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                              {new Date(c.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-primary)', lineHeight: '1.4' }}>{c.text}</div>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddCommentSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Add interaction note..." 
                      value={newCommentText} 
                      onChange={e => setNewCommentText(e.target.value)}
                      style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                    />
                    <button type="submit" className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Post Note</button>
                  </form>
                </div>

                {/* Audit Event Timeline (PRABAL MONITORING SYSTEM) */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Founder Audit Timeline
                  </h4>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}>
                    {selectedClientForDetails.timeline && selectedClientForDetails.timeline.map((ev, i) => (
                      <div key={ev.id || i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        fontSize: '0.75rem',
                        borderLeft: '2px solid var(--accent-black)',
                        paddingLeft: '0.6rem',
                        marginLeft: '4px'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                          <span style={{ color: 'var(--text-primary)' }}>{ev.text}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Action by: {ev.userName}</span>
                        </div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                          {new Date(ev.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
