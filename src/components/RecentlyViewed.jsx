import { useNavigate } from 'react-router-dom';
import useRecentlyViewed from '../hooks/useRecentlyViewed';
import { useCart } from '../context/CartContext';

export default function RecentlyViewed({ excludeId = null, currentProduct = null }) {
  const { recent, addRecentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
  const { addToCart, openDrawer } = useCart();
  const navigate = useNavigate();

  // Register the current product view
  if (currentProduct) {
    // (Deferred — actually registered in parent via useEffect)
  }

  const items = excludeId ? recent.filter((p) => p.id !== excludeId) : recent;

  if (items.length === 0) return null;

  const handleView = (product) => {
    navigate('/products');
  };

  const handleAddToCart = (product) => {
    if (product.stock === 0) return;
    addToCart(product);
    openDrawer();
  };

  return (
    <section className="recently-viewed-section">
      <div className="app-container">
        <div className="recently-viewed-header">
          <div>
            <h2 className="section-title" style={{ left: 0, transform: 'none' }}>
              Recently Viewed
            </h2>
          </div>
          <button className="recently-viewed-clear" onClick={clearRecentlyViewed}>
            Clear
          </button>
        </div>

        <div className="recently-viewed-grid">
          {items.map((product) => {
            const outOfStock = product.stock === 0;
            return (
              <div key={product.id} className="recently-viewed-card">
                <div className="recently-viewed-img-wrap">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    onClick={() => handleView(product)}
                  />
                  {outOfStock && (
                    <span className="out-of-stock-badge">Out of Stock</span>
                  )}
                </div>
                <div className="recently-viewed-info">
                  <h4 onClick={() => handleView(product)}>{product.name}</h4>
                  <span className="recently-viewed-weight">{product.weight}</span>
                  <span className="recently-viewed-price">₹{product.price}</span>
                  {outOfStock ? (
                    <button className="add-to-cart-btn disabled" disabled>
                      Out of Stock
                    </button>
                  ) : (
                    <button
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(product)}
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
