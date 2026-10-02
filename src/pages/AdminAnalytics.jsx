import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const COLORS = ['#14513E', '#C9A227', '#B8341F', '#1B6B50', '#8B5E3C', '#6A1B9A'];

export default function AdminAnalytics() {
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [retailers, setRetailers] = useState([]);
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

    const [ordersRes, productsRes, retailersRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, order_items(quantity, price_at_time, product_id, products(name, category, pack_size_kg))')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true }),
      supabase.from('products').select('*'),
      supabase.from('retailers').select('*'),
    ]);

    setOrders(ordersRes.data || []);
    setProducts(productsRes.data || []);
    setRetailers(retailersRes.data || []);
    setLoading(false);
  }

  // ── Compute metrics ──

  // 1. Revenue & kg by day
  const trendByDay = (() => {
    const map = {};
    orders.forEach((o) => {
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      if (!map[day]) map[day] = { date: day.slice(5), revenue: 0, kg: 0, orders: 0 };
      map[day].revenue += Number(o.total_amount || 0);
      map[day].kg += (o.order_items || []).reduce(
        (s, item) => s + (item.products?.pack_size_kg || 1) * item.quantity,
        0
      );
      map[day].orders += 1;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  })();

  // 2. Top retailers by revenue
  const topRetailers = (() => {
    const map = {};
    orders.forEach((o) => {
      const key = o.retailer_id || o.customer_name;
      if (!map[key]) {
        map[key] = {
          name: o.customer_name,
          district: o.retailers?.district || '—',
          revenue: 0,
          orders: 0,
          kg: 0,
        };
      }
      map[key].revenue += Number(o.total_amount || 0);
      map[key].orders += 1;
      map[key].kg += (o.order_items || []).reduce(
        (s, item) => s + (item.products?.pack_size_kg || 1) * item.quantity,
        0
      );
    });
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  })();

  // 3. Category split (Banana vs Jackfruit)
  const categorySplit = (() => {
    const map = {};
    orders.forEach((o) => {
      (o.order_items || []).forEach((item) => {
        const cat = item.products?.category || 'Other';
        if (!map[cat]) map[cat] = { name: cat, kg: 0, revenue: 0 };
        const kg = (item.products?.pack_size_kg || 1) * item.quantity;
        map[cat].kg += kg;
        map[cat].revenue += kg * 0 + Number(item.price_at_time) * item.quantity;
      });
    });
    return Object.values(map);
  })();

  // 4. Revenue by district
  const districtRevenue = (() => {
    const map = {};
    orders.forEach((o) => {
      const d = o.retailers?.district || 'Unknown';
      if (!map[d]) map[d] = { name: d, revenue: 0, kg: 0 };
      map[d].revenue += Number(o.total_amount || 0);
      map[d].kg += (o.order_items || []).reduce(
        (s, item) => s + (item.products?.pack_size_kg || 1) * item.quantity,
        0
      );
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  })();

  // 5. Repeat retailer rate
  const retailerMetrics = (() => {
    const orderCounts = {};
    orders.forEach((o) => {
      const key = o.retailer_id || o.customer_name;
      orderCounts[key] = (orderCounts[key] || 0) + 1;
    });
    const total = Object.keys(orderCounts).length;
    const repeat = Object.values(orderCounts).filter((c) => c > 1).length;
    return {
      total,
      repeat,
      rate: total ? ((repeat / total) * 100).toFixed(0) : '0',
    };
  })();

  // 6. Top products by kg
  const topProductsByKg = (() => {
    const map = {};
    orders.forEach((o) => {
      (o.order_items || []).forEach((item) => {
        const key = item.product_id;
        if (!map[key]) {
          map[key] = {
            name: item.products?.name || 'Unknown',
            kg: 0,
            revenue: 0,
            packSize: item.products?.pack_size_kg || 1,
          };
        }
        const kg = (item.products?.pack_size_kg || 1) * item.quantity;
        map[key].kg += kg;
        map[key].revenue += Number(item.price_at_time) * item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.kg - a.kg).slice(0, 5);
  })();

  // ── Totals ──
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const totalKg = orders.reduce(
    (sum, o) =>
      sum +
      (o.order_items || []).reduce(
        (s, item) => s + (item.products?.pack_size_kg || 1) * item.quantity,
        0
      ),
    0
  );
  const avgOrderKg = orders.length ? totalKg / orders.length : 0;
  const bestDay = trendByDay.reduce(
    (best, d) => (d.revenue > (best?.revenue || 0) ? d : best),
    null
  );

  return (
    <div className="prem-admin">
      <AdminSidebar active="/admin/analytics" />

      <main className="prem-admin-main">
        <header className="prem-admin-topbar">
          <div>
            <span className="prem-kicker">INSIGHTS</span>
            <h1 className="prem-admin-page-title">
              Wholesale <em>Analytics.</em>
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
          <div className="prem-admin-loading"><p>Crunching numbers...</p></div>
        ) : (
          <>
            {/* ── KPI CARDS ── */}
            <div className="prem-admin-stats">
              <div className="prem-admin-stat">
                <span className="prem-admin-stat-label">Total Revenue</span>
                <span className="prem-admin-stat-value">₹{totalRevenue.toFixed(0)}</span>
                <span className="prem-admin-stat-sub">{orders.length} orders</span>
              </div>
              <div className="prem-admin-stat gold">
                <span className="prem-admin-stat-label">Volume Sold</span>
                <span className="prem-admin-stat-value">{Math.round(totalKg)} kg</span>
                <span className="prem-admin-stat-sub">across all orders</span>
              </div>
              <div className="prem-admin-stat">
                <span className="prem-admin-stat-label">Avg Order Size</span>
                <span className="prem-admin-stat-value">{avgOrderKg.toFixed(1)} kg</span>
                <span className="prem-admin-stat-sub">per order</span>
              </div>
              <div className="prem-admin-stat warn">
                <span className="prem-admin-stat-label">Repeat Retailers</span>
                <span className="prem-admin-stat-value">{retailerMetrics.rate}%</span>
                <span className="prem-admin-stat-sub">{retailerMetrics.repeat} of {retailerMetrics.total}</span>
              </div>
            </div>

            {/* ── REVENUE + KG TREND ── */}
            <section className="prem-admin-section">
              <h2 className="prem-admin-section-title">
                Revenue &amp; Volume <em>Trend</em>
                {bestDay && (
                  <span className="prem-admin-section-count">
                    Best: ₹{bestDay.revenue.toFixed(0)} · {Math.round(bestDay.kg)} kg on {bestDay.date}
                  </span>
                )}
              </h2>
              <div className="prem-admin-chart">
                {trendByDay.length === 0 ? (
                  <p className="prem-admin-chart-empty">No data in this period</p>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={trendByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EBE3D5" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={{ stroke: '#EBE3D5' }} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 0, border: '1px solid #0F0F0F', fontSize: '0.85rem', background: '#FEFDFB' }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#14513E"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#14513E', strokeWidth: 0 }}
                        name="Revenue (₹)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="kg"
                        stroke="#C9A227"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#C9A227', strokeWidth: 0 }}
                        name="Volume (kg)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* ── TOP PRODUCTS (by kg) + CATEGORY SPLIT ── */}
            <div className="prem-admin-chart-row">
              <section className="prem-admin-section" style={{ marginBottom: 0 }}>
                <h2 className="prem-admin-section-title">
                  Top Products <em>by Volume</em>
                </h2>
                <div className="prem-admin-chart">
                  {topProductsByKg.length === 0 ? (
                    <p className="prem-admin-chart-empty">No data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={topProductsByKg} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EBE3D5" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={{ stroke: '#EBE3D5' }} tickLine={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 11, fill: '#2A2A2A' }}
                          width={110}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: 0, border: '1px solid #0F0F0F', fontSize: '0.85rem', background: '#FEFDFB' }}
                          formatter={(v) => [`${Math.round(v)} kg`, 'Volume']}
                        />
                        <Bar dataKey="kg" fill="#C9A227" radius={0} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </section>

              <section className="prem-admin-section" style={{ marginBottom: 0 }}>
                <h2 className="prem-admin-section-title">
                  Category <em>Split</em>
                </h2>
                <div className="prem-admin-chart">
                  {categorySplit.length === 0 ? (
                    <p className="prem-admin-chart-empty">No data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={categorySplit}
                          dataKey="kg"
                          nameKey="name"
                          outerRadius={100}
                          innerRadius={55}
                          paddingAngle={2}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {categorySplit.map((entry, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: 0, border: '1px solid #0F0F0F', fontSize: '0.85rem', background: '#FEFDFB' }}
                          formatter={(v) => [`${Math.round(v)} kg`, 'Volume']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </section>
            </div>

            {/* ── REVENUE BY DISTRICT ── */}
            <section className="prem-admin-section" style={{ marginTop: 'var(--s-5)' }}>
              <h2 className="prem-admin-section-title">
                Revenue by <em>District</em>
              </h2>
              <div className="prem-admin-chart">
                {districtRevenue.length === 0 ? (
                  <p className="prem-admin-chart-empty">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={districtRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EBE3D5" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={{ stroke: '#EBE3D5' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 0, border: '1px solid #0F0F0F', fontSize: '0.85rem', background: '#FEFDFB' }}
                        formatter={(v, k) => (k === 'revenue' ? `₹${v.toFixed(0)}` : `${Math.round(v)} kg`)}
                      />
                      <Bar dataKey="revenue" fill="#14513E" radius={0} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* ── TOP RETAILERS TABLE ── */}
            <section className="prem-admin-section">
              <h2 className="prem-admin-section-title">
                Top <em>Retailers</em>
                <span className="prem-admin-section-count">{topRetailers.length} ranked</span>
              </h2>
              <div className="prem-admin-table-wrap">
                <table className="prem-admin-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Retailer</th>
                      <th>District</th>
                      <th>Orders</th>
                      <th>Volume</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRetailers.map((r, idx) => (
                      <tr key={idx}>
                        <td><strong>{idx + 1}</strong></td>
                        <td>{r.name}</td>
                        <td>{r.district}</td>
                        <td>{r.orders}</td>
                        <td>{Math.round(r.kg)} kg</td>
                        <td className="revenue-cell">₹{r.revenue.toFixed(0)}</td>
                      </tr>
                    ))}
                    {topRetailers.length === 0 && (
                      <tr><td colSpan="6" className="empty-row">No orders in this period</td></tr>
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