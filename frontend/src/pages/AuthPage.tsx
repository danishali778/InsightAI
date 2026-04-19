import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { T } from '../components/dashboard/tokens';
import { useAuth } from '../context/AuthContext';

export function AuthPage() {
  const navigate = useNavigate();
  const { user, isDevMode, onboardUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in (or if DEV mode forces a mock user), push to dashboard immediately
  React.useEffect(() => {
    const freshCheck = async () => {
      if (user || isDevMode) {
        if (!isDevMode) {
          try {
            // "Database Truth Check" - ensure the user exists before moving forward
            // By calling onboardUser first, we fix the race condition for new users
            await onboardUser();
            
            const { request } = await import('../services/http');
            await request('/settings/me'); 
            navigate('/dashboard');
          } catch (err) {
            console.warn("Auth verification failed:", err);
            // The 401 handling in http.ts handles the logout/redirect
          }
        } else {
          navigate('/dashboard');
        }
      }
    };
    freshCheck();
  }, [user, isDevMode, navigate]);

  const handleOAuthLogin = async (provider: 'google') => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // The useEffect will detect the session change and handle onboarding/navigation
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // If session is returned immediately (confirmation disabled), the useEffect will handle it
        if (!data.session) {
          setError("Success! Please check your email for a confirmation link.");
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
      boxSizing: 'border-box',
      background: T.s1, // Light background
      fontFamily: T.fontBody,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        padding: '40px 32px',
        background: '#ffffff',
        border: `1px solid ${T.border}`,
        borderRadius: 20,
        boxShadow: '0 20px 40px rgba(0,0,0,0.03)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 48, height: 48, borderRadius: 12,
            background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
            color: '#fff', fontSize: '1.4rem', fontWeight: 800,
            marginBottom: 16,
          }}>Q</div>
          <h2 style={{ margin: 0, fontFamily: T.fontHead, fontWeight: 800, fontSize: '1.6rem', color: T.text, letterSpacing: -0.5 }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ margin: '8px 0 0', color: T.text3, fontSize: '0.9rem' }}>
            {isLogin ? 'Enter your details to access your workspace.' : 'Start querying your data magically.'}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: '0.82rem',
            background: error.startsWith('Success') ? T.greenDim : '#fee2e2',
            color: error.startsWith('Success') ? T.green : '#b91c1c',
            border: `1px solid ${error.startsWith('Success') ? 'rgba(34,211,165,0.2)' : 'rgba(185,28,28,0.2)'}`
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: T.text2, marginBottom: 6 }}>Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: `1px solid ${T.border}`, background: T.s2,
                fontSize: '0.9rem', color: T.text, outline: 'none', transition: 'border 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.currentTarget.style.borderColor = T.accent}
              onBlur={e => e.currentTarget.style.borderColor = T.border}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: T.text2, marginBottom: 6 }}>Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: `1px solid ${T.border}`, background: T.s2,
                fontSize: '0.9rem', color: T.text, outline: 'none', transition: 'border 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.currentTarget.style.borderColor = T.accent}
              onBlur={e => e.currentTarget.style.borderColor = T.border}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%', padding: '14px', marginTop: 8, borderRadius: 10, border: 'none',
              background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
              color: '#ffffff', fontWeight: 600, fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: T.text3 }}>
          <div style={{ flex: 1, height: 1, background: T.border }} />
          <span style={{ padding: '0 12px', fontSize: '0.75rem', fontWeight: 500, fontFamily: T.fontMono, textTransform: 'uppercase' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>

        <button 
          onClick={() => handleOAuthLogin('google')}
          disabled={loading}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 10,
            border: `1px solid ${T.border}`, background: '#ffffff',
            color: T.text, fontWeight: 600, fontSize: '0.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = T.s2}
          onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
        >
          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: T.text3 }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none', border: 'none', color: T.accent, fontWeight: 600,
              cursor: 'pointer', padding: 0, textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
