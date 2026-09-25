import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { getItemCount, openDrawer } = useCart();
  const { user, signOut, isAdmin } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Scroll detection for glassmorphism
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
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
        {/* Brand logo */}
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🌿</span>
          <span className="logo-text">Mahalaxmi Chips</span>
        </Link>

        {/* Mobile hamburger */}
        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Nav links + actions */}
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

          {/* Customer: My Orders */}
          {user && !isAdmin && (
            <Link
              to="/my-orders"
              className={location.pathname === '/my-orders' ? 'active' : ''}
            >
              {t('nav.myOrders')}
            </Link>
          )}

          {/* Not logged in: Login */}
          {!user && (
            <Link
              to="/login"
              className={location.pathname === '/login' ? 'active' : ''}
            >
              {t('nav.login')}
            </Link>
          )}

          {/* Admin: Admin Panel button */}
          {user && isAdmin && (
            <Link to="/admin/dashboard" className="nav-admin-btn">
              <span className="nav-admin-icon">⚙</span>
              {t('nav.adminPanel')}
            </Link>
          )}

          {/* Sign Out */}
          {user && (
            <button
              className="nav-account-btn"
              onClick={handleSignOut}
              title={user.email}
            >
              {t('nav.signOut')}
            </button>
          )}

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Cart */}
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