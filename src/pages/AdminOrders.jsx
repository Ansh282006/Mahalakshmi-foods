import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

const STATUS_FLOW = ['Pending', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered'];
const ALL_STATUSES = [...STATUS_FLOW, 'Cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [items, setItems] = useState({});
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/admin');
    });
    fetchOrders();
  }, [navigate]);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load orders');
      return;
    }
    setOrders(data || []);
  }

  async function loadItems(orderId) {
    if (items[orderId]) return;
    const { data } = await supabase
      .from('order_items')
      .select('*, products(name, weight, image_url)')
      .eq('order_id', orderId);
    setItems((prev) => ({ ...prev, [orderId]: data || [] }));
  }

  async function toggleOrder(orderId) {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    await loadItems(orderId);
    setExpandedOrder(orderId);
  }

  async function updateStatus(order, newStatus) {
    if (order.status === newStatus) return;

    const newEntry = { status: newStatus, timestamp: new Date().toISOString() };
    const updatedHistory = [...(order.status_history || []), newEntry];

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, status_history: updatedHistory })
      .eq('id', order.id);

    if (error) {
      toast.error('Failed to update: ' + error.message);
      return;
    }

    toast.success(`Order ${order.order_code} → ${newStatus}`);
    fetchOrders();
  }

  const filteredOrders = filter === 'All' ? orders : orders.filter((o) => o.status === filter);

  function getNextStatus(currentStatus) {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  }

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <h2>🌿 Admin</h2>
        <nav>
          <Link to="/admin/dashboard">📊 Dashboard</Link>
          <Link to="/admin/orders" className="active">📦 Orders</Link>
          <Link to="/admin/products">🍌 Products</Link>
          <Link to="/">🏠 View Site</Link>
        </nav>
        <button className="logout-btn" onClick={async () => { await supabase.auth.signOut(); navigate('/admin'); }}>
          Logout
        </button>
      </aside>

      <main className="admin-main">
        <h1>Orders</h1>

        <div className="order-filters">
          {['All', ...ALL_STATUSES].map((s) => {
            const count = s === 'All' ? orders.length : orders.filter((o) => o.status === s).length;
            return (
              <button
                key={s}
                className={`filter-tab ${filter === s ? 'active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s} {count > 0 && <span className="tab-count">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="orders-list">
          {filteredOrders.map((o) => {
            const nextStatus = getNextStatus(o.status);
            const isOpen = expandedOrder === o.id;

            return (
              <div key={o.id} className="order-card">
                <div className="order-header" onClick={() => toggleOrder(o.id)}>
                  <div className="order-left">
                    <span className="order-code">{o.order_code || '—'}</span>
                    <strong>{o.customer_name}</strong>
                    <span className="order-phone">{o.customer_phone}</span>
                  </div>
                  <div className="order-right">
                    <span className="order-total">₹{o.total_amount}</span>
                    <span className={`status-badge status-${o.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {o.status}
                    </span>
                    <span className="expand-icon">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="order-details">
                    <div className="detail-grid">
                      <div>
                        <label>Delivery Address</label>
                        <p>{o.customer_address}</p>
                      </div>
                      <div>
                        <label>Placed On</label>
                        <p>{new Date(o.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    <h4>Order Items</h4>
                    <ul className="item-list">
                      {(items[o.id] || []).map((item) => (
                        <li key={item.id} className="item-row">
                          {item.products?.image_url && (
                            <img src={item.products.image_url} alt="" className="item-thumb" />
                          )}
                          <div className="item-info">
                            <strong>{item.products?.name || 'Product'}</strong>
                            <span>{item.products?.weight}</span>
                          </div>
                          <span className="item-qty">× {item.quantity}</span>
                          <span className="item-price">₹{item.price_at_time}</span>
                        </li>
                      ))}
                    </ul>

                    <h4>Status Timeline</h4>
                    <div className="status-timeline">
                      {(o.status_history || []).map((entry, idx) => (
                        <div key={idx} className="timeline-entry">
                          <span className={`timeline-dot status-${entry.status.toLowerCase().replace(/\s+/g, '-')}`}></span>
                          <div className="timeline-content">
                            <strong>{entry.status}</strong>
                            <span>{new Date(entry.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="status-actions">
                      {nextStatus && (
                        <button className="advance-btn" onClick={() => updateStatus(o, nextStatus)}>
                          ➜ Mark as {nextStatus}
                        </button>
                      )}
                      {o.status !== 'Cancelled' && o.status !== 'Delivered' && (
                        <button
                          className="cancel-btn"
                          onClick={() => { if (confirm('Cancel this order?')) updateStatus(o, 'Cancelled'); }}
                        >
                          ✕ Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredOrders.length === 0 && (
            <p className="empty-row">No orders with status "{filter}".</p>
          )}
        </div>
      </main>
    </div>
  );
}