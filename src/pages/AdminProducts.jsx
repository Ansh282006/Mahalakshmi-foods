import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

const EMPTY_FORM = {
  name: '',
  price: '',
  stock: '',
  low_stock_threshold: 10,
  weight: '250g',
  category: 'Banana Chips',
  image_url: '',
  description: '',
};

const CATEGORIES = ['Banana Chips', 'Jackfruit Chips', 'Combo Packs'];
const WEIGHTS = ['100g', '250g', '500g', '1kg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
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

  // ---------- IMAGE UPLOAD ----------
  async function uploadImage(file) {
    // Validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WEBP image');
      return null;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be under 5 MB');
      return null;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading image...');

    // Create a unique file name
    const ext = file.name.split('.').pop();
    const uniqueName = `product-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(uniqueName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    setUploading(false);

    if (error) {
      toast.error('Upload failed: ' + error.message, { id: toastId });
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    toast.success('Image uploaded!', { id: toastId });
    return urlData.publicUrl;
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) handleFileForAdd(file);
  }

  async function handleFileForAdd(file) {
    const url = await uploadImage(file);
    if (url) {
      setAddForm((prev) => ({ ...prev, image_url: url }));
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileForAdd(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setDragOver(false);
  }

  // ---------- EDIT EXISTING ----------
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

  // ---------- ADD NEW PRODUCT ----------
  function openAddModal() {
    setAddForm(EMPTY_FORM);
    setShowAddModal(true);
  }

  function closeAddModal() {
    if (saving || uploading) return;
    setShowAddModal(false);
    setAddForm(EMPTY_FORM);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    if (!addForm.name.trim()) return toast.error('Product name is required');
    if (!addForm.price || Number(addForm.price) <= 0) return toast.error('Enter a valid price');
    if (!addForm.stock || Number(addForm.stock) < 0) return toast.error('Enter a valid stock');
    if (!addForm.image_url.trim()) return toast.error('Please upload or paste an image');

    setSaving(true);

    const { error } = await supabase.from('products').insert({
      name: addForm.name.trim(),
      category: addForm.category,
      weight: addForm.weight,
      price: Number(addForm.price),
      stock: Number(addForm.stock),
      low_stock_threshold: Number(addForm.low_stock_threshold),
      image_url: addForm.image_url.trim(),
      description: addForm.description.trim(),
      is_available: true,
    });

    setSaving(false);

    if (error) {
      toast.error('Failed to add product: ' + error.message);
      return;
    }

    toast.success(`${addForm.name} added successfully! 🎉`);
    setShowAddModal(false);
    setAddForm(EMPTY_FORM);
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
        <div className="admin-main-header">
          <div>
            <h1>Products</h1>
            <p className="admin-subtext">
              {products.length} {products.length === 1 ? 'product' : 'products'} in your catalog
            </p>
          </div>
          <button className="add-product-btn" onClick={openAddModal}>
            <span className="plus-icon">+</span> Add Product
          </button>
        </div>

        <div className="admin-products-grid">
          {products.map((p) => {
            const stockStatus = getStockStatus(p);
            return (
              <div key={p.id} className={`admin-product-card ${stockStatus === 'out' ? 'is-out' : ''}`}>
                <div className="admin-product-image-wrap">
                  <img src={p.image_url} alt={p.name} />
                  {stockStatus === 'out' && <span className="stock-overlay out">Out of Stock</span>}
                  {stockStatus === 'low' && (
                    <span className="stock-overlay low">Low Stock · {p.stock} left</span>
                  )}
                </div>

                <h3>{p.name}</h3>
                <p className="product-weight">{p.weight} · {p.category}</p>

                {editing === p.id ? (
                  <div className="edit-form">
                    <label>Price (₹)</label>
                    <input type="number" value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })} />
                    <label>Stock</label>
                    <input type="number" value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                    <label>Low Stock Alert Threshold</label>
                    <input type="number" value={form.low_stock_threshold}
                      onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
                    <label>Image URL</label>
                    <input value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                    <label>Description</label>
                    <textarea value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    <div className="edit-actions">
                      <button className="save-btn" onClick={saveEdit}>Save</button>
                      <button className="cancel-btn" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="product-price">₹{p.price}</p>
                    <p className={`stock stock-${stockStatus}`}>
                      Stock: {p.stock} {stockStatus === 'low' && '⚠️'} {stockStatus === 'out' && '❌'}
                    </p>
                    <div className="product-actions">
                      <button onClick={() => startEdit(p)}>✏️ Edit</button>
                      <button onClick={() => toggleAvailability(p)}
                        className={p.is_available ? 'hide-btn' : 'show-btn'}>
                        {p.is_available ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {products.length === 0 && (
            <div className="empty-products">
              <div className="empty-icon">📦</div>
              <h3>No products yet</h3>
              <p>Click "+ Add Product" to create your first product.</p>
              <button className="add-product-btn" onClick={openAddModal}>
                <span className="plus-icon">+</span> Add Your First Product
              </button>
            </div>
          )}
        </div>
      </main>

      {showAddModal && (
        <div className="modal-backdrop" onClick={closeAddModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Add New Product</h2>
                <p className="modal-subtitle">Fill in the details and upload a product photo.</p>
              </div>
              <button className="modal-close" onClick={closeAddModal}>✕</button>
            </div>

            <form onSubmit={handleAddProduct} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input type="text" value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="e.g. Kela Chips" required />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Weight *</label>
                  <select value={addForm.weight}
                    onChange={(e) => setAddForm({ ...addForm, weight: e.target.value })}>
                    {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" value={addForm.price}
                    onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                    placeholder="80" min="0" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input type="number" value={addForm.stock}
                    onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })}
                    placeholder="50" min="0" required />
                </div>
                <div className="form-group">
                  <label>Low Stock Alert At</label>
                  <input type="number" value={addForm.low_stock_threshold}
                    onChange={(e) => setAddForm({ ...addForm, low_stock_threshold: e.target.value })}
                    placeholder="10" min="0" />
                </div>
              </div>

              {/* ----- IMAGE UPLOAD ----- */}
              <div className="form-group">
                <label>Product Image *</label>

                {/* Preview */}
                {addForm.image_url && (
                  <div className="image-preview-lg">
                    <img src={addForm.image_url} alt="Preview" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => setAddForm({ ...addForm, image_url: '' })}
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}

                {/* Upload area */}
                {!addForm.image_url && (
                  <div
                    className={`image-upload-zone ${dragOver ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <div className="upload-progress">
                        <div className="upload-spinner"></div>
                        <p>Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <div className="upload-icon">📷</div>
                        <p className="upload-title">
                          Click to upload <span className="upload-divider">or</span> drag & drop
                        </p>
                        <p className="upload-hint">
                          JPG, PNG, or WEBP · Max 5 MB
                        </p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="hidden-file-input"
                    />
                  </div>
                )}

                {/* Fallback: URL paste */}
                <div className="url-fallback">
                  <span>Or paste an image URL:</span>
                  <input
                    type="url"
                    value={addForm.image_url}
                    onChange={(e) => setAddForm({ ...addForm, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  placeholder="Crispy, golden banana chips..." rows="3" />
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={closeAddModal}
                  disabled={saving || uploading}>
                  Cancel
                </button>
                <button type="submit" className="modal-save-btn"
                  disabled={saving || uploading}>
                  {saving ? 'Adding...' : uploading ? 'Uploading...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}