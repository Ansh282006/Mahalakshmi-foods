import { useState } from 'react';
import toast from 'react-hot-toast';

const SITE_URL = 'https://mahalakshmi-foods.vercel.app';

export default function ShareButton({ product }) {
  const [open, setOpen] = useState(false);

  const productUrl = `${SITE_URL}/products`;
  const shareText = `Check out ${product.name} (${product.weight}) at Mahalaxmi Chips — only ₹${product.price}!`;

  const handleShare = (platform, e) => {
    e.preventDefault();
    e.stopPropagation();

    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${productUrl}`)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(`${shareText}\n\n${productUrl}`);
        toast.success('Link copied to clipboard!');
        setOpen(false);
        return;
      default:
        return;
    }

    window.open(url, '_blank');
    setOpen(false);
  };

  const handleTrigger = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((v) => !v);
  };

  return (
    <div className="share-wrapper">
      <button
        className="share-trigger"
        onClick={handleTrigger}
        aria-label="Share product"
        title="Share"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="share-backdrop"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div className="share-menu" onClick={(e) => e.stopPropagation()}>
            <button className="share-item whatsapp" onClick={(e) => handleShare('whatsapp', e)}>
              WhatsApp
            </button>
            <button className="share-item facebook" onClick={(e) => handleShare('facebook', e)}>
              Facebook
            </button>
            <button className="share-item twitter" onClick={(e) => handleShare('twitter', e)}>
              Twitter
            </button>
            <button className="share-item copy" onClick={(e) => handleShare('copy', e)}>
              Copy Link
            </button>
          </div>
        </>
      )}
    </div>
  );
}
