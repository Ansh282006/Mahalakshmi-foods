import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

const ADMIN_EMAIL = 'admin@mahalaxmi.com';
const REMEMBER_KEY = 'mahalaxmi_admin_email';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email === ADMIN_EMAIL) {
        navigate('/admin/dashboard');
      } else {
        setCheckingSession(false);
      }
    });
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, [navigate]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      setError('This login is for administrators only.');
      triggerShake();
      setLoading(false);
      return;
    }

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (loginError) {
      setError(loginError.message);
      triggerShake();
      setLoading(false);
      return;
    }

    if (data.user?.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setError('You are not authorized as an admin.');
      triggerShake();
      setLoading(false);
      return;
    }

    if (remember) localStorage.setItem(REMEMBER_KEY, email.trim().toLowerCase());
    else localStorage.removeItem(REMEMBER_KEY);

    toast.success('Welcome back, Admin');
    navigate('/admin/dashboard');
  };

  if (checkingSession) {
    return (
      <div className="prem-admin-login" style={{ gridTemplateColumns: '1fr' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gold-400)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '2px',
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="prem-admin-login">
      {/* LEFT — BRAND */}
      <aside className="prem-admin-login-brand">
        <Link to="/" className="prem-admin-login-logo" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="prem-admin-login-mark">M</span>
          <span className="prem-admin-login-brand-text">
            MAHALAXMI
            <em>KRUSHI PRAKRIYA UDYOG</em>
          </span>
        </Link>

        <div className="prem-admin-login-copy">
          <span className="prem-kicker" style={{ color: 'var(--gold-500)', borderBottomColor: 'var(--gold-500)' }}>
            ADMIN ACCESS
          </span>
          <h1 className="prem-admin-login-title">
            The control room, <em>simplified.</em>
          </h1>
          <p className="prem-admin-login-desc">
            Manage orders, monitor stock, track revenue, and grow your business
            from one place. Built for Mahalaxmi Chips by Mahalaxmi Chips.
          </p>
        </div>

        <div className="prem-admin-login-secure">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Restricted access · Admin credentials required</span>
        </div>
      </aside>

      {/* RIGHT — FORM */}
      <main className="prem-admin-login-form-side">
        <div className={`prem-admin-login-form-inner prem-admin-login-card ${shake ? 'shake' : ''}`}>
          <span className="prem-kicker">SIGN IN</span>
          <h2 className="prem-admin-login-form-title">Admin Login</h2>
          <p className="prem-admin-login-form-sub">
            Enter your credentials to access the dashboard.
          </p>

          <form onSubmit={handleLogin}>
            <div className="prem-field">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mahalaxmi.com"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            <div className="prem-field">
              <label>Password</label>
              <div className="prem-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="prem-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--s-3)' }}>
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--forest-700)' }}
              />
              <label htmlFor="remember" style={{ fontSize: '0.85rem', color: 'var(--charcoal-700)', cursor: 'pointer' }}>
                Remember my email
              </label>
            </div>

            {error && (
              <div className="prem-admin-login-error">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="prem-btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '18px' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <Link to="/" className="prem-admin-login-back">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Store
          </Link>
        </div>
      </main>
    </div>
  );
}