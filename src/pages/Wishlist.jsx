import { Link } from 'react-router-dom';
import useWishlist from '../hooks/useWishlist';
import { useCart } from '../context/CartContext';
import StarRating from '../components/StarRating';

export default function Wishlist() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart, openDrawer } = useCart();

  const handleAddToCart = (product) => {
    if (product.stock === 0) return;
    addToCart(product);
    openDrawer();
  };

  const handleAddAllToCart = () => {
    const available = wishlist.filter((p) => p.stock > 0);
    if (available.length === 0) return;
    available.forEach((p) => addToCart(p));
    openDrawer();
  };

  if (wishlist.length === 0) {
    return (
      <div className="app-container">
        <h1 className="page-title">My Wishlist</h1>
        <div className="track-empty">
          <div className="empty-icon">🤍</div>
          <h3>Your wishlist is empty</h3>
          <p>Save your favorite chips here and come back to them anytime.</p>
          <Link to="/products" className="track-shop-link">Browse Products →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="wishlist-header">
        <div>
          <h1 className="page-title">My Wishlist</h1>
          <p className="admin-subtext">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
        <div className="wishlist-header-actions">
          <button className="wishlist-clear-btn" onClick={() => {
            if (confirm('Clear your entire wishlist?')) clearWishlist();
          }}>
            Clear All
          </button>
          <button className="wishlist-add-all-btn" onClick={handleAddAllToCart}>
            🛒 Add All to Cart
          </button>
        </div>
      </div>

      <div className="wishlist-grid">
        {wishlist.map((product) => {
          const outOfStock = product.stock === 0;
          return (
            <div key={product.id} className="wishlist-card">
              <button
                className="wishlist-remove"
                onClick={() => removeFromWishlist(product.id)}
                aria-label="Remove"
              >
                ✕
              </button>

              <div className="wishlist-img-wrap">
                <img src={product.image_url} alt={product.name} />
                {outOfStock && <span className="out-of-stock-badge">Out of Stock</span>}
              </div>

              <div className="wishlist-info">
                <h3>{product.name}</h3>
                <p className="product-weight">{product.weight}</p>
                <p className="product-price">₹{product.price}</p>

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
  );
}