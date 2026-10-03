import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [retailers, setRetailers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/admin');
    });
    fetchData();
  }, [navigate]);

  async function fetchData() {
    setLoading(true);
    const [retRes, ordRes] = await Promise.all([
      supabase.from('retailers').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*'),
    ]);
    setRetailers(retRes.data || []);
    setOrders(ordRes.data || []);
    setLoading(false);
  }

  function getStats(retailerId) {
    const userOrders = orders.filter((o) => o.retailer_id === retailerId);
    const revenue = userOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const pending = userOrders
      .filter((o) => ['Pending', 'Partial', 'Credit'].includes(o.payment_status))
      .reduce((s, o) => s + Number(o.total_amount || 0), 0);
    return { count: userOrders.length, revenue, pending };
  }

  return (
    <div className="prem-admin">
      <AdminSidebar active="/admin/users" />

      <main className="prem-admin-main">
        <header className="prem-admin-topbar">
          <div>
            <span className="prem-kicker">USER DATA</span>
            <h1 className="prem-admin-page-title">All <em>Users.</em></h1>
            <p className="prem-admin-page-sub"><strong>{retailers.length}</strong> retailers registered</p>
          </div>
        </header>

        {loading ? (
          <div className="prem-admin-loading"><p>Loading users...</p></div>
        ) : (
          <div className="prem-admin-orders-list">
            {retailers.map((r) => {
              const stats = getStats(r.id);
              const isOpen = expanded === r.id;
              return (
                <article key={r.id} className={`prem-admin-order ${isOpen ? 'open' : ''}`}>
                  <header className="prem-admin-order-head" onClick={() => setExpanded(isOpen ? null : r.id)}>
                    <div className="prem-admin-order-head-left">
                      <span className="prem-admin-order-name">{r.shop_name}</span>
                      <span className="prem-admin-order-phone">{r.owner_name}</span>
                      <span className="prem-admin-order-phone">· {r.district}</span>
                    </div>
                    <div className="prem-admin-order-head-right">
                      <span className="prem-admin-order-total">₹{stats.revenue.toFixed(0)}</span>
                      <span className={`prem-admin-badge ${r.status.toLowerCase()}`}>{r.status}</span>
                    </div>
                  </header>

                  {isOpen && (
                    <div className="prem-admin-order-body">
                      <div className="prem-admin-order-details">
                        <div>
                          <span className="prem-admin-detail-label">Phone</span>
                          <span className="prem-admin-detail-value">{r.phone}</span>
                        </div>
                        <div>
                          <span className="prem-admin-detail-label">GSTIN</span>
                          <span className="prem-admin-detail-value">{r.gstin || '—'}</span>
                        </div>
                        <div>
                          <span className="prem-admin-detail-label">Orders</span>
                          <span className="prem-admin-detail-value">{stats.count}</span>
                        </div>
                        <div>
                          <span className="prem-admin-detail-label">Revenue</span>
                          <span className="prem-admin-detail-value">₹{stats.revenue.toFixed(0)}</span>
                        </div>
                        <div>
                          <span className="prem-admin-detail-label">Pending</span>
                          <span className="prem-admin-detail-value">₹{stats.pending.toFixed(0)}</span>
                        </div>
                        <div className="full">
                          <span className="prem-admin-detail-label">Address</span>
                          <span className="prem-admin-detail-value">{r.address}</span>
                        </div>
                      </div>

                      <div className="prem-admin-order-actions">
                        <a href={`https://wa.me/91${r.phone}`} target="_blank" rel="noopener noreferrer" className="prem-admin-action primary">
                          WhatsApp
                        </a>
                        <a href={`tel:+91${r.phone}`} className="prem-admin-action">Call</a>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}