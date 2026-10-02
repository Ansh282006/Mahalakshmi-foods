import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [retailer, setRetailer] = useState(null);
  const { cart, addToCart, updateQuantity } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchAll();
  }, [user]);

  async function fetchAll() {
    console.log('Fetching products...');

    const { data: prods, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('category');

    if (error) {
      console.error('Products fetch error:', error);
    }
    console.log('Products loaded:', prods?.length || 0);
    setProducts(prods || []);

    if (user) {
      const { data: ret } = await supabase
        .from('retailers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      console.log('Retailer:', ret);
      setRetailer(ret);
    }

    setTimeout(() => setLoading(false), 500);
  }

  const filtered = useMemo(() => {
    let result = filter === 'All' ? products : products.filter((p) => p.category === filter);
    result = result.filter((p) => !p.is_seasonal || p.is_active_this_season !== false);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) => {
        const text = `${p.name} ${p.category} ${p.pack_size_kg}kg`.toLowerCase();
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
        </div>
      </section>

      {!user && (
        <div className="prem-b2b-banner info" style={{ maxWidth: '1200px', margin: '24px auto 0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', background: '#E3F2FD', borderLeft: '4px solid #1565C0' }}>
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0D47A1' }}>New here?</strong>
            <span style={{ fontSize: '0.85rem', color: '#1565C0' }}>Sign up as a retailer to place wholesale orders.</span>
          </div>
          <a href="/signup" className="prem-btn-primary">Register as Retailer</a>
        </div>
      )}

      {user && !retailer && (
        <div className="prem-b2b-banner warn" style={{ maxWidth: '1200px', margin: '24px auto 0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', background: '#FFF8E1', borderLeft: '4px solid #A67C00' }}>
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem', color: '#665500' }}>Complete your retailer profile</strong>
            <span style={{ fontSize: '0.85rem', color: '#8B6F00' }}>We need your shop details before you can order.</span>
          </div>
          <a href="/retailer-setup" className="prem-btn-primary">Complete Profile</a>
        </div>
      )}

      {user && retailer?.status === 'Pending' && (
        <div className="prem-b2b-banner warn" style={{ maxWidth: '1200px', margin: '24px auto 0', padding: '16px 20px', background: '#FFF8E1', borderLeft: '4px solid #A67C00' }}>
          <strong style={{ display: 'block', fontSize: '0.95rem', color: '#665500' }}>Profile under review</strong>
          <span style={{ fontSize: '0.85rem', color: '#8B6F00' }}>We will approve your account within 24 hours.</span>
        </div>
      )}

      <div className="prem-toolbar" style={{ maxWidth: '1200px', margin: '24px auto 0', padding: '0 20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          style={{ flex: 1, minWidth: '260px', padding: '14px 18px', border: '1px solid #0F0F0F', background: '#FEFDFB', fontSize: '0.92rem' }}
        />
        <div style={{ display: 'flex', border: '1px solid #0F0F0F' }}>
          {['All', 'Banana Chips', 'Jackfruit Chips'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '14px 20px',
                border: 'none',
                borderRight: cat === 'Jackfruit Chips' ? 'none' : '1px solid #0F0F0F',
                background: filter === cat ? '#0F0F0F' : '#FEFDFB',
                color: filter === cat ? '#FEFDFB' : '#0F0F0F',
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="prem-grid" style={{ maxWidth: '1200px', margin: '24px auto 0', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 20px' }}>
            Loading catalog...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 20px' }}>
            <h3>No products found</h3>
            <p style={{ color: '#6B6B6B' }}>Try a different search or filter.</p>
          </div>
        ) : (
          filtered.map((product) => {
            const cartQty = getCartQty(product.id);
            const isOffSeason = product.is_seasonal && product.is_active_this_season === false;

            return (
              <article key={product.id} className="prem-card" style={{ background: '#FEFDFB', border: '1px solid #EBE3D5', display: 'flex', flexDirection: 'column' }}>
                <div style={{ aspectRatio: '4/5', overflow: 'hidden', background: '#F5EFE6', position: 'relative' }}>
                  <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {product.is_seasonal && (
                    <span style={{ position: 'absolute', top: '12px', left: '12px', padding: '5px 10px', background: isOffSeason ? '#6B6B6B' : '#14513E', color: 'white', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                      {isOffSeason ? 'Off Season' : 'In Season'}
                    </span>
                  )}
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '2px', color: '#A67C00', textTransform: 'uppercase' }}>
                    {product.category}
                  </span>
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 500, color: '#0F0F0F', margin: 0 }}>
                    {product.name}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px 0', margin: '8px 0', borderTop: '1px solid #EBE3D5', borderBottom: '1px solid #EBE3D5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#6B6B6B' }}>Pack Size</span>
                      <strong style={{ color: '#0F3D2E' }}>{product.pack_size_kg || 1} kg</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#6B6B6B' }}>Wholesale Rate</span>
                      <strong style={{ color: '#0F3D2E' }}>₹{product.price} / pack</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#6B6B6B' }}>GST</span>
                      <strong style={{ color: '#0F3D2E' }}>{product.gst_percent || 5}%</strong>
                    </div>
                  </div>

                  {isOffSeason ? (
                    <button disabled style={{ padding: '12px', background: '#B0B0B0', color: 'white', border: 'none', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.72rem', cursor: 'not-allowed', marginTop: 'auto' }}>
                      Available in Season
                    </button>
                  ) : !isApprovedRetailer ? (
                    <button disabled style={{ padding: '12px', background: '#B0B0B0', color: 'white', border: 'none', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.72rem', cursor: 'not-allowed', marginTop: 'auto' }}>
                      {!user ? 'Login to Order' : retailer?.status === 'Pending' ? 'Awaiting Approval' : 'Retailer Only'}
                    </button>
                  ) : cartQty === 0 ? (
                    <button
                      onClick={() => handleAdd(product)}
                      style={{ padding: '12px', background: '#0F0F0F', color: '#FEFDFB', border: 'none', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.72rem', cursor: 'pointer', marginTop: 'auto' }}
                    >
                      Add to Order
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #0F0F0F', height: '44px', marginTop: 'auto' }}>
                      <button onClick={() => updateQuantity(product.id, cartQty - 1)} style={{ width: '44px', height: '100%', background: 'transparent', border: 'none', fontSize: '1.15rem', cursor: 'pointer' }}>−</button>
                      <span style={{ flex: 1, textAlign: 'center', fontWeight: 700 }}>{cartQty}</span>
                      <button onClick={() => updateQuantity(product.id, cartQty + 1)} style={{ width: '44px', height: '100%', background: 'transparent', border: 'none', fontSize: '1.15rem', cursor: 'pointer' }}>+</button>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#061A11', color: '#FEFDFB', borderTop: '1px solid #C9A227', padding: '16px 20px', zIndex: 900 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '2px', color: '#C9A227', textTransform: 'uppercase' }}>Order Sheet</span>
              <strong style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem' }}>
                {cart.length} items · {totalKg} kg · ₹{cart.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(0)}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {totalKg < 10 && (
                <span style={{ fontSize: '0.82rem', color: '#D9B24D', fontWeight: 600 }}>
                  Add {10 - totalKg} kg more to reach MOQ
                </span>
              )}
              <a
                href="/cart"
                style={{
                  padding: '14px 24px',
                  background: totalKg >= 10 ? '#C9A227' : '#6B6B6B',
                  color: totalKg >= 10 ? '#061A11' : '#FEFDFB',
                  textDecoration: 'none',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  fontSize: '0.72rem',
                  pointerEvents: totalKg >= 10 ? 'auto' : 'none',
                }}
              >
                {totalKg >= 10 ? 'Review Order →' : 'Add More'}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}