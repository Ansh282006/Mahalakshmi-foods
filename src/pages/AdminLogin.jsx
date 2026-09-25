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

  // Check if already logged in as admin → redirect
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email === ADMIN_EMAIL) {
        navigate('/admin/dashboard');
      } else {
        setCheckingSession(false);
      }
    });

    // Prefill remembered email
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

    // STEP 1: Enforce admin-only access
    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      setError('This login is for administrators only.');
      triggerShake();
      setLoading(false);
      return;
    }

    // STEP 2: Try the login
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

    // STEP 3: Verify the user really is the admin
    if (data.user?.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setError('You are not authorized as an admin.');
      triggerShake();
      setLoading(false);
      return;
    }

    // STEP 4: Save email if "Remember me"
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, email.trim().toLowerCase());
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    toast.success('Welcome back, Admin! 🌿');
    navigate('/admin/dashboard');
  };

  if (checkingSession) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-loading">
          <div className="admin-login-spinner"></div>
          <p>Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-wrapper">
      {/* Decorative orbs */}
      <div className="admin-orb admin-orb-1"></div>
      <div className="admin-orb admin-orb-2"></div>

      <div className="admin-login-container">
        {/* Brand header */}
        <div className="admin-brand">
          <div className="admin-brand-icon">🌿</div>
          <h1 className="admin-brand-title">Mahalaxmi Chips</h1>
          <p className="admin-brand-subtitle">Administration Portal</p>
        </div>

        {/* Login card */}
        <div className={`admin-login-card ${shake ? 'shake' : ''}`}>
          <div className="admin-login-header">
            <h2>🔐 Admin Login</h2>
            <p>Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div className="admin-field">
              <label>Email Address</label>
              <div className="admin-input-wrap">
                <span className="input-icon">✉</span>
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
            </div>

            {/* Password */}
            <div className="admin-field">
              <label>Password</label>
              <div className="admin-input-wrap">
                <span className="input-icon">🔒</span>
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
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁' : '👁‍🗨'}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="admin-remember">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={loading}
                />
                <span className="checkmark"></span>
                Remember my email
              </label>
            </div>

            {/* Error message */}
            {error && (
              <div className="admin-error">
                <span className="error-icon">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button type="submit" className="admin-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="btn-arrow">→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="admin-login-footer">
            <p className="support-line">
              Having trouble? Call <strong>7774982725</strong>
            </p>
            <Link to="/" className="back-home-link">
              ← Back to Store
            </Link>
          </div>
        </div>

        {/* Secure note */}
        <p className="admin-secure-note">
          🔒 This is a secure admin area. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}