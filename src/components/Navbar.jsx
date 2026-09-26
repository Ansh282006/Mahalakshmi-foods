import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useWishlist from '../hooks/useWishlist';
import Sidebar from './Sidebar';

export default function Navbar() {
  const { getItemCount, openDrawer } = useCart();
  const { user, isAdmin } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleCartClick = () => {
    openDrawer();
  };

  const handleAdminClick = () => {
    if (user && isAdmin) {
      navigate('/admin/dashboard');
    }
  };

  return (
    <>
      <nav className={`topbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="topbar-inner">
          {/* Left: Menu button */}
          <button
            className="topbar-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <span></span>
            <span></span>
            <span></span>
            <span className="topbar-menu-label">MENU</span>
          </button>

          {/* Center: Logo */}
          <Link to="/" className="topbar-logo">
            <span className="topbar-logo-name">MAHALAXMI</span>
            <span className="topbar-logo-sub">CHIPS</span>
          </Link>

          {/* Right: Actions */}
          <div className="topbar-actions">
            {user && isAdmin ? (
              <button
                className="topbar-action-btn admin"
                onClick={handleAdminClick}
                aria-label="Admin Panel"
              >
                Admin
              </button>
            ) : (
              <Link to="/track" className="topbar-action-btn">
                Track
              </Link>
            )}

            <Link
              to="/wishlist"
              className="topbar-action-btn"
              aria-label="Wishlist"
            >
              Saved
              {wishlistCount > 0 && (
                <span className="topbar-badge">{wishlistCount}</span>
              )}
            </Link>

            <button
              className="topbar-action-btn cart"
              onClick={handleCartClick}
              aria-label="Open cart"
            >
              Cart
              {getItemCount() > 0 && (
                <span className="topbar-badge">{getItemCount()}</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}