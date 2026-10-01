import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import useFlyToCart from '../hooks/useFlyToCart';
import useSEO from '../hooks/useSEO';
import { organizationSchema } from '../utils/seo';
import SkeletonCard from '../components/SkeletonCard';
import BrandMarquee from '../components/BrandMarquee';
import StarRating from '../components/StarRating';
import ReviewsModal from '../components/ReviewsModal';
import PincodeChecker from '../components/PincodeChecker';
import WishlistButton from '../components/WishlistButton';
import ShareButton from '../components/ShareButton';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [heroProduct, setHeroProduct] = useState(null);
  const { addToCart } = useCart();
  const flyToCart = useFlyToCart();

  useSEO({
    title: 'Shop — Mahalaxmi Chips',
    description:
      'Buy freshly fried banana chips and jackfruit chips from Kolhapur. FSSAI certified, home delivered. Cash on Delivery available.',
    structuredData: organizationSchema(),
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_available', true);
        if (error) throw error;
        setProducts(data || []);
        setHeroProduct((data || [])[0] || null);

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
      } catch (err) {
        console.error(err.message);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAddToCart = (e, product) => {
    if (product.stock === 0) return;
    const card = e.currentTarget.closest('.prem-card');
    flyToCart(card);
    addToCart(product);
  };

  return (
    <div className="prem-page">
      {/* HERO */}
      <section className="prem-hero">
        <div className="prem-hero-inner">
          <div className="prem-hero-split">
            <div>
              <span className="prem-kicker">SHOP ALL</span>
              <h1 className="prem-hero-title">
                Hand-Cut.<br />
                Fried Fresh.<br />
                <em>Delivered.</em>
              </h1>
              <p className="prem-hero-sub">
                Traditional Kolhapuri chips, made in small batches with coconut
                oil and the same family recipe we have used for over 18 years.
              </p>

              <div className="prem-hero-stats">
                <div className="prem-hero-stat">
                  <span className="prem-hero-stat-num">18+</span>
                  <span className="prem-hero-stat-label">Years of Making</span>
                </div>
                <div className="prem-hero-stat">
                  <span className="prem-hero-stat-num">100%</span>
                  <span className="prem-hero-stat-label">Natural</span>
                </div>
                <div className="prem-hero-stat">
                  <span className="prem-hero-stat-num">24hr</span>
                  <span className="prem-hero-stat-label">Kolhapur Delivery</span>
                </div>
              </div>
            </div>

            {heroProduct && (
              <div className="prem-hero-visual">
                <img src={heroProduct.image_url} alt={heroProduct.name} />
              </div>
            )}
          </div>
        </div>
      </section>

      <BrandMarquee />

      {/* PINCODE CHECKER */}
      <div className="pincode-section">
        <PincodeChecker />
      </div>

      {/* PRODUCTS */}
      <section className="prem-section">
        <div className="prem-section-header">
          <div>
            <span className="prem-kicker">CATALOG</span>
            <h2 className="prem-section-title">
              Our <em>Signature</em> Batch
            </h2>
          </div>
          <span className="prem-section-count">
            {products.length} Products
          </span>
        </div>
      </section>

      <div className="prem-grid">
        {loading
          ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          : products.slice(0, 8).map((product) => {
              const outOfStock = product.stock === 0;
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
                      onClick={() => setReviewProduct(product)}
                      style={{ cursor: 'pointer' }}
                    />
                    {outOfStock && (
                      <span className="prem-card-badge">Out of Stock</span>
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
                      onClick={() => setReviewProduct(product)}
                    >
                      {product.name}
                    </h3>
                    <span className="prem-card-weight">{product.weight}</span>

                    <button
                      className="prem-card-rating"
                      onClick={() => setReviewProduct(product)}
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
            })}
      </div>

      {/* TRUST BAND */}
      <div className="prem-trust-band">
        <div className="prem-trust-item">
          <div className="prem-trust-num">FSSAI</div>
          <div className="prem-trust-label">Certified Kitchen</div>
        </div>
        <div className="prem-trust-item">
          <div className="prem-trust-num">100%</div>
          <div className="prem-trust-label">Natural Ingredients</div>
        </div>
        <div className="prem-trust-item">
          <div className="prem-trust-num">24hr</div>
          <div className="prem-trust-label">Kolhapur Delivery</div>
        </div>
        <div className="prem-trust-item">
          <div className="prem-trust-num">COD</div>
          <div className="prem-trust-label">Cash on Delivery</div>
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