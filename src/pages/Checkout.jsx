import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PincodeChecker from '../components/PincodeChecker';
import CouponInput from '../components/CouponInput';

export default function Checkout() {
  const { cart, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [pincodeServiceable, setPincodeServiceable] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.user_metadata?.full_name || '',
        phone: prev.phone || user.user_metadata?.phone || '',
      }));
      loadPoints();
    }
  }, [user]);

  async function loadPoints() {
    const { data } = await supabase
      .from('loyalty_points')
      .select('points, type')
      .eq('user_id', user.id);
    if (data) {
      const earned = data.filter((p) => p.type === 'earned').reduce((s, p) => s + p.points, 0);
      const redeemed = data.filter((p) => p.type === 'redeemed').reduce((s, p) => s + p.points, 0);
      setUserPoints(earned - redeemed);
    }
  }

  const subtotal = getTotal();
  const couponDiscount = appliedCoupon?.discount || 0;

  // Points: 100 points = ₹50
  const maxPointsValue = Math.floor(userPoints / 100) * 50;
  const pointsDiscount = usePoints ? Math.min(maxPointsValue, subtotal - couponDiscount) : 0;
  const pointsUsed = usePoints ? Math.ceil(pointsDiscount / 50) * 100 : 0;

  const finalTotal = Math.max(subtotal - couponDiscount - pointsDiscount, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pincodeServiceable === false) {
      toast.error('Delivery not available at your pincode');
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
          total_amount: finalTotal,
          status: 'Pending',
          user_id: user?.id || null,
          coupon_code: appliedCoupon?.code || null,
          discount_amount: couponDiscount + pointsDiscount,
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

      // Increment coupon usage
      if (appliedCoupon?.code) {
        await supabase.rpc('increment_coupon_usage', { coupon_code: appliedCoupon.code });
      }

      // Deduct points if used
      if (usePoints && pointsUsed > 0) {
        await supabase.from('loyalty_points').insert({
          user_id: user.id,
          points: pointsUsed,
          type: 'redeemed',
          source: 'order',
          order_id: order.id,
          description: `Redeemed on order ${order.order_code || ''}`,
        });
      }

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
        <div className="empty-cart"><p>Your cart is empty 😢</p></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <h1 className="page-title">Checkout</h1>
      <div className="checkout-grid">
        <PincodeChecker
          compact
          onServiceable={(isServiceable) => setPincodeServiceable(isServiceable)}
        />

        {!user && (
          <div className="guest-notice">
            Checking out as a <strong>guest</strong>.{' '}
            <a href="/login">Sign in</a> to save details and earn loyalty points.
          </div>
        )}

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

          <div className="coupon-section">
            <CouponInput
              subtotal={subtotal}
              appliedCoupon={appliedCoupon}
              onApply={(c) => setAppliedCoupon(c)}
              onRemove={() => setAppliedCoupon(null)}
            />
          </div>

          {/* Loyalty Points Redemption */}
          {user && userPoints >= 100 && (
            <div className="points-redeem-section">
              <label className="points-redeem-label">
                <input
                  type="checkbox"
                  checked={usePoints}
                  onChange={(e) => setUsePoints(e.target.checked)}
                />
                <span className="checkmark"></span>
                <div className="points-redeem-info">
                  <strong>Use {pointsUsed || Math.floor(userPoints / 100) * 100} Loyalty Points</strong>
                  <span>Save ₹{usePoints ? pointsDiscount.toFixed(0) : Math.floor(userPoints / 100) * 50}</span>
                </div>
              </label>
              <div className="points-balance-note">
                Available balance: {userPoints} points (≈ ₹{maxPointsValue})
              </div>
            </div>
          )}

          <div className="checkout-totals">
            <div className="checkout-total-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="checkout-total-row discount">
                <span>Coupon Discount</span>
                <span>−₹{couponDiscount.toFixed(2)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="checkout-total-row discount">
                <span>Points Redemption</span>
                <span>−₹{pointsDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="checkout-total-row grand">
              <span>Total</span>
              <strong>₹{finalTotal.toFixed(2)}</strong>
            </div>
          </div>
        </div>

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
            {submitting ? 'Placing Order...' : `Place Order (₹${finalTotal.toFixed(2)})`}
          </button>

          <p className="checkout-cod-note">
            💵 Cash on Delivery · No online payment required
          </p>
        </form>
      </div>
    </div>
  );
}