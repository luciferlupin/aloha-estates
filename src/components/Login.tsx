import React, { useState } from 'react';
import { CRMStore, User } from '../services/store';
import { Building2, Mail, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      // 1. Try to authenticate via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (!authError && authData.user) {
        // Pull roles from custom users table linking matching email
        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('email', authData.user.email)
          .single();

        if (!dbError && dbUser) {
          const authenticatedUser: User = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            checkedIn: dbUser.checked_in,
            lastCheckIn: dbUser.last_check_in,
            lastCheckOut: dbUser.last_check_out
          };
          onLoginSuccess(authenticatedUser);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Supabase Auth error, attempting local credentials fallback:', e);
    }

    // 2. Local Fallback (Sandbox sandbox logins)
    const authenticatedUser = CRMStore.authenticate(email.trim(), password);
    if (authenticatedUser) {
      onLoginSuccess(authenticatedUser);
    } else {
      setError('Invalid email or password. Please verify your credentials.');
    }
    setLoading(false);
  };

  const fillCredentials = (type: 'superadmin' | 'agent') => {
    if (type === 'superadmin') {
      setEmail('prabal@alohaestates.com');
      setPassword('admin123');
    } else {
      setEmail('kabir@alohaestates.com');
      setPassword('agent123');
    }
    setError(null);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-secondary)',
      padding: '1.5rem'
    }}>
      <div className="premium-card fade-in" style={{
        maxWidth: '420px',
        width: '100%',
        padding: '2.5rem',
        textAlign: 'center',
        gap: '1.75rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            backgroundColor: 'var(--accent-black)',
            color: 'var(--bg-primary)',
            borderRadius: '16px',
            marginBottom: '1rem'
          }}>
            <Building2 size={32} strokeWidth={1.5} />
          </div>
          <h1 className="luxury-title" style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--accent-black)', marginBottom: '0.25rem' }}>
            ALOHA ESTATES
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Private CRM Portal
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(255, 59, 48, 0.08)',
            border: '1px solid rgba(255, 59, 48, 0.15)',
            color: 'var(--accent-red)',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            textAlign: 'left'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }} />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@alohaestates.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }} />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '0.85rem', 
              fontSize: '0.95rem', 
              marginTop: '0.5rem', 
              opacity: loading ? 0.75 : 1, 
              cursor: loading ? 'not-allowed' : 'pointer' 
            }}
          >
            {loading ? 'Authenticating Secure Session...' : 'Sign In to Workspace'}
          </button>
        </form>

        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Quick Sandbox Access (Pre-configured)
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              onClick={() => fillCredentials('superadmin')}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px' }}
            >
              Prabal (Founder)
            </button>
            <button
              onClick={() => fillCredentials('agent')}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px' }}
            >
              Kabir (Agent)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
