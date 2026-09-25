import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import useFlyToCart from '../hooks/useFlyToCart';
import SkeletonCard from '../components/SkeletonCard';
import RevealCard from '../components/RevealCard';
import BrandMarquee from '../components/BrandMarquee';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const flyToCart = useFlyToCart();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_available', true);
        if (error) throw error;
        setProducts(data);
        setTimeout(() => setLoading(false), 800);
      } catch (err) {
        console.error(err.message);
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleAddToCart = (e, product) => {
    if (product.stock === 0) return;
    const card = e.currentTarget.closest('.product-card');
    flyToCart(card);
    addToCart(product);
  };

  return (
    <div className="app-container">
      <header className="hero-section">
        <h1>Mahalaxmi Krushi Prakriya Udyog</h1>
        <p>Authentic, crunchy, and made with traditional care.</p>
        <Link to="/products" className="hero-btn">Shop All Products</Link>
      </header>

      <BrandMarquee />

      <section className="products-section">
        <h2>Our Best Sellers</h2>
        <div className="products-grid">
          {loading
            ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
            : products.slice(0, 4).map((product, index) => {
                const outOfStock = product.stock === 0;
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
  );
}