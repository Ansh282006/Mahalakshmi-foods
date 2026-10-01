import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import useRewards from '../hooks/useRewards';

export default function MyRewards() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { referralCode, referrals, points, pointsHistory, walletBalance, loading } = useRewards();
  const [copied, setCopied] = useState(false);

  if (authLoading) {
    return (
      <div className="prem-page">
        <div className="prem-empty-cart">
          <p className="prem-empty-cart-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const copyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('Referral code copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const msg = `Mahalaxmi Chips\n\nI am sharing my referral code: ${referralCode}\n\nSign up using it and get 500 loyalty points (Rs. 50 off on your first order).\n\nShop fresh, authentic chips at mahalakshmi-foods.vercel.app/signup?ref=${referralCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const redeemableValue = Math.floor(points / 100) * 50;

  return (
    <div className="prem-page">
      <section className="prem-hero">
        <div className="prem-hero-inner">
          <span className="prem-kicker">MY REWARDS</span>
          <h1 className="prem-hero-title">
            Earn, refer, and <em>save.</em>
          </h1>
          <p className="prem-hero-sub">
            Every rupee you spend earns loyalty points. Every friend you refer
            earns both of you a bonus. Points never expire.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="prem-empty-cart">
          <p className="prem-empty-cart-text">Loading your rewards...</p>
        </div>
      ) : (
        <>
          <div className="prem-rewards-stats">
            <div className="prem-reward-stat">
              <span className="prem-reward-stat-label">Loyalty Points</span>
              <span className="prem-reward-stat-value">{points}</span>
              <span className="prem-reward-stat-sub">Redeemable value: ₹{redeemableValue}</span>
            </div>
            <div className="prem-reward-stat">
              <span className="prem-reward-stat-label">Wallet Balance</span>
              <span className="prem-reward-stat-value">₹{walletBalance.toFixed(0)}</span>
              <span className="prem-reward-stat-sub">Usable on any order</span>
            </div>
            <div className="prem-reward-stat">
              <span className="prem-reward-stat-label">Friends Referred</span>
              <span className="prem-reward-stat-value">{referrals.length}</span>
              <span className="prem-reward-stat-sub">500 points per friend</span>
            </div>
          </div>

          {/* REFERRAL */}
          <section className="prem-rewards-section">
            <div className="prem-rewards-section-head">
              <span className="prem-kicker">REFERRAL PROGRAM</span>
              <h2 className="prem-section-title">Refer a friend.<br /><em>Both of you get ₹50.</em></h2>
              <p className="prem-rewards-desc">
                Share your unique code. When a friend signs up, both of you receive
                500 loyalty points — that is ₹50 off your next order.
              </p>
            </div>

            <div className="prem-referral-box">
              <span className="prem-referral-label">Your Referral Code</span>
              <div className="prem-referral-value">{referralCode || '—'}</div>
              <div className="prem-referral-actions">
                <button className="prem-btn-primary" onClick={copyCode}>
                  {copied ? 'Copied' : 'Copy Code'}
                </button>
                <button className="prem-btn-primary prem-btn-gold" onClick={shareWhatsApp}>
                  Share on WhatsApp
                </button>
              </div>
            </div>

            {referrals.length > 0 && (
              <div className="prem-referral-history">
                <h3 className="prem-rewards-h3">Your Referrals</h3>
                {referrals.map((r) => (
                  <div key={r.id} className="prem-referral-history-row">
                    <div>
                      <strong>{r.referee_email || 'Friend'}</strong>
                      <span>{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    <span className="prem-referral-history-points">+{r.reward_points}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* POINTS HISTORY */}
          <section className="prem-rewards-section">
            <div className="prem-rewards-section-head">
              <span className="prem-kicker">ACTIVITY</span>
              <h2 className="prem-section-title">Points <em>History.</em></h2>
            </div>

            {pointsHistory.length === 0 ? (
              <div className="prem-rewards-empty">
                <p>No activity yet. Start shopping to earn your first points.</p>
                <Link to="/shop" className="prem-btn-primary">Start Shopping</Link>
              </div>
            ) : (
              <div className="prem-points-history">
                {pointsHistory.map((p) => (
                  <div key={p.id} className="prem-points-history-row">
                    <div className="prem-points-history-info">
                      <strong>{p.type === 'earned' ? 'Earned' : 'Redeemed'} — {p.source}</strong>
                      <span>{p.description}</span>
                      <span className="prem-points-history-date">
                        {new Date(p.created_at).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span className={`prem-points-badge ${p.type}`}>
                      {p.type === 'earned' ? '+' : '−'}{p.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* HOW IT WORKS */}
          <section className="prem-rewards-section">
            <div className="prem-rewards-section-head">
              <span className="prem-kicker">HOW IT WORKS</span>
              <h2 className="prem-section-title">Three ways to <em>save.</em></h2>
            </div>

            <div className="prem-how-grid">
              <div className="prem-how-card">
                <div className="prem-how-num">01</div>
                <h3>Earn Points</h3>
                <p>Get 1 point for every ₹10 you spend. Points are added once your order is delivered.</p>
              </div>
              <div className="prem-how-card">
                <div className="prem-how-num">02</div>
                <h3>Refer Friends</h3>
                <p>Share your code. When a friend signs up, you both get 500 points instantly.</p>
              </div>
              <div className="prem-how-card">
                <div className="prem-how-num">03</div>
                <h3>Redeem at Checkout</h3>
                <p>Use points at checkout. 100 points = ₹50 off. No minimum order required.</p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}