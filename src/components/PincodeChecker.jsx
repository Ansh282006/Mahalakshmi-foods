import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function PincodeChecker({ compact = false, onServiceable }) {
  const [pincode, setPincode] = useState('');
  const [status, setStatus] = useState(null);
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
      setResult({ area: data.area, days: data.delivery_days });
      if (onServiceable) onServiceable(true, pin);
    } else {
      setStatus('no');
      setResult({ message: "Sorry, we do not deliver here yet." });
      if (onServiceable) onServiceable(false, pin);
    }
  };

  return (
    <div className={`prem-pincode ${compact ? 'compact' : ''}`}>
      {!compact && (
        <div className="prem-pincode-head">
          <span className="prem-kicker">DELIVERY CHECK</span>
          <h3 className="prem-pincode-title">
            Do we deliver to <em>your area?</em>
          </h3>
        </div>
      )}

      <form onSubmit={handleCheck} className="prem-pincode-form">
        <input
          type="text"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter 6-digit pincode"
          className="prem-pincode-input"
          maxLength={6}
        />
        <button
          type="submit"
          className="prem-pincode-btn"
          disabled={status === 'checking' || pincode.length !== 6}
        >
          {status === 'checking' ? '...' : 'Check'}
        </button>
      </form>

      {status === 'yes' && result && (
        <div className="prem-pincode-result success">
          <div>
            <strong>We deliver to {result.area}</strong>
            <span>Estimated delivery in {result.days} {result.days === 1 ? 'day' : 'days'}</span>
          </div>
        </div>
      )}

      {status === 'no' && result && (
        <div className="prem-pincode-result fail">
          <div>
            <strong>{result.message}</strong>
            <span>Call us at 7774982725 to check if we can arrange delivery</span>
          </div>
        </div>
      )}

      {status === 'error' && result && (
        <div className="prem-pincode-result warn">
          <div>
            <strong>{result.message}</strong>
          </div>
        </div>
      )}
    </div>
  );
}