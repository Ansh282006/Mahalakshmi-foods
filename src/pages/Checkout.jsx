import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PincodeChecker from '../components/PincodeChecker';

export default function Checkout() {
  const { cart, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [pincodeServiceable, setPincodeServiceable] = useState(null);

  // Auto-fill from logged-in user
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.user_metadata?.full_name || '',
        phone: prev.phone || user.user_metadata?.phone || '',
      }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pincodeServiceable === false) {
      toast.error('Cannot place order — delivery not available at your pincode');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Placing your order...');

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: form.name,
          customer_phone: form.phone,
          customer_address: form.address,
          total_amount: getTotal(),
          status: 'Pending',
          user_id: user?.id || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const items = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price,
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;

      clearCart();
      toast.success('Order placed! 🎉', { id: toastId });
      navigate(`/order-confirmed/${order.id}`);
    } catch (err) {
      toast.error('Error: ' + err.message, { id: toastId });
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="app-container">
        <h1 className="page-title">Checkout</h1>
        <div className="empty-cart">
          <p>Your cart is empty 😢</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <h1 className="page-title">Checkout</h1>
      <div className="checkout-grid">
        {/* Pincode Checker */}
        <PincodeChecker
          compact
          onServiceable={(isServiceable) => setPincodeServiceable(isServiceable)}
        />

        {/* Guest Notice */}
        {!user && (
          <div className="guest-notice">
            Checking out as a <strong>guest</strong>.{' '}
            <a href="/login">Sign in</a> to save your details for next time.
          </div>
        )}

        {/* Order Summary */}
        <div className="checkout-summary-card">
          <h3>Order Summary</h3>
          <div className="checkout-summary-list">
            {cart.map((item) => (
              <div key={item.id} className="checkout-summary-item">
                <img src={item.image_url} alt={item.name} />
                <div className="checkout-summary-info">
                  <strong>{item.name}</strong>
                  <span>{item.weight} × {item.quantity}</span>
                </div>
                <span className="checkout-summary-price">
                  ₹{(item.price * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
          <div className="checkout-summary-total">
            <span>Total</span>
            <strong>₹{getTotal().toFixed(2)}</strong>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="checkout-form">
          <label>Full Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Ansh Patil"
            required
          />

          <label>Phone Number</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="10-digit mobile number"
            pattern="[0-9]{10}"
            title="Please enter a valid 10-digit phone number"
            required
          />

          <label>Delivery Address</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="House / Street / Village / Taluka / District / Pincode"
            required
          />

          <button
            type="submit"
            className="checkout-btn"
            disabled={submitting || pincodeServiceable === false}
          >
            {submitting
              ? 'Placing Order...'
              : `Place Order (₹${getTotal().toFixed(2)})`}
          </button>

          <p className="checkout-cod-note">
            💵 Cash on Delivery · No online payment required
          </p>
        </form>
      </div>
    </div>
  );
}