import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

const OCCASIONS = [
  'Wedding / Reception',
  'Corporate Event',
  'Festival / Diwali',
  'Birthday / Party',
  'Reseller / Wholesale',
  'Other',
];

const EMPTY_FORM = {
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  company_name: '',
  occasion: 'Wedding / Reception',
  products_needed: '',
  estimated_quantity: '',
  delivery_date: '',
  delivery_city: '',
  notes: '',
};

export default function BulkOrder() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contact_name.trim()) return toast.error('Please enter your name');
    if (!/^\d{10}$/.test(form.contact_phone))
      return toast.error('Enter a valid 10-digit phone number');

    setSubmitting(true);
    const { error } = await supabase.from('bulk_orders').insert({
      contact_name: form.contact_name.trim(),
      contact_phone: form.contact_phone.trim(),
      contact_email: form.contact_email.trim() || null,
      company_name: form.company_name.trim() || null,
      occasion: form.occasion,
      products_needed: form.products_needed.trim() || null,
      estimated_quantity: form.estimated_quantity.trim() || null,
      delivery_date: form.delivery_date || null,
      delivery_city: form.delivery_city.trim() || null,
      notes: form.notes.trim() || null,
    });
    setSubmitting(false);

    if (error) return toast.error('Failed to submit: ' + error.message);
    setSubmitted(true);
    toast.success('Enquiry received');
  };

  if (submitted) {
    return (
      <div className="prem-page">
        <div className="prem-confirm">
          <div className="prem-confirm-header">
            <div className="prem-confirm-icon">
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="prem-confirm-title">
              Enquiry <em>Received.</em>
            </h1>
            <p className="prem-confirm-sub">
              Thank you, <strong>{form.contact_name}</strong>. We have received your bulk
              order enquiry and will respond on <strong>{form.contact_phone}</strong> within 24 hours
              with a custom quote.
            </p>
          </div>

          <div className="prem-confirm-details">
            <div className="prem-confirm-row">
              <span className="prem-confirm-row-label">Occasion</span>
              <span className="prem-confirm-row-value">{form.occasion}</span>
            </div>
            <div className="prem-confirm-row">
              <span className="prem-confirm-row-label">Estimated Quantity</span>
              <span className="prem-confirm-row-value">{form.estimated_quantity || 'To be discussed'}</span>
            </div>
            <div className="prem-confirm-row">
              <span className="prem-confirm-row-label">Delivery City</span>
              <span className="prem-confirm-row-value">{form.delivery_city || 'To be confirmed'}</span>
            </div>
          </div>

          <div className="prem-confirm-actions">
            <button className="prem-btn-primary prem-btn-gold" onClick={() => { setForm(EMPTY_FORM); setSubmitted(false); }}>
              Submit Another Enquiry
            </button>
            <Link to="/shop" className="prem-btn-outline">Back to Shop</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="prem-page">
      <section className="prem-hero">
        <div className="prem-hero-inner">
          <span className="prem-kicker">BULK & EVENTS</span>
          <h1 className="prem-hero-title">
            Ordering for a <em>celebration?</em>
          </h1>
          <p className="prem-hero-sub">
            Weddings, corporate events, festivals, or resale — we deliver custom
            packaging, advance scheduling, and dedicated support for orders
            above 10 kilograms.
          </p>

          <div className="prem-hero-stats">
            <div className="prem-hero-stat">
              <span className="prem-hero-stat-num">10kg+</span>
              <span className="prem-hero-stat-label">Minimum Order</span>
            </div>
            <div className="prem-hero-stat">
              <span className="prem-hero-stat-num">48hr</span>
              <span className="prem-hero-stat-label">Advance Notice</span>
            </div>
            <div className="prem-hero-stat">
              <span className="prem-hero-stat-num">Pan-India</span>
              <span className="prem-hero-stat-label">Shipping Available</span>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="prem-bulk-form">
        <section className="prem-checkout-section">
          <h2 className="prem-checkout-section-title">
            <span className="prem-checkout-section-num">01</span>
            Your Details
          </h2>

          <div className="prem-field-row">
            <div className="prem-field">
              <label>Your Name</label>
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                placeholder="e.g. Ansh Patil"
                required
              />
            </div>
            <div className="prem-field">
              <label>Phone Number</label>
              <input
                type="tel"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="10-digit mobile"
                required
              />
            </div>
          </div>

          <div className="prem-field-row">
            <div className="prem-field">
              <label>Email (Optional)</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
            <div className="prem-field">
              <label>Company / Organisation (Optional)</label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder="e.g. Sharma Wedding Planners"
              />
            </div>
          </div>
        </section>

        <section className="prem-checkout-section">
          <h2 className="prem-checkout-section-title">
            <span className="prem-checkout-section-num">02</span>
            Order Details
          </h2>

          <div className="prem-field-row">
            <div className="prem-field">
              <label>Occasion</label>
              <select
                value={form.occasion}
                onChange={(e) => setForm({ ...form, occasion: e.target.value })}
              >
                {OCCASIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="prem-field">
              <label>Estimated Quantity</label>
              <input
                type="text"
                value={form.estimated_quantity}
                onChange={(e) => setForm({ ...form, estimated_quantity: e.target.value })}
                placeholder="e.g. 50 packs of 500g"
              />
            </div>
          </div>

          <div className="prem-field">
            <label>Products Needed</label>
            <input
              type="text"
              value={form.products_needed}
              onChange={(e) => setForm({ ...form, products_needed: e.target.value })}
              placeholder="e.g. 25 × Banana Chips 500g, 25 × Jackfruit Chips 500g"
            />
          </div>
        </section>

        <section className="prem-checkout-section">
          <h2 className="prem-checkout-section-title">
            <span className="prem-checkout-section-num">03</span>
            Delivery
          </h2>

          <div className="prem-field-row">
            <div className="prem-field">
              <label>Delivery City / Area</label>
              <input
                type="text"
                value={form.delivery_city}
                onChange={(e) => setForm({ ...form, delivery_city: e.target.value })}
                placeholder="e.g. Kolhapur, Ajara, Pune"
              />
            </div>
            <div className="prem-field">
              <label>Preferred Delivery Date</label>
              <input
                type="date"
                value={form.delivery_date}
                onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
              />
            </div>
          </div>

          <div className="prem-field">
            <label>Additional Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any specific requirements, packaging, or questions..."
            />
          </div>
        </section>

        <button
          type="submit"
          className="prem-btn-primary"
          disabled={submitting}
          style={{ width: '100%', padding: '20px' }}
        >
          {submitting ? 'Submitting...' : 'Submit Bulk Enquiry'}
        </button>

        <p className="prem-bulk-note">
          We respond within 24 hours with a quote and availability.
        </p>
      </form>
    </div>
  );
}