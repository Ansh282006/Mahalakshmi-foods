import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import useFlyToCart from '../hooks/useFlyToCart';
import SkeletonCard from '../components/SkeletonCard';
import RevealCard from '../components/RevealCard';
import BrandMarquee from '../components/BrandMarquee';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const flyToCart = useFlyToCart();

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('*').eq('is_available', true);
      setProducts(data || []);
      setTimeout(() => setLoading(false), 800);
    }
    fetchProducts();
  }, []);

  const filtered = filter === 'All' ? products : products.filter((p) => p.category === filter);

  const handleAddToCart = (e, product) => {
    if (product.stock === 0) return;
    const card = e.currentTarget.closest('.product-card');
    flyToCart(card);
    addToCart(product);
  };

  return (
    <>
      {/* ---------- FULL-WIDTH MARQUEE ---------- */}
      <BrandMarquee />

      {/* ---------- CONTAINERED GRID ---------- */}
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
    </>
  );
}