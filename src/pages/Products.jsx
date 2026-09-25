import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import useFlyToCart from '../hooks/useFlyToCart';
import SkeletonCard from '../components/SkeletonCard';
import RevealCard from '../components/RevealCard';
import BrandMarquee from '../components/BrandMarquee';
import StarRating from '../components/StarRating';
import ReviewsModal from '../components/ReviewsModal';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [ratings, setRatings] = useState({});
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [reviewProduct, setReviewProduct] = useState(null);
  const { addToCart } = useCart();
  const flyToCart = useFlyToCart();

  useEffect(() => {
    fetchAll();
  }, []);

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
        out[id] = {
          avg: agg[id].sum / agg[id].count,
          count: agg[id].count,
        };
      });
      setRatings(out);
    }

    setTimeout(() => setLoading(false), 800);
  }

  const filtered = filter === 'All' ? products : products.filter((p) => p.category === filter);

  const handleAddToCart = (e, product) => {
    if (product.stock === 0) return;
    const card = e.currentTarget.closest('.product-card');
    flyToCart(card);
    addToCart(product);
  };

  return (
    <>
      <BrandMarquee />
      <div className="app-container">
        <h1 className="page-title">All Products</h1>
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
        <div className="products-grid">
          {loading
            ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
            : filtered.map((product, index) => {
                const outOfStock = product.stock === 0;
                const lowStock = !outOfStock && product.stock <= (product.low_stock_threshold || 10);
                const rating = ratings[product.id];
                return (
                  <RevealCard key={product.id} delay={(index % 4) * 100}>
                    <div className={`product-card ${outOfStock ? 'is-out' : ''}`}>
                      <div className="product-image-wrap">
                        <img src={product.image_url} alt={product.name} className="product-image" />
                        {outOfStock && <div className="out-of-stock-badge">Out of Stock</div>}
                        {lowStock && <div className="low-stock-badge">Only {product.stock} left</div>}
                      </div>
                      <div className="product-info">
                        <h3>{product.name}</h3>
                        <p className="product-weight">{product.weight}</p>

                        <button
                          className="product-rating-btn"
                          onClick={() => setReviewProduct(product)}
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
                          <button className="add-to-cart-btn disabled" disabled>Out of Stock</button>
                        ) : (
                          <button className="add-to-cart-btn" onClick={(e) => handleAddToCart(e, product)}>
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

      {reviewProduct && (
        <ReviewsModal product={reviewProduct} onClose={() => setReviewProduct(null)} />
      )}
    </>
  );
}