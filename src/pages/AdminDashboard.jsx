import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    totalKg: 0,
    pendingOrders: 0,
    pendingRetailers: 0,
    pendingPayments: 0,
    lowStock: 0,
    activeRetailers: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [districtSplit, setDistrictSplit] = useState([]);
  const [adminEmail, setAdminEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate('/admin');
        return;
      }
      setAdminEmail(data.session.user.email);
    });
    fetchDashboard();
  }, [navigate]);

  async function fetchDashboard() {
    // Fetch in parallel
    const [ordersRes, productsRes, retailersRes] = await Promise.all([
      supabase.from('orders').select('*, order_items(quantity, price_at_time, products(pack_size_kg))'),
      supabase.from('products').select('*'),
      supabase.from('retailers').select('*'),
    ]);

    const orders = ordersRes.data || [];
    const products = productsRes.data || [];
    const retailers = retailersRes.data || [];

    // ── Compute stats ──
    const revenue = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const totalKg = orders.reduce((sum, o) => {
      const kg = (o.order_items || []).reduce((s, item) => {
        const packSize = item.products?.pack_size_kg || 1;
        return s + packSize * item.quantity;
      }, 0);
      return sum + kg;
    }, 0);

    const pendingOrders = orders.filter((o) =>
      ['Enquiry', 'Confirmed', 'Packed'].includes(o.status)
    ).length;

    const pendingPayments = orders
      .filter((o) => ['Pending', 'Partial', 'Credit'].includes(o.payment_status))
      .reduce((s, o) => s + Number(o.total_amount || 0), 0);

    const pendingRetailers = retailers.filter((r) => r.status === 'Pending').length;
    const activeRetailers = retailers.filter((r) => r.status === 'Approved').length;

    const lowStock = products.filter(
      (p) => p.stock > 0 && p.stock <= (p.low_stock_threshold || 10)
    ).length;

    setStats({
      totalOrders: orders.length,
      revenue,
      totalKg: Math.round(totalKg),
      pendingOrders,
      pendingRetailers,
      pendingPayments,
      lowStock,
      activeRetailers,
    });

    // ── Recent orders ──
    setRecentOrders(orders.slice(-6).reverse());

    // ── District split ──
    const distMap = {};
    orders.forEach((o) => {
      const district = o.retailers?.district || 'Unknown';
      if (!distMap[district]) distMap[district] = { district, orders: 0, revenue: 0, kg: 0 };
      distMap[district].orders += 1;
      distMap[district].revenue += Number(o.total_amount || 0);
      distMap[district].kg += (o.order_items || []).reduce(
        (s, item) => s + (item.products?.pack_size_kg || 1) * item.quantity,
        0
      );
    });
    const districts = Object.values(distMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    setDistrictSplit(districts);
  }

  return (
    <div className="prem-admin">
      <AdminSidebar
        counts={{
          orders: stats.pendingOrders,
          lowstock: stats.lowStock,
          retailers: stats.pendingRetailers,
        }}
        active="/admin/dashboard"
      />

      <main className="prem-admin-main">
        <header className="prem-admin-topbar">
          <div>
            <span className="prem-kicker">OVERVIEW</span>
            <h1 className="prem-admin-page-title">
              Welcome back, <em>Admin.</em>
            </h1>
            <p className="prem-admin-page-sub">
              Signed in as <strong>{adminEmail}</strong>
            </p>
          </div>
          <div className="prem-admin-top-actions">
            <Link to="/" className="prem-admin-action">View Site</Link>
            <Link to="/admin/orders" className="prem-admin-action primary">Manage Orders</Link>
          </div>
        </header>

        {/* ── PRIMARY KPIs ── */}
        <div className="prem-admin-stats">
          <div className="prem-admin-stat">
            <span className="prem-admin-stat-label">Total Revenue</span>
            <span className="prem-admin-stat-value">₹{stats.revenue.toFixed(0)}</span>
            <span className="prem-admin-stat-sub">{stats.totalOrders} orders</span>
          </div>
          <div className="prem-admin-stat gold">
            <span className="prem-admin-stat-label">Volume Sold</span>
            <span className="prem-admin-stat-value">{stats.totalKg} kg</span>
            <span className="prem-admin-stat-sub">across all orders</span>
          </div>
          <div className="prem-admin-stat">
            <span className="prem-admin-stat-label">Active Retailers</span>
            <span className="prem-admin-stat-value">{stats.activeRetailers}</span>
            <span className="prem-admin-stat-sub">{stats.pendingRetailers} pending approval</span>
          </div>
          <div className={`prem-admin-stat ${stats.pendingOrders > 0 ? 'alert' : ''}`}>
            <span className="prem-admin-stat-label">Open Orders</span>
            <span className="prem-admin-stat-value">{stats.pendingOrders}</span>
            <span className="prem-admin-stat-sub">need action</span>
          </div>
        </div>

        {/* ── SECONDARY KPIs ── */}
        <div className="prem-admin-stats secondary">
          <div className="prem-admin-stat warn">
            <span className="prem-admin-stat-label">Pending Payments</span>
            <span className="prem-admin-stat-value">₹{stats.pendingPayments.toFixed(0)}</span>
            <span className="prem-admin-stat-sub">outstanding from retailers</span>
          </div>
          <div className="prem-admin-stat">
            <span className="prem-admin-stat-label">Low Stock Products</span>
            <span className="prem-admin-stat-value">{stats.lowStock}</span>
            <span className="prem-admin-stat-sub">reorder soon</span>
          </div>
        </div>

        {/* ── ALERT BANNER ── */}
        {(stats.pendingRetailers > 0 || stats.lowStock > 0) && (
          <div className="prem-admin-alert">
            <div className="prem-admin-alert-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="prem-admin-alert-text">
              <strong>Action needed</strong>
              <span>
                {stats.pendingRetailers > 0 && `${stats.pendingRetailers} retailer applications pending`}
                {stats.pendingRetailers > 0 && stats.lowStock > 0 && ' · '}
                {stats.lowStock > 0 && `${stats.lowStock} products running low`}
              </span>
            </div>
            <Link
              to={stats.pendingRetailers > 0 ? '/admin/retailers' : '/admin/products'}
              className="prem-admin-alert-action"
            >
              Review Now
            </Link>
          </div>
        )}

        {/* ── DISTRICT SPLIT ── */}
        {districtSplit.length > 0 && (
          <section className="prem-admin-section">
            <h2 className="prem-admin-section-title">
              Top <em>Districts</em>
              <span className="prem-admin-section-count">{districtSplit.length} showing</span>
            </h2>
            <div className="prem-admin-table-wrap">
              <table className="prem-admin-table">
                <thead>
                  <tr>
                    <th>District</th>
                    <th>Orders</th>
                    <th>Volume</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {districtSplit.map((d) => (
                    <tr key={d.district}>
                      <td><strong>{d.district}</strong></td>
                      <td>{d.orders}</td>
                      <td>{Math.round(d.kg)} kg</td>
                      <td className="revenue-cell">₹{d.revenue.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── RECENT ORDERS ── */}
        <section className="prem-admin-section">
          <h2 className="prem-admin-section-title">
            Recent <em>Orders</em>
            <Link to="/admin/orders" className="prem-admin-section-count" style={{ textDecoration: 'none' }}>
              View All →
            </Link>
          </h2>
          <div className="prem-admin-table-wrap">
            <table className="prem-admin-table">
              <thead>
                <tr>
                  <th>Order Code</th>
                  <th>Retailer</th>
                  <th>Date</th>
                  <th>Volume</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => {
                  const kg = (o.order_items || []).reduce(
                    (s, item) => s + (item.products?.pack_size_kg || 1) * item.quantity,
                    0
                  );
                  return (
                    <tr key={o.id}>
                      <td className="order-code-cell">{o.order_code || '—'}</td>
                      <td>{o.customer_name}</td>
                      <td>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                      <td>{Math.round(kg)} kg</td>
                      <td className="revenue-cell">₹{o.total_amount}</td>
                      <td>
                        <span className={`prem-admin-badge ${o.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-row">No orders yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}