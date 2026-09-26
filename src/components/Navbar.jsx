import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useWishlist from '../hooks/useWishlist';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { getItemCount, openDrawer } = useCart();
  const { user, signOut, isAdmin } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleCartClick = () => {
    setMenuOpen(false);
    openDrawer();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className={`navbar-glass ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🌿</span>
          <span className="logo-text">Mahalaxmi Chips</span>
        </Link>

        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`nav-links ${menuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            {t('nav.home')}
          </Link>

          <Link
            to="/products"
            className={location.pathname === '/products' ? 'active' : ''}
          >
            {t('nav.products')}
          </Link>

          <Link
            to="/track"
            className={location.pathname === '/track' ? 'active' : ''}
          >
            {t('nav.track')}
          </Link>

          {/* Wishlist Link */}
          <Link
            to="/wishlist"
            className={location.pathname === '/wishlist' ? 'active' : ''}
          >
            🤍 Wishlist{' '}
            {wishlistCount > 0 && <span className="cart-badge">{wishlistCount}</span>}
          </Link>

          {/* Bulk Order Link */}
          <Link
            to="/bulk-order"
            className={location.pathname === '/bulk-order' ? 'active' : ''}
          >
            📦 Bulk Order
          </Link>

          {user && !isAdmin && (
            <Link
              to="/my-orders"
              className={location.pathname === '/my-orders' ? 'active' : ''}
            >
              {t('nav.myOrders')}
            </Link>
          )}

          {!user && (
            <Link
              to="/login"
              className={location.pathname === '/login' ? 'active' : ''}
            >
              {t('nav.login')}
            </Link>
          )}

          {user && isAdmin && (
            <Link to="/admin/dashboard" className="nav-admin-btn">
              <span className="nav-admin-icon">⚙</span>
              {t('nav.adminPanel')}
            </Link>
          )}

          {user && (
            <button
              className="nav-account-btn"
              onClick={handleSignOut}
              title={user.email}
            >
              {t('nav.signOut')}
            </button>
          )}

          <LanguageSwitcher />

          <button
            className="cart-link"
            onClick={handleCartClick}
            aria-label="Open cart"
          >
            🛒 {t('nav.cart')}
            {getItemCount() > 0 && (
              <span className="cart-badge">{getItemCount()}</span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}