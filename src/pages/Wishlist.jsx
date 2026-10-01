import { Link } from 'react-router-dom';
import useWishlist from '../hooks/useWishlist';
import { useCart } from '../context/CartContext';

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
    if (!available.length) return;
    available.forEach((p) => addToCart(p));
    openDrawer();
  };

  if (wishlist.length === 0) {
    return (
      <div className="prem-page">
        <section className="prem-hero">
          <div className="prem-hero-inner">
            <span className="prem-kicker">YOUR SAVED ITEMS</span>
            <h1 className="prem-hero-title">
              Wishlist is <em>empty.</em>
            </h1>
          </div>
        </section>

        <div className="prem-empty-cart">
          <div className="prem-empty-icon">
            <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2 className="prem-empty-cart-title">Nothing saved yet</h2>
          <p className="prem-empty-cart-text">
            Tap the heart icon on any product to save it here for later.
          </p>
          <Link to="/shop" className="prem-btn-primary">Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="prem-page">
      <section className="prem-hero">
        <div className="prem-hero-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--s-3)' }}>
            <div>
              <span className="prem-kicker">YOUR SAVED ITEMS</span>
              <h1 className="prem-hero-title">
                Your <em>Wishlist.</em>
              </h1>
              <p className="prem-hero-sub">
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later.
              </p>
            </div>
            <div className="prem-wishlist-actions">
              <button className="prem-btn-outline" style={{ borderColor: 'rgba(254, 253, 251, 0.3)', color: 'var(--cream-100)' }} onClick={() => {
                if (confirm('Clear your entire wishlist?')) clearWishlist();
              }}>
                Clear All
              </button>
              <button className="prem-btn-primary prem-btn-gold" onClick={handleAddAllToCart}>
                Add All to Cart
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="prem-grid" style={{ marginTop: 'var(--s-5)' }}>
        {wishlist.map((product) => {
          const outOfStock = product.stock === 0;
          return (
            <article key={product.id} className={`prem-card ${outOfStock ? 'is-out' : ''}`}>
              <div className="prem-card-media">
                <img src={product.image_url} alt={product.name} />
                {outOfStock && <span className="prem-card-badge">Out of Stock</span>}
                <button
                  className="prem-wishlist-remove"
                  onClick={() => removeFromWishlist(product.id)}
                  aria-label="Remove from wishlist"
                >
                  ✕
                </button>
              </div>
              <div className="prem-card-body">
                <span className="prem-card-cat">{product.category || 'Chips'}</span>
                <h3 className="prem-card-title">{product.name}</h3>
                <span className="prem-card-weight">{product.weight}</span>
                <div className="prem-card-foot">
                  <span className="prem-card-price">₹{product.price}</span>
                  {outOfStock ? (
                    <button className="prem-card-add disabled" disabled>Sold Out</button>
                  ) : (
                    <button className="prem-card-add" onClick={() => handleAddToCart(product)}>
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}