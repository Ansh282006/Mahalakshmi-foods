import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import AdminSidebar from '../components/AdminSidebar';

// ── Form defaults ──
const EMPTY_FORM = {
  name: '',
  category: 'Banana Chips',
  pack_size_kg: 1,
  price: '',
  stock: '',
  moq_kg: 10,
  hsn_code: '2005',
  gst_percent: 5,
  low_stock_threshold: 10,
  image_url: '',
  description: '',
  is_seasonal: false,
  season_start: '',
  season_end: '',
  is_active_this_season: true,
  pairs_with: '',
  best_time: '',
  try_with: '',
  recipe_note: '',
};

const CATEGORIES = ['Banana Chips', 'Jackfruit Chips', 'Combo Packs', 'Other'];
const PACK_SIZES = [1, 2, 5, 10, 25];
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
  const [search, setSearch] = useState('');
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

  // ── Image upload ──
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
    if (error) {
      toast.error('Upload failed: ' + error.message, { id: toastId });
      return null;
    }
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

  // ── Edit existing ──
  function startEdit(product) {
    setEditing(product.id);
    setForm({
      name: product.name || '',
      category: product.category || 'Banana Chips',
      pack_size_kg: product.pack_size_kg || 1,
      price: product.price || '',
      stock: product.stock ?? 0,
      moq_kg: product.moq_kg || 10,
      hsn_code: product.hsn_code || '2005',
      gst_percent: product.gst_percent || 5,
      low_stock_threshold: product.low_stock_threshold ?? 10,
      image_url: product.image_url || '',
      description: product.description || '',
      is_seasonal: product.is_seasonal || false,
      season_start: product.season_start || '',
      season_end: product.season_end || '',
      is_active_this_season: product.is_active_this_season !== false,
      pairs_with: product.pairs_with || '',
      best_time: product.best_time || '',
      try_with: product.try_with || '',
      recipe_note: product.recipe_note || '',
    });
  }

  async function saveEdit() {
    // Validate
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.price || Number(form.price) <= 0) return toast.error('Valid price required');

    const { error } = await supabase
      .from('products')
      .update({
        name: form.name.trim(),
        category: form.category,
        pack_size_kg: Number(form.pack_size_kg),
        price: Number(form.price),
        stock: Number(form.stock),
        moq_kg: Number(form.moq_kg),
        hsn_code: form.hsn_code.trim(),
        gst_percent: Number(form.gst_percent),
        low_stock_threshold: Number(form.low_stock_threshold),
        image_url: form.image_url,
        description: form.description,
        is_seasonal: form.is_seasonal,
        season_start: form.season_start || null,
        season_end: form.season_end || null,
        is_active_this_season: form.is_active_this_season,
        pairs_with: form.pairs_with,
        best_time: form.best_time,
        try_with: form.try_with,
        recipe_note: form.recipe_note,
      })
      .eq('id', editing);

    if (error) return toast.error('Failed to save: ' + error.message);
    toast.success('Product updated');
    setEditing(null);
    fetchProducts();
  }

  async function toggleAvailability(product) {
    await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id);
    toast.success(product.is_available ? 'Hidden from catalog' : 'Visible in catalog');
    fetchProducts();
  }

  // ── Add new ──
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
    if (!addForm.stock || Number(addForm.stock) < 0) return toast.error('Enter valid stock');
    if (!addForm.image_url.trim()) return toast.error('Please upload or paste an image');

    setSaving(true);
    const { error } = await supabase.from('products').insert({
      name: addForm.name.trim(),
      category: addForm.category,
      pack_size_kg: Number(addForm.pack_size_kg),
      price: Number(addForm.price),
      stock: Number(addForm.stock),
      moq_kg: Number(addForm.moq_kg),
      hsn_code: addForm.hsn_code.trim(),
      gst_percent: Number(addForm.gst_percent),
      low_stock_threshold: Number(addForm.low_stock_threshold),
      image_url: addForm.image_url.trim(),
      description: addForm.description.trim(),
      is_available: true,
      is_wholesale: true,
      is_seasonal: addForm.is_seasonal,
      season_start: addForm.season_start || null,
      season_end: addForm.season_end || null,
      is_active_this_season: addForm.is_active_this_season,
      pairs_with: addForm.pairs_with,
      best_time: addForm.best_time,
      try_with: addForm.try_with,
      recipe_note: addForm.recipe_note,
    });
    setSaving(false);
    if (error) return toast.error('Failed to add: ' + error.message);
    toast.success(`${addForm.name} added`);
    setShowAddModal(false);
    setAddForm(EMPTY_FORM);
    fetchProducts();
  }

  // ── Helpers ──
  const getStockStatus = (p) => {
    const threshold = p.low_stock_threshold || 10;
    if (p.stock === 0) return 'out';
    if (p.stock <= threshold) return 'low';
    return 'ok';
  };

  const filteredProducts = search.trim()
    ? products.filter((p) => {
        const q = search.toLowerCase();
        return `${p.name} ${p.category} ${p.pack_size_kg}kg`.toLowerCase().includes(q);
      })
    : products;

  const lowStockCount = products.filter((p) => getStockStatus(p) !== 'ok').length;
  const seasonalCount = products.filter((p) => p.is_seasonal).length;
  const offSeasonCount = products.filter((p) => p.is_seasonal && p.is_active_this_season === false).length;

  const sidebarCounts = { lowstock: lowStockCount };

  return (
    <div className="prem-admin">
      <AdminSidebar counts={sidebarCounts} active="/admin/products" />

      <main className="prem-admin-main">
        <header className="prem-admin-topbar">
          <div>
            <span className="prem-kicker">CATALOG</span>
            <h1 className="prem-admin-page-title">
              Wholesale <em>Products.</em>
            </h1>
            <p className="prem-admin-page-sub">
              <strong>{products.length}</strong> products · <strong>{lowStockCount}</strong> need stock attention
              {seasonalCount > 0 && ` · ${seasonalCount} seasonal (${offSeasonCount} off-season)`}
            </p>
          </div>
          <div className="prem-admin-top-actions">
            <button className="prem-admin-action gold" onClick={openAddModal}>+ Add Product</button>
          </div>
        </header>

        {/* Search */}
        <div className="prem-admin-search-row">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="prem-admin-search"
          />
        </div>

        <div className="prem-admin-products-grid">
          {filteredProducts.map((p) => {
            const stockStatus = getStockStatus(p);
            const isOffSeason = p.is_seasonal && p.is_active_this_season === false;

            return (
              <article key={p.id} className={`prem-admin-product ${stockStatus === 'out' ? 'is-out' : ''}`}>
                <div className="prem-admin-product-media">
                  <img src={p.image_url} alt={p.name} />
                  {stockStatus === 'out' && <span className="prem-admin-product-badge out">Out of Stock</span>}
                  {stockStatus === 'low' && <span className="prem-admin-product-badge low">Low · {p.stock} left</span>}
                  {p.is_seasonal && (
                    <span className={`prem-admin-product-badge ${isOffSeason ? 'season-off' : 'season-on'}`}>
                      {isOffSeason ? 'Off Season' : 'In Season'}
                    </span>
                  )}
                </div>

                <div className="prem-admin-product-body">
                  <span className="prem-admin-product-cat">{p.category}</span>
                  <h3 className="prem-admin-product-name">{p.name}</h3>
                  <span className="prem-admin-product-weight">
                    {p.pack_size_kg || 1} kg pack · HSN {p.hsn_code || '2005'} · GST {p.gst_percent || 5}%
                  </span>

                  {editing === p.id ? (
                    <div className="prem-admin-edit-form">
                      {/* ── BASIC ── */}
                      <div className="prem-admin-edit-divider">Basic</div>
                      <label>Product Name</label>
                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

                      <label>Category</label>
                      <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>

                      <label>Description</label>
                      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

                      {/* ── PACK & PRICE ── */}
                      <div className="prem-admin-edit-divider">Pack &amp; Price</div>
                      <label>Pack Size (kg)</label>
                      <select value={form.pack_size_kg} onChange={(e) => setForm({ ...form, pack_size_kg: Number(e.target.value) })}>
                        {PACK_SIZES.map((s) => <option key={s} value={s}>{s} kg</option>)}
                      </select>

                      <label>Price per Pack (₹)</label>
                      <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />

                      <label>MOQ (Minimum Order in kg)</label>
                      <input type="number" value={form.moq_kg} onChange={(e) => setForm({ ...form, moq_kg: e.target.value })} />

                      {/* ── TAX ── */}
                      <div className="prem-admin-edit-divider">Tax</div>
                      <label>HSN Code</label>
                      <input value={form.hsn_code} onChange={(e) => setForm({ ...form, hsn_code: e.target.value })} />

                      <label>GST %</label>
                      <input type="number" value={form.gst_percent} onChange={(e) => setForm({ ...form, gst_percent: e.target.value })} />

                      {/* ── STOCK ── */}
                      <div className="prem-admin-edit-divider">Stock</div>
                      <label>Stock Quantity</label>
                      <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />

                      <label>Low Stock Alert Threshold</label>
                      <input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />

                      {/* ── SEASONALITY ── */}
                      <div className="prem-admin-edit-divider">Seasonality</div>
                      <label className="prem-admin-edit-checkbox">
                        <input
                          type="checkbox"
                          checked={form.is_seasonal}
                          onChange={(e) => setForm({ ...form, is_seasonal: e.target.checked })}
                        />
                        <span>This is a seasonal product (e.g. Jackfruit)</span>
                      </label>

                      {form.is_seasonal && (
                        <>
                          <label>Season Start (month)</label>
                          <input
                            value={form.season_start}
                            onChange={(e) => setForm({ ...form, season_start: e.target.value })}
                            placeholder="e.g. November"
                          />

                          <label>Season End (month)</label>
                          <input
                            value={form.season_end}
                            onChange={(e) => setForm({ ...form, season_end: e.target.value })}
                            placeholder="e.g. February"
                          />

                          <label className="prem-admin-edit-checkbox">
                            <input
                              type="checkbox"
                              checked={form.is_active_this_season}
                              onChange={(e) => setForm({ ...form, is_active_this_season: e.target.checked })}
                            />
                            <span>Currently available (uncheck to hide in off-season)</span>
                          </label>
                        </>
                      )}

                      {/* ── RECIPE PAIRINGS ── */}
                      <div className="prem-admin-edit-divider">Recipe Pairings</div>
                      <label>Pairs With</label>
                      <input value={form.pairs_with} onChange={(e) => setForm({ ...form, pairs_with: e.target.value })} placeholder="e.g. Masala Chai" />

                      <label>Best Enjoyed</label>
                      <input value={form.best_time} onChange={(e) => setForm({ ...form, best_time: e.target.value })} placeholder="e.g. Monsoon evenings" />

                      <label>Try It With</label>
                      <input value={form.try_with} onChange={(e) => setForm({ ...form, try_with: e.target.value })} placeholder="e.g. Coconut chutney" />

                      <label>Recipe Note</label>
                      <textarea value={form.recipe_note} onChange={(e) => setForm({ ...form, recipe_note: e.target.value })} />

                      {/* ── IMAGE ── */}
                      <div className="prem-admin-edit-divider">Image</div>
                      <label>Image URL</label>
                      <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />

                      <div className="prem-admin-edit-actions">
                        <button className="prem-admin-action primary" onClick={saveEdit}>Save Changes</button>
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

          {filteredProducts.length === 0 && products.length > 0 && (
            <div className="prem-admin-empty">
              <h3>No products match &quot;{search}&quot;</h3>
              <button className="prem-admin-action" onClick={() => setSearch('')}>Clear Search</button>
            </div>
          )}

          {products.length === 0 && (
            <div className="prem-admin-empty">
              <h3>No products yet</h3>
              <p>Click &quot;+ Add Product&quot; to create your first product.</p>
              <button className="prem-admin-action gold" onClick={openAddModal}>+ Add Your First Product</button>
            </div>
          )}
        </div>
      </main>

      {/* ────── ADD PRODUCT MODAL ────── */}
      {showAddModal && (
        <div className="prem-admin-modal-backdrop" onClick={closeAddModal}>
          <div className="prem-admin-modal" onClick={(e) => e.stopPropagation()}>
            <header className="prem-admin-modal-head">
              <div>
                <span className="prem-kicker">NEW PRODUCT</span>
                <h2 className="prem-admin-modal-title">Add Wholesale Product</h2>
              </div>
              <button className="prem-admin-modal-close" onClick={closeAddModal}>✕</button>
            </header>

            <form onSubmit={handleAddProduct} className="prem-admin-modal-body">
              {/* Basic */}
              <div className="prem-admin-edit-divider">Basic</div>
              <div className="prem-field-row">
                <div className="prem-field">
                  <label>Product Name</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="e.g. Kela Chips"
                    required
                  />
                </div>
                <div className="prem-field">
                  <label>Category</label>
                  <select value={addForm.category} onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Pack & Price */}
              <div className="prem-admin-edit-divider">Pack &amp; Price</div>
              <div className="prem-field-row">
                <div className="prem-field">
                  <label>Pack Size</label>
                  <select value={addForm.pack_size_kg} onChange={(e) => setAddForm({ ...addForm, pack_size_kg: Number(e.target.value) })}>
                    {PACK_SIZES.map((s) => <option key={s} value={s}>{s} kg</option>)}
                  </select>
                </div>
                <div className="prem-field">
                  <label>Price per Pack (₹)</label>
                  <input type="number" value={addForm.price} onChange={(e) => setAddForm({ ...addForm, price: e.target.value })} placeholder="120" required />
                </div>
              </div>
              <div className="prem-field-row">
                <div className="prem-field">
                  <label>MOQ (kg)</label>
                  <input type="number" value={addForm.moq_kg} onChange={(e) => setAddForm({ ...addForm, moq_kg: e.target.value })} />
                </div>
                <div className="prem-field">
                  <label>Stock Quantity</label>
                  <input type="number" value={addForm.stock} onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })} placeholder="50" required />
                </div>
              </div>
              <div className="prem-field">
                <label>Low Stock Alert At</label>
                <input type="number" value={addForm.low_stock_threshold} onChange={(e) => setAddForm({ ...addForm, low_stock_threshold: e.target.value })} />
              </div>

              {/* Tax */}
              <div className="prem-admin-edit-divider">Tax</div>
              <div className="prem-field-row">
                <div className="prem-field">
                  <label>HSN Code</label>
                  <input value={addForm.hsn_code} onChange={(e) => setAddForm({ ...addForm, hsn_code: e.target.value })} />
                </div>
                <div className="prem-field">
                  <label>GST %</label>
                  <input type="number" value={addForm.gst_percent} onChange={(e) => setAddForm({ ...addForm, gst_percent: e.target.value })} />
                </div>
              </div>

              {/* Seasonality */}
              <div className="prem-admin-edit-divider">Seasonality</div>
              <label className="prem-admin-edit-checkbox">
                <input
                  type="checkbox"
                  checked={addForm.is_seasonal}
                  onChange={(e) => setAddForm({ ...addForm, is_seasonal: e.target.checked })}
                />
                <span>Seasonal product (e.g. Jackfruit)</span>
              </label>

              {addForm.is_seasonal && (
                <div className="prem-field-row">
                  <div className="prem-field">
                    <label>Season Start</label>
                    <input
                      value={addForm.season_start}
                      onChange={(e) => setAddForm({ ...addForm, season_start: e.target.value })}
                      placeholder="e.g. November"
                    />
                  </div>
                  <div className="prem-field">
                    <label>Season End</label>
                    <input
                      value={addForm.season_end}
                      onChange={(e) => setAddForm({ ...addForm, season_end: e.target.value })}
                      placeholder="e.g. February"
                    />
                  </div>
                </div>
              )}

              {/* Image */}
              <div className="prem-admin-edit-divider">Product Image</div>
              <div className="prem-field">
                {addForm.image_url && (
                  <div className="prem-admin-image-preview">
                    <img src={addForm.image_url} alt="Preview" />
                    <button
                      type="button"
                      className="prem-admin-image-remove"
                      onClick={() => setAddForm({ ...addForm, image_url: '' })}
                    >
                      ✕ Remove
                    </button>
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
                        <p className="prem-admin-upload-title">Click to upload or drag &amp; drop</p>
                        <p className="prem-admin-upload-hint">JPG, PNG, or WEBP · Max 5 MB</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}

                <div className="prem-admin-url-fallback">
                  <span>Or paste an image URL:</span>
                  <input
                    type="url"
                    value={addForm.image_url}
                    onChange={(e) => setAddForm({ ...addForm, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Description */}
              <div className="prem-field">
                <label>Description</label>
                <textarea
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  placeholder="Crispy, golden banana chips fried in fresh coconut oil..."
                />
              </div>

              {/* Recipe Pairings */}
              <div className="prem-admin-edit-divider">Recipe Pairings (Optional)</div>
              <div className="prem-field-row">
                <div className="prem-field">
                  <label>Pairs With</label>
                  <input
                    value={addForm.pairs_with}
                    onChange={(e) => setAddForm({ ...addForm, pairs_with: e.target.value })}
                    placeholder="e.g. Masala Chai"
                  />
                </div>
                <div className="prem-field">
                  <label>Best Enjoyed</label>
                  <input
                    value={addForm.best_time}
                    onChange={(e) => setAddForm({ ...addForm, best_time: e.target.value })}
                    placeholder="e.g. Monsoon evenings"
                  />
                </div>
              </div>
              <div className="prem-field">
                <label>Try It With</label>
                <input
                  value={addForm.try_with}
                  onChange={(e) => setAddForm({ ...addForm, try_with: e.target.value })}
                  placeholder="e.g. Coconut chutney"
                />
              </div>

              <div className="prem-admin-modal-actions">
                <button
                  type="button"
                  className="prem-admin-action"
                  onClick={closeAddModal}
                  disabled={saving || uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="prem-admin-action gold"
                  disabled={saving || uploading}
                >
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