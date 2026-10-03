import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { generateInvoice } from '../utils/invoice';
import useCompanyInfo from '../hooks/useCompanyInfo';

const BANK = {
  account_name: 'Mahalaxmi Krushi Prakriya Udyog',
  account_number: 'XXXXXXXXXXXX',
  ifsc: 'XXXXXXXX',
  bank_name: 'Bank Name',
  upi_id: 'mahalaxmi@upi',
};

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const company = useCompanyInfo();

  useEffect(() => {
    async function fetchOrder() {
      const { data: orderData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }
      setOrder(orderData);

      const { data: itemData } = await supabase
        .from('order_items')
        .select('*, products(name, pack_size_kg, hsn_code, gst_percent, image_url)')
        .eq('order_id', orderId);
      setItems(itemData || []);
      setLoading(false);
    }
    fetchOrder();
  }, [orderId]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  const shareOnWhatsApp = () => {
    if (!order) return;
    const msg = `Mahalaxmi Chips\n\nOrder Code: ${order.order_code}\nTotal: ₹${order.total_amount}\n\nThank you for your order. We will confirm shortly.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const callUs = (phone) => { window.location.href = `tel:${phone}`; };

  const totalKg = items.reduce(
    (sum, item) => sum + (item.products?.pack_size_kg || 1) * item.quantity,
    0
  );

  if (loading) {
    return (
      <div className="prem-page">
        <div className="prem-empty-cart">
          <p className="prem-empty-cart-text">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="prem-page">
        <div className="prem-empty-cart">
          <h2 className="prem-empty-cart-title">Order not found</h2>
          <Link to="/products" className="prem-btn-primary">Back to Catalog</Link>
        </div>
      </div>
    );
  }

  const isCredit = order.payment_mode === 'Credit';
  const isAdvance = !isCredit;

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
            Order <em>Received.</em>
          </h1>
          <p className="prem-confirm-sub">
            Thank you, <strong>{order.customer_name}</strong>. We have received your
            wholesale order and will confirm it on WhatsApp within 4 hours.
          </p>
        </div>

        {/* ORDER CODE */}
        <div className="prem-order-code">
          <div className="prem-order-code-label">Order Code</div>
          <div className="prem-order-code-value">{order.order_code}</div>
          <p className="prem-order-code-hint">
            Save this code to track your order status anytime.
          </p>
          <button className="prem-order-code-btn" onClick={() => copyToClipboard(order.order_code)}>
            Copy Code
          </button>
        </div>

        {/* ORDER SUMMARY */}
        <div className="prem-confirm-details">
          <div className="prem-confirm-row">
            <span className="prem-confirm-row-label">Total Amount</span>
            <span className="prem-confirm-row-value price">₹{order.total_amount}</span>
          </div>
          <div className="prem-confirm-row">
            <span className="prem-confirm-row-label">Total Volume</span>
            <span className="prem-confirm-row-value">{totalKg} kg</span>
          </div>
          <div className="prem-confirm-row">
            <span className="prem-confirm-row-label">Status</span>
            <span className="prem-confirm-row-value status">{order.status}</span>
          </div>
          <div className="prem-confirm-row">
            <span className="prem-confirm-row-label">Payment Mode</span>
            <span className="prem-confirm-row-value">{order.payment_mode || 'Advance'}</span>
          </div>
          <div className="prem-confirm-row">
            <span className="prem-confirm-row-label">Delivery Address</span>
            <span className="prem-confirm-row-value">{order.customer_address}</span>
          </div>
        </div>

        {/* ADVANCE PAYMENT INSTRUCTIONS */}
        {isAdvance && (
          <div className="prem-b2b-bank" style={{ marginBottom: 'var(--s-4)' }}>
            <div className="prem-b2b-bank-head">
              <span className="prem-kicker">NEXT STEP</span>
              <h3>Complete Advance Payment</h3>
              <p>
                Please transfer ₹{order.total_amount} to the account below and
                share the UTR/reference on WhatsApp. We will dispatch once payment
                is received.
              </p>
            </div>

            <div className="prem-b2b-bank-grid">
              <div className="prem-b2b-bank-row">
                <span>Account Name</span>
                <strong>{BANK.account_name}</strong>
              </div>
              <div className="prem-b2b-bank-row">
                <span>Account Number</span>
                <strong>{BANK.account_number}</strong>
              </div>
              <div className="prem-b2b-bank-row">
                <span>IFSC</span>
                <strong>{BANK.ifsc}</strong>
              </div>
              <div className="prem-b2b-bank-row">
                <span>Bank</span>
                <strong>{BANK.bank_name}</strong>
              </div>
              <div className="prem-b2b-bank-row">
                <span>UPI ID</span>
                <strong>{BANK.upi_id}</strong>
              </div>
            </div>

            <div style={{ marginTop: 'var(--s-3)' }}>
              <button
                className="prem-btn-primary"
                style={{ width: '100%', padding: '14px' }}
                onClick={() => copyToClipboard(`${BANK.bank_name} · A/c: ${BANK.account_number} · IFSC: ${BANK.ifsc} · UPI: ${BANK.upi_id}`)}
              >
                Copy Bank Details
              </button>
            </div>
          </div>
        )}

        {isCredit && (
          <div className="prem-cod-note" style={{ marginBottom: 'var(--s-4)' }}>
            <div>
              <strong>Credit Account</strong>
              <span>
                This order will be added to your credit account. Invoice will be
                raised on dispatch. Payment due as per your agreed terms.
              </span>
            </div>
          </div>
        )}

        {/* ITEMS TABLE */}
        <section className="prem-checkout-section">
          <h2 className="prem-checkout-section-title">
            <span className="prem-checkout-section-num">ITEMS</span>
            What You Ordered
          </h2>
          <div className="prem-admin-table-wrap">
            <table className="prem-admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Pack</th>
                  <th>Qty</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.products?.name || 'Product'}</td>
                    <td>{item.products?.pack_size_kg || 1} kg</td>
                    <td>× {item.quantity}</td>
                    <td className="revenue-cell">₹{(item.price_at_time * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ACTIONS */}
        <div className="prem-confirm-actions" style={{ marginTop: 'var(--s-5)' }}>
          <button className="prem-btn-primary prem-btn-gold" onClick={() => generateInvoice(order, items, company)}>
            Download Invoice
          </button>
          <button className="prem-btn-primary" onClick={shareOnWhatsApp}>
            Share on WhatsApp
          </button>
          <button className="prem-btn-outline" onClick={() => callUs('7774982725')}>
            Call Us
          </button>
          <Link to="/my-orders" className="prem-btn-outline">
            My Orders
          </Link>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--charcoal-500)', marginTop: 'var(--s-5)', paddingTop: 'var(--s-4)', borderTop: '1px solid var(--cream-300)', lineHeight: 1.7 }}>
          Our team will confirm your order on WhatsApp within 4 hours.<br />
          For urgent queries, call us at <strong style={{ color: 'var(--charcoal-900)' }}>7774982725</strong> or <strong style={{ color: 'var(--charcoal-900)' }}>9168843668</strong>.
        </p>
      </div>
    </div>
  );
}