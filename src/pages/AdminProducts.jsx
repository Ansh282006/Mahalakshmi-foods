import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    low_stock_threshold: '',
    weight: '',
    category: 'Banana Chips',
    image_url: '',
    description: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/admin');
    });
    fetchProducts();
  }, [navigate]);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at');
    setProducts(data || []);
  }

  function startEdit(product) {
    setEditing(product.id);
    setForm({
      name: product.name,
      price: product.price,
      stock: product.stock ?? 0,
      low_stock_threshold: product.low_stock_threshold ?? 10,
      weight: product.weight,
      category: product.category,
      image_url: product.image_url || '',
      description: product.description || '',
    });
  }

  async function saveEdit() {
    const { error } = await supabase
      .from('products')
      .update({
        price: Number(form.price),
        stock: Number(form.stock),
        low_stock_threshold: Number(form.low_stock_threshold),
        image_url: form.image_url,
        description: form.description,
      })
      .eq('id', editing);

    if (error) {
      toast.error('Failed to save: ' + error.message);
      return;
    }

    toast.success('Product updated');
    setEditing(null);
    fetchProducts();
  }

  async function toggleAvailability(product) {
    await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id);
    toast.success(product.is_available ? 'Product hidden' : 'Product shown');
    fetchProducts();
  }

  function getStockStatus(product) {
    const threshold = product.low_stock_threshold || 10;
    if (product.stock === 0) return 'out';
    if (product.stock <= threshold) return 'low';
    return 'ok';
  }

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <h2>🌿 Admin</h2>
        <nav>
          <Link to="/admin/dashboard">📊 Dashboard</Link>
          <Link to="/admin/orders">📦 Orders</Link>
          <Link to="/admin/products" className="active">🍌 Products</Link>
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
        <h1>Products</h1>
        <div className="admin-products-grid">
          {products.map((p) => {
            const stockStatus = getStockStatus(p);

            return (
              <div
                key={p.id}
                className={`admin-product-card ${stockStatus === 'out' ? 'is-out' : ''}`}
              >
                <div className="admin-product-image-wrap">
                  <img src={p.image_url} alt={p.name} />
                  {stockStatus === 'out' && (
                    <span className="stock-overlay out">Out of Stock</span>
                  )}
                  {stockStatus === 'low' && (
                    <span className="stock-overlay low">
                      Low Stock · {p.stock} left
                    </span>
                  )}
                </div>

                <h3>{p.name}</h3>
                <p className="product-weight">{p.weight}</p>

                {editing === p.id ? (
                  <div className="edit-form">
                    <label>Price (₹)</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />

                    <label>Stock</label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    />

                    <label>Low Stock Alert Threshold</label>
                    <input
                      type="number"
                      value={form.low_stock_threshold}
                      onChange={(e) =>
                        setForm({ ...form, low_stock_threshold: e.target.value })
                      }
                    />

                    <label>Image URL</label>
                    <input
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    />

                    <label>Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />

                    <div className="edit-actions">
                      <button className="save-btn" onClick={saveEdit}>
                        Save
                      </button>
                      <button className="cancel-btn" onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="product-price">₹{p.price}</p>
                    <p className={`stock stock-${stockStatus}`}>
                      Stock: {p.stock} {stockStatus === 'low' && '⚠️'}{' '}
                      {stockStatus === 'out' && '❌'}
                    </p>

                    <div className="product-actions">
                      <button onClick={() => startEdit(p)}>✏️ Edit</button>
                      <button
                        onClick={() => toggleAvailability(p)}
                        className={p.is_available ? 'hide-btn' : 'show-btn'}
                      >
                        {p.is_available ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}