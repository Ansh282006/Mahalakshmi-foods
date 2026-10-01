import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { supabase } from '../supabaseClient';
import AdminSidebar from '../components/AdminSidebar';

const RANGE_OPTIONS = [
  { label: '7 DAYS', value: 7 },
  { label: '30 DAYS', value: 30 },
  { label: '90 DAYS', value: 90 },
  { label: 'ALL TIME', value: 3650 },
];

const CATEGORY_COLORS = ['#14513E', '#C9A227', '#B8341F', '#1B6B50', '#8B5E3C'];

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

    let itms = [];
    const orderIds = (ords || []).map((o) => o.id);
    if (orderIds.length > 0) {
      const { data } = await supabase.from('order_items').select('*').in('order_id', orderIds);
      itms = data || [];
    }

    setOrders(ords || []);
    setItems(itms);
    setProducts(prods || []);
    setLoading(false);
  }

  const revenueByDay = (() => {
    const map = {};
    orders.forEach((o) => {
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      if (!map[day]) map[day] = { date: day.slice(5), revenue: 0, orders: 0 };
      map[day].revenue += Number(o.total_amount);
      map[day].orders += 1;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  })();

  const topProducts = (() => {
    const map = {};
    items.forEach((it) => {
      if (!map[it.product_id]) {
        const prod = products.find((p) => p.id === it.product_id);
        map[it.product_id] = {
          name: prod ? `${prod.name} (${prod.weight})` : 'Unknown',
          shortName: prod ? prod.name.split(' ')[0] : 'Unknown',
          qty: 0,
          revenue: 0,
        };
      }
      map[it.product_id].qty += it.quantity;
      map[it.product_id].revenue += it.quantity * Number(it.price_at_time);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  })();

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

  const customerMetrics = (() => {
    const customers = {};
    orders.forEach((o) => {
      const key = o.customer_phone || o.customer_name;
      customers[key] = (customers[key] || 0) + 1;
    });
    const total = Object.keys(customers).length;
    const repeat = Object.values(customers).filter((c) => c > 1).length;
    return { total, repeat, repeatRate: total ? ((repeat / total) * 100).toFixed(0) : '0' };
  })();

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const bestDay = revenueByDay.reduce((best, d) => (d.revenue > (best?.revenue || 0) ? d : best), null);

  return (
    <div className="prem-admin">
      <AdminSidebar active="/admin/analytics" />

      <main className="prem-admin-main">
        <header className="prem-admin-topbar">
          <div>
            <span className="prem-kicker">INSIGHTS</span>
            <h1 className="prem-admin-page-title">
              Business <em>Analytics.</em>
            </h1>
            <p className="prem-admin-page-sub">
              Performance for the last <strong>{range} days</strong>
            </p>
          </div>

          <div className="prem-admin-range">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`prem-admin-range-btn ${range === opt.value ? 'active' : ''}`}
                onClick={() => setRange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="prem-admin-loading">
            <p>Crunching the numbers...</p>
          </div>
        ) : (
          <>
            {/* KPI CARDS */}
            <div className="prem-admin-stats">
              <div className="prem-admin-stat">
                <span className="prem-admin-stat-label">Total Revenue</span>
                <span className="prem-admin-stat-value">₹{totalRevenue.toFixed(0)}</span>
                <span className="prem-admin-stat-sub">{totalOrders} orders</span>
              </div>
              <div className="prem-admin-stat gold">
                <span className="prem-admin-stat-label">Avg Order Value</span>
                <span className="prem-admin-stat-value">₹{avgOrderValue.toFixed(0)}</span>
                <span className="prem-admin-stat-sub">per order</span>
              </div>
              <div className="prem-admin-stat">
                <span className="prem-admin-stat-label">Total Customers</span>
                <span className="prem-admin-stat-value">{customerMetrics.total}</span>
                <span className="prem-admin-stat-sub">{customerMetrics.repeat} repeat buyers</span>
              </div>
              <div className="prem-admin-stat warn">
                <span className="prem-admin-stat-label">Repeat Rate</span>
                <span className="prem-admin-stat-value">{customerMetrics.repeatRate}%</span>
                <span className="prem-admin-stat-sub">loyal customers</span>
              </div>
            </div>

            {/* REVENUE TREND */}
            <section className="prem-admin-section">
              <h2 className="prem-admin-section-title">
                Revenue <em>Trend</em>
                {bestDay && (
                  <span className="prem-admin-section-count">
                    Best: ₹{bestDay.revenue.toFixed(0)} on {bestDay.date}
                  </span>
                )}
              </h2>
              <div className="prem-admin-chart">
                {revenueByDay.length === 0 ? (
                  <p className="prem-admin-chart-empty">No orders in this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EBE3D5" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={{ stroke: '#EBE3D5' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 0, border: '1px solid #0F0F0F', fontSize: '0.85rem', background: '#FEFDFB' }}
                        formatter={(v) => [`₹${v}`, 'Revenue']}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#14513E"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#14513E', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#C9A227', stroke: '#14513E', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* TOP PRODUCTS + CATEGORY */}
            <div className="prem-admin-chart-row">
              <section className="prem-admin-section" style={{ marginBottom: 0 }}>
                <h2 className="prem-admin-section-title">
                  Top <em>Sellers</em>
                </h2>
                <div className="prem-admin-chart">
                  {topProducts.length === 0 ? (
                    <p className="prem-admin-chart-empty">No sales yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EBE3D5" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={{ stroke: '#EBE3D5' }} tickLine={false} />
                        <YAxis type="category" dataKey="shortName" tick={{ fontSize: 11, fill: '#2A2A2A' }} width={80} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 0, border: '1px solid #0F0F0F', fontSize: '0.85rem', background: '#FEFDFB' }}
                          formatter={(v, k) => (k === 'revenue' ? `₹${v}` : `${v} units`)}
                        />
                        <Bar dataKey="revenue" fill="#C9A227" radius={0} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </section>

              <section className="prem-admin-section" style={{ marginBottom: 0 }}>
                <h2 className="prem-admin-section-title">
                  Revenue by <em>Category</em>
                </h2>
                <div className="prem-admin-chart">
                  {categoryRevenue.length === 0 ? (
                    <p className="prem-admin-chart-empty">No data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryRevenue}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={90}
                          innerRadius={50}
                          paddingAngle={2}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {categoryRevenue.map((entry, idx) => (
                            <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: 0, border: '1px solid #0F0F0F', fontSize: '0.85rem', background: '#FEFDFB' }}
                          formatter={(v) => `₹${v}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </section>
            </div>

            {/* PRODUCT PERFORMANCE TABLE */}
            <section className="prem-admin-section" style={{ marginTop: 'var(--s-5)' }}>
              <h2 className="prem-admin-section-title">
                Product <em>Performance</em>
                <span className="prem-admin-section-count">{topProducts.length} products</span>
              </h2>
              <div className="prem-admin-table-wrap">
                <table className="prem-admin-table">
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
                        <td><strong>{idx + 1}</strong></td>
                        <td>{p.name}</td>
                        <td>{p.qty}</td>
                        <td className="revenue-cell">₹{p.revenue.toFixed(0)}</td>
                      </tr>
                    ))}
                    {topProducts.length === 0 && (
                      <tr><td colSpan="4" className="empty-row">No sales in this period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}