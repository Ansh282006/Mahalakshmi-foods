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

    if (error) {
      toast.error('Failed to submit: ' + error.message);
      return;
    }

    setSubmitted(true);
    toast.success('Enquiry received! We will contact you within 24 hours.');
  };

  if (submitted) {
    return (
      <div className="bulk-success-wrapper">
        <div className="bulk-success-card">
          <div className="bulk-success-icon">✅</div>
          <h1>Enquiry Received!</h1>
          <p>
            Thank you, <strong>{form.contact_name}</strong>. We've received your bulk order
            enquiry and will contact you on <strong>{form.contact_phone}</strong> within 24 hours
            with a quote.
          </p>
          <div className="bulk-success-actions">
            <Link to="/products" className="confirm-btn continue">Continue Shopping</Link>
            <button
              className="confirm-btn track"
              onClick={() => {
                setForm(EMPTY_FORM);
                setSubmitted(false);
              }}
            >
              Submit Another Enquiry
            </button>
          </div>
          <p className="bulk-success-contact">
            Or call us directly: <strong>7774982725</strong> / <strong>9168843668</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bulk-wrapper">
      <div className="app-container">
        <div className="bulk-header">
          <span className="bulk-header-icon">📦</span>
          <h1 className="page-title">Bulk Order Enquiry</h1>
          <p className="bulk-subtitle">
            Ordering for a wedding, festival, corporate event, or resale? Tell us your requirements
            and we'll send you a custom quote within 24 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bulk-form">
          {/* Contact */}
          <div className="bulk-section">
            <h3>1. Your Details</h3>
            <div className="bulk-row">
              <div className="bulk-field">
                <label>Your Name *</label>
                <input
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  placeholder="e.g. Ansh Patil"
                  required
                />
              </div>
              <div className="bulk-field">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={form.contact_phone}
                  onChange={(e) =>
                    setForm({ ...form, contact_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                  }
                  placeholder="10-digit mobile"
                  required
                />
              </div>
            </div>

            <div className="bulk-row">
              <div className="bulk-field">
                <label>Email (optional)</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div className="bulk-field">
                <label>Company / Organisation (optional)</label>
                <input
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  placeholder="e.g. Sharma Wedding Planners"
                />
              </div>
            </div>
          </div>

          {/* Order details */}
          <div className="bulk-section">
            <h3>2. Order Details</h3>
            <div className="bulk-row">
              <div className="bulk-field">
                <label>Occasion *</label>
                <select
                  value={form.occasion}
                  onChange={(e) => setForm({ ...form, occasion: e.target.value })}
                >
                  {OCCASIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div className="bulk-field">
                <label>Estimated Quantity</label>
                <input
                  value={form.estimated_quantity}
                  onChange={(e) => setForm({ ...form, estimated_quantity: e.target.value })}
                  placeholder="e.g. 50 packs of 500g"
                />
              </div>
            </div>

            <div className="bulk-field">
              <label>Products Needed</label>
              <input
                value={form.products_needed}
                onChange={(e) => setForm({ ...form, products_needed: e.target.value })}
                placeholder="e.g. 25 × Banana Chips 500g, 25 × Jackfruit Chips 500g"
              />
            </div>
          </div>

          {/* Delivery */}
          <div className="bulk-section">
            <h3>3. Delivery</h3>
            <div className="bulk-row">
              <div className="bulk-field">
                <label>Delivery City / Area</label>
                <input
                  value={form.delivery_city}
                  onChange={(e) => setForm({ ...form, delivery_city: e.target.value })}
                  placeholder="e.g. Kolhapur, Ajara, Pune"
                />
              </div>
              <div className="bulk-field">
                <label>Preferred Delivery Date</label>
                <input
                  type="date"
                  value={form.delivery_date}
                  onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
                />
              </div>
            </div>

            <div className="bulk-field">
              <label>Additional Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any specific requirements, packaging, or questions..."
                rows="3"
              />
            </div>
          </div>

          <button type="submit" className="bulk-submit-btn" disabled={submitting}>
            {submitting ? 'Submitting...' : '📩 Submit Enquiry'}
          </button>

          <p className="bulk-note">
            We'll respond within 24 hours with a quote and availability.
          </p>
        </form>
      </div>
    </div>
  );
}