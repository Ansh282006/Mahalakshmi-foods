import useWishlist from '../hooks/useWishlist';

export default function WishlistButton({ product }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const active = isInWishlist(product.id);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <button
      className={`wishlist-btn ${active ? 'active' : ''}`}
      onClick={handleClick}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      title={active ? 'Saved' : 'Save to wishlist'}
    >
      <span className="wishlist-btn-heart">
        {active ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 3 5 6.5 5c1.74 0 3.41.81 4.5 2.09C12.09 5.81 13.76 5 15.5 5 19 5 21.5 8.5 21.5 12.5 19 16.65 12 21 12 21z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 3 5 6.5 5c1.74 0 3.41.81 4.5 2.09C12.09 5.81 13.76 5 15.5 5 19 5 21.5 8.5 21.5 12.5 19 16.65 12 21 12 21z"/>
          </svg>
        )}
      </span>
    </button>
  );
}