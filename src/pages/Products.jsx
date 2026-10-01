import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import useFlyToCart from '../hooks/useFlyToCart';
import useSEO from '../hooks/useSEO';
import useRecentlyViewed from '../hooks/useRecentlyViewed';
import { productSchema } from '../utils/seo';
import SkeletonCard from '../components/SkeletonCard';
import RevealCard from '../components/RevealCard';
import BrandMarquee from '../components/BrandMarquee';
import StarRating from '../components/StarRating';
import ReviewsModal from '../components/ReviewsModal';
import WishlistButton from '../components/WishlistButton';
import ShareButton from '../components/ShareButton';
import RecentlyViewed from '../components/RecentlyViewed';

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

  // Register every product a customer clicks
  const handleViewProduct = (product) => {
    addRecentlyViewed(product);
    setReviewProduct(product);
  };

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

    setTimeout(() => setLoading(false), 800);
  }

  const filtered = useMemo(() => {
    let result = filter === 'All' ? products : products.filter((p) => p.category === filter);
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
    const card = e.currentTarget.closest('.product-card');
    flyToCart(card);
    addToCart(product);
    addRecentlyViewed(product);
  };

  return (
    <>
      <BrandMarquee />

      <div className="app-container">
        <h1 className="page-title">All Products</h1>

        {/* Search Bar */}
        <div className="products-search-wrap">
          <div className="products-search">
            <span className="search-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chips, categories, weights..."
              className="products-search-input"
            />
            {search && (
              <button
                className="search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {search && (
            <p className="search-results-count">
              {filtered.length} {filtered.length === 1 ? 'result' : 'results'} for "{search}"
            </p>
          )}
        </div>

        {/* Category Filters */}
        <div className="filters">
          {['All', 'Banana Chips', 'Jackfruit Chips'].map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {loading
            ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
            ? (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No products found</h3>
                <p>Try a different search term or category.</p>
                <button className="no-results-btn" onClick={() => { setSearch(''); setFilter('All'); }}>
                  Clear Filters
                </button>
              </div>
            )
            : filtered.map((product, index) => {
                const outOfStock = product.stock === 0;
                const lowStock =
                  !outOfStock &&
                  product.stock <= (product.low_stock_threshold || 10);
                const rating = ratings[product.id];

                return (
                  <RevealCard key={product.id} delay={(index % 4) * 100}>
                    <div className={`product-card ${outOfStock ? 'is-out' : ''}`}>
                      <div className="product-image-wrap">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="product-image"
                          onClick={() => handleViewProduct(product)}
                          style={{ cursor: 'pointer' }}
                        />
                        {outOfStock && (
                          <div className="out-of-stock-badge">Out of Stock</div>
                        )}
                        {lowStock && (
                          <div className="low-stock-badge">
                            Only {product.stock} left
                          </div>
                        )}
                        <WishlistButton product={product} />
                        <ShareButton product={product} />
                      </div>
                      <div className="product-info">
                        <h3
                          onClick={() => handleViewProduct(product)}
                          style={{ cursor: 'pointer' }}
                        >
                          {product.name}
                        </h3>
                        <p className="product-weight">{product.weight}</p>

                        <button
                          className="product-rating-btn"
                          onClick={() => handleViewProduct(product)}
                        >
                          <StarRating
                            value={rating?.avg || 0}
                            size="0.85rem"
                            showNumber
                            total={rating?.count || 0}
                          />
                        </button>

                        <p className="product-price">₹{product.price}</p>

                        {outOfStock ? (
                          <button className="add-to-cart-btn disabled" disabled>
                            Out of Stock
                          </button>
                        ) : (
                          <button
                            className="add-to-cart-btn"
                            onClick={(e) => handleAddToCart(e, product)}
                          >
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </RevealCard>
                );
              })}
        </div>
      </div>

      {/* Recently Viewed Section */}
      <RecentlyViewed />

      {reviewProduct && (
        <ReviewsModal
          product={reviewProduct}
          onClose={() => setReviewProduct(null)}
        />
      )}
    </>
  );
}
