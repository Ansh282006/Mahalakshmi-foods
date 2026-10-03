import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

const STATUS_STEPS = ['Enquiry', 'Confirmed', 'Packed', 'Dispatched', 'Delivered'];

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

  const getStepIndex = (status) => STATUS_STEPS.indexOf(status);
  const isCancelled = (order) => order.status === 'Cancelled';

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Order code copied');
  };

  const callPartner = (phone) => { window.location.href = `tel:${phone}`; };

  const shareOnWhatsApp = (order) => {
    const message = `Mahalaxmi Chips\n\nOrder: ${order.order_code}\nStatus: ${order.status}\n${order.transporter_name ? `Transporter: ${order.transporter_name}\n` : ''}${order.transporter_lr ? `LR No: ${order.transporter_lr}\n` : ''}Total: Rs. ${order.total_amount}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="prem-page">
      <section className="prem-hero">
        <div className="prem-hero-inner">
          <span className="prem-kicker">ORDER TRACKING</span>
          <h1 className="prem-hero-title">
            Where is <em>my order?</em>
          </h1>
          <p className="prem-hero-sub">
            Enter your order code (like MF-2026-0001) or the phone number used
            on the order to see live status, transporter, and LR details.
          </p>
        </div>
      </section>

      <form className="prem-track-form" onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Order code or phone number"
          className="prem-track-input"
        />
        <button type="submit" className="prem-track-btn" disabled={loading}>
          {loading ? 'Searching...' : 'Track Order'}
        </button>
      </form>

      {loading && (
        <div className="prem-admin-loading" style={{ maxWidth: '820px', margin: '0 auto' }}>
          <p>Looking for your order...</p>
        </div>
      )}

      {!loading && searched && orders.length === 0 && (
        <div className="prem-empty-cart">
          <h2 className="prem-empty-cart-title">No order found</h2>
          <p className="prem-empty-cart-text">
            Please double-check your order code or phone number.
          </p>
          <Link to="/products" className="prem-btn-primary">Back to Catalog</Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="prem-track-results">
          {orders.map((order) => {
            const stepIdx = getStepIndex(order.status);
            const cancelled = isCancelled(order);
            const hasDispatch = !!order.transporter_name || !!order.transporter_lr;

            return (
              <article key={order.id} className="prem-track-card">
                <header className="prem-track-head">
                  <div>
                    <div className="prem-track-head-code">{order.order_code}</div>
                    <div className="prem-track-head-date">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </div>
                  </div>
                  <span className={`prem-admin-badge ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {order.status}
                  </span>
                </header>

                {cancelled && (
                  <div className="prem-track-cancelled">
                    This order was cancelled. Contact us at 7774982725 if you have questions.
                  </div>
                )}

                {/* TIMELINE */}
                {!cancelled && (
                  <div className="prem-track-timeline">
                    {STATUS_STEPS.map((step, idx) => {
                      const completed = idx < stepIdx;
                      const current = idx === stepIdx;
                      return (
                        <div
                          key={step}
                          className={`prem-track-step ${completed ? 'done' : ''} ${current ? 'now' : ''}`}
                        >
                          {idx > 0 && (
                            <div className={`prem-track-line ${completed || current ? 'active' : ''}`} />
                          )}
                          <div className="prem-track-dot">
                            {completed ? '✓' : idx + 1}
                          </div>
                          <div className="prem-track-label">{step}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* DELIVERED BANNER */}
                {order.status === 'Delivered' && order.delivered_at && (
                  <div className="prem-track-banner delivered">
                    <strong>Delivered</strong>
                    <span>{new Date(order.delivered_at).toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* DISPATCH INFO */}
                {hasDispatch && !cancelled && (
                  <div className="prem-track-partner">
                    <div className="prem-track-partner-avatar">
                      {(order.transporter_name || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div className="prem-track-partner-info">
                      <span className="prem-track-partner-label">Transporter</span>
                      <strong>{order.transporter_name || 'Assigned on dispatch'}</strong>
                      {order.transporter_lr && (
                        <span className="prem-track-partner-phone">
                          LR Number: <strong style={{ color: 'var(--charcoal-900)' }}>{order.transporter_lr}</strong>
                        </span>
                      )}
                      {order.package_count && (
                        <span className="prem-track-partner-phone">
                          {order.package_count} package{order.package_count === 1 ? '' : 's'}
                          {order.package_weight_kg && ` · ${order.package_weight_kg} kg total`}
                        </span>
                      )}
                    </div>
                    {order.transporter_name && (
                      <button
                        className="prem-track-partner-call"
                        onClick={() => copyCode(order.transporter_lr || order.transporter_name)}
                      >
                        Copy LR
                      </button>
                    )}
                  </div>
                )}

                {/* DETAILS */}
                <div className="prem-track-details">
                  <div>
                    <span className="prem-track-detail-label">Retailer</span>
                    <span className="prem-track-detail-value">{order.customer_name}</span>
                  </div>
                  <div>
                    <span className="prem-track-detail-label">Phone</span>
                    <span className="prem-track-detail-value">{order.customer_phone}</span>
                  </div>
                  <div>
                    <span className="prem-track-detail-label">Total</span>
                    <span className="prem-track-detail-value price">₹{order.total_amount}</span>
                  </div>
                  <div>
                    <span className="prem-track-detail-label">Payment</span>
                    <span className="prem-track-detail-value">
                      {order.payment_mode || 'Advance'} · {order.payment_status || 'Pending'}
                    </span>
                  </div>
                  <div className="full">
                    <span className="prem-track-detail-label">Delivery Address</span>
                    <span className="prem-track-detail-value">{order.customer_address}</span>
                  </div>
                </div>

                {/* STATUS HISTORY */}
                {order.status_history && order.status_history.length > 0 && (
                  <div className="prem-track-history">
                    <h4 className="prem-track-history-title">Status Updates</h4>
                    {order.status_history.map((entry, i) => (
                      <div key={i} className="prem-track-history-row">
                        <span className={`prem-track-history-dot ${entry.status.toLowerCase().replace(/\s+/g, '-')}`} />
                        <div>
                          <strong>{entry.status}</strong>
                          <span>
                            {new Date(entry.timestamp).toLocaleString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* FOOTER */}
                <footer className="prem-track-foot">
                  <button className="prem-track-copy" onClick={() => copyCode(order.order_code)}>
                    Copy Code
                  </button>
                  <button className="prem-track-wa" onClick={() => shareOnWhatsApp(order)}>
                    Share on WhatsApp
                  </button>
                  <Link to="/products" className="prem-track-continue">Back to Catalog</Link>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}