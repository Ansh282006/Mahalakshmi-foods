import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) console.error(error);
      else setOrder(data);
      setLoading(false);
    }
    fetchOrder();
  }, [orderId]);

  const copyToClipboard = () => {
    if (!order?.order_code) return;
    navigator.clipboard.writeText(order.order_code);
    toast.success('Order code copied!');
  };

  const shareOnWhatsApp = () => {
    if (!order) return;
    const message = `🌿 *Mahalaxmi Krushi Prakriya Udyog*\n\nI just placed an order!\n\n📋 Order Code: *${order.order_code}*\n💰 Total: ₹${order.total_amount}\n📍 Delivery to: ${order.customer_name}\n\nTrack it anytime at our website. 🙏`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loader">Loading your order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="confirm-wrapper">
        <div className="app-container">
          <div className="confirm-card">
            <h1 className="confirm-title">Order not found</h1>
            <p className="confirm-subtitle">We couldn't find this order.</p>
            <Link to="/track" className="track-shop-link">Track Order →</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="confirm-wrapper">
      <div className="app-container">
        <div className="confirm-card">
          {/* Success Icon */}
          <div className="confirm-icon">
            <div className="checkmark-circle">
              <span>✓</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="confirm-title">Order Placed Successfully!</h1>
          <p className="confirm-subtitle">
            Thank you, <strong>{order.customer_name}</strong>! We've received your order and
            will contact you soon on <strong>{order.customer_phone}</strong>.
          </p>

          {/* Order Code */}
          <div className="confirm-code-box">
            <label>Your Order Code</label>
            <div className="confirm-code-row">
              <span className="confirm-code">{order.order_code}</span>
              <button className="copy-btn" onClick={copyToClipboard} title="Copy code">
                📋
              </button>
            </div>
            <small>Save this code to track your order anytime.</small>
          </div>

          {/* Summary */}
          <div className="confirm-summary">
            <div className="confirm-row">
              <span>Total Amount</span>
              <strong className="confirm-price">₹{order.total_amount}</strong>
            </div>
            <div className="confirm-row">
              <span>Current Status</span>
              <span className="status-badge status-pending">{order.status}</span>
            </div>
            <div className="confirm-row">
              <span>Delivery Address</span>
              <span className="confirm-address">{order.customer_address}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="confirm-actions">
            <button className="confirm-btn whatsapp" onClick={shareOnWhatsApp}>
              📱 Share on WhatsApp
            </button>
            <Link to="/track" className="confirm-btn track">
              📦 Track Order
            </Link>
            <Link to="/products" className="confirm-btn continue">
              🛒 Continue Shopping
            </Link>
          </div>

          {/* Help */}
          <div className="confirm-help">
            <p>
              Questions? Call us at <strong>7774982725</strong> or <strong>9168843668</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}