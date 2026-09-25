import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function PincodeChecker({ compact = false, onServiceable }) {
  const [pincode, setPincode] = useState('');
  const [status, setStatus] = useState(null);
  // status: null | 'checking' | 'yes' | 'no' | 'error'
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    const pin = pincode.trim();
    if (!/^\d{6}$/.test(pin)) {
      setStatus('error');
      setResult({ message: 'Please enter a valid 6-digit pincode.' });
      return;
    }

    setStatus('checking');
    setResult(null);

    const { data, error } = await supabase
      .from('serviceable_pincodes')
      .select('*')
      .eq('pincode', pin)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      setStatus('error');
      setResult({ message: 'Something went wrong. Please try again.' });
      return;
    }

    if (data) {
      setStatus('yes');
      setResult({
        area: data.area,
        days: data.delivery_days,
      });
      if (onServiceable) onServiceable(true, pin);
    } else {
      setStatus('no');
      setResult({
        message: "Sorry, we don't deliver here yet.",
      });
      if (onServiceable) onServiceable(false, pin);
    }
  };

  return (
    <div className={`pincode-checker ${compact ? 'compact' : ''}`}>
      {!compact && (
        <div className="pincode-header">
          <span className="pincode-icon">📍</span>
          <div>
            <h4>Delivery Availability</h4>
            <p className="pincode-subtitle">
              Check if we deliver to your pincode
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleCheck} className="pincode-form">
        <input
          type="text"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter 6-digit pincode"
          className="pincode-input"
          maxLength={6}
        />
        <button
          type="submit"
          className="pincode-btn"
          disabled={status === 'checking' || pincode.length !== 6}
        >
          {status === 'checking' ? '...' : 'Check'}
        </button>
      </form>

      {status === 'yes' && result && (
        <div className="pincode-result success">
          <span className="result-icon">✅</span>
          <div>
            <strong>We deliver to {result.area}!</strong>
            <span>Estimated delivery in {result.days} {result.days === 1 ? 'day' : 'days'}</span>
          </div>
        </div>
      )}

      {status === 'no' && result && (
        <div className="pincode-result fail">
          <span className="result-icon">❌</span>
          <div>
            <strong>{result.message}</strong>
            <span>Call us at 7774982725 to check if we can arrange delivery</span>
          </div>
        </div>
      )}

      {status === 'error' && result && (
        <div className="pincode-result warn">
          <span className="result-icon">⚠️</span>
          <div>
            <strong>{result.message}</strong>
          </div>
        </div>
      )}
    </div>
  );
}