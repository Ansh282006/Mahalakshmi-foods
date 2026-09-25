import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';

export default function ReviewsModal({ product, onClose }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverStar, setHoverStar] = useState(0);

  useEffect(() => {
    loadReviews();
    if (user) checkEligibility();
  }, [product.id, user]);

  async function loadReviews() {
    setLoading(true);
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false });
    setReviews(data || []);
    setLoading(false);
  }

  async function checkEligibility() {
    // Has the user bought this product?
    const { data: purchased } = await supabase
      .from('order_items')
      .select('order_id, orders!inner(user_id)')
      .eq('product_id', product.id)
      .eq('orders.user_id', user.id)
      .limit(1);

    const bought = (purchased || []).length > 0;

    // Has the user already reviewed?
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', product.id)
      .eq('user_id', user.id)
      .limit(1);

    setAlreadyReviewed((existing || []).length > 0);
    setCanReview(bought && (existing || []).length === 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please write a short review');
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from('reviews').insert({
      product_id: product.id,
      user_id: user.id,
      customer_name: user.user_metadata?.full_name || 'Customer',
      rating: Number(rating),
      comment: comment.trim(),
    });

    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Thank you for your review! ⭐');
    setCanReview(false);
    setAlreadyReviewed(true);
    setRating(5);
    setComment('');
    loadReviews();
  }

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content reviews-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Reviews</h2>
            <p className="modal-subtitle">{product.name} · {product.weight}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Summary */}
        <div className="reviews-summary">
          <div className="reviews-summary-left">
            <div className="reviews-big-rating">
              {avgRating > 0 ? avgRating.toFixed(1) : '—'}
            </div>
            <StarRating value={avgRating} size="1.3rem" />
            <p className="reviews-count">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          <div className="reviews-summary-right">
            {ratingCounts.map(({ star, count }) => {
              const pct = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="rating-bar-row">
                  <span className="rating-bar-label">{star}★</span>
                  <div className="rating-bar-track">
                    <div className="rating-bar-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="rating-bar-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review form */}
        {user && canReview && (
          <form className="review-form" onSubmit={handleSubmit}>
            <h3>Write a Review</h3>
            <p className="review-form-note">✅ Verified buyer — you can review this product</p>

            <div className="star-picker">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`star-pick ${(hoverStar || rating) >= s ? 'active' : ''}`}
                  onMouseEnter={() => setHoverStar(s)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => setRating(s)}
                >
                  ★
                </button>
              ))}
              <span className="star-pick-label">{rating} / 5</span>
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you think of the chips? Taste, freshness, packaging..."
              rows="3"
              required
            />

            <button type="submit" className="review-submit-btn" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {user && alreadyReviewed && (
          <div className="review-verified-note">
            ✅ You've already reviewed this product. Thank you!
          </div>
        )}

        {!user && (
          <div className="review-login-note">
            🔒 Please <a href="/login">sign in</a> to leave a review.
          </div>
        )}

        {user && !canReview && !alreadyReviewed && (
          <div className="review-not-buyer-note">
            🛒 Only verified buyers can leave reviews. Order this product to share your experience!
          </div>
        )}

        {/* Reviews list */}
        <div className="reviews-list">
          {loading ? (
            <p className="reviews-loading">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <div className="reviews-empty">
              <div className="empty-icon">💬</div>
              <p>No reviews yet. Be the first to share your experience!</p>
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="review-item">
                <div className="review-item-header">
                  <div className="review-avatar">
                    {(r.customer_name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong>{r.customer_name}</strong>
                    <div className="review-meta">
                      <StarRating value={r.rating} size="0.85rem" />
                      <span className="review-date">
                        {new Date(r.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="review-comment">{r.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}