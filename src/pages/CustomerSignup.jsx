import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { processReferral } from '../hooks/useReferralSignup';
import { supabase } from '../supabaseClient';

function generateCode(name) {
  const prefix = (name || 'USER').replace(/\s/g, '').toUpperCase().slice(0, 3);
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${num}`;
}

export default function CustomerSignup() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const referralCode = searchParams.get('ref');

  useEffect(() => {
    if (referralCode) toast.success(`Referral code ${referralCode} applied`);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await signUp(form.email, form.password, form.name, form.phone);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data?.user?.id) {
      const myCode = generateCode(form.name);
      await supabase.from('referral_codes').insert({
        user_id: data.user.id,
        code: myCode,
      });
    }

    if (referralCode && data?.user?.id) {
      try {
        await processReferral(referralCode, data.user.id, form.email);
        toast.success('Referral bonus applied');
      } catch (err) {
        console.error('Referral processing error:', err);
      }
    }

    setLoading(false);
    toast.success('Account created');
    navigate('/my-orders');
  };

  return (
    <div className="prem-auth-page">
      <div className="prem-auth-layout reverse">
        <aside className="prem-auth-brand">
          <Link to="/" className="prem-auth-brand-logo">
            <span className="prem-auth-brand-mark">M</span>
            <span className="prem-auth-brand-text">
              MAHALAXMI<em>CHIPS</em>
            </span>
          </Link>

          <div className="prem-auth-brand-copy">
            <span className="prem-kicker" style={{ color: 'var(--gold-500)', borderBottomColor: 'var(--gold-500)' }}>CREATE ACCOUNT</span>
            <h2 className="prem-auth-brand-title">
              Join the <em>Mahalaxmi</em> family.
            </h2>
            <p>
              Create your account in 30 seconds. Get 100% faster checkout,
              track orders live, and earn loyalty points on every purchase.
            </p>
          </div>

          <ul className="prem-auth-brand-list">
            <li>
              <span className="prem-auth-check">✓</span>
              <span>Personal order history</span>
            </li>
            <li>
              <span className="prem-auth-check">✓</span>
              <span>Loyalty points on every order</span>
            </li>
            <li>
              <span className="prem-auth-check">✓</span>
              <span>Referral rewards (₹50 per friend)</span>
            </li>
            <li>
              <span className="prem-auth-check">✓</span>
              <span>Early access to new flavours</span>
            </li>
          </ul>
        </aside>

        <main className="prem-auth-form-side">
          <div className="prem-auth-form-inner">
            <span className="prem-kicker">NEW ACCOUNT</span>
            <h1 className="prem-auth-title">Create your account.</h1>
            <p className="prem-auth-sub">
              Fill in your details to get started.
            </p>

            {referralCode && (
              <div className="prem-auth-referral">
                <strong>Referral applied: {referralCode}</strong>
                <span>You will get 500 loyalty points on signup</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="prem-auth-form">
              <div className="prem-field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ansh Patil"
                  required
                />
              </div>

              <div className="prem-field">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="10-digit mobile number"
                  pattern="[0-9]{10}"
                  required
                />
              </div>

              <div className="prem-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="prem-field">
                <label>Password</label>
                <div className="prem-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    required
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

              <button type="submit" className="prem-btn-primary" disabled={loading} style={{ width: '100%', padding: '18px' }}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="prem-auth-switch">
              <span>Already have an account?</span>
              <Link to="/login">Sign in</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}