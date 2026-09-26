import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useWishlist from '../hooks/useWishlist';
import LanguageSwitcher from './LanguageSwitcher';

export default function Sidebar({ isOpen, onClose }) {
  const { getItemCount } = useCart();
  const { user, signOut, isAdmin } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // Close sidebar on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
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

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <aside className={`sidebar-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
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

        {/* Menu */}
        <nav className="sidebar-nav">
          {/* Section: Shop */}
          <div className="sidebar-section">
            <span className="sidebar-section-label">SHOP</span>
            <Link
              to="/"
              className={`sidebar-link ${isActive('/') ? 'active' : ''}`}
            >
              Home
            </Link>
            <Link
              to="/products"
              className={`sidebar-link ${isActive('/products') ? 'active' : ''}`}
            >
              Products
            </Link>
            <Link
              to="/bulk-order"
              className={`sidebar-link ${isActive('/bulk-order') ? 'active' : ''}`}
            >
              Bulk Order
            </Link>
          </div>

          {/* Section: Account */}
          <div className="sidebar-section">
            <span className="sidebar-section-label">ACCOUNT</span>

            {!user && (
              <>
                <Link
                  to="/login"
                  className={`sidebar-link ${isActive('/login') ? 'active' : ''}`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className={`sidebar-link ${isActive('/signup') ? 'active' : ''}`}
                >
                  Create Account
                </Link>
              </>
            )}

            {user && !isAdmin && (
              <Link
                to="/my-orders"
                className={`sidebar-link ${isActive('/my-orders') ? 'active' : ''}`}
              >
                My Orders
              </Link>
            )}

            {user && isAdmin && (
              <Link
                to="/admin/dashboard"
                className={`sidebar-link admin-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
              >
                Admin Panel
              </Link>
            )}

            {user && (
              <>
                <div className="sidebar-user-info">
                  <span className="sidebar-user-label">Signed in as</span>
                  <span className="sidebar-user-email">{user.email}</span>
                </div>
                <button className="sidebar-link logout" onClick={handleSignOut}>
                  Sign Out
                </button>
              </>
            )}
          </div>

          {/* Section: Support */}
          <div className="sidebar-section">
            <span className="sidebar-section-label">SUPPORT</span>
            <Link
              to="/track"
              className={`sidebar-link ${isActive('/track') ? 'active' : ''}`}
            >
              Track Order
            </Link>
            <a
              href="tel:+917774982725"
              className="sidebar-link"
              onClick={onClose}
            >
              Call Us
            </a>
            <a
              href="https://wa.me/917774982725"
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-link"
            >
              WhatsApp
            </a>
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-lang">
            <LanguageSwitcher />
          </div>

          <div className="sidebar-footer-stats">
            <Link to="/wishlist" className="sidebar-stat" onClick={onClose}>
              <span className="sidebar-stat-label">Wishlist</span>
              <span className="sidebar-stat-count">{wishlistCount}</span>
            </Link>
            <Link to="/cart" className="sidebar-stat" onClick={onClose}>
              <span className="sidebar-stat-label">Cart</span>
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