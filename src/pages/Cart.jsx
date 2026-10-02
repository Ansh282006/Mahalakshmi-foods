import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, getTotal, getTotalKg, getGstTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [retailer, setRetailer] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('retailers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setRetailer(data));
  }, [user]);

  const subtotal = getTotal();
  const gstTotal = getGstTotal();
  const totalKg = getTotalKg();
  const moqReached = totalKg >= 10;

  if (cart.length === 0) {
    return (
      <div className="prem-page">
        <section className="prem-hero">
          <div className="prem-hero-inner">
            <span className="prem-kicker">ORDER SHEET</span>
            <h1 className="prem-hero-title">
              Your order sheet is <em>empty.</em>
            </h1>
          </div>
        </section>

        <div className="prem-empty-cart">
          <h2 className="prem-empty-cart-title">Start your wholesale order</h2>
          <p className="prem-empty-cart-text">
            Add 1kg or 5kg packs from the catalog. Minimum order is 10kg.
          </p>
          <Link to="/products" className="prem-btn-primary">Browse Catalog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="prem-page">
      <section className="prem-hero">
        <div className="prem-hero-inner">
          <span className="prem-kicker">ORDER SHEET</span>
          <h1 className="prem-hero-title">
            Review your <em>wholesale order.</em>
          </h1>
          <p className="prem-hero-sub">
            {cart.length} {cart.length === 1 ? 'product' : 'products'} · {totalKg} kg total · Minimum order 10kg
          </p>
        </div>
      </section>

      <div className="prem-cart-layout">
        {/* Items */}
        <div>
          <div className="prem-cart-list">
            {cart.map((item) => (
              <div key={item.id} className="prem-cart-item">
                <img src={item.image_url} alt={item.name} className="prem-cart-item-img" />
                <div className="prem-cart-item-info">
                  <span className="prem-cart-item-cat">{item.category || 'Chips'}</span>
                  <h3 className="prem-cart-item-title">{item.name}</h3>
                  <span className="prem-cart-item-weight">
                    {item.pack_size_kg || 1} kg pack · {item.pack_size_kg || 1}kg
                  </span>
                  <button
                    className="prem-cart-item-remove"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
                <div className="prem-cart-item-right">
                  <span className="prem-cart-item-price">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                  <div className="prem-qty">
                    <button className="prem-qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                    <span className="prem-qty-num">{item.quantity}</span>
                    <button className="prem-qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <span className="prem-cart-item-kg">
                    {(item.pack_size_kg || 1) * item.quantity} kg
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--s-3)', flexWrap: 'wrap' }}>
            <Link to="/products" className="prem-btn-outline">← Add More Products</Link>
            <button className="prem-btn-outline" style={{ borderColor: 'var(--signal-red)', color: 'var(--signal-red)' }} onClick={() => { if (confirm('Clear the entire order sheet?')) clearCart(); }}>
              Clear Order Sheet
            </button>
          </div>

          {/* MOQ alert */}
          {!moqReached && (
            <div className="prem-b2b-banner warn" style={{ marginTop: 'var(--s-4)' }}>
              <div>
                <strong>Minimum order not met</strong>
                <span>You have {totalKg} kg. Add {10 - totalKg} kg more to reach the 10kg minimum.</span>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="prem-summary">
          <h3 className="prem-summary-title">
            Order Summary
            <span className="prem-summary-title-count">{totalKg} kg</span>
          </h3>

          <div className="prem-summary-row">
            <span className="prem-summary-row-label">Subtotal</span>
            <span className="prem-summary-row-value">₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="prem-summary-row">
            <span className="prem-summary-row-label">GST (included)</span>
            <span className="prem-summary-row-value">₹{gstTotal.toFixed(2)}</span>
          </div>

          <div className="prem-summary-row">
            <span className="prem-summary-row-label">Transport</span>
            <span className="prem-summary-row-value">On Actuals</span>
          </div>

          <div className="prem-summary-total">
            <span className="prem-summary-total-label">Total</span>
            <span className="prem-summary-total-value">₹{subtotal.toFixed(2)}</span>
          </div>

          {retailer?.payment_terms === 'Credit' && (
            <div className="prem-summary-note" style={{ marginTop: 'var(--s-3)' }}>
              <span>Payment terms: <strong>Credit (15 days)</strong></span>
            </div>
          )}

          {retailer?.payment_terms !== 'Credit' && (
            <div className="prem-summary-note" style={{ marginTop: 'var(--s-3)' }}>
              <span>Payment terms: <strong>100% Advance</strong></span>
            </div>
          )}

          <div className="prem-summary-cta">
            <button
              className="prem-btn-primary"
              disabled={!moqReached}
              style={{ width: '100%', padding: '18px', opacity: !moqReached ? 0.5 : 1 }}
              onClick={() => navigate('/checkout')}
            >
              {moqReached ? 'Proceed to Confirm Order' : `Add ${10 - totalKg} kg More`}
            </button>
          </div>

          <div className="prem-summary-note" style={{ marginTop: 'var(--s-3)', background: 'transparent', padding: 0 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--charcoal-500)', lineHeight: 1.55 }}>
              GST invoice will be generated after order confirmation. Transport charges billed separately by your transporter.
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}