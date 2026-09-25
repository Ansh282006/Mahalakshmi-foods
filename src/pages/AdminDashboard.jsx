import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [outOfStock, setOutOfStock] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/admin');
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const totalAlerts = lowStock.length + outOfStock.length;

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <h2>🌿 Admin</h2>
        <nav>
          <Link to="/admin/dashboard" className="active">📊 Dashboard</Link>
          <Link to="/admin/orders">📦 Orders</Link>
          <Link to="/admin/products">🍌 Products</Link>
          <Link to="/">🏠 View Site</Link>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="admin-main">
        <h1>Dashboard</h1>

        <div className="stats-grid">
          <div className="stat-card"><p>Total Orders</p><h2>{stats.orders}</h2></div>
          <div className="stat-card"><p>Total Revenue</p><h2>₹{stats.revenue.toFixed(2)}</h2></div>
          <div className="stat-card"><p>Products</p><h2>{stats.products}</h2></div>
          <div className="stat-card highlight"><p>Pending Orders</p><h2>{stats.pending}</h2></div>
        </div>

        {totalAlerts > 0 && (
          <div className="stock-alert-banner">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <strong>{totalAlerts} stock {totalAlerts === 1 ? 'alert' : 'alerts'} need attention</strong>
              <p>
                {outOfStock.length > 0 && `${outOfStock.length} out of stock`}
                {outOfStock.length > 0 && lowStock.length > 0 && ' · '}
                {lowStock.length > 0 && `${lowStock.length} running low`}
              </p>
            </div>
            <Link to="/admin/products" className="alert-action">Manage Stock →</Link>
          </div>
        )}

        {lowStock.length > 0 && (
          <>
            <h2 className="section-heading">🟡 Low Stock</h2>
            <div className="stock-list">
              {lowStock.map((p) => (
                <div key={p.id} className="stock-item low">
                  <img src={p.image_url} alt={p.name} />
                  <div className="stock-item-info">
                    <strong>{p.name}</strong>
                    <span>{p.weight}</span>
                  </div>
                  <div className="stock-item-qty">
                    <span className="stock-number">{p.stock}</span>
                    <small>left</small>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {outOfStock.length > 0 && (
          <>
            <h2 className="section-heading">🔴 Out of Stock</h2>
            <div className="stock-list">
              {outOfStock.map((p) => (
                <div key={p.id} className="stock-item out">
                  <img src={p.image_url} alt={p.name} />
                  <div className="stock-item-info">
                    <strong>{p.name}</strong>
                    <span>{p.weight}</span>
                  </div>
                  <div className="stock-item-qty">
                    <span className="stock-number">0</span>
                    <small>left</small>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="section-heading">Recent Orders</h2>
        <div className="orders-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td><span className="order-code">{o.order_code || '—'}</span></td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>{o.customer_name}</td>
                  <td>₹{o.total_amount}</td>
                  <td>
                    <span className={`status-badge status-${o.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan="5" className="empty-row">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}