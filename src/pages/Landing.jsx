import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import ThreeDotMenu from '../components/ThreeDotMenu';

export default function Landing() {
  const [products, setProducts] = useState([]);
  const { addToCart, openDrawer } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchFeatured() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .gt('stock', 0)
        .limit(4);
      setProducts(data || []);
    }
    fetchFeatured();
  }, []);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    addToCart(product);
    openDrawer();
  };

  return (
    <div className="landing">
      {/* Top Bar - Minimal */}
      <header className="landing-topbar">
        <ThreeDotMenu variant="landing" />
        <Link to="/" className="landing-logo">
          <span className="landing-logo-mark">M</span>
          <span className="landing-logo-text">
            MAHALAXMI<em>CHIPS</em>
          </span>
        </Link>
        <nav className="landing-nav">
          <Link to="/shop">Shop</Link>
          <Link to="/bulk-order">Bulk Orders</Link>
          <Link to="/track">Track Order</Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero-landing">
        <div className="hero-landing-bg" aria-hidden="true">
          <div className="hero-grain"></div>
          <div className="hero-glow hero-glow-a"></div>
          <div className="hero-glow hero-glow-b"></div>
        </div>

        <div className="hero-landing-inner">
          <div className="hero-eyebrow">
            <span className="eyebrow-line"></span>
            <span>ESTABLISHED IN KOLHAPUR</span>
            <span className="eyebrow-line"></span>
          </div>

          <h1 className="hero-landing-title">
            <span className="hero-line">The <em>Real</em> Taste</span>
            <span className="hero-line">of Kolhapur,</span>
            <span className="hero-line">Fried Fresh <em>Daily.</em></span>
          </h1>

          <p className="hero-landing-sub">
            Hand-cut banana and jackfruit chips, made in small batches with
            coconut oil and traditional spice blends. No preservatives. No shortcuts.
          </p>

          <div className="hero-landing-cta">
            <Link to="/shop" className="btn-primary-landing">
              <span>Explore the Collection</span>
              <span className="btn-arrow">→</span>
            </Link>
            <Link to="/bulk-order" className="btn-ghost-landing">
              <span>Bulk & Weddings</span>
            </Link>
          </div>

          <div className="hero-trust-row">
            <div className="trust-item">
              <span className="trust-num">FSSAI</span>
              <span className="trust-label">Certified Kitchen</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <span className="trust-num">100%</span>
              <span className="trust-label">Natural Ingredients</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <span className="trust-num">24hr</span>
              <span className="trust-label">Kolhapur Delivery</span>
            </div>
          </div>
        </div>

        {/* Floating product images */}
        {products[0] && (
          <div className="hero-float hero-float-1">
            <img src={products[0].image_url} alt={products[0].name} />
          </div>
        )}
        {products[1] && (
          <div className="hero-float hero-float-2">
            <img src={products[1].image_url} alt={products[1].name} />
          </div>
        )}
        {products[2] && (
          <div className="hero-float hero-float-3">
            <img src={products[2].image_url} alt={products[2].name} />
          </div>
        )}
      </section>

      {/* MARQUEE STRIP */}
      <div className="landing-strip">
        <div className="strip-track">
          {[1, 2, 3].map((i) => (
            <div key={i} className="strip-group">
              <span>Hand-Cut Daily</span>
              <span className="strip-dot"></span>
              <span>No Preservatives</span>
              <span className="strip-dot"></span>
              <span>Coconut Oil Fried</span>
              <span className="strip-dot"></span>
              <span>Delivered Fresh</span>
              <span className="strip-dot"></span>
              <span>Made in Kolhapur</span>
              <span className="strip-dot"></span>
            </div>
          ))}
        </div>
      </div>

      {/* STORY SECTION */}
      <section className="story-section">
        <div className="story-grid">
          <div className="story-text">
            <span className="section-kicker">Our Story</span>
            <h2 className="section-title-landing">
              Three generations of <em>one recipe</em>.
            </h2>
            <p>
              Mahalaxmi Krushi Prakriya Udyog began in a small home kitchen in
              Gavase, Ajara — with nothing but a cast-iron wok, a family recipe,
              and a promise to never compromise.
            </p>
            <p>
              Today, we still make every batch the same way. Hand-cut bananas.
              Fresh coconut oil. And the same spice blend our grandfather
              perfected over forty years ago.
            </p>
            <Link to="/shop" className="btn-text-landing">
              Taste the tradition <span>→</span>
            </Link>
          </div>
          <div className="story-visual">
            {products[3] ? (
              <img src={products[3].image_url} alt="Traditional chips" />
            ) : (
              <div className="story-placeholder"></div>
            )}
            <div className="story-badge">
              <div className="story-badge-num">18+</div>
              <div className="story-badge-text">Years of<br />Experience</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="featured-section">
        <div className="section-header-row">
          <div>
            <span className="section-kicker">Featured</span>
            <h2 className="section-title-landing">
              Our <em>Signature</em> Batch
            </h2>
          </div>
          <Link to="/shop" className="btn-text-landing">
            View all products <span>→</span>
          </Link>
        </div>

        <div className="featured-grid-landing">
          {products.map((product) => (
            <article key={product.id} className="featured-card-landing">
              <Link to="/shop" className="featured-media">
                <img src={product.image_url} alt={product.name} />
              </Link>
              <div className="featured-body">
                <span className="featured-cat">{product.category}</span>
                <h3>{product.name}</h3>
                <p className="featured-weight">{product.weight}</p>
                <div className="featured-foot">
                  <span className="featured-price">₹{product.price}</span>
                  <button
                    className="featured-add"
                    onClick={(e) => handleAddToCart(e, product)}
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section className="why-section">
        <div className="why-inner">
          <span className="section-kicker section-kicker-light">Why Mahalaxmi</span>
          <h2 className="section-title-landing section-title-light">
            Three reasons families keep coming back.
          </h2>

          <div className="why-grid">
            <div className="why-card">
              <div className="why-num">01</div>
              <h3>Fried Fresh, Every Morning</h3>
              <p>
                Every batch is fried the same day it ships. If it doesn't taste
                like it just came out of the wok, we don't send it.
              </p>
            </div>
            <div className="why-card">
              <div className="why-num">02</div>
              <h3>Nothing Artificial. Ever.</h3>
              <p>
                No preservatives, no artificial flavors, no MSG. Just bananas,
                jackfruit, coconut oil, salt, and time.
              </p>
            </div>
            <div className="why-card">
              <div className="why-num">03</div>
              <h3>Made for Your Family</h3>
              <p>
                Our chips are made to be shared. That's why every pack is
                sealed for freshness and delivered within 24 hours in Kolhapur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BULK CTA */}
      <section className="bulk-cta-landing">
        <div className="bulk-cta-inner">
          <div className="bulk-cta-text">
            <span className="section-kicker section-kicker-light">For Weddings & Events</span>
            <h2 className="section-title-landing section-title-light">
              Ordering in bulk? <em>We've got you.</em>
            </h2>
            <p>
              Weddings, corporate events, festivals, and resellers —
              we offer custom packaging, advance scheduling, and dedicated
              support for orders above 10kg.
            </p>
            <Link to="/bulk-order" className="btn-primary-landing btn-primary-light">
              <span>Request a Bulk Quote</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
          <div className="bulk-cta-visual">
            <div className="bulk-stat">
              <span className="bulk-stat-num">50kg+</span>
              <span className="bulk-stat-label">Minimum for Bulk</span>
            </div>
            <div className="bulk-stat">
              <span className="bulk-stat-num">48hr</span>
              <span className="bulk-stat-label">Advance Notice</span>
            </div>
            <div className="bulk-stat">
              <span className="bulk-stat-num">Pan-India</span>
              <span className="bulk-stat-label">Shipping Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* VISIT US */}
      <section className="visit-section">
        <div className="visit-grid">
          <div className="visit-item">
            <span className="visit-label">Visit the Kitchen</span>
            <p>A/p. Gavase, Tal. Ajara<br />Dist. Kolhapur, MH 416505</p>
          </div>
          <div className="visit-item">
            <span className="visit-label">Call or WhatsApp</span>
            <p>
              <a href="tel:+917774982725">+91 77749 82725</a><br />
              <a href="tel:+919168843668">+91 91688 43668</a>
            </p>
          </div>
          <div className="visit-item">
            <span className="visit-label">Open Hours</span>
            <p>Monday – Saturday<br />9:00 AM – 8:00 PM</p>
          </div>
        </div>
      </section>

      {/* BACK TO TOP */}
      <button
        className="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <span className="btt-arrow">↑</span>
        <span className="btt-label">Back to Top</span>
      </button>

      {/* FULL FOOTER */}
      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-cols">
            {/* Column 1: Shop */}
            <div className="footer-col">
              <h4 className="footer-col-title">Shop</h4>
              <ul>
                <li><Link to="/shop">All Products</Link></li>
                <li><Link to="/products">Banana Chips</Link></li>
                <li><Link to="/products">Jackfruit Chips</Link></li>
                <li><Link to="/products">Combo Packs</Link></li>
                <li><Link to="/shop">Best Sellers</Link></li>
                <li><Link to="/shop">New Arrivals</Link></li>
              </ul>
            </div>

            {/* Column 2: Orders */}
            <div className="footer-col">
              <h4 className="footer-col-title">Orders & Delivery</h4>
              <ul>
                <li><Link to="/track">Track Your Order</Link></li>
                <li><Link to="/my-orders">My Orders</Link></li>
                <li><Link to="/bulk-order">Bulk Enquiry</Link></li>
                <li><Link to="/cart">Shopping Cart</Link></li>
                <li><Link to="/checkout">Checkout</Link></li>
                <li><Link to="/rewards">My Rewards</Link></li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div className="footer-col">
              <h4 className="footer-col-title">Company</h4>
              <ul>
                <li><Link to="/">Our Story</Link></li>
                <li><Link to="/">Kitchen Location</Link></li>
                <li><Link to="/">FSSAI Certification</Link></li>
                <li><Link to="/">Wholesale Enquiry</Link></li>
                <li><Link to="/">Careers</Link></li>
                <li><Link to="/">Press</Link></li>
              </ul>
            </div>

            {/* Column 4: Support */}
            <div className="footer-col">
              <h4 className="footer-col-title">Help & Support</h4>
              <ul>
                <li><a href="tel:+917774982725">Call: 7774982725</a></li>
                <li><a href="tel:+919168843668">Call: 9168843668</a></li>
                <li><a href="https://wa.me/917774982725" target="_blank" rel="noopener noreferrer">WhatsApp Support</a></li>
                <li><Link to="/">Shipping Policy</Link></li>
                <li><Link to="/">Return & Refunds</Link></li>
                <li><Link to="/">Contact Us</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* BRAND BAR */}
        <div className="footer-brand-bar">
          <div className="footer-brand-inner">
            <div className="footer-brand-lockup">
              <span className="footer-mark">M</span>
              <div>
                <div className="footer-brand-name">MAHALAXMI CHIPS</div>
                <div className="footer-brand-sub">KRUSHI PRAKRIYA UDYOG</div>
              </div>
            </div>

            <div className="footer-badges">
              <span className="footer-badge">FSSAI 21519267000110</span>
              <span className="footer-badge">100% Natural</span>
              <span className="footer-badge">Made in Kolhapur</span>
            </div>
          </div>
        </div>

        {/* LEGAL BAR */}
        <div className="footer-legal">
          <div className="footer-legal-inner">
            <div className="footer-legal-links">
              <Link to="/">Conditions of Use</Link>
              <Link to="/">Privacy Notice</Link>
              <Link to="/">Interest-Based Ads</Link>
              <Link to="/">Terms & Conditions</Link>
            </div>
            <div className="footer-legal-copy">
              © {new Date().getFullYear()} Mahalaxmi Krushi Prakriya Udyog. All rights reserved.
            </div>
            <div className="footer-legal-address">
              A/p. Gavase, Tal. Ajara, Dist. Kolhapur, Maharashtra 416505 · India
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}