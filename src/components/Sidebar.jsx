import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useWishlist from '../hooks/useWishlist';
import usePendingOrders from '../hooks/usePendingOrders';
import LanguageSwitcher from './LanguageSwitcher';
import DarkModeToggle from './DarkModeToggle';

export default function Sidebar({ isOpen, onClose }) {
  const { getItemCount } = useCart();
  const { user, signOut, isAdmin } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { pending, unseen, markAsSeen } = usePendingOrders();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    onClose();
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSignOut = async () => {
    onClose();
    await signOut();
    navigate('/');
  };

  const handleAdminClick = () => {
    markAsSeen();
    onClose();
    navigate('/admin/dashboard');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar-panel ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" onClick={onClose}>
            <span className="sidebar-brand-name">MAHALAXMI</span>
            <span className="sidebar-brand-sub">KRUSHI PRAKRIYA UDYOG</span>
          </Link>
          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <span></span>
            <span></span>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <span className="sidebar-section-label">{t('nav.shop')}</span>
            <Link to="/" className={`sidebar-link ${isActive('/') ? 'active' : ''}`} onClick={onClose}>
              {t('nav.home')}
            </Link>
            <Link to="/products" className={`sidebar-link ${isActive('/products') ? 'active' : ''}`} onClick={onClose}>
              {t('nav.products')}
            </Link>
            <Link to="/bulk-order" className={`sidebar-link ${isActive('/bulk-order') ? 'active' : ''}`} onClick={onClose}>
              {t('nav.bulkOrder')}
            </Link>
          </div>

          <div className="sidebar-section">
            <span className="sidebar-section-label">{t('nav.account')}</span>

            {!user && (
              <>
                <Link to="/login" className={`sidebar-link ${isActive('/login') ? 'active' : ''}`} onClick={onClose}>
                  {t('nav.login')}
                </Link>
                <Link to="/signup" className={`sidebar-link ${isActive('/signup') ? 'active' : ''}`} onClick={onClose}>
                  {t('nav.signup')}
                </Link>
              </>
            )}

            {user && !isAdmin && (
              <>
                <Link to="/my-orders" className={`sidebar-link ${isActive('/my-orders') ? 'active' : ''}`} onClick={onClose}>
                  {t('nav.myOrders')}
                </Link>
                <Link to="/rewards" className={`sidebar-link ${isActive('/rewards') ? 'active' : ''}`} onClick={onClose}>
                  My Rewards
                </Link>
              </>
            )}

            {user && isAdmin && (
              <button
                className={`sidebar-link admin-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                onClick={handleAdminClick}
              >
                {t('nav.adminPanel')}
                {unseen > 0 && (
                  <span className="sidebar-notification-badge">{unseen}</span>
                )}
                {unseen === 0 && pending > 0 && (
                  <span className="sidebar-pending-badge">{pending}</span>
                )}
              </button>
            )}

            {user && (
              <>
                <div className="sidebar-user-info">
                  <span className="sidebar-user-label">{t('nav.signedInAs')}</span>
                  <span className="sidebar-user-email">{user.email}</span>
                </div>
                <button className="sidebar-link logout" onClick={handleSignOut}>
                  {t('nav.signOut')}
                </button>
              </>
            )}
          </div>

          <div className="sidebar-section">
            <span className="sidebar-section-label">{t('nav.support')}</span>
            <Link to="/track" className={`sidebar-link ${isActive('/track') ? 'active' : ''}`} onClick={onClose}>
              {t('nav.track')}
            </Link>
            <a href="tel:+917774982725" className="sidebar-link" onClick={onClose}>
              {t('nav.callUs')}
            </a>
            <a href="https://wa.me/917774982725" target="_blank" rel="noopener noreferrer" className="sidebar-link">
              {t('nav.whatsapp')}
            </a>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-lang">
            <LanguageSwitcher />
          </div>

          <div className="sidebar-footer-dark">
            <DarkModeToggle />
          </div>

          <div className="sidebar-footer-stats">
            <Link to="/wishlist" className="sidebar-stat" onClick={onClose}>
              <span className="sidebar-stat-label">{t('nav.wishlist')}</span>
              <span className="sidebar-stat-count">{wishlistCount}</span>
            </Link>
            <Link to="/cart" className="sidebar-stat" onClick={onClose}>
              <span className="sidebar-stat-label">{t('nav.cart')}</span>
              <span className="sidebar-stat-count">{getItemCount()}</span>
            </Link>
          </div>

          <p className="sidebar-footer-copy">
            &copy; {new Date().getFullYear()} Mahalaxmi Chips
          </p>
        </div>
      </aside>
    </>
  );
}
