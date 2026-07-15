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

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<string>('dashboard');

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

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} onNavigate={setActiveView} />;
      case 'clients':
        return <Clients currentUser={currentUser} />;
      case 'tasks':
        return <Tasks currentUser={currentUser} />;
      case 'team':
        return <Team currentUser={currentUser} onNavigate={setActiveView} />;
      case 'chat':
        return <Chat currentUser={currentUser} />;
      case 'meta':
        return <MetaCampaigns />;
      default:
        return <Dashboard currentUser={currentUser} onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        currentUser={currentUser} 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
      />
      <main className="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;
