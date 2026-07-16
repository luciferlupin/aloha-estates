import { useState, useEffect } from 'react';
import { CRMStore, User } from './services/store';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Clients } from './components/Clients';
import { Tasks } from './components/Tasks';
import { Team } from './components/Team';
import { Chat } from './components/Chat';
import { MetaCampaigns } from './components/MetaCampaigns';
import { SupabaseSync } from './services/supabaseSync';
import { Menu, X } from 'lucide-react';

// Import full-page workspaces replacing modals
import { AddClientPage } from './components/AddClientPage';
import { ClientDetailsPage } from './components/ClientDetailsPage';
import { AgentDetailPage } from './components/AgentDetailPage';
import { DashboardDrillDown } from './components/DashboardDrillDown';
import { CompanyActivity } from './components/CompanyActivity';
import { CompanyAnalytics } from './components/CompanyAnalytics';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [viewContext, setViewContext] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Initialize standard database keys in localStorage
    CRMStore.init();

    // Check if user session already exists in sessionStorage for page refreshes
    const savedUser = sessionStorage.getItem('aloha_current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    // Trigger initial Supabase sync-down and register real-time broadcast channel
    SupabaseSync.syncDown();
    SupabaseSync.subscribeRealtime();
    SupabaseSync.optimizeStorage();
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('aloha_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('aloha_current_user');
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    sessionStorage.setItem('aloha_current_user', JSON.stringify(updatedUser));
  };

  const handleNavigate = (view: string, context: any = null) => {
    setActiveView(view);
    setViewContext(context);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} onNavigate={handleNavigate} />;
      case 'clients':
        return <Clients currentUser={currentUser} onNavigate={handleNavigate} />;
      case 'tasks':
        return <Tasks currentUser={currentUser} onNavigate={handleNavigate} />;
      case 'team':
        return <Team currentUser={currentUser} onNavigate={handleNavigate} />;
      case 'chat':
        return <Chat currentUser={currentUser} />;
      case 'meta':
        return <MetaCampaigns />;
      
      // New Dedicated Full Page Views
      case 'add-client':
        return <AddClientPage onBack={() => setActiveView('clients')} />;
      case 'client-details':
        return (
          <ClientDetailsPage 
            clientId={viewContext?.clientId} 
            onBack={() => setActiveView('clients')} 
            currentUser={currentUser} 
          />
        );
      case 'agent-detail':
        return (
          <AgentDetailPage 
            agentId={viewContext?.agentId} 
            onBack={() => setActiveView(viewContext?.fromView || 'dashboard')} 
            currentUser={currentUser} 
          />
        );
      case 'dashboard-drilldown':
        return (
          <DashboardDrillDown 
            type={viewContext?.type} 
            meta={viewContext?.meta} 
            onBack={() => setActiveView('dashboard')} 
            currentUser={currentUser} 
          />
        );
      case 'activity':
        return <CompanyActivity currentUser={currentUser} onNavigate={handleNavigate} />;
      case 'analytics':
        return <CompanyAnalytics currentUser={currentUser} onNavigate={handleNavigate} />;
      default:
        return <Dashboard currentUser={currentUser} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Header Bar */}
      <header className="mobile-header">
        <button 
          className="menu-toggle-btn" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="mobile-brand-title">ALOHA ESTATES</span>
        <div style={{ width: 36 }}></div>
      </header>

      {/* Slide-out Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        currentUser={currentUser} 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
        isMobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />
      
      <main className="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;
