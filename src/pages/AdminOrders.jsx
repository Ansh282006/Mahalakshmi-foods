import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import AdminSidebar from '../components/AdminSidebar';
import {
  msgOrderPlaced, msgOrderConfirmed, msgOrderPacked,
  msgOutForDelivery, msgOrderDelivered, msgOrderCancelled,
  msgOwnerNewOrder, openWhatsApp,
} from '../utils/whatsappTemplates';

const STATUS_FLOW = ['Pending', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered'];
const ALL_STATUSES = [...STATUS_FLOW, 'Cancelled'];
const OWNER_PHONE = '7774982725';

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
    if (error) return toast.error('Failed to load orders');
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
    const updates = { status: newStatus, status_history: updatedHistory };
    if (newStatus === 'Delivered') updates.delivered_at = new Date().toISOString();

    const { error } = await supabase.from('orders').update(updates).eq('id', order.id);
    if (error) return toast.error('Failed to update: ' + error.message);
    toast.success(`Order ${order.order_code} → ${newStatus}`);
    fetchOrders();
  }

  async function updateDeliveryField(orderId, field, value) {
    const { error } = await supabase
      .from('orders')
      .update({ [field]: value || null })
      .eq('id', orderId);
    if (error) return toast.error('Failed to update: ' + error.message);
    toast.success('Delivery details updated');
    fetchOrders();
  }

  const handleSendToCustomer = (order, templateFn, label) => {
    const orderItems = items[order.id] || [];
    const msg = templateFn(order, orderItems);
    openWhatsApp(order.customer_phone, msg);
    toast.success(`Opening WhatsApp for ${label}`);
  };

  const handleNotifyOwner = (order) => {
    const orderItems = items[order.id] || [];
    const msg = msgOwnerNewOrder(order, orderItems);
    openWhatsApp(OWNER_PHONE, msg);
    toast.success('Opening WhatsApp to notify owner');
  };

  const filtered = filter === 'All' ? orders : orders.filter((o) => o.status === filter);
  const pendingCount = orders.filter((o) => o.status === 'Pending').length;

  const getNextStatus = (current) => {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  };

  const sidebarCounts = { orders: pendingCount };

  return (
    <div className="prem-admin">
      <AdminSidebar counts={sidebarCounts} active="/admin/orders" />

      <main className="prem-admin-main">
        <header className="prem-admin-topbar">
          <div>
            <span className="prem-kicker">OPERATIONS</span>
            <h1 className="prem-admin-page-title">
              Order <em>Management.</em>
            </h1>
            <p className="prem-admin-page-sub">
              <strong>{orders.length}</strong> total orders · <strong>{pendingCount}</strong> pending
            </p>
          </div>
          <div className="prem-admin-top-actions">
            <Link to="/admin/dashboard" className="prem-admin-action">Dashboard</Link>
          </div>
        </header>

        {/* FILTERS */}
        <div className="prem-admin-filters">
          {['All', ...ALL_STATUSES].map((s) => {
            const count = s === 'All' ? orders.length : orders.filter((o) => o.status === s).length;
            return (
              <button
                key={s}
                className={`prem-admin-filter ${filter === s ? 'active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s}
                {count > 0 && <span className="prem-admin-filter-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* ORDERS LIST */}
        <div className="prem-admin-orders-list">
          {filtered.map((o) => {
            const nextStatus = getNextStatus(o.status);
            const isOpen = expandedOrder === o.id;

            return (
              <article key={o.id} className={`prem-admin-order ${isOpen ? 'open' : ''}`}>
                <header className="prem-admin-order-head" onClick={() => toggleOrder(o.id)}>
                  <div className="prem-admin-order-head-left">
                    <span className="prem-admin-order-code">{o.order_code || '—'}</span>
                    <span className="prem-admin-order-name">{o.customer_name}</span>
                    <span className="prem-admin-order-phone">{o.customer_phone}</span>
                  </div>
                  <div className="prem-admin-order-head-right">
                    <span className="prem-admin-order-total">₹{o.total_amount}</span>
                    <span className={`prem-admin-badge ${o.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {o.status}
                    </span>
                    <span className={`prem-admin-order-caret ${isOpen ? 'open' : ''}`}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>
                </header>

                {isOpen && (
                  <div className="prem-admin-order-body">
                    {/* Details */}
                    <div className="prem-admin-order-details">
                      <div>
                        <span className="prem-admin-detail-label">Delivery Address</span>
                        <span className="prem-admin-detail-value">{o.customer_address}</span>
                      </div>
                      <div>
                        <span className="prem-admin-detail-label">Placed On</span>
                        <span className="prem-admin-detail-value">
                          {new Date(o.created_at).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <h3 className="prem-admin-subhead">Order Items</h3>
                    <div className="prem-admin-items">
                      {(items[o.id] || []).map((item) => (
                        <div key={item.id} className="prem-admin-item">
                          {item.products?.image_url && (
                            <img src={item.products.image_url} alt="" />
                          )}
                          <div className="prem-admin-item-info">
                            <strong>{item.products?.name || 'Product'}</strong>
                            <span>{item.products?.weight}</span>
                          </div>
                          <span className="prem-admin-item-qty">× {item.quantity}</span>
                          <span className="prem-admin-item-price">₹{item.price_at_time}</span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Partner */}
                    <h3 className="prem-admin-subhead">Delivery Details</h3>
                    <div className="prem-admin-dp-grid">
                      <div className="prem-admin-dp-field">
                        <label>Partner Name</label>
                        <input
                          type="text"
                          defaultValue={o.delivery_partner_name || ''}
                          placeholder="e.g. Ravi Kadam"
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val === (o.delivery_partner_name || '')) return;
                            updateDeliveryField(o.id, 'delivery_partner_name', val);
                          }}
                        />
                      </div>
                      <div className="prem-admin-dp-field">
                        <label>Partner Phone</label>
                        <input
                          type="tel"
                          defaultValue={o.delivery_partner_phone || ''}
                          placeholder="10-digit mobile"
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val === (o.delivery_partner_phone || '')) return;
                            updateDeliveryField(o.id, 'delivery_partner_phone', val);
                          }}
                        />
                      </div>
                      <div className="prem-admin-dp-field">
                        <label>Est. Delivery Date</label>
                        <input
                          type="date"
                          defaultValue={o.estimated_delivery || ''}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val === (o.estimated_delivery || '')) return;
                            updateDeliveryField(o.id, 'estimated_delivery', val);
                          }}
                        />
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <h3 className="prem-admin-subhead">Send WhatsApp Notification</h3>
                    <p className="prem-admin-sub-note">
                      Click a button to open WhatsApp with the message pre-filled.
                    </p>
                    <div className="prem-admin-wa-grid">
                      <button className={`prem-admin-wa-btn ${o.status === 'Pending' ? 'current' : ''}`} onClick={() => handleSendToCustomer(o, msgOrderPlaced, 'Order Placed')}>
                        Order Placed {o.status === 'Pending' && <span className="prem-admin-wa-current">CURRENT</span>}
                      </button>
                      <button className={`prem-admin-wa-btn ${o.status === 'Confirmed' ? 'current' : ''}`} onClick={() => handleSendToCustomer(o, msgOrderConfirmed, 'Confirmed')}>
                        Confirmed {o.status === 'Confirmed' && <span className="prem-admin-wa-current">CURRENT</span>}
                      </button>
                      <button className={`prem-admin-wa-btn ${o.status === 'Packed' ? 'current' : ''}`} onClick={() => handleSendToCustomer(o, msgOrderPacked, 'Packed')}>
                        Packed {o.status === 'Packed' && <span className="prem-admin-wa-current">CURRENT</span>}
                      </button>
                      <button className={`prem-admin-wa-btn ${o.status === 'Out for Delivery' ? 'current' : ''}`} onClick={() => handleSendToCustomer(o, msgOutForDelivery, 'Out for Delivery')}>
                        Out for Delivery {o.status === 'Out for Delivery' && <span className="prem-admin-wa-current">CURRENT</span>}
                      </button>
                      <button className={`prem-admin-wa-btn ${o.status === 'Delivered' ? 'current' : ''}`} onClick={() => handleSendToCustomer(o, msgOrderDelivered, 'Delivered')}>
                        Delivered {o.status === 'Delivered' && <span className="prem-admin-wa-current">CURRENT</span>}
                      </button>
                      <button className={`prem-admin-wa-btn ${o.status === 'Cancelled' ? 'current' : ''}`} onClick={() => handleSendToCustomer(o, msgOrderCancelled, 'Cancelled')}>
                        Cancelled {o.status === 'Cancelled' && <span className="prem-admin-wa-current">CURRENT</span>}
                      </button>
                    </div>
                    <button className="prem-admin-wa-owner" onClick={() => handleNotifyOwner(o)}>
                      Notify Owner — New Order Alert
                    </button>

                    {/* Timeline */}
                    <h3 className="prem-admin-subhead">Status Timeline</h3>
                    <div className="prem-admin-timeline">
                      {(o.status_history || []).map((entry, idx) => (
                        <div key={idx} className="prem-admin-tl-row">
                          <span className={`prem-admin-tl-dot ${entry.status.toLowerCase().replace(/\s+/g, '-')}`} />
                          <div className="prem-admin-tl-content">
                            <strong>{entry.status}</strong>
                            <span>{new Date(entry.timestamp).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="prem-admin-order-actions">
                      {nextStatus && (
                        <button className="prem-admin-action primary" onClick={() => updateStatus(o, nextStatus)}>
                          Mark as {nextStatus}
                        </button>
                      )}
                      {o.status !== 'Cancelled' && o.status !== 'Delivered' && (
                        <button className="prem-admin-action danger" onClick={() => { if (confirm('Cancel this order?')) updateStatus(o, 'Cancelled'); }}>
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
          {filtered.length === 0 && (
            <div className="prem-admin-table-wrap">
              <p className="empty-row">No orders with status "{filter}"</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}