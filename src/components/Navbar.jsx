import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { getItemCount, openDrawer } = useCart();
  const { user, signOut, isAdmin } = useAuth();
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
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/products" className={location.pathname === '/products' ? 'active' : ''}>Products</Link>
          <Link to="/track" className={location.pathname === '/track' ? 'active' : ''}>Track Order</Link>

          {user && !isAdmin && (
            <Link to="/my-orders" className={location.pathname === '/my-orders' ? 'active' : ''}>
              My Orders
            </Link>
          )}

          {!user && (
            <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>
              Login
            </Link>
          )}

          {user && (
            <button className="nav-account-btn" onClick={handleSignOut} title={user.email}>
              Sign Out
            </button>
          )}

          <button className="cart-link" onClick={handleCartClick} aria-label="Open cart">
            🛒 Cart {getItemCount() > 0 && <span className="cart-badge">{getItemCount()}</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}