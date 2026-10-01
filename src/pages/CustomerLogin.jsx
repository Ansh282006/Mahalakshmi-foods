import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function CustomerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success('Welcome back');
    navigate('/my-orders');
  };

  return (
    <div className="prem-auth-page">
      <div className="prem-auth-layout">
        {/* LEFT: BRAND SIDE */}
        <aside className="prem-auth-brand">
          <Link to="/" className="prem-auth-brand-logo">
            <span className="prem-auth-brand-mark">M</span>
            <span className="prem-auth-brand-text">
              MAHALAXMI<em>CHIPS</em>
            </span>
          </Link>

          <div className="prem-auth-brand-copy">
            <span className="prem-kicker" style={{ color: 'var(--gold-500)', borderBottomColor: 'var(--gold-500)' }}>WELCOME BACK</span>
            <h2 className="prem-auth-brand-title">
              Sign in to your <em>account.</em>
            </h2>
            <p>
              Track your orders, download invoices, redeem loyalty points, and reorder
              your favourites in one click.
            </p>
          </div>

          <ul className="prem-auth-brand-list">
            <li>
              <span className="prem-auth-check">✓</span>
              <span>View full order history</span>
            </li>
            <li>
              <span className="prem-auth-check">✓</span>
              <span>Download invoices anytime</span>
            </li>
            <li>
              <span className="prem-auth-check">✓</span>
              <span>Earn and redeem reward points</span>
            </li>
            <li>
              <span className="prem-auth-check">✓</span>
              <span>Faster one-click checkout</span>
            </li>
          </ul>
        </aside>

        {/* RIGHT: FORM SIDE */}
        <main className="prem-auth-form-side">
          <div className="prem-auth-form-inner">
            <span className="prem-kicker">SIGN IN</span>
            <h1 className="prem-auth-title">Welcome back.</h1>
            <p className="prem-auth-sub">
              Enter your email and password to continue.
            </p>

            <form onSubmit={handleSubmit} className="prem-auth-form">
              <div className="prem-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
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
                    required
                  />
                  <button
                    type="button"
                    className="prem-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button type="submit" className="prem-btn-primary" disabled={loading} style={{ width: '100%', padding: '18px' }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="prem-auth-switch">
              <span>New here?</span>
              <Link to="/signup">Create an account</Link>
            </div>

            <div className="prem-auth-note">
              By signing in you agree to our Terms of Use and Privacy Policy.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}