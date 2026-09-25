import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { supabase } from '../supabaseClient';

const RANGE_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: 'All time', value: 3650 },
];

const CATEGORY_COLORS = ['#2E7D32', '#F9A825', '#C62828', '#1565C0', '#6a1b9a'];

export default function AdminAnalytics() {
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/admin');
    });
    fetchData();
  }, [navigate, range]);

  async function fetchData() {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - range);

    const { data: ords } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    const { data: prods } = await supabase.from('products').select('*');

    let orderIds = (ords || []).map((o) => o.id);
    let itms = [];
    if (orderIds.length > 0) {
      const { data } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);
      itms = data || [];
    }

    setOrders(ords || []);
    setItems(itms);
    setProducts(prods || []);
    setLoading(false);
  }

  // ---------- DERIVED DATA ----------

  // Revenue per day
  const revenueByDay = (() => {
    const map = {};
    orders.forEach((o) => {
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      if (!map[day]) map[day] = { date: day, revenue: 0, orders: 0 };
      map[day].revenue += Number(o.total_amount);
      map[day].orders += 1;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  })();

  // Top selling products
  const topProducts = (() => {
    const map = {};
    items.forEach((it) => {
      if (!map[it.product_id]) {
        const prod = products.find((p) => p.id === it.product_id);
        map[it.product_id] = {
          name: prod ? `${prod.name} · ${prod.weight}` : 'Unknown',
          qty: 0,
          revenue: 0,
        };
      }
      map[it.product_id].qty += it.quantity;
      map[it.product_id].revenue += it.quantity * Number(it.price_at_time);
    });
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  })();

  // Category revenue
  const categoryRevenue = (() => {
    const map = {};
    items.forEach((it) => {
      const prod = products.find((p) => p.id === it.product_id);
      const cat = prod?.category || 'Other';
      if (!map[cat]) map[cat] = { name: cat, value: 0 };
      map[cat].value += it.quantity * Number(it.price_at_time);
    });
    return Object.values(map);
  })();

  // Customer metrics
  const customerMetrics = (() => {
    const customers = {};
    orders.forEach((o) => {
      const key = o.customer_phone || o.customer_name;
      customers[key] = (customers[key] || 0) + 1;
    });
    const total = Object.keys(customers).length;
    const repeat = Object.values(customers).filter((c) => c > 1).length;
    return {
      total,
      repeat,
      repeatRate: total ? ((repeat / total) * 100).toFixed(1) : '0.0',
    };
  })();

  // KPIs
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const bestDay = revenueByDay.reduce(
    (best, d) => (d.revenue > (best?.revenue || 0) ? d : best),
    null
  );

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <h2>🌿 Admin</h2>
        <nav>
          <Link to="/admin/dashboard">📊 Dashboard</Link>
          <Link to="/admin/analytics">📈 Analytics</Link>
          <Link to="/admin/analytics" className="active">📈 Analytics</Link>
          <Link to="/admin/orders">📦 Orders</Link>
          <Link to="/admin/products">🍌 Products</Link>
          <Link to="/">🏠 View Site</Link>
        </nav>
        <button
          className="logout-btn"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate('/admin');
          }}
        >
          Logout
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-top-bar">
          <div className="admin-top-left">
            <h1>Analytics</h1>
            <p className="admin-welcome">
              Business insights for the last <strong>{range} days</strong>
            </p>
          </div>

          <div className="range-picker">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`range-btn ${range === opt.value ? 'active' : ''}`}
                onClick={() => setRange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="analytics-loading">
            <div className="track-spinner"></div>
            <p>Crunching the numbers...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="analytics-kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #2E7D32, #1B5E20)' }}>₹</div>
                <p className="kpi-label">Total Revenue</p>
                <h2 className="kpi-value">₹{totalRevenue.toFixed(0)}</h2>
                <p className="kpi-sub">{totalOrders} orders</p>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #F9A825, #ef6c00)' }}>📊</div>
                <p className="kpi-label">Avg Order Value</p>
                <h2 className="kpi-value">₹{avgOrderValue.toFixed(0)}</h2>
                <p className="kpi-sub">per order</p>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #C62828, #a02020)' }}>👥</div>
                <p className="kpi-label">Total Customers</p>
                <h2 className="kpi-value">{customerMetrics.total}</h2>
                <p className="kpi-sub">{customerMetrics.repeat} repeat buyers</p>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #1565C0, #0d47a1)' }}>🔁</div>
                <p className="kpi-label">Repeat Rate</p>
                <h2 className="kpi-value">{customerMetrics.repeatRate}%</h2>
                <p className="kpi-sub">loyal customers</p>
              </div>
            </div>

            {/* Revenue Trend */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <h3>📈 Revenue Trend</h3>
                {bestDay && (
                  <p className="analytics-sub">
                    Best day: <strong>₹{bestDay.revenue.toFixed(0)}</strong> on {bestDay.date}
                  </p>
                )}
              </div>
              <div className="chart-wrapper">
                {revenueByDay.length === 0 ? (
                  <p className="chart-empty">No orders in this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={revenueByDay}>
                      <defs>
                        <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2E7D32" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#2E7D32" stopOpacity={0.15} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: '1px solid #e0e0e0',
                          fontSize: '0.85rem',
                        }}
                        formatter={(v) => `₹${v}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2E7D32"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#2E7D32' }}
                        activeDot={{ r: 6 }}
                        fill="url(#revGradient)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Best Sellers + Categories */}
            <div className="analytics-row">
              <div className="analytics-card">
                <h3>🏆 Top Selling Products</h3>
                <div className="chart-wrapper">
                  {topProducts.length === 0 ? (
                    <p className="chart-empty">No sales yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 11, fill: '#555' }}
                          width={130}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: 10, fontSize: '0.85rem' }}
                          formatter={(v, k) =>
                            k === 'revenue' ? `₹${v}` : `${v} units`
                          }
                        />
                        <Bar dataKey="revenue" fill="#F9A825" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="analytics-card">
                <h3>🥧 Category Revenue</h3>
                <div className="chart-wrapper">
                  {categoryRevenue.length === 0 ? (
                    <p className="chart-empty">No data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryRevenue}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={100}
                          innerRadius={50}
                          paddingAngle={3}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {categoryRevenue.map((entry, idx) => (
                            <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: 10, fontSize: '0.85rem' }}
                          formatter={(v) => `₹${v}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Top Products Table */}
            <div className="analytics-card">
              <h3>📋 Product Performance</h3>
              <div className="orders-table-wrapper" style={{ marginTop: 16 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Product</th>
                      <th>Units Sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className="rank-badge">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                        </td>
                        <td>{p.name}</td>
                        <td>{p.qty}</td>
                        <td className="revenue-cell">₹{p.revenue.toFixed(0)}</td>
                      </tr>
                    ))}
                    {topProducts.length === 0 && (
                      <tr>
                        <td colSpan="4" className="empty-row">No sales in this period.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}