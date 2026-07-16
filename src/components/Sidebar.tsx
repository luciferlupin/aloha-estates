import React from 'react';
import { User, CRMStore } from '../services/store';
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  MessageSquare, 
  Megaphone,
  LogOut,
  Clock,
  UserCheck,
  Activity,
  BarChart3
} from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeView,
  setActiveView,
  onLogout,
  onUserUpdate,
  isMobileOpen = false,
  onCloseMobile
}) => {
  
  const handleCheckInToggle = () => {
    const updated = CRMStore.toggleCheckIn(currentUser.id);
    if (updated) {
      onUserUpdate(updated);
    }
  };

  const handleNavSelect = (viewId: string) => {
    setActiveView(viewId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients & Pipeline', icon: Users },
    { id: 'tasks', label: 'Task Center', icon: CheckSquare },
    { id: 'team', label: 'Team Directory', icon: UserCheck },
    { id: 'chat', label: 'General Chat', icon: MessageSquare },
    { id: 'meta', label: 'Meta Ads', icon: Megaphone }
  ];

  if (currentUser.role === 'superadmin') {
    navItems.push({ id: 'analytics', label: 'Company Analytics', icon: BarChart3 });
    navItems.push({ id: 'activity', label: 'Company Activity', icon: Activity });
  }

  return (
    <div className={`sidebar-wrapper ${isMobileOpen ? 'mobile-open' : ''}`} style={{
      backgroundColor: 'var(--bg-primary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '2rem 1.5rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          backgroundColor: 'var(--accent-black)',
          color: 'var(--bg-primary)',
          padding: '0.5rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Building2 size={20} />
        </div>
        <div>
          <h2 className="luxury-title" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-black)', lineHeight: 1.1 }}>
            ALOHA ESTATES
          </h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Luxury Real Estate
          </span>
        </div>
      </div>

      {/* Profile Card */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            fontWeight: 600
          }}>
            {currentUser.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.name}
            </span>
            <span style={{ display: 'inline-flex', alignSelf: 'flex-start' }}>
              <span className={`badge ${currentUser.role === 'superadmin' ? 'badge-black' : 'badge-gray'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', textTransform: 'uppercase' }}>
                {currentUser.role}
              </span>
            </span>
          </div>
        </div>

        {/* Shift Control Button */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={12} /> Shift Status
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 500 }}>
              <span className={`status-dot ${currentUser.checkedIn ? 'active' : 'inactive'}`}></span>
              {currentUser.checkedIn ? 'Checked In' : 'Checked Out'}
            </span>
          </div>
          <button 
            onClick={handleCheckInToggle}
            className={`btn-${currentUser.checkedIn ? 'secondary' : 'primary'}`} 
            style={{ 
              width: '100%', 
              padding: '0.45rem', 
              fontSize: '0.75rem', 
              borderRadius: '6px',
              border: currentUser.checkedIn ? '1px solid var(--border-color)' : 'none'
            }}
          >
            {currentUser.checkedIn ? 'Check Out of Shift' : 'Check In to Shift'}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: '1.5rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem'
      }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavSelect(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                border: 'none',
                background: isActive ? 'var(--bg-secondary)' : 'transparent',
                color: isActive ? 'var(--accent-black)' : 'var(--text-secondary)',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2 : 1.75} style={{ flexShrink: 0 }} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div style={{
        padding: '1rem 0.75rem',
        borderTop: '1px solid var(--border-color)'
      }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            border: 'none',
            background: 'transparent',
            color: 'var(--accent-red)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 500,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          Sign Out Portal
        </button>
      </div>
    </div>
  );
};
