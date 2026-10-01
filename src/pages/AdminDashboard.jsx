import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [outOfStock, setOutOfStock] = useState([]);
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

    async function fetchData() {
      const { data: orders } = await supabase.from('orders').select('*');
      const { data: products } = await supabase.from('products').select('*');

      if (orders) {
        setStats({
          orders: orders.length,
          revenue: orders.reduce((sum, o) => sum + Number(o.total_amount), 0),
          products: products?.length || 0,
          pending: orders.filter((o) => o.status === 'Pending').length,
        });
        setRecentOrders(orders.slice(-5).reverse());
      }
      if (products) {
        setLowStock(products.filter((p) => p.stock > 0 && p.stock <= (p.low_stock_threshold || 10)));
        setOutOfStock(products.filter((p) => p.stock === 0));
      }
    }
    fetchData();
  }, [navigate]);

  const totalAlerts = lowStock.length + outOfStock.length;

  const sidebarCounts = {
    orders: stats.pending,
    lowstock: totalAlerts,
  };

  return (
    <div className="prem-admin">
      <AdminSidebar counts={sidebarCounts} active="/admin/dashboard" />

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
            <Link to="/" className="prem-admin-action">View Store</Link>
            <Link to="/admin/orders" className="prem-admin-action primary">Manage Orders</Link>
          </div>
        </header>

        {/* STATS */}
        <div className="prem-admin-stats">
          <div className="prem-admin-stat">
            <span className="prem-admin-stat-label">Total Orders</span>
            <span className="prem-admin-stat-value">{stats.orders}</span>
            <span className="prem-admin-stat-sub">All-time orders received</span>
          </div>
          <div className="prem-admin-stat gold">
            <span className="prem-admin-stat-label">Total Revenue</span>
            <span className="prem-admin-stat-value">₹{stats.revenue.toFixed(0)}</span>
            <span className="prem-admin-stat-sub">Cash on Delivery</span>
          </div>
          <div className="prem-admin-stat">
            <span className="prem-admin-stat-label">Products</span>
            <span className="prem-admin-stat-value">{stats.products}</span>
            <span className="prem-admin-stat-sub">Active in catalog</span>
          </div>
          <div className={`prem-admin-stat ${stats.pending > 0 ? 'alert' : ''}`}>
            <span className="prem-admin-stat-label">Pending Orders</span>
            <span className="prem-admin-stat-value">{stats.pending}</span>
            <span className="prem-admin-stat-sub">Need attention</span>
          </div>
        </div>

        {/* ALERT BANNER */}
        {totalAlerts > 0 && (
          <div className="prem-admin-alert">
            <div className="prem-admin-alert-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="prem-admin-alert-text">
              <strong>
                {totalAlerts} stock {totalAlerts === 1 ? 'alert' : 'alerts'} need attention
              </strong>
              <span>
                {outOfStock.length > 0 && `${outOfStock.length} out of stock`}
                {outOfStock.length > 0 && lowStock.length > 0 && ' · '}
                {lowStock.length > 0 && `${lowStock.length} running low`}
              </span>
            </div>
            <Link to="/admin/products" className="prem-admin-alert-action">Manage Stock</Link>
          </div>
        )}

        {/* LOW STOCK */}
        {lowStock.length > 0 && (
          <section className="prem-admin-section">
            <h2 className="prem-admin-section-title">
              Low Stock <em>Warning</em>
              <span className="prem-admin-section-count">{lowStock.length} products</span>
            </h2>
            <div className="prem-admin-table-wrap">
              <table className="prem-admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Weight</th>
                    <th>Category</th>
                    <th>Stock Left</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.weight}</td>
                      <td>{p.category}</td>
                      <td><strong>{p.stock}</strong></td>
                      <td><span className="prem-admin-badge pending">Low</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* RECENT ORDERS */}
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
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="order-code-cell">{o.order_code || '—'}</td>
                    <td>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                    <td>{o.customer_name}</td>
                    <td className="revenue-cell">₹{o.total_amount}</td>
                    <td>
                      <span className={`prem-admin-badge ${o.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-row">No orders yet</td>
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