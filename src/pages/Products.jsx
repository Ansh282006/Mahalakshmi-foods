import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import useSEO from '../hooks/useSEO';
import { useAuth } from '../context/AuthContext';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [retailer, setRetailer] = useState(null);
  const { cart, addToCart, updateQuantity, removeFromCart, getTotalKg } = useCart();
  const { user } = useAuth();

  useSEO({
    title: 'Wholesale Catalog — Mahalaxmi Chips',
    description: 'Wholesale banana and jackfruit chips for retailers and distributors. 1kg and 5kg packs. MOQ 10kg.',
  });

  useEffect(() => {
    fetchAll();
  }, [user]);

  async function fetchAll() {
    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('category');
    setProducts(prods || []);

    if (user) {
      const { data: ret } = await supabase
        .from('retailers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setRetailer(ret);
    }

    setTimeout(() => setLoading(false), 600);
  }

  const filtered = useMemo(() => {
    let result = filter === 'All' ? products : products.filter((p) => p.category === filter);
    // Hide seasonal products that are off-season
    result = result.filter((p) => !p.is_seasonal || p.is_active_this_season !== false);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) => {
        const text = `${p.name} ${p.category} ${p.pack_size_kg}kg ${p.description || ''}`.toLowerCase();
        return text.includes(q);
      });
    }
    return result;
  }, [products, filter, search]);

  const getCartQty = (productId) => {
    const item = cart.find((c) => c.id === productId);
    return item ? item.quantity : 0;
  };

  const handleAdd = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      weight: `${product.pack_size_kg || 1}kg`,
      pack_size_kg: product.pack_size_kg || 1,
      image_url: product.image_url,
      category: product.category,
      gst_percent: product.gst_percent || 5,
      hsn_code: product.hsn_code || '2005',
    });
  };

  const isApprovedRetailer = retailer?.status === 'Approved';
  const totalKg = cart.reduce((sum, item) => sum + (item.pack_size_kg || 1) * item.quantity, 0);
  const moqReached = totalKg >= 10;

  return (
    <div className="prem-page">
      <section className="prem-hero">
        <div className="prem-hero-inner">
          <span className="prem-kicker">WHOLESALE CATALOG</span>
          <h1 className="prem-hero-title">
            Bulk packs for <em>retailers.</em>
          </h1>
          <p className="prem-hero-sub">
            1kg and 5kg packs. Fresh-fried, FSSAI certified, dispatched by
            transport to your district. Minimum order 10kg.
          </p>

          <div className="prem-hero-stats">
            <div className="prem-hero-stat">
              <span className="prem-hero-stat-num">1kg</span>
              <span className="prem-hero-stat-label">Smallest Pack</span>
            </div>
            <div className="prem-hero-stat">
              <span className="prem-hero-stat-num">10kg</span>
              <span className="prem-hero-stat-label">Minimum Order</span>
            </div>
            <div className="prem-hero-stat">
              <span className="prem-hero-stat-num">FSSAI</span>
              <span className="prem-hero-stat-label">Certified Kitchen</span>
            </div>
          </div>
        </div>
      </section>

      {/* Retailer Status Banner */}
      {!user && (
        <div className="prem-b2b-banner info">
          <div>
            <strong>New here?</strong>
            <span>Sign up as a retailer to place wholesale orders. Approval is quick.</span>
          </div>
          <a href="/signup" className="prem-admin-action gold">Register as Retailer</a>
        </div>
      )}

      {user && !retailer && (
        <div className="prem-b2b-banner warn">
          <div>
            <strong>Complete your retailer profile</strong>
            <span>We need your shop name, GSTIN, and district before you can order.</span>
          </div>
          <a href="/retailer-setup" className="prem-admin-action gold">Complete Profile</a>
        </div>
      )}

      {user && retailer?.status === 'Pending' && (
        <div className="prem-b2b-banner warn">
          <div>
            <strong>Profile under review</strong>
            <span>We are reviewing your application. You will be able to order once approved (usually within 24 hours).</span>
          </div>
        </div>
      )}

      {user && retailer?.status === 'Rejected' && (
        <div className="prem-b2b-banner danger">
          <div>
            <strong>Application not approved</strong>
            <span>Please contact us at 7774982725 for more information.</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="prem-toolbar">
        <div className="prem-search">
          <span className="prem-search-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="prem-search-input"
          />
        </div>
        <div className="prem-filters">
          {['All', 'Banana Chips', 'Jackfruit Chips'].map((cat) => (
            <button
              key={cat}
              className={`prem-filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="prem-grid">
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 20px', color: 'var(--charcoal-500)' }}>
            Loading catalog...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="prem-empty">
              <h3 className="prem-empty-title">No products found</h3>
              <p className="prem-empty-text">Try a different search or filter.</p>
            </div>
          </div>
        ) : (
          filtered.map((product) => {
            const cartQty = getCartQty(product.id);
            const isSeasonal = product.is_seasonal;
            const isOffSeason = isSeasonal && product.is_active_this_season === false;

            return (
              <article key={product.id} className="prem-card">
                <div className="prem-card-media">
                  <img src={product.image_url} alt={product.name} />
                  {isSeasonal && (
                    <span className={`prem-card-badge ${isOffSeason ? '' : 'low'}`}>
                      {isOffSeason ? 'Off Season' : 'In Season'}
                    </span>
                  )}
                </div>

                <div className="prem-card-body">
                  <span className="prem-card-cat">{product.category}</span>
                  <h3 className="prem-card-title">{product.name}</h3>

                  <div className="prem-b2b-meta">
                    <div className="prem-b2b-meta-row">
                      <span>Pack Size</span>
                      <strong>{product.pack_size_kg || 1} kg</strong>
                    </div>
                    <div className="prem-b2b-meta-row">
                      <span>Wholesale Rate</span>
                      <strong>₹{product.price} / pack</strong>
                    </div>
                    <div className="prem-b2b-meta-row">
                      <span>Per kg</span>
                      <strong>₹{(product.price / (product.pack_size_kg || 1)).toFixed(0)}</strong>
                    </div>
                    <div className="prem-b2b-meta-row">
                      <span>GST</span>
                      <strong>{product.gst_percent || 5}%</strong>
                    </div>
                  </div>

                  {isOffSeason ? (
                    <button className="prem-card-add disabled" disabled>Available in Season</button>
                  ) : !isApprovedRetailer ? (
                    <button className="prem-card-add disabled" disabled>
                      {!user ? 'Login to Order' : retailer?.status === 'Pending' ? 'Awaiting Approval' : 'Retailer Only'}
                    </button>
                  ) : cartQty === 0 ? (
                    <button className="prem-card-add" onClick={() => handleAdd(product)}>
                      Add to Order
                    </button>
                  ) : (
                    <div className="prem-b2b-qty">
                      <button className="prem-qty-btn" onClick={() => updateQuantity(product.id, cartQty - 1)}>−</button>
                      <span className="prem-qty-num">{cartQty}</span>
                      <button className="prem-qty-btn" onClick={() => updateQuantity(product.id, cartQty + 1)}>+</button>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Sticky order bar */}
      {cart.length > 0 && (
        <div className="prem-b2b-sticky">
          <div className="prem-b2b-sticky-inner">
            <div className="prem-b2b-sticky-left">
              <span className="prem-b2b-sticky-label">Order Sheet</span>
              <strong className="prem-b2b-sticky-value">
                {cart.length} {cart.length === 1 ? 'item' : 'items'} · {totalKg} kg · ₹{getTotal().toFixed(2)}
              </strong>
            </div>
            <div className="prem-b2b-sticky-right">
              {!moqReached && (
                <span className="prem-b2b-moq-warn">
                  Add {10 - totalKg} kg more to reach 10kg MOQ
                </span>
              )}
              <a
                href="/cart"
                className={`prem-btn-primary ${!moqReached ? 'disabled' : ''}`}
                style={!moqReached ? { opacity: 0.5, pointerEvents: 'none' } : {}}
              >
                Review Order →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}