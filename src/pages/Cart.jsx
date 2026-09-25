import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, getTotal } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="app-container">
        <h1 className="page-title">Your Cart</h1>
        <div className="empty-cart">
          <p>Your cart is empty 😢</p>
          <Link to="/products" className="hero-btn">Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <h1 className="page-title">Your Cart</h1>
      <div className="cart-list">
        {cart.map((item) => (
          <div key={item.id} className="cart-item">
            <img src={item.image_url} alt={item.name} />
            <div className="cart-item-info">
              <h3>{item.name}</h3>
              <p>{item.weight}</p>
              <p className="product-price">₹{item.price}</p>
            </div>
            <div className="qty-controls">
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
            </div>
            <button className="remove-btn" onClick={() => removeFromCart(item.id)}>🗑</button>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <h2>Total: ₹{getTotal().toFixed(2)}</h2>
        <button className="checkout-btn" onClick={() => navigate('/checkout')}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}