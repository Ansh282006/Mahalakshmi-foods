import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function ThreeDotMenu({ variant = 'default' }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, isAdmin, signOut } = useAuth();
  const { openDrawer } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const close = () => setOpen(false);

  const handleSignOut = async () => {
    close();
    await signOut();
    navigate('/');
  };

  const handleCart = () => {
    close();
    openDrawer();
  };

  return (
    <div className={`three-dot ${variant === 'landing' ? 'three-dot-landing' : ''}`} ref={menuRef}>
      <button
        className={`three-dot-btn ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {open && (
        <>
          <div className="three-dot-overlay" onClick={close}></div>
          <nav className="three-dot-menu">
            <div className="tdm-header">
              <span className="tdm-header-kicker">MENU</span>
            </div>

            <div className="tdm-section">
              <Link to="/" className="tdm-item" onClick={close}>
                <span className="tdm-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" />
                  </svg>
                </span>
                <span className="tdm-label">Home</span>
              </Link>

              <Link to="/shop" className="tdm-item" onClick={close}>
                <span className="tdm-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l1-5h16l1 5" />
                    <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <path d="M9 21V13h6v8" />
                  </svg>
                </span>
                <span className="tdm-label">Shop</span>
              </Link>

              <Link to="/products" className="tdm-item" onClick={close}>
                <span className="tdm-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </span>
                <span className="tdm-label">All Products</span>
              </Link>

              <button className="tdm-item" onClick={handleCart}>
                <span className="tdm-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </span>
                <span className="tdm-label">Cart</span>
              </button>

              <Link to="/track" className="tdm-item" onClick={close}>
                <span className="tdm-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="10" r="3" />
                    <path d="M12 21s-8-7.5-8-12a8 8 0 1 1 16 0c0 4.5-8 12-8 12z" />
                  </svg>
                </span>
                <span className="tdm-label">Track Order</span>
              </Link>

              <Link to="/bulk-order" className="tdm-item" onClick={close}>
                <span className="tdm-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <path d="M3.27 6.96L12 12.01l8.73-5.05" />
                    <path d="M12 22.08V12" />
                  </svg>
                </span>
                <span className="tdm-label">Bulk Order</span>
              </Link>
            </div>

            <div className="tdm-divider"></div>

            <div className="tdm-section">
              {!user && (
                <>
                  <Link to="/login" className="tdm-item" onClick={close}>
                    <span className="tdm-icon">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                    </span>
                    <span className="tdm-label">Customer Login</span>
                  </Link>
                  <Link to="/signup" className="tdm-item" onClick={close}>
                    <span className="tdm-icon">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                      </svg>
                    </span>
                    <span className="tdm-label">Create Account</span>
                  </Link>
                </>
              )}

              {user && !isAdmin && (
                <Link to="/my-orders" className="tdm-item" onClick={close}>
                  <span className="tdm-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </span>
                  <span className="tdm-label">My Orders</span>
                </Link>
              )}

              {user && (
                <button className="tdm-item tdm-item-danger" onClick={handleSignOut}>
                  <span className="tdm-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </span>
                  <span className="tdm-label">Sign Out</span>
                </button>
              )}
            </div>

            <div className="tdm-divider"></div>

            <div className="tdm-section">
              <Link to="/admin" className="tdm-item tdm-item-admin" onClick={close}>
                <span className="tdm-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <span className="tdm-label">Admin Login</span>
              </Link>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}