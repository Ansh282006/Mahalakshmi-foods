import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function RetailerSetup() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [existing, setExisting] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    shop_name: '',
    owner_name: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
    district: '',
    pincode: '',
    notes: '',
  });

  // Check if retailer profile already exists
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    async function checkRetailer() {
      const { data } = await supabase
        .from('retailers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setExisting(data);
      setChecking(false);

      if (data) {
        // Pre-fill form with existing data
        setForm({
          shop_name: data.shop_name || '',
          owner_name: data.owner_name || '',
          phone: data.phone || '',
          email: data.email || user.email || '',
          gstin: data.gstin || '',
          address: data.address || '',
          district: data.district || '',
          pincode: data.pincode || '',
          notes: data.notes || '',
        });
      } else {
        // Pre-fill from signup metadata
        setForm((prev) => ({
          ...prev,
          owner_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
          email: user.email || '',
        }));
      }
    }
    checkRetailer();
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.shop_name.trim()) return toast.error('Shop name is required');
    if (!form.owner_name.trim()) return toast.error('Owner name is required');
    if (!/^\d{10}$/.test(form.phone)) return toast.error('Enter a valid 10-digit phone number');
    if (!form.address.trim()) return toast.error('Address is required');
    if (!form.district.trim()) return toast.error('District is required');
    if (form.gstin && !/^[0-9A-Z]{15}$/.test(form.gstin.toUpperCase())) {
      return toast.error('GSTIN must be 15 characters');
    }

    setSubmitting(true);

    const payload = {
      user_id: user.id,
      shop_name: form.shop_name.trim(),
      owner_name: form.owner_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      gstin: form.gstin.trim().toUpperCase() || null,
      address: form.address.trim(),
      district: form.district.trim(),
      pincode: form.pincode.trim() || null,
      notes: form.notes.trim() || null,
    };

    let error;
    if (existing) {
      // Update existing profile
      ({ error } = await supabase
        .from('retailers')
        .update(payload)
        .eq('user_id', user.id));
    } else {
      // Create new profile (status stays 'Pending' by default)
      ({ error } = await supabase.from('retailers').insert(payload));
    }

    setSubmitting(false);
    if (error) return toast.error('Failed to save: ' + error.message);

    toast.success(existing ? 'Profile updated' : 'Application submitted');
    navigate('/products');
  };

  if (checking) {
    return (
      <div className="prem-page">
        <div className="prem-empty-cart">
          <p className="prem-empty-cart-text">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const isPending = existing?.status === 'Pending';
  const isRejected = existing?.status === 'Rejected';

  return (
    <div className="prem-page">
      <section className="prem-hero">
        <div className="prem-hero-inner">
          <span className="prem-kicker">
            {existing ? 'RETAILER PROFILE' : 'RETAILER REGISTRATION'}
          </span>
          <h1 className="prem-hero-title">
            {existing ? (
              <>Update your <em>profile.</em></>
            ) : (
              <>Register as a <em>retailer.</em></>
            )}
          </h1>
          <p className="prem-hero-sub">
            {existing
              ? 'Keep your details up to date so we can dispatch orders quickly.'
              : 'Tell us about your shop so we can approve your wholesale account. Approval is usually within 24 hours.'}
          </p>
        </div>
      </section>

      {/* Status banners */}
      {isPending && (
        <div className="prem-b2b-banner warn">
          <div>
            <strong>Application under review</strong>
            <span>
              We are reviewing your registration. You will be able to order once approved.
              Updates to your profile will be re-reviewed.
            </span>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="prem-b2b-banner danger">
          <div>
            <strong>Application was not approved</strong>
            <span>
              Please contact us at 7774982725. You can update your details below and we will re-review.
            </span>
          </div>
        </div>
      )}

      {existing?.status === 'Approved' && (
        <div className="prem-b2b-banner info">
          <div>
            <strong>Approved retailer</strong>
            <span>
              Your account is active. Payment terms: <strong>{existing.payment_terms || 'Advance'}</strong>
              {existing.credit_limit > 0 && ` · Credit limit: ₹${existing.credit_limit}`}
            </span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="prem-bulk-form">
        <section className="prem-checkout-section">
          <h2 className="prem-checkout-section-title">
            <span className="prem-checkout-section-num">01</span>
            Shop Details
          </h2>

          <div className="prem-field-row">
            <div className="prem-field">
              <label>Shop / Business Name</label>
              <input
                type="text"
                value={form.shop_name}
                onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
                placeholder="e.g. Shree Ganesh Kirana Stores"
                required
              />
            </div>
            <div className="prem-field">
              <label>Owner Name</label>
              <input
                type="text"
                value={form.owner_name}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                placeholder="e.g. Ramesh Patil"
                required
              />
            </div>
          </div>

          <div className="prem-field-row">
            <div className="prem-field">
              <label>Contact Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                }
                placeholder="10-digit mobile"
                required
              />
            </div>
            <div className="prem-field">
              <label>Email (Optional)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="shop@example.com"
              />
            </div>
          </div>

          <div className="prem-field">
            <label>GSTIN (Optional but recommended)</label>
            <input
              type="text"
              value={form.gstin}
              onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase().slice(0, 15) })}
              placeholder="27ABCDE1234F1Z5"
              style={{ textTransform: 'uppercase', letterSpacing: '1.5px' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-500)', marginTop: '4px' }}>
              Required for GST invoices. Skip if you don&apos;t have one.
            </span>
          </div>
        </section>

        <section className="prem-checkout-section">
          <h2 className="prem-checkout-section-title">
            <span className="prem-checkout-section-num">02</span>
            Address & District
          </h2>

          <div className="prem-field">
            <label>Full Shop Address</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Shop No / Street / Area / Taluka / District"
              required
            />
          </div>

          <div className="prem-field-row">
            <div className="prem-field">
              <label>District</label>
              <input
                type="text"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                placeholder="e.g. Kolhapur, Sangli, Satara"
                required
              />
            </div>
            <div className="prem-field">
              <label>Pincode</label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                placeholder="416001"
              />
            </div>
          </div>
        </section>

        <section className="prem-checkout-section">
          <h2 className="prem-checkout-section-title">
            <span className="prem-checkout-section-num">03</span>
            Additional Notes
          </h2>

          <div className="prem-field">
            <label>Anything We Should Know? (Optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Your monthly requirement, preferred delivery days, or any other details..."
            />
          </div>
        </section>

        <button
          type="submit"
          className="prem-btn-primary"
          disabled={submitting}
          style={{ width: '100%', padding: '20px' }}
        >
          {submitting
            ? 'Saving...'
            : existing
            ? 'Update Profile'
            : 'Submit Application'}
        </button>

        <p className="prem-bulk-note">
          {existing
            ? 'Your updates will be visible to us immediately.'
            : 'We review every application personally. Expect a response within 24 hours.'}
        </p>
      </form>
    </div>
  );
}