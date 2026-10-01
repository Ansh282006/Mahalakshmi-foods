import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { generateInvoice } from '../utils/invoice';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
        .select('*, products(name, weight, image_url)')
        .eq('order_id', orderId);
      setItems(itemData || []);
      setLoading(false);
    }
    fetchOrder();
  }, [orderId]);

  const copyToClipboard = () => {
    if (!order?.order_code) return;
    navigator.clipboard.writeText(order.order_code);
    toast.success('Order code copied');
  };

  const shareOnWhatsApp = () => {
    if (!order) return;
    const message = `Mahalaxmi Chips\n\nOrder Code: ${order.order_code}\nTotal: Rs. ${order.total_amount}\n\nThank you for your order!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="prem-page">
        <div className="prem-empty-cart">
          <p className="prem-empty-cart-text">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="prem-page">
        <div className="prem-empty-cart">
          <h2 className="prem-empty-cart-title">Order not found</h2>
          <p className="prem-empty-cart-text">
            We could not find this order.
          </p>
          <Link to="/track" className="prem-btn-primary">
            Track an Order
          </Link>
        </div>
      </div>
    );
  }

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
            Order <em>Confirmed.</em>
          </h1>
          <p className="prem-confirm-sub">
            Thank you, <strong>{order.customer_name}</strong>. We have received your
            order and will contact you on <strong>{order.customer_phone}</strong> shortly.
          </p>
        </div>

        {/* Order code */}
        <div className="prem-order-code">
          <div className="prem-order-code-label">Your Order Code</div>
          <div className="prem-order-code-value">{order.order_code}</div>
          <p className="prem-order-code-hint">
            Save this code to track your order anytime.
          </p>
          <button className="prem-order-code-btn" onClick={copyToClipboard}>
            Copy Code
          </button>
        </div>

        {/* Details */}
        <div className="prem-confirm-details">
          <div className="prem-confirm-row">
            <span className="prem-confirm-row-label">Total Amount</span>
            <span className="prem-confirm-row-value price">₹{order.total_amount}</span>
          </div>
          <div className="prem-confirm-row">
            <span className="prem-confirm-row-label">Status</span>
            <span className="prem-confirm-row-value status">{order.status}</span>
          </div>
          <div className="prem-confirm-row">
            <span className="prem-confirm-row-label">Delivery Address</span>
            <span className="prem-confirm-row-value">{order.customer_address}</span>
          </div>
          <div className="prem-confirm-row">
            <span className="prem-confirm-row-label">Payment</span>
            <span className="prem-confirm-row-value">Cash on Delivery</span>
          </div>
        </div>

        {/* Actions */}
        <div className="prem-confirm-actions">
          <button
            className="prem-btn-primary prem-btn-gold"
            onClick={() => generateInvoice(order, items)}
          >
            Download Invoice
          </button>
          <button className="prem-btn-outline" onClick={shareOnWhatsApp}>
            Share on WhatsApp
          </button>
          <Link to="/track" className="prem-btn-outline">
            Track Order
          </Link>
        </div>

        <div style={{ marginTop: 'var(--s-5)', textAlign: 'center' }}>
          <Link to="/shop" className="btn-text-landing" style={{ color: 'var(--forest-700)', borderBottomColor: 'var(--forest-700)' }}>
            Continue Shopping →
          </Link>
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '0.82rem',
          color: 'var(--charcoal-500)',
          marginTop: 'var(--s-5)',
          paddingTop: 'var(--s-4)',
          borderTop: '1px solid var(--cream-300)',
          lineHeight: 1.6,
        }}>
          Questions? Call us at <strong style={{ color: 'var(--charcoal-900)' }}>7774982725</strong> or <strong style={{ color: 'var(--charcoal-900)' }}>9168843668</strong>
        </p>
      </div>
    </div>
  );
}