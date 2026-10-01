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

    if (error || !data) return toast.error('Invalid or expired coupon code');

    const now = new Date();
    if (data.valid_from && new Date(data.valid_from) > now) return toast.error('Coupon is not active yet');
    if (data.valid_until && new Date(data.valid_until) < now) return toast.error('Coupon has expired');
    if (subtotal < data.min_order_amount) return toast.error(`Minimum order ₹${data.min_order_amount} required`);
    if (data.usage_limit && data.used_count >= data.usage_limit) return toast.error('Coupon usage limit reached');

    let discount = 0;
    if (data.discount_type === 'percent') {
      discount = (subtotal * data.discount_value) / 100;
      if (data.max_discount) discount = Math.min(discount, data.max_discount);
    } else {
      discount = Number(data.discount_value);
    }
    discount = Math.min(discount, subtotal);

    onApply({ code: data.code, discount, description: data.description });
    toast.success(`Coupon applied — saved ₹${discount.toFixed(0)}`);
    setCode('');
  }

  if (appliedCoupon) {
    return (
      <div className="prem-coupon-applied">
        <div>
          <span className="prem-coupon-applied-code">{appliedCoupon.code}</span>
          <span className="prem-coupon-applied-desc">{appliedCoupon.description}</span>
        </div>
        <div className="prem-coupon-applied-right">
          <span className="prem-coupon-applied-saving">−₹{appliedCoupon.discount.toFixed(0)}</span>
          <button className="prem-coupon-applied-remove" onClick={onRemove} aria-label="Remove coupon">
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="prem-coupon" onSubmit={handleApply}>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter coupon code"
        disabled={loading}
      />
      <button type="submit" className="prem-coupon-btn" disabled={loading || !code.trim()}>
        {loading ? '...' : 'Apply'}
      </button>
    </form>
  );
}