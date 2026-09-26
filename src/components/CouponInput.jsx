import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

export default function CouponInput({ subtotal, onApply, onRemove, appliedCoupon }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleApply(e) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', c)
      .eq('is_active', true)
      .maybeSingle();

    setLoading(false);

    if (error || !data) {
      toast.error('Invalid or expired coupon code');
      return;
    }

    // Validate dates
    const now = new Date();
    if (data.valid_from && new Date(data.valid_from) > now) {
      toast.error('This coupon is not active yet');
      return;
    }
    if (data.valid_until && new Date(data.valid_until) < now) {
      toast.error('This coupon has expired');
      return;
    }

    // Min order
    if (subtotal < data.min_order_amount) {
      toast.error(`Minimum order ₹${data.min_order_amount} required`);
      return;
    }

    // Usage limit
    if (data.usage_limit && data.used_count >= data.usage_limit) {
      toast.error('This coupon has reached its usage limit');
      return;
    }

    // Calculate discount
    let discount = 0;
    if (data.discount_type === 'percent') {
      discount = (subtotal * data.discount_value) / 100;
      if (data.max_discount) discount = Math.min(discount, data.max_discount);
    } else {
      discount = Number(data.discount_value);
    }
    discount = Math.min(discount, subtotal);

    onApply({ code: data.code, discount, description: data.description });
    toast.success(`Coupon applied! You saved ₹${discount.toFixed(0)} 🎉`);
    setCode('');
  }

  if (appliedCoupon) {
    return (
      <div className="coupon-applied">
        <div className="coupon-applied-left">
          <span className="coupon-check">✓</span>
          <div>
            <strong>{appliedCoupon.code}</strong>
            <span>{appliedCoupon.description}</span>
          </div>
        </div>
        <div className="coupon-applied-right">
          <span className="coupon-saving">−₹{appliedCoupon.discount.toFixed(0)}</span>
          <button className="coupon-remove" onClick={onRemove}>✕</button>
        </div>
      </div>
    );
  }

  return (
    <form className="coupon-form" onSubmit={handleApply}>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter coupon code"
        className="coupon-input"
        disabled={loading}
      />
      <button type="submit" className="coupon-btn" disabled={loading || !code.trim()}>
        {loading ? '...' : 'Apply'}
      </button>
    </form>
  );
}