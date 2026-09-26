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
      {active ? '❤️' : '🤍'}
    </button>
  );
}