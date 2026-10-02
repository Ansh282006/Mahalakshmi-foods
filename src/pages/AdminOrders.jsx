import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { generateInvoice } from '../utils/invoice';
import AdminSidebar from '../components/AdminSidebar';
import {
  msgOrderPlaced, msgOrderConfirmed, msgOrderPacked,
  msgDispatched, msgOrderDelivered, msgOrderCancelled,
  openWhatsApp,
} from '../utils/whatsappTemplates';

const STATUS_FLOW = ['Enquiry', 'Confirmed', 'Packed', 'Dispatched', 'Delivered'];
const ALL_STATUSES = [...STATUS_FLOW, 'Cancelled'];
const OWNER_PHONE = '7774982725';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [items, setItems] = useState({});
  const [filter, setFilter] = useState('All');
  const [company, setCompany] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/admin');
    });
    fetchOrders();
    fetchCompany();
  }, [navigate]);

  async function fetchCompany() {
    const { data } = await supabase.from('company_info').select('*').eq('id', 1).maybeSingle();
    setCompany(data);
  }

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, retailers(shop_name, gstin, district)')
      .order('created_at', { ascending: false });
    if (error) return toast.error('Failed to load orders');
    setOrders(data || []);
  }

  async function loadItems(orderId) {
    if (items[orderId]) return;
    const { data } = await supabase
      .from('order_items')
      .select('*, products(name, weight, pack_size_kg, hsn_code, gst_percent, image_url)')
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

    if (newStatus === 'Delivered') {
      updates.delivered_at = new Date().toISOString();
      updates.payment_status = order.payment_status === 'Pending' ? 'Paid' : order.payment_status;
    }
    if (newStatus === 'Dispatched') {
      updates.dispatched_at = new Date().toISOString();
    }

    const { error } = await supabase.from('orders').update(updates).eq('id', order.id);
    if (error) return toast.error('Failed to update: ' + error.message);
    toast.success(`Order ${order.order_code} → ${newStatus}`);
    fetchOrders();
  }

  async function updateField(orderId, field, value) {
    const { error } = await supabase
      .from('orders')
      .update({ [field]: value || null })
      .eq('id', orderId);
    if (error) return toast.error('Failed: ' + error.message);
    toast.success('Updated');
    fetchOrders();
  }

  // ── WhatsApp senders ──
  const sendWhatsApp = (order, templateFn, label) => {
    const orderItems = items[order.id] || [];
    const msg = templateFn(order, orderItems);
    openWhatsApp(order.customer_phone, msg);
    toast.success(`Opening WhatsApp — ${label}`);
  };

  // ── Invoice download ──
  const downloadInvoice = (order) => {
    if (!items[order.id]) {
      toast.error('Please wait — loading items...');
      loadItems(order.id).then(() => {
        generateInvoice(order, items[order.id] || [], company);
      });
      return;
    }
    generateInvoice(order, items[order.id] || [], company);
  };

  const filtered = filter === 'All' ? orders : orders.filter((o) => o.status === filter);
  const pendingCount = orders.filter((o) => o.status === 'Enquiry').length;

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
              Wholesale <em>Orders.</em>
            </h1>
            <p className="prem-admin-page-sub">
              <strong>{orders.length}</strong> total · <strong>{pendingCount}</strong> new enquiries
            </p>
          </div>
          <div className="prem-admin-top-actions">
            <Link to="/admin/retailers" className="prem-admin-action">Retailers</Link>
          </div>
        </header>

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
                    {o.retailers?.district && (
                      <span className="prem-admin-order-phone">· {o.retailers.district}</span>
                    )}
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
                    {/* Delivery Details */}
                    <div className="prem-admin-order-details">
                      <div className="full">
                        <span className="prem-admin-detail-label">Delivery Address</span>
                        <span className="prem-admin-detail-value">{o.customer_address}</span>
                      </div>
                      {o.retailers?.gstin && (
                        <div>
                          <span className="prem-admin-detail-label">Buyer GSTIN</span>
                          <span className="prem-admin-detail-value">{o.retailers.gstin}</span>
                        </div>
                      )}
                      <div>
                        <span className="prem-admin-detail-label">Placed On</span>
                        <span className="prem-admin-detail-value">
                          {new Date(o.created_at).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="prem-admin-detail-label">Payment</span>
                        <span className="prem-admin-detail-value">
                          {o.payment_mode || 'Advance'} · {o.payment_status || 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Internal notes from customer */}
                    {o.internal_notes && (
                      <>
                        <h3 className="prem-admin-subhead">Customer Notes / PO</h3>
                        <p style={{ fontSize: '0.88rem', color: 'var(--charcoal-700)', lineHeight: 1.6 }}>
                          {o.internal_notes}
                        </p>
                      </>
                    )}

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
                            <span>{item.pack_size_kg || 1}kg pack · HSN {item.hsn_code || '2005'}</span>
                          </div>
                          <span className="prem-admin-item-qty">× {item.quantity}</span>
                          <span className="prem-admin-item-price">₹{item.price_at_time}</span>
                        </div>
                      ))}
                    </div>

                    {/* ────── DISPATCH PANEL ────── */}
                    <h3 className="prem-admin-subhead">Dispatch Details</h3>
                    <p className="prem-admin-sub-note">
                      Fill these in when the order leaves our premises. Updates are saved automatically.
                    </p>
                    <div className="prem-admin-dp-grid">
                      <div className="prem-admin-dp-field">
                        <label>Transporter Name</label>
                        <input
                          type="text"
                          defaultValue={o.transporter_name || ''}
                          placeholder="e.g. VRL, TCI, local tempo"
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val === (o.transporter_name || '')) return;
                            updateField(o.id, 'transporter_name', val);
                          }}
                        />
                      </div>
                      <div className="prem-admin-dp-field">
                        <label>LR / Docket Number</label>
                        <input
                          type="text"
                          defaultValue={o.transporter_lr || ''}
                          placeholder="Transporter LR number"
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val === (o.transporter_lr || '')) return;
                            updateField(o.id, 'transporter_lr', val);
                          }}
                        />
                      </div>
                      <div className="prem-admin-dp-field">
                        <label>Package Count</label>
                        <input
                          type="number"
                          defaultValue={o.package_count || ''}
                          placeholder="e.g. 5"
                          onBlur={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null;
                            if (val === o.package_count) return;
                            updateField(o.id, 'package_count', val);
                          }}
                        />
                      </div>
                      <div className="prem-admin-dp-field">
                        <label>Total Weight (kg)</label>
                        <input
                          type="number"
                          step="0.5"
                          defaultValue={o.package_weight_kg || ''}
                          placeholder="e.g. 25"
                          onBlur={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null;
                            if (val === o.package_weight_kg) return;
                            updateField(o.id, 'package_weight_kg', val);
                          }}
                        />
                      </div>
                      <div className="prem-admin-dp-field">
                        <label>E-Way Bill (if applicable)</label>
                        <input
                          type="text"
                          defaultValue={o.eway_bill_number || ''}
                          placeholder="E-way bill number"
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val === (o.eway_bill_number || '')) return;
                            updateField(o.id, 'eway_bill_number', val);
                          }}
                        />
                      </div>
                      <div className="prem-admin-dp-field">
                        <label>Estimated Delivery Date</label>
                        <input
                          type="date"
                          defaultValue={o.estimated_delivery || ''}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val === (o.estimated_delivery || '')) return;
                            updateField(o.id, 'estimated_delivery', val);
                          }}
                        />
                      </div>
                    </div>

                    {/* ────── PAYMENT STATUS ────── */}
                    <h3 className="prem-admin-subhead">Payment Status</h3>
                    <div className="prem-admin-dp-grid">
                      <div className="prem-admin-dp-field">
                        <label>Payment Reference / UTR</label>
                        <input
                          type="text"
                          defaultValue={o.payment_reference || ''}
                          placeholder="UTR or transaction ref"
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val === (o.payment_reference || '')) return;
                            updateField(o.id, 'payment_reference', val);
                          }}
                        />
                      </div>
                      <div className="prem-admin-dp-field">
                        <label>Payment Status</label>
                        <select
                          defaultValue={o.payment_status || 'Pending'}
                          onChange={(e) => updateField(o.id, 'payment_status', e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Partial">Partial</option>
                          <option value="Paid">Paid</option>
                          <option value="Credit">On Credit</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </div>
                    </div>

                    {/* ────── WHATSAPP NOTIFICATIONS ────── */}
                    <h3 className="prem-admin-subhead">Send WhatsApp Notification</h3>
                    <p className="prem-admin-sub-note">
                      Click a status to open WhatsApp with the message pre-filled.
                    </p>
                    <div className="prem-admin-wa-grid">
                      <button
                        className={`prem-admin-wa-btn ${o.status === 'Enquiry' ? 'current' : ''}`}
                        onClick={() => sendWhatsApp(o, msgOrderPlaced, 'Enquiry Received')}
                      >
                        Enquiry Received
                      </button>
                      <button
                        className={`prem-admin-wa-btn ${o.status === 'Confirmed' ? 'current' : ''}`}
                        onClick={() => sendWhatsApp(o, msgOrderConfirmed, 'Confirmed')}
                      >
                        Confirmed
                      </button>
                      <button
                        className={`prem-admin-wa-btn ${o.status === 'Packed' ? 'current' : ''}`}
                        onClick={() => sendWhatsApp(o, msgOrderPacked, 'Packed')}
                      >
                        Packed
                      </button>
                      <button
                        className={`prem-admin-wa-btn ${o.status === 'Dispatched' ? 'current' : ''}`}
                        onClick={() => sendWhatsApp(o, msgDispatched, 'Dispatched')}
                      >
                        Dispatched
                      </button>
                      <button
                        className={`prem-admin-wa-btn ${o.status === 'Delivered' ? 'current' : ''}`}
                        onClick={() => sendWhatsApp(o, msgOrderDelivered, 'Delivered')}
                      >
                        Delivered
                      </button>
                      <button
                        className={`prem-admin-wa-btn ${o.status === 'Cancelled' ? 'current' : ''}`}
                        onClick={() => sendWhatsApp(o, msgOrderCancelled, 'Cancelled')}
                      >
                        Cancelled
                      </button>
                    </div>

                    {/* ────── TIMELINE ────── */}
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

                    {/* ────── ACTIONS ────── */}
                    <div className="prem-admin-order-actions">
                      {nextStatus && (
                        <button className="prem-admin-action primary" onClick={() => updateStatus(o, nextStatus)}>
                          Mark as {nextStatus}
                        </button>
                      )}
                      <button className="prem-admin-action gold" onClick={() => downloadInvoice(o)}>
                        Download Invoice
                      </button>
                      {o.status !== 'Cancelled' && o.status !== 'Delivered' && (
                        <button
                          className="prem-admin-action danger"
                          onClick={() => {
                            if (confirm('Cancel this order?')) updateStatus(o, 'Cancelled');
                          }}
                        >
                          Cancel
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
              <p className="empty-row">No orders with status &quot;{filter}&quot;</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}