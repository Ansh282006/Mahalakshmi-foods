import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const {
    cart,
    isDrawerOpen,
    closeDrawer,
    removeFromCart,
    updateQuantity,
    getTotal,
    getItemCount,
  } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeDrawer();
    navigate('/checkout');
  };

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('cart-drawer-backdrop')) {
      closeDrawer();
    }
  };

  return (
    <>
      <div
        className={`cart-drawer-backdrop ${isDrawerOpen ? 'open' : ''}`}
        onClick={handleBackdropClick}
      />

      <aside className={`cart-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div>
            <h2>Your Cart</h2>
            <p className="drawer-subtitle">
              {getItemCount()} {getItemCount() === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button className="drawer-close" onClick={closeDrawer} aria-label="Close cart">
            ✕
          </button>
        </div>

        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="drawer-empty">
              <div className="empty-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Add some delicious chips to get started!</p>
              <button
                className="drawer-shop-btn"
                onClick={() => {
                  closeDrawer();
                  navigate('/products');
                }}
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="drawer-items">
              {cart.map((item) => (
                <div key={item.id} className="drawer-item">
                  <img src={item.image_url} alt={item.name} className="drawer-item-img" />
                  <div className="drawer-item-info">
                    <h4>{item.name}</h4>
                    <p className="drawer-item-weight">{item.weight}</p>
                    <p className="drawer-item-price">₹{item.price}</p>
                    <div className="drawer-qty-controls">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <button
                    className="drawer-remove"
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remove"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer">
            <div className="drawer-total">
              <span>Subtotal</span>
              <strong>₹{getTotal().toFixed(2)}</strong>
            </div>
            <button className="drawer-checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout →
            </button>
            <button className="drawer-continue-btn" onClick={closeDrawer}>
              Continue Shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
}