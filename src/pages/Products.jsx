import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import useFlyToCart from '../hooks/useFlyToCart';
import useSEO from '../hooks/useSEO';
import useRecentlyViewed from '../hooks/useRecentlyViewed';
import { productSchema } from '../utils/seo';
import SkeletonCard from '../components/SkeletonCard';
import StarRating from '../components/StarRating';
import ReviewsModal from '../components/ReviewsModal';
import WishlistButton from '../components/WishlistButton';
import ShareButton from '../components/ShareButton';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [ratings, setRatings] = useState({});
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewProduct, setReviewProduct] = useState(null);
  const { addToCart } = useCart();
  const flyToCart = useFlyToCart();
  const { addRecentlyViewed } = useRecentlyViewed();

  useSEO({
    title: 'All Products — Mahalaxmi Chips',
    description:
      'Browse our authentic banana chips and jackfruit chips. Multiple sizes available. Free delivery in Kolhapur.',
  });

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      let script = document.getElementById('structured-data');
      if (!script) {
        script = document.createElement('script');
        script.id = 'structured-data';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(productSchema(products));
    }
  }, [products]);

  async function fetchAll() {
    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true);
    setProducts(prods || []);

    const { data: revs } = await supabase
      .from('reviews')
      .select('product_id, rating');
    if (revs) {
      const agg = {};
      revs.forEach((r) => {
        if (!agg[r.product_id]) agg[r.product_id] = { sum: 0, count: 0 };
        agg[r.product_id].sum += r.rating;
        agg[r.product_id].count += 1;
      });
      const out = {};
      Object.keys(agg).forEach((id) => {
        out[id] = { avg: agg[id].sum / agg[id].count, count: agg[id].count };
      });
      setRatings(out);
    }
    setTimeout(() => setLoading(false), 700);
  }

  const filtered = useMemo(() => {
    let result =
      filter === 'All' ? products : products.filter((p) => p.category === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) => {
        const text = `${p.name} ${p.category} ${p.weight} ${p.description || ''}`.toLowerCase();
        return text.includes(q);
      });
    }
    return result;
  }, [products, filter, search]);

  const handleAddToCart = (e, product) => {
    if (product.stock === 0) return;
    const card = e.currentTarget.closest('.prem-card');
    flyToCart(card);
    addToCart(product);
    addRecentlyViewed(product);
  };

  const handleViewProduct = (product) => {
    addRecentlyViewed(product);
    setReviewProduct(product);
  };

  return (
    <div className="prem-page">
      {/* PAGE HERO */}
      <section className="prem-hero">
        <div className="prem-hero-inner">
          <span className="prem-kicker">PRODUCT CATALOG</span>
          <h1 className="prem-hero-title">
            The Complete <em>Collection.</em>
          </h1>
          <p className="prem-hero-sub">
            Every batch is fried fresh the day it ships. Choose your size,
            choose your flavour, we handle the rest.
          </p>
        </div>
      </section>

      {/* TOOLBAR: SEARCH + FILTERS */}
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
            placeholder="Search chips, categories, weights..."
            className="prem-search-input"
          />
          {search && (
            <button
              className="prem-search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
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

      {/* PRODUCT GRID */}
      <div className="prem-grid">
        {loading ? (
          [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="prem-empty">
              <div className="prem-empty-icon">
                <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3 className="prem-empty-title">No products found</h3>
              <p className="prem-empty-text">
                Try a different search term or clear your filters to see all products.
              </p>
              <button
                className="prem-empty-btn"
                onClick={() => {
                  setSearch('');
                  setFilter('All');
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          filtered.map((product) => {
            const outOfStock = product.stock === 0;
            const lowStock =
              !outOfStock && product.stock <= (product.low_stock_threshold || 10);
            const rating = ratings[product.id];

            return (
              <article
                key={product.id}
                className={`prem-card ${outOfStock ? 'is-out' : ''}`}
              >
                <div className="prem-card-media">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    onClick={() => handleViewProduct(product)}
                    style={{ cursor: 'pointer' }}
                  />
                  {outOfStock && (
                    <span className="prem-card-badge">Out of Stock</span>
                  )}
                  {lowStock && (
                    <span className="prem-card-badge low">
                      Only {product.stock} left
                    </span>
                  )}
                  <div className="prem-card-actions">
                    <WishlistButton product={product} />
                    <ShareButton product={product} />
                  </div>
                </div>

                <div className="prem-card-body">
                  <span className="prem-card-cat">{product.category}</span>
                  <h3
                    className="prem-card-title"
                    onClick={() => handleViewProduct(product)}
                  >
                    {product.name}
                  </h3>
                  <span className="prem-card-weight">{product.weight}</span>

                  <button
                    className="prem-card-rating"
                    onClick={() => handleViewProduct(product)}
                  >
                    <StarRating
                      value={rating?.avg || 0}
                      size="0.8rem"
                      showNumber
                      total={rating?.count || 0}
                    />
                  </button>

                  <div className="prem-card-foot">
                    <span className="prem-card-price">₹{product.price}</span>
                    {outOfStock ? (
                      <button className="prem-card-add disabled" disabled>
                        Sold Out
                      </button>
                    ) : (
                      <button
                        className="prem-card-add"
                        onClick={(e) => handleAddToCart(e, product)}
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* TRUST BAND */}
      <div className="prem-trust-band">
        <div className="prem-trust-item">
          <div className="prem-trust-num">FSSAI</div>
          <div className="prem-trust-label">Certified</div>
        </div>
        <div className="prem-trust-item">
          <div className="prem-trust-num">100%</div>
          <div className="prem-trust-label">Natural</div>
        </div>
        <div className="prem-trust-item">
          <div className="prem-trust-num">Fresh</div>
          <div className="prem-trust-label">Every Morning</div>
        </div>
        <div className="prem-trust-item">
          <div className="prem-trust-num">COD</div>
          <div className="prem-trust-label">Available</div>
        </div>
      </div>

      {reviewProduct && (
        <ReviewsModal
          product={reviewProduct}
          onClose={() => setReviewProduct(null)}
        />
      )}
    </div>
  );
}