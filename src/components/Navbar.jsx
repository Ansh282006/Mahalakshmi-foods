import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useWishlist from '../hooks/useWishlist';
import usePendingOrders from '../hooks/usePendingOrders';
import Sidebar from './Sidebar';

export default function Navbar() {
  const { getItemCount, openDrawer } = useCart();
  const { user, isAdmin } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { pending, unseen, markAsSeen } = usePendingOrders();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAdminClick = () => {
    markAsSeen();
    navigate('/admin/dashboard');
  };

  return (
    <>
      <nav className={`topbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="topbar-inner">
          <button
            className="topbar-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <span></span>
            <span></span>
            <span></span>
            <span className="topbar-menu-label">{t('nav.menu')}</span>
          </button>

          <Link to="/" className="topbar-logo">
            <span className="topbar-logo-name">MAHALAXMI</span>
            <span className="topbar-logo-sub">CHIPS</span>
          </Link>

          <div className="topbar-actions">
            {user && isAdmin ? (
              <button
                className="topbar-action-btn admin"
                onClick={handleAdminClick}
                style={{ position: 'relative' }}
              >
                {t('nav.adminPanel')}
                {unseen > 0 && (
                  <span className="topbar-notification-badge">{unseen}</span>
                )}
                {unseen === 0 && pending > 0 && (
                  <span className="topbar-pending-badge">{pending}</span>
                )}
              </button>
            ) : (
              <Link to="/track" className="topbar-action-btn">
                {t('nav.track')}
              </Link>
            )}

            <Link to="/wishlist" className="topbar-action-btn">
              {t('nav.saved')}
              {wishlistCount > 0 && (
                <span className="topbar-badge">{wishlistCount}</span>
              )}
            </Link>

            <button
              className="topbar-action-btn cart"
              onClick={openDrawer}
              aria-label="Open cart"
            >
              {t('nav.cart')}
              {getItemCount() > 0 && (
                <span className="topbar-badge">{getItemCount()}</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
