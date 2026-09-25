import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { getItemCount, openDrawer } = useCart();
  const location = useLocation();
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
            Home
          </Link>
          <Link to="/products" className={location.pathname === '/products' ? 'active' : ''}>
            Products
          </Link>
          <Link to="/track" className={location.pathname === '/track' ? 'active' : ''}>
            Track Order
          </Link>
          <button className="cart-link" onClick={handleCartClick} aria-label="Open cart">
            🛒 Cart {getItemCount() > 0 && <span className="cart-badge">{getItemCount()}</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}