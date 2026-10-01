import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, getTotal, getItemCount } = useCart();
  const navigate = useNavigate();

  const subtotal = getTotal();
  const shipping = 0; // Free
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="prem-page">
        <section className="prem-hero">
          <div className="prem-hero-inner">
            <span className="prem-kicker">YOUR CART</span>
            <h1 className="prem-hero-title">
              Nothing here <em>yet.</em>
            </h1>
          </div>
        </section>

        <div className="prem-empty-cart">
          <div className="prem-empty-icon">
            <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
          <h2 className="prem-empty-cart-title">Your cart is empty</h2>
          <p className="prem-empty-cart-text">
            Add some freshly fried chips and they will show up here. Every batch
            ships the same day it is made.
          </p>
          <Link to="/shop" className="prem-btn-primary">
            Browse the Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="prem-page">
      <section className="prem-hero">
        <div className="prem-hero-inner">
          <span className="prem-kicker">YOUR CART</span>
          <h1 className="prem-hero-title">
            Review & <em>Confirm.</em>
          </h1>
          <p className="prem-hero-sub">
            Take a moment to check your items. Free delivery within Kolhapur.
            Cash on Delivery available.
          </p>
        </div>
      </section>

      <div className="prem-cart-layout">
        {/* ITEMS LIST */}
        <div>
          <div className="prem-cart-list">
            {cart.map((item) => (
              <div key={item.id} className="prem-cart-item">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="prem-cart-item-img"
                />

                <div className="prem-cart-item-info">
                  <span className="prem-cart-item-cat">
                    {item.category || 'Chips'}
                  </span>
                  <h3 className="prem-cart-item-title">{item.name}</h3>
                  <span className="prem-cart-item-weight">{item.weight}</span>
                  <button
                    className="prem-cart-item-remove"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="prem-cart-item-right">
                  <span className="prem-cart-item-price">
                    ₹{(item.price * item.quantity).toFixed(0)}
                  </span>
                  <div className="prem-qty">
                    <button
                      className="prem-qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="prem-qty-num">{item.quantity}</span>
                    <button
                      className="prem-qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--s-3)' }}>
            <Link to="/shop" className="prem-btn-outline">
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* SUMMARY */}
        <aside className="prem-summary">
          <h3 className="prem-summary-title">
            Order Summary
            <span className="prem-summary-title-count">
              {getItemCount()} {getItemCount() === 1 ? 'Item' : 'Items'}
            </span>
          </h3>

          <div className="prem-summary-row">
            <span className="prem-summary-row-label">Subtotal</span>
            <span className="prem-summary-row-value">₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="prem-summary-row">
            <span className="prem-summary-row-label">Delivery</span>
            <span className="prem-summary-row-value">Free</span>
          </div>

          <div className="prem-summary-total">
            <span className="prem-summary-total-label">Total</span>
            <span className="prem-summary-total-value">₹{total.toFixed(2)}</span>
          </div>

          <div className="prem-summary-cta">
            <button
              className="prem-btn-primary"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </button>
          </div>

          <div className="prem-summary-note">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>
              <strong>Cash on Delivery</strong> — No online payment required
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}