import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import TrackOrderSkeleton from '../components/TrackOrderSkeleton';

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

  const getStepIndex = (status) => STATUS_STEPS.indexOf(status);
  const isCancelled = (order) => order.status === 'Cancelled';

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Order code copied');
  };

  const shareOnWhatsApp = (order) => {
    const message = `Mahalaxmi Chips\n\nOrder Code: ${order.order_code}\nStatus: ${order.status}\nTotal: Rs. ${order.total_amount}\n\nTrack anytime at our website.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const callPartner = (phone) => { window.location.href = `tel:${phone}`; };

  const formatDeliveryDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
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
            Enter your order code (like MF-2026-0001) or the phone number you used
            at checkout to see live status.
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

      {loading && <TrackOrderSkeleton />}

      {!loading && searched && orders.length === 0 && (
        <div className="prem-empty-cart">
          <div className="prem-empty-icon">
            <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <h2 className="prem-empty-cart-title">No order found</h2>
          <p className="prem-empty-cart-text">
            Please double-check your order code or phone number. If you placed the
            order recently, allow a minute for it to appear.
          </p>
          <Link to="/shop" className="prem-btn-primary">Back to Shop</Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="prem-track-results">
          {orders.map((order) => {
            const stepIdx = getStepIndex(order.status);
            const cancelled = isCancelled(order);
            const hasPartner = !!order.delivery_partner_name;
            const isOut = order.status === 'Out for Delivery';

            return (
              <article key={order.id} className="prem-track-card">
                <header className="prem-track-head">
                  <div>
                    <div className="prem-track-head-code">{order.order_code}</div>
                    <div className="prem-track-head-date">
                      Ordered {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </div>
                  </div>
                  <span className={`prem-order-status status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {order.status}
                  </span>
                </header>

                {cancelled && (
                  <div className="prem-track-cancelled">
                    This order was cancelled. If this is unexpected, please contact us.
                  </div>
                )}

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

                {order.status === 'Delivered' && (
                  <div className="prem-track-banner delivered">
                    <strong>Delivered</strong>
                    <span>
                      {order.delivered_at
                        ? new Date(order.delivered_at).toLocaleString('en-IN')
                        : 'Successfully delivered'}
                    </span>
                  </div>
                )}

                {!cancelled && order.estimated_delivery && order.status !== 'Delivered' && (
                  <div className="prem-track-banner eta">
                    <strong>Estimated Delivery</strong>
                    <span>{formatDeliveryDate(order.estimated_delivery)}</span>
                  </div>
                )}

                {hasPartner && !cancelled && (
                  <div className="prem-track-partner">
                    <div className="prem-track-partner-avatar">
                      {(order.delivery_partner_name || 'D').charAt(0).toUpperCase()}
                    </div>
                    <div className="prem-track-partner-info">
                      <span className="prem-track-partner-label">Delivery Partner</span>
                      <strong>{order.delivery_partner_name}</strong>
                      {order.delivery_partner_phone && (
                        <span className="prem-track-partner-phone">{order.delivery_partner_phone}</span>
                      )}
                    </div>
                    {order.delivery_partner_phone && isOut && (
                      <button
                        className="prem-track-partner-call"
                        onClick={() => callPartner(order.delivery_partner_phone)}
                      >
                        Call
                      </button>
                    )}
                  </div>
                )}

                <div className="prem-track-details">
                  <div>
                    <span className="prem-track-detail-label">Customer</span>
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
                  <div className="full">
                    <span className="prem-track-detail-label">Delivery Address</span>
                    <span className="prem-track-detail-value">{order.customer_address}</span>
                  </div>
                </div>

                {order.status_history?.length > 0 && (
                  <div className="prem-track-history">
                    <h4 className="prem-track-history-title">Status Updates</h4>
                    {order.status_history.map((entry, i) => (
                      <div key={i} className="prem-track-history-row">
                        <span className={`prem-track-history-dot status-${entry.status.toLowerCase().replace(/\s+/g, '-')}`} />
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

                <footer className="prem-track-foot">
                  <button className="prem-track-copy" onClick={() => copyCode(order.order_code)}>
                    Copy Code
                  </button>
                  <button className="prem-track-wa" onClick={() => shareOnWhatsApp(order)}>
                    Share on WhatsApp
                  </button>
                  <Link to="/shop" className="prem-track-continue">Continue Shopping</Link>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}