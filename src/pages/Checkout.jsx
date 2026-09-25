import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const { cart, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

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
        {!user && (
          <div className="guest-notice">
            Checking out as a <strong>guest</strong>.{' '}
            <a href="/login">Sign in</a> to save your details for next time.
          </div>
        )}
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
          <button type="submit" className="checkout-btn" disabled={submitting}>
            {submitting ? 'Placing Order...' : `Place Order (₹${getTotal().toFixed(2)})`}
          </button>
        </form>
      </div>
    </div>
  );
}