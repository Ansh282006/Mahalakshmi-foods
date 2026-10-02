import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

// ── Bank details — replace with actual values before going live ──
const BANK_DETAILS = {
  account_name: 'Mahalaxmi Krushi Prakriya Udyog',
  account_number: 'XXXXXXXXXXXX', // replace
  ifsc: 'XXXXXXXX', // replace
  bank_name: 'Bank Name', // replace
  upi_id: 'mahalaxmi@upi', // replace
};

export default function Checkout() {
  const { cart, getTotal, getTotalKg, getGstTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [retailer, setRetailer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    delivery_address: '',
    delivery_district: '',
    delivery_pincode: '',
    po_number: '',
    payment_mode: 'Advance',
    payment_reference: '',
    transporter_preference: '',
    internal_notes: '',
  });

  // Fetch retailer info
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    async function fetchRetailer() {
      const { data } = await supabase
        .from('retailers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setRetailer(data);
      if (data) {
        setForm((prev) => ({
          ...prev,
          delivery_address: data.address || '',
          delivery_district: data.district || '',
          delivery_pincode: data.pincode || '',
        }));
      }
      setLoading(false);
    }
    fetchRetailer();
  }, [user, navigate]);

  const subtotal = getTotal();
  const totalKg = getTotalKg();
  const gstTotal = getGstTotal();
  const moqReached = totalKg >= 10;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!retailer || retailer.status !== 'Approved') {
      toast.error('Your retailer account is not approved yet');
      return;
    }
    if (!moqReached) {
      toast.error('Minimum order is 10kg');
      return;
    }
    if (!form.delivery_address.trim()) {
      toast.error('Delivery address is required');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Submitting order...');

    try {
      // Generate reference code
      const refNumber = `PO-${Date.now().toString().slice(-8)}`;

      // Determine initial status based on payment terms
      const initialStatus = retailer.payment_terms === 'Credit' ? 'Confirmed' : 'Enquiry';
      const paymentStatus = retailer.payment_terms === 'Credit' ? 'Credit' : 'Pending';

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: retailer.shop_name,
          customer_phone: retailer.phone,
          customer_address: form.delivery_address.trim(),
          total_amount: subtotal,
          subtotal: subtotal,
          gst_amount: gstTotal,
          status: initialStatus,
          order_type: 'B2B',
          user_id: user.id,
          retailer_id: retailer.id,
          payment_status: paymentStatus,
          payment_mode: retailer.payment_terms || 'Advance',
          payment_reference: form.payment_reference.trim() || null,
          internal_notes: `PO: ${form.po_number || 'Not provided'} | Kg: ${totalKg} | District: ${form.delivery_district} | Transporter pref: ${form.transporter_preference || 'None'} | Notes: ${form.internal_notes || 'None'}`,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const items = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price,
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;

      clearCart();
      toast.success('Order submitted', { id: toastId });
      navigate(`/order-confirmed/${order.id}`);
    } catch (err) {
      toast.error('Error: ' + err.message, { id: toastId });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="prem-page">
        <div className="prem-empty-cart"><p className="prem-empty-cart-text">Loading...</p></div>
      </div>
    );
  }

  if (!retailer || retailer.status !== 'Approved') {
    return (
      <div className="prem-page">
        <div className="prem-empty-cart">
          <h2 className="prem-empty-cart-title">Retailer approval required</h2>
          <p className="prem-empty-cart-text">
            {!retailer
              ? 'Please complete your retailer profile to place wholesale orders.'
              : retailer.status === 'Pending'
              ? 'Your application is under review. You can order once approved.'
              : 'Your account is not currently active. Contact us at 7774982725.'}
          </p>
          <Link to={!retailer ? '/retailer-setup' : '/products'} className="prem-btn-primary">
            {!retailer ? 'Complete Profile' : 'Back to Catalog'}
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="prem-page">
        <div className="prem-empty-cart">
          <h2 className="prem-empty-cart-title">Your order sheet is empty</h2>
          <p className="prem-empty-cart-text">Add products to the order sheet before checking out.</p>
          <Link to="/products" className="prem-btn-primary">Browse Catalog</Link>
        </div>
      </div>
    );
  }

  const isCredit = retailer.payment_terms === 'Credit';

  return (
    <div className="prem-page">
      <section className="prem-hero">
        <div className="prem-hero-inner">
          <span className="prem-kicker">CONFIRM ORDER</span>
          <h1 className="prem-hero-title">
            Final step, <em>{retailer.shop_name}.</em>
          </h1>
          <p className="prem-hero-sub">
            Review your order and confirm delivery details. We will confirm your
            order and share the dispatch plan within 24 hours.
          </p>
        </div>
      </section>

      <div className="prem-cart-layout">
        {/* LEFT: FORM */}
        <div>
          <form onSubmit={handleSubmit}>
            {/* Delivery Address */}
            <section className="prem-checkout-section">
              <h2 className="prem-checkout-section-title">
                <span className="prem-checkout-section-num">01</span>
                Delivery Address
              </h2>

              <div className="prem-field">
                <label>Full Delivery Address</label>
                <textarea
                  value={form.delivery_address}
                  onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                  placeholder="Shop No / Street / Area / Taluka / District"
                  required
                />
              </div>

              <div className="prem-field-row">
                <div className="prem-field">
                  <label>District</label>
                  <input
                    type="text"
                    value={form.delivery_district}
                    onChange={(e) => setForm({ ...form, delivery_district: e.target.value })}
                    placeholder="e.g. Kolhapur"
                  />
                </div>
                <div className="prem-field">
                  <label>Pincode</label>
                  <input
                    type="text"
                    value={form.delivery_pincode}
                    onChange={(e) => setForm({ ...form, delivery_pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    placeholder="416001"
                  />
                </div>
              </div>
            </section>

            {/* Order Details */}
            <section className="prem-checkout-section">
              <h2 className="prem-checkout-section-title">
                <span className="prem-checkout-section-num">02</span>
                Order Details
              </h2>

              <div className="prem-field">
                <label>Your PO / Reference Number (Optional)</label>
                <input
                  type="text"
                  value={form.po_number}
                  onChange={(e) => setForm({ ...form, po_number: e.target.value })}
                  placeholder="Your internal reference — helps you track on your side"
                />
              </div>

              <div className="prem-field">
                <label>Transporter Preference (Optional)</label>
                <input
                  type="text"
                  value={form.transporter_preference}
                  onChange={(e) => setForm({ ...form, transporter_preference: e.target.value })}
                  placeholder="e.g. VRL, TCI, local tempo — leave blank for us to decide"
                />
              </div>

              <div className="prem-field">
                <label>Notes for Us (Optional)</label>
                <textarea
                  value={form.internal_notes}
                  onChange={(e) => setForm({ ...form, internal_notes: e.target.value })}
                  placeholder="Any special instructions for this order..."
                />
              </div>
            </section>

            {/* Payment */}
            <section className="prem-checkout-section">
              <h2 className="prem-checkout-section-title">
                <span className="prem-checkout-section-num">03</span>
                Payment
              </h2>

              {isCredit ? (
                <div className="prem-cod-note">
                  <div>
                    <strong>Credit Account</strong>
                    <span>
                      Your account is on credit terms. Invoice will be raised on dispatch.
                      Credit limit: <strong>₹{retailer.credit_limit || 0}</strong> ·
                      Current outstanding: <strong>₹{retailer.credit_used || 0}</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="prem-b2b-bank">
                    <div className="prem-b2b-bank-head">
                      <span className="prem-kicker">PAYMENT INSTRUCTIONS</span>
                      <h3>100% Advance Payment</h3>
                      <p>
                        Please transfer the total amount to the bank account below
                        and enter the transaction reference in the next field.
                        We will dispatch once payment is received.
                      </p>
                    </div>

                    <div className="prem-b2b-bank-grid">
                      <div className="prem-b2b-bank-row">
                        <span>Account Name</span>
                        <strong>{BANK_DETAILS.account_name}</strong>
                      </div>
                      <div className="prem-b2b-bank-row">
                        <span>Account Number</span>
                        <strong>{BANK_DETAILS.account_number}</strong>
                      </div>
                      <div className="prem-b2b-bank-row">
                        <span>IFSC Code</span>
                        <strong>{BANK_DETAILS.ifsc}</strong>
                      </div>
                      <div className="prem-b2b-bank-row">
                        <span>Bank</span>
                        <strong>{BANK_DETAILS.bank_name}</strong>
                      </div>
                      <div className="prem-b2b-bank-row">
                        <span>UPI ID</span>
                        <strong>{BANK_DETAILS.upi_id}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="prem-field" style={{ marginTop: 'var(--s-4)' }}>
                    <label>Payment Reference / UTR Number (Optional)</label>
                    <input
                      type="text"
                      value={form.payment_reference}
                      onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
                      placeholder="Enter UTR or transaction reference after transfer"
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-500)', marginTop: '4px' }}>
                      Skip this if you will pay after we confirm the order.
                    </span>
                  </div>
                </>
              )}
            </section>

            <button
              type="submit"
              className="prem-btn-primary"
              disabled={submitting}
              style={{ width: '100%', padding: '20px' }}
            >
              {submitting ? 'Submitting...' : isCredit ? 'Place Order on Credit' : 'Submit Order'}
            </button>

            <p className="prem-bulk-note">
              {isCredit
                ? 'We will dispatch on credit terms as per your account agreement.'
                : 'Our team will confirm your order on WhatsApp within 4 hours.'}
            </p>
          </form>
        </div>

        {/* RIGHT: SUMMARY */}
        <aside className="prem-summary">
          <h3 className="prem-summary-title">
            Order Summary
            <span className="prem-summary-title-count">{totalKg} kg</span>
          </h3>

          {cart.map((item) => (
            <div key={item.id} className="prem-summary-row">
              <span className="prem-summary-row-label">
                {item.name} ({item.pack_size_kg || 1}kg) × {item.quantity}
              </span>
              <span className="prem-summary-row-value">
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}

          <div className="prem-summary-total" style={{ marginTop: 'var(--s-3)' }}>
            <span className="prem-summary-total-label">Subtotal</span>
            <span className="prem-summary-row-value">₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="prem-summary-row">
            <span className="prem-summary-row-label">GST (included)</span>
            <span className="prem-summary-row-value">₹{gstTotal.toFixed(2)}</span>
          </div>

          <div className="prem-summary-row">
            <span className="prem-summary-row-label">Transport</span>
            <span className="prem-summary-row-value">On Actuals</span>
          </div>

          <div className="prem-summary-total" style={{ marginTop: 'var(--s-4)' }}>
            <span className="prem-summary-total-label">Total</span>
            <span className="prem-summary-total-value">₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="prem-summary-note" style={{ marginTop: 'var(--s-3)' }}>
            <span>
              <strong>{isCredit ? 'Payment: Credit' : 'Payment: Advance'}</strong>
              {isCredit ? ' · Invoice on dispatch' : ' · UTR reference recorded on order'}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}