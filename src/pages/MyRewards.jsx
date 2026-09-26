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
    return <div className="app-container"><div className="loader">Loading...</div></div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const copyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const msg = `🌿 *Mahalaxmi Chips*\n\nI'm sharing my referral code: *${referralCode}*\n\nSign up using it and get *500 loyalty points* (₹50 off on your first order)!\n\nShop fresh, authentic chips: https://mahalakshmi-foods.vercel.app/signup?ref=${referralCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const redeemableValue = Math.floor(points / 100) * 50; // 100 points = ₹50

  return (
    <div className="rewards-wrapper">
      <div className="app-container">
        <div className="rewards-header">
          <h1 className="page-title">My Rewards</h1>
          <p className="admin-subtext">
            Earn points, refer friends, save money
          </p>
        </div>

        {loading ? (
          <div className="loader">Loading rewards...</div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="rewards-stats-grid">
              <div className="reward-stat-card points">
                <span className="reward-stat-label">Loyalty Points</span>
                <span className="reward-stat-value">{points}</span>
                <span className="reward-stat-sub">
                  ≈ ₹{redeemableValue} value
                </span>
              </div>
              <div className="reward-stat-card wallet">
                <span className="reward-stat-label">Wallet Balance</span>
                <span className="reward-stat-value">₹{walletBalance.toFixed(0)}</span>
                <span className="reward-stat-sub">Usable on orders</span>
              </div>
              <div className="reward-stat-card referrals">
                <span className="reward-stat-label">Friends Referred</span>
                <span className="reward-stat-value">{referrals.length}</span>
                <span className="reward-stat-sub">500 points each</span>
              </div>
            </div>

            {/* Referral Section */}
            <div className="rewards-card referral-card">
              <h3>Refer a Friend — Get Rewarded</h3>
              <p className="rewards-desc">
                Share your unique code. When a friend signs up, both of you get
                <strong> 500 loyalty points</strong> (= ₹50 off).
              </p>

              <div className="referral-code-display">
                <div className="referral-code-label">YOUR REFERRAL CODE</div>
                <div className="referral-code-value">{referralCode || '—'}</div>
                <div className="referral-code-actions">
                  <button className="referral-copy-btn" onClick={copyCode}>
                    {copied ? 'Copied ✓' : 'Copy Code'}
                  </button>
                  <button className="referral-wa-btn" onClick={shareWhatsApp}>
                    Share on WhatsApp
                  </button>
                </div>
              </div>

              {referrals.length > 0 && (
                <div className="referral-history">
                  <h4>Your Referrals</h4>
                  {referrals.map((r) => (
                    <div key={r.id} className="referral-history-item">
                      <div>
                        <strong>{r.referee_email || 'Friend'}</strong>
                        <span>{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      <span className="referral-bonus">+{r.reward_points} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Points History */}
            <div className="rewards-card">
              <h3>Points History</h3>

              {pointsHistory.length === 0 ? (
                <div className="rewards-empty">
                  <p>No activity yet.</p>
                  <Link to="/products" className="track-shop-link">
                    Start Shopping →
                  </Link>
                </div>
              ) : (
                <div className="points-history-list">
                  {pointsHistory.map((p) => (
                    <div key={p.id} className="points-history-item">
                      <div className="points-history-info">
                        <strong>
                          {p.type === 'earned' ? 'Earned' : 'Redeemed'} — {p.source}
                        </strong>
                        <span>{p.description}</span>
                        <span className="points-history-date">
                          {new Date(p.created_at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <span className={`points-badge ${p.type}`}>
                        {p.type === 'earned' ? '+' : '−'}
                        {p.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* How it Works */}
            <div className="rewards-card how-it-works">
              <h3>How It Works</h3>
              <div className="how-grid">
                <div className="how-item">
                  <span className="how-number">01</span>
                  <strong>Earn Points</strong>
                  <p>Get 1 point for every ₹10 you spend. Points are added once your order is delivered.</p>
                </div>
                <div className="how-item">
                  <span className="how-number">02</span>
                  <strong>Refer Friends</strong>
                  <p>Share your code. When a friend signs up, you both get 500 points instantly.</p>
                </div>
                <div className="how-item">
                  <span className="how-number">03</span>
                  <strong>Redeem & Save</strong>
                  <p>Use points at checkout. 100 points = ₹50 off. No minimum order.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}