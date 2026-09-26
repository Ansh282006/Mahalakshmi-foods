import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { processReferral } from '../hooks/useReferralSignup';
import { supabase } from '../supabaseClient';

// Generate a referral code from name
function generateCode(name) {
  const prefix = (name || 'USER').replace(/\s/g, '').toUpperCase().slice(0, 3);
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${num}`;
}

export default function CustomerSignup() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      toast.success(`Referral code ${ref} applied! 🎁`);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const referralCode = searchParams.get('ref');

    const { data, error } = await signUp(
      form.email,
      form.password,
      form.name,
      form.phone
    );

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Generate a referral code for the new user (client-side, safe)
    if (data?.user?.id) {
      const myCode = generateCode(form.name);
      await supabase.from('referral_codes').insert({
        user_id: data.user.id,
        code: myCode,
      });
    }

    // Process incoming referral code (if any)
    if (referralCode && data?.user?.id) {
      try {
        await processReferral(referralCode, data.user.id, form.email);
        toast.success('Referral bonus applied! 🎁');
      } catch (err) {
        console.error('Referral processing error:', err);
      }
    }

    setLoading(false);
    toast.success('Account created! Check your email to verify.');
    navigate('/my-orders');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Save your details for faster checkout & order tracking.</p>

        {searchParams.get('ref') && (
          <div className="referral-banner">
            🎁 You were referred! Sign up to get <strong>500 points (₹50 off)</strong>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ansh Patil"
            required
          />

          <label>Phone Number</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="10-digit mobile"
            pattern="[0-9]{10}"
            title="Enter a valid 10-digit phone number"
            required
          />

          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Minimum 6 characters"
            minLength={6}
            required
          />

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}