import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import useFlyToCart from '../hooks/useFlyToCart';
import SkeletonCard from '../components/SkeletonCard';
import RevealCard from '../components/RevealCard';
import BrandMarquee from '../components/BrandMarquee';
import StarRating from '../components/StarRating';
import ReviewsModal from '../components/ReviewsModal';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [reviewProduct, setReviewProduct] = useState(null);
  const { addToCart } = useCart();
  const flyToCart = useFlyToCart();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_available', true);
        if (error) throw error;
        setProducts(data);

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
      } catch (err) {
        console.error(err.message);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAddToCart = (e, product) => {
    if (product.stock === 0) return;
    const card = e.currentTarget.closest('.product-card');
    flyToCart(card);
    addToCart(product);
  };

  return (
    <>
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-word">Mahalaxmi</span>{' '}
            <span className="hero-word">Krushi</span>{' '}
            <span className="hero-word">Prakriya</span>{' '}
            <span className="hero-word">Udyog</span>
          </h1>
          <p className="hero-subtitle">
            Authentic, crunchy, and made with traditional care.
          </p>
          <Link to="/products" className="hero-btn">
            <span>Shop All Products</span>
            <span className="hero-btn-arrow">→</span>
          </Link>
        </div>
        <div className="hero-orb hero-orb-1"></div>
        <div className="hero-orb hero-orb-2"></div>
        <div className="hero-orb hero-orb-3"></div>
      </header>

      <BrandMarquee />

      <div className="app-container">
        <section className="products-section">
          <h2 className="section-title">Our Best Sellers</h2>
          <div className="products-grid">
            {loading
              ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
              : products.slice(0, 4).map((product, index) => {
                  const outOfStock = product.stock === 0;
                  const rating = ratings[product.id];
                  return (
                    <RevealCard key={product.id} delay={index * 100}>
                      <div className={`product-card ${outOfStock ? 'is-out' : ''}`}>
                        <div className="product-image-wrap">
                          <img src={product.image_url} alt={product.name} className="product-image" />
                          {outOfStock && <div className="out-of-stock-badge">Out of Stock</div>}
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
        </section>
      </div>

      {reviewProduct && (
        <ReviewsModal product={reviewProduct} onClose={() => setReviewProduct(null)} />
      )}
    </>
  );
}