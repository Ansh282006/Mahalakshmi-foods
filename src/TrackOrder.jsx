import { useState } from 'react';
import { Link } from 'react-router-dom';
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

    // Search by order_code OR phone number
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

  function getCurrentStepIndex(status) {
    return STATUS_STEPS.indexOf(status);
  }

  function isCancelled(order) {
    return order.status === 'Cancelled';
  }

  return (
    <div className="track-wrapper">
      <div className="app-container">
        <div className="track-header">
          <h1 className="page-title">Track Your Order</h1>
          <p className="track-subtitle">
            Enter your <strong>order code</strong> (e.g. MF-2026-0001) or <strong>phone number</strong> to see the status.
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
            {loading ? 'Searching...' : 'Track'}
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
            <p>Double-check your order code or phone number. If you just placed the order, wait a minute and try again.</p>
            <Link to="/products" className="track-shop-link">Browse Products →</Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="track-results">
            {orders.map((order) => {
              const stepIdx = getCurrentStepIndex(order.status);
              const cancelled = isCancelled(order);

              return (
                <div key={order.id} className="track-card">
                  {/* Header */}
                  <div className="track-card-header">
                    <div>
                      <span className="track-code">{order.order_code}</span>
                      <span className="track-date">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <span
                      className={`status-badge status-${order.status
                        .toLowerCase()
                        .replace(/\s+/g, '-')}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Cancelled message */}
                  {cancelled && (
                    <div className="cancelled-notice">
                      ⚠️ This order was cancelled. If this is unexpected, please contact us.
                    </div>
                  )}

                  {/* Progress steps */}
                  {!cancelled && (
                    <div className="track-steps">
                      {STATUS_STEPS.map((step, idx) => {
                        const isCompleted = idx < stepIdx;
                        const isCurrent = idx === stepIdx;

                        return (
                          <div
                            key={step}
                            className={`track-step ${isCompleted ? 'completed' : ''} ${
                              isCurrent ? 'current' : ''
                            }`}
                          >
                            <div className="step-circle">
                              {isCompleted ? '✓' : isCurrent ? '●' : idx + 1}
                            </div>
                            <div className="step-label">{step}</div>
                            {idx < STATUS_STEPS.length - 1 && (
                              <div
                                className={`step-line ${isCompleted ? 'completed' : ''}`}
                              ></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Details */}
                  <div className="track-details">
                    <div className="track-detail-item">
                      <span className="detail-label">Customer</span>
                      <span className="detail-value">{order.customer_name}</span>
                    </div>
                    <div className="track-detail-item">
                      <span className="detail-label">Total</span>
                      <span className="detail-value detail-price">₹{order.total_amount}</span>
                    </div>
                    <div className="track-detail-item full">
                      <span className="detail-label">Delivery Address</span>
                      <span className="detail-value">{order.customer_address}</span>
                    </div>
                  </div>

                  {/* Timeline */}
                  {order.status_history && order.status_history.length > 0 && (
                    <div className="track-history">
                      <h4>Status Updates</h4>
                      <div className="history-list">
                        {order.status_history.map((entry, i) => (
                          <div key={i} className="history-entry">
                            <span
                              className={`history-dot status-${entry.status
                                .toLowerCase()
                                .replace(/\s+/g, '-')}`}
                            ></span>
                            <div>
                              <strong>{entry.status}</strong>
                              <span className="history-time">
                                {new Date(entry.timestamp).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}