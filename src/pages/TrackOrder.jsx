import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

const STATUS_STEPS = ['Pending', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered'];

export default function TrackOrder() {
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setSearched(false);
    setOrders([]);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`order_code.eq.${q.toUpperCase()},customer_phone.eq.${q}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      setSearched(true);
      return;
    }

    setOrders(data || []);
    setLoading(false);
    setSearched(true);
  }

  function getStepIndex(status) {
    return STATUS_STEPS.indexOf(status);
  }

  function isCancelled(order) {
    return order.status === 'Cancelled';
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code);
    toast.success('Order code copied!');
  }

  function shareOnWhatsApp(order) {
    const message = `🌿 *Mahalaxmi Krushi Prakriya Udyog*\n\n📋 Order: *${order.order_code}*\n📦 Status: ${order.status}\n💰 Total: ₹${order.total_amount}\n\nTrack anytime at our website. 🙏`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }

  function callPartner(phone) {
    window.location.href = `tel:${phone}`;
  }

  function formatDeliveryDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  return (
    <div className="track-wrapper">
      <div className="app-container">
        <div className="track-header">
          <h1 className="page-title">Track Your Order</h1>
          <p className="track-subtitle">
            Enter your <strong>order code</strong> (e.g. MF-2026-0001) or <strong>phone number</strong> to see the current status.
          </p>
        </div>

        <form onSubmit={handleSearch} className="track-form">
          <input
            type="text"
            placeholder="MF-2026-0001 or 9876543210"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="track-input"
          />
          <button type="submit" className="track-btn" disabled={loading}>
            {loading ? 'Searching...' : '🔍 Track'}
          </button>
        </form>

        {loading && (
          <div className="track-loading">
            <div className="track-spinner"></div>
            <p>Looking for your order...</p>
          </div>
        )}

        {!loading && searched && orders.length === 0 && (
          <div className="track-empty">
            <div className="empty-icon">📦</div>
            <h3>No orders found</h3>
            <p>Double-check your order code or phone number.</p>
            <Link to="/products" className="track-shop-link">Browse Products →</Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="track-results">
            {orders.map((order) => {
              const stepIdx = getStepIndex(order.status);
              const cancelled = isCancelled(order);
              const hasDeliveryPartner = !!order.delivery_partner_name;
              const isOutForDelivery = order.status === 'Out for Delivery';

              return (
                <div key={order.id} className="track-card">
                  <div className="track-card-header">
                    <div className="track-header-left">
                      <div className="track-code-row">
                        <span className="track-code">{order.order_code}</span>
                        <button
                          className="track-copy-btn"
                          onClick={() => copyCode(order.order_code)}
                          title="Copy order code"
                        >
                          📋
                        </button>
                      </div>
                      <span className="track-date">
                        Ordered on {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <span className={`status-badge status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {order.status}
                    </span>
                  </div>

                  {cancelled && (
                    <div className="cancelled-notice">
                      ⚠️ This order was cancelled. If unexpected, please contact us.
                    </div>
                  )}

                  {/* Estimated Delivery Banner */}
                  {!cancelled && order.estimated_delivery && order.status !== 'Delivered' && (
                    <div className="eta-banner">
                      <span className="eta-icon">📅</span>
                      <div>
                        <strong>Estimated Delivery</strong>
                        <span>{formatDeliveryDate(order.estimated_delivery)}</span>
                      </div>
                    </div>
                  )}

                  {/* Delivered Banner */}
                  {order.status === 'Delivered' && (
                    <div className="delivered-banner">
                      <span className="eta-icon">🎉</span>
                      <div>
                        <strong>Delivered</strong>
                        <span>
                          {order.delivered_at
                            ? new Date(order.delivered_at).toLocaleString('en-IN')
                            : 'Successfully delivered'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Progress timeline */}
                  {!cancelled && (
                    <div className="track-timeline">
                      <div className="timeline-track">
                        {STATUS_STEPS.map((step, idx) => {
                          const isCompleted = idx < stepIdx;
                          const isCurrent = idx === stepIdx;
                          const isPending = idx > stepIdx;

                          return (
                            <div
                              key={step}
                              className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
                            >
                              {idx > 0 && (
                                <div className={`timeline-connector ${isCompleted || isCurrent ? 'active' : ''}`}></div>
                              )}
                              <div className="timeline-circle">
                                {isCompleted ? '✓' : isCurrent ? '●' : idx + 1}
                              </div>
                              <div className="timeline-label">{step}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Delivery Partner Card */}
                  {hasDeliveryPartner && !cancelled && (
                    <div className={`delivery-partner-card ${isOutForDelivery ? 'active' : ''}`}>
                      <div className="dp-avatar">
                        {(order.delivery_partner_name || 'D').charAt(0).toUpperCase()}
                      </div>
                      <div className="dp-info">
                        <span className="dp-label">Your Delivery Partner</span>
                        <strong>{order.delivery_partner_name}</strong>
                        {order.delivery_partner_phone && (
                          <span className="dp-phone">{order.delivery_partner_phone}</span>
                        )}
                      </div>
                      {order.delivery_partner_phone && isOutForDelivery && (
                        <button
                          className="dp-call-btn"
                          onClick={() => callPartner(order.delivery_partner_phone)}
                        >
                          📞 Call
                        </button>
                      )}
                    </div>
                  )}

                  {/* Details */}
                  <div className="track-details">
                    <div className="track-detail-item">
                      <span className="detail-label">Customer</span>
                      <span className="detail-value">{order.customer_name}</span>
                    </div>
                    <div className="track-detail-item">
                      <span className="detail-label">Phone</span>
                      <span className="detail-value">{order.customer_phone}</span>
                    </div>
                    <div className="track-detail-item">
                      <span className="detail-label">Total Amount</span>
                      <span className="detail-value detail-price">₹{order.total_amount}</span>
                    </div>
                    <div className="track-detail-item full">
                      <span className="detail-label">Delivery Address</span>
                      <span className="detail-value">{order.customer_address}</span>
                    </div>
                  </div>

                  {/* Status History */}
                  {order.status_history && order.status_history.length > 0 && (
                    <div className="track-history">
                      <h4>Status Updates</h4>
                      <div className="history-list">
                        {order.status_history.map((entry, i) => (
                          <div key={i} className="history-entry">
                            <span className={`history-dot status-${entry.status.toLowerCase().replace(/\s+/g, '-')}`}></span>
                            <div className="history-info">
                              <strong>{entry.status}</strong>
                              <span className="history-time">
                                {new Date(entry.timestamp).toLocaleString('en-IN', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="track-card-actions">
                    <button className="track-wa-btn" onClick={() => shareOnWhatsApp(order)}>
                      📱 Share on WhatsApp
                    </button>
                    <Link to="/products" className="track-continue-btn">
                      🛒 Continue Shopping
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}