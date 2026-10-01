import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import AdminSidebar from '../components/AdminSidebar';

const EMPTY_FORM = {
  name: '', price: '', stock: '', low_stock_threshold: 10,
  weight: '250g', category: 'Banana Chips', image_url: '', description: '',
};

const CATEGORIES = ['Banana Chips', 'Jackfruit Chips', 'Combo Packs'];
const WEIGHTS = ['100g', '250g', '500g', '1kg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
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

  async function uploadImage(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Please upload JPG, PNG, or WEBP');
      return null;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be under 5 MB');
      return null;
    }
    setUploading(true);
    const toastId = toast.loading('Uploading image...');
    const ext = file.name.split('.').pop();
    const uniqueName = `product-${Date.now()}-${Math.random().toString(36).substr(2, 8)}.${ext}`;
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(uniqueName, file, { cacheControl: '3600', upsert: false });
    setUploading(false);
    if (error) { toast.error('Upload failed: ' + error.message, { id: toastId }); return null; }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
    toast.success('Image uploaded', { id: toastId });
    return urlData.publicUrl;
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) handleFileForAdd(file);
  }

  async function handleFileForAdd(file) {
    const url = await uploadImage(file);
    if (url) setAddForm((prev) => ({ ...prev, image_url: url }));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileForAdd(file);
  }

  function startEdit(product) {
    setEditing(product.id);
    setForm({
      name: product.name, price: product.price, stock: product.stock ?? 0,
      low_stock_threshold: product.low_stock_threshold ?? 10,
      weight: product.weight, category: product.category,
      image_url: product.image_url || '', description: product.description || '',
    });
  }

  async function saveEdit() {
    const { error } = await supabase.from('products').update({
      price: Number(form.price),
      stock: Number(form.stock),
      low_stock_threshold: Number(form.low_stock_threshold),
      image_url: form.image_url,
      description: form.description,
    }).eq('id', editing);
    if (error) return toast.error('Failed to save: ' + error.message);
    toast.success('Product updated');
    setEditing(null);
    fetchProducts();
  }

  async function toggleAvailability(product) {
    await supabase.from('products').update({ is_available: !product.is_available }).eq('id', product.id);
    toast.success(product.is_available ? 'Product hidden' : 'Product visible');
    fetchProducts();
  }

  function openAddModal() { setAddForm(EMPTY_FORM); setShowAddModal(true); }
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
    if (!addForm.stock || Number(addForm.stock) < 0) return toast.error('Enter valid stock');
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
    if (error) return toast.error('Failed to add: ' + error.message);
    toast.success(`${addForm.name} added`);
    setShowAddModal(false);
    setAddForm(EMPTY_FORM);
    fetchProducts();
  }

  const getStockStatus = (p) => {
    const threshold = p.low_stock_threshold || 10;
    if (p.stock === 0) return 'out';
    if (p.stock <= threshold) return 'low';
    return 'ok';
  };

  const lowStockCount = products.filter((p) => getStockStatus(p) !== 'ok').length;
  const sidebarCounts = { lowstock: lowStockCount };

  return (
    <div className="prem-admin">
      <AdminSidebar counts={sidebarCounts} active="/admin/products" />

      <main className="prem-admin-main">
        <header className="prem-admin-topbar">
          <div>
            <span className="prem-kicker">CATALOG</span>
            <h1 className="prem-admin-page-title">
              Product <em>Management.</em>
            </h1>
            <p className="prem-admin-page-sub">
              <strong>{products.length}</strong> products in catalog · <strong>{lowStockCount}</strong> need stock attention
            </p>
          </div>
          <div className="prem-admin-top-actions">
            <button className="prem-admin-action gold" onClick={openAddModal}>+ Add Product</button>
          </div>
        </header>

        <div className="prem-admin-products-grid">
          {products.map((p) => {
            const stockStatus = getStockStatus(p);
            return (
              <article key={p.id} className={`prem-admin-product ${stockStatus === 'out' ? 'is-out' : ''}`}>
                <div className="prem-admin-product-media">
                  <img src={p.image_url} alt={p.name} />
                  {stockStatus === 'out' && <span className="prem-admin-product-badge out">Out of Stock</span>}
                  {stockStatus === 'low' && <span className="prem-admin-product-badge low">Low · {p.stock} left</span>}
                </div>

                <div className="prem-admin-product-body">
                  <span className="prem-admin-product-cat">{p.category}</span>
                  <h3 className="prem-admin-product-name">{p.name}</h3>
                  <span className="prem-admin-product-weight">{p.weight}</span>

                  {editing === p.id ? (
                    <div className="prem-admin-edit-form">
                      <label>Price (₹)</label>
                      <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                      <label>Stock</label>
                      <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                      <label>Low Stock Alert At</label>
                      <input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
                      <label>Image URL</label>
                      <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                      <label>Description</label>
                      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                      <div className="prem-admin-edit-actions">
                        <button className="prem-admin-action primary" onClick={saveEdit}>Save</button>
                        <button className="prem-admin-action" onClick={() => setEditing(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="prem-admin-product-foot">
                        <span className="prem-admin-product-price">₹{p.price}</span>
                        <span className={`prem-admin-product-stock stock-${stockStatus}`}>
                          {p.stock === 0 ? 'Sold out' : `${p.stock} in stock`}
                        </span>
                      </div>
                      <div className="prem-admin-product-actions">
                        <button className="prem-admin-action" onClick={() => startEdit(p)}>Edit</button>
                        <button className="prem-admin-action" onClick={() => toggleAvailability(p)}>
                          {p.is_available ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </article>
            );
          })}

          {products.length === 0 && (
            <div className="prem-admin-empty">
              <h3>No products yet</h3>
              <p>Click "+ Add Product" to create your first product.</p>
              <button className="prem-admin-action gold" onClick={openAddModal}>+ Add Your First Product</button>
            </div>
          )}
        </div>
      </main>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="prem-admin-modal-backdrop" onClick={closeAddModal}>
          <div className="prem-admin-modal" onClick={(e) => e.stopPropagation()}>
            <header className="prem-admin-modal-head">
              <div>
                <span className="prem-kicker">NEW PRODUCT</span>
                <h2 className="prem-admin-modal-title">Add Product</h2>
              </div>
              <button className="prem-admin-modal-close" onClick={closeAddModal}>✕</button>
            </header>

            <form onSubmit={handleAddProduct} className="prem-admin-modal-body">
              <div className="prem-field-row">
                <div className="prem-field">
                  <label>Product Name</label>
                  <input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="e.g. Kela Chips" required />
                </div>
                <div className="prem-field">
                  <label>Category</label>
                  <select value={addForm.category} onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="prem-field-row">
                <div className="prem-field">
                  <label>Weight</label>
                  <select value={addForm.weight} onChange={(e) => setAddForm({ ...addForm, weight: e.target.value })}>
                    {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="prem-field">
                  <label>Price (₹)</label>
                  <input type="number" value={addForm.price} onChange={(e) => setAddForm({ ...addForm, price: e.target.value })} placeholder="80" min="0" required />
                </div>
              </div>

              <div className="prem-field-row">
                <div className="prem-field">
                  <label>Stock Quantity</label>
                  <input type="number" value={addForm.stock} onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })} placeholder="50" min="0" required />
                </div>
                <div className="prem-field">
                  <label>Low Stock Alert At</label>
                  <input type="number" value={addForm.low_stock_threshold} onChange={(e) => setAddForm({ ...addForm, low_stock_threshold: e.target.value })} placeholder="10" min="0" />
                </div>
              </div>

              <div className="prem-field">
                <label>Product Image</label>

                {addForm.image_url && (
                  <div className="prem-admin-image-preview">
                    <img src={addForm.image_url} alt="Preview" />
                    <button type="button" className="prem-admin-image-remove" onClick={() => setAddForm({ ...addForm, image_url: '' })}>✕ Remove</button>
                  </div>
                )}

                {!addForm.image_url && (
                  <div
                    className={`prem-admin-upload ${dragOver ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <p>Uploading...</p>
                    ) : (
                      <>
                        <p className="prem-admin-upload-title">Click to upload or drag & drop</p>
                        <p className="prem-admin-upload-hint">JPG, PNG, or WEBP · Max 5 MB</p>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} style={{ display: 'none' }} />
                  </div>
                )}

                <div className="prem-admin-url-fallback">
                  <span>Or paste an image URL:</span>
                  <input type="url" value={addForm.image_url} onChange={(e) => setAddForm({ ...addForm, image_url: e.target.value })} placeholder="https://..." />
                </div>
              </div>

              <div className="prem-field">
                <label>Description</label>
                <textarea value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} placeholder="Crispy, golden banana chips..." />
              </div>

              <div className="prem-admin-modal-actions">
                <button type="button" className="prem-admin-action" onClick={closeAddModal} disabled={saving || uploading}>Cancel</button>
                <button type="submit" className="prem-admin-action gold" disabled={saving || uploading}>
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