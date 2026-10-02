import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ThreeDotMenu from '../components/ThreeDotMenu';

const DISTRICTS_SERVED = [
  'Kolhapur', 'Sangli', 'Satara', 'Solapur', 'Belagavi', 'Pune',
];

export default function Landing() {
  const [stats, setStats] = useState({ products: 0, retailers: 0, orders: 0 });

  useEffect(() => {
    async function fetchStats() {
      const [prodRes, retRes, ordRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_available', true),
        supabase.from('retailers').select('id', { count: 'exact', head: true }).eq('status', 'Approved'),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        products: prodRes.count || 0,
        retailers: retRes.count || 0,
        orders: ordRes.count || 0,
      });
    }
    fetchStats();
  }, []);

  return (
    <div className="landing">
      {/* TOP BAR */}
      <header className="landing-topbar">
        <ThreeDotMenu variant="landing" />
        <Link to="/" className="landing-logo">
          <span className="landing-logo-mark">M</span>
          <span className="landing-logo-text">
            MAHALAXMI<em>CHIPS</em>
          </span>
        </Link>
        <nav className="landing-nav">
          <Link to="/products">Catalog</Link>
          <Link to="/retailer-setup">Become a Retailer</Link>
          <Link to="/login">Retailer Login</Link>
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
            <span>WHOLESALE FOR RETAILERS</span>
            <span className="eyebrow-line"></span>
          </div>

          <h1 className="hero-landing-title">
            <span className="hero-line">Bulk Chips for</span>
            <span className="hero-line">Your Store,</span>
            <span className="hero-line">Delivered Fresh <em>Weekly.</em></span>
          </h1>

          <p className="hero-landing-sub">
            We supply 1kg and 5kg packs of traditional Kolhapuri banana and
            jackfruit chips to kirana stores, supermarkets, and distributors across
            Maharashtra. FSSAI certified. GST invoices. Transport dispatch.
          </p>

          <div className="hero-landing-cta">
            <Link to="/retailer-setup" className="btn-primary-landing">
              <span>Apply as Retailer</span>
              <span className="btn-arrow">→</span>
            </Link>
            <Link to="/products" className="btn-ghost-landing">
              <span>View Wholesale Catalog</span>
            </Link>
          </div>

          <div className="hero-trust-row">
            <div className="trust-item">
              <span className="trust-num">{stats.retailers || '25'}+</span>
              <span className="trust-label">Retailers Served</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <span className="trust-num">6+</span>
              <span className="trust-label">Districts Covered</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <span className="trust-num">FSSAI</span>
              <span className="trust-label">Certified Kitchen</span>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="landing-strip">
        <div className="strip-track">
          {[1, 2, 3].map((i) => (
            <div key={i} className="strip-group">
              <span>Wholesale Rates</span>
              <span className="strip-dot"></span>
              <span>1kg & 5kg Packs</span>
              <span className="strip-dot"></span>
              <span>GST Invoices</span>
              <span className="strip-dot"></span>
              <span>Transport Dispatch</span>
              <span className="strip-dot"></span>
              <span>Made in Kolhapur</span>
              <span className="strip-dot"></span>
            </div>
          ))}
        </div>
      </div>

      {/* WHO WE SERVE */}
      <section className="story-section">
        <div className="story-grid">
          <div className="story-text">
            <span className="section-kicker">WHO WE SERVE</span>
            <h2 className="section-title-landing">
              Built for <em>retailers</em> like you.
            </h2>
            <p>
              Whether you run a small kirana shop or supply supermarkets across
              multiple districts, we deliver consistently fresh chips with reliable
              packaging and honest pricing.
            </p>
            <ul className="prem-landing-list">
              <li>Kirana & general stores</li>
              <li>Supermarkets & marts</li>
              <li>Distributors & wholesalers</li>
              <li>Namkeen speciality shops</li>
              <li>Gift & festive pack retailers</li>
            </ul>
          </div>
          <div className="story-visual">
            <div className="story-placeholder-b2b">
              <div className="story-badge">
                <div className="story-badge-num">18+</div>
                <div className="story-badge-text">Years of<br />Manufacturing</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="featured-section">
        <div className="section-header-row">
          <div>
            <span className="section-kicker">WHAT YOU GET</span>
            <h2 className="section-title-landing">
              Built for <em>business.</em>
            </h2>
          </div>
        </div>

        <div className="prem-landing-grid">
          <div className="prem-landing-card">
            <div className="prem-landing-num">01</div>
            <h3>Wholesale Pricing</h3>
            <p>
              Transparent rates on 1kg and 5kg packs. No hidden margins. Rates
              locked per season.
            </p>
          </div>
          <div className="prem-landing-card">
            <div className="prem-landing-num">02</div>
            <h3>GST Invoices</h3>
            <p>
              Every order comes with a proper GST invoice (HSN 2005). Use it for
              your own input credit and clean accounting.
            </p>
          </div>
          <div className="prem-landing-card">
            <div className="prem-landing-num">03</div>
            <h3>Transport Dispatch</h3>
            <p>
              We dispatch via your preferred transporter or ours. LR number shared
              on WhatsApp for tracking.
            </p>
          </div>
          <div className="prem-landing-card">
            <div className="prem-landing-num">04</div>
            <h3>Credit Terms</h3>
            <p>
              Regular retailers can avail 15 or 30 day credit terms after a few
              confirmed orders. Advance payment for new accounts.
            </p>
          </div>
          <div className="prem-landing-card">
            <div className="prem-landing-num">05</div>
            <h3>Fresh from Kolhapur</h3>
            <p>
              Fried in small batches, sealed same day. Every pack has a fried-on
              date. No preservatives, no shortcuts.
            </p>
          </div>
          <div className="prem-landing-card">
            <div className="prem-landing-num">06</div>
            <h3>Dedicated Support</h3>
            <p>
              Direct WhatsApp access to our team. Reorder in one click. Same-day
              response on all queries.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="why-section">
        <div className="why-inner">
          <span className="section-kicker section-kicker-light">HOW IT WORKS</span>
          <h2 className="section-title-landing section-title-light">
            From enquiry to dispatch in <em>4 steps.</em>
          </h2>

          <div className="prem-landing-steps">
            <div className="prem-landing-step">
              <div className="prem-landing-step-num">01</div>
              <h3>Apply</h3>
              <p>Fill the retailer form with your shop and GST details.</p>
            </div>
            <div className="prem-landing-step">
              <div className="prem-landing-step-num">02</div>
              <h3>Get Approved</h3>
              <p>We review your application within 24 hours.</p>
            </div>
            <div className="prem-landing-step">
              <div className="prem-landing-step-num">03</div>
              <h3>Place Order</h3>
              <p>Pick products, confirm address, and submit.</p>
            </div>
            <div className="prem-landing-step">
              <div className="prem-landing-step-num">04</div>
              <h3>Receive Stock</h3>
              <p>We dispatch and share LR number for tracking.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DISTRICTS SERVED */}
      <section className="prem-landing-districts">
        <div className="prem-landing-districts-inner">
          <span className="section-kicker">CURRENTLY SERVING</span>
          <h2 className="section-title-landing">
            Across <em>Maharashtra</em> &amp; beyond.
          </h2>
          <div className="prem-landing-district-list">
            {DISTRICTS_SERVED.map((d) => (
              <span key={d} className="prem-landing-district-chip">{d}</span>
            ))}
          </div>
          <p className="prem-landing-districts-note">
            Not in the list? <Link to="/bulk-order">Contact us</Link> — we are
            expanding to new districts every month.
          </p>
        </div>
      </section>

      {/* MAP */}
      {/* CTA */}
      <section className="bulk-cta-landing">
        <div className="bulk-cta-inner">
          <div className="bulk-cta-text">
            <span className="section-kicker section-kicker-light">READY TO STOCK?</span>
            <h2 className="section-title-landing section-title-light">
              Open your wholesale account <em>today.</em>
            </h2>
            <p>
              Fill a short form, get approved in 24 hours, and start ordering.
              Minimum order just 10kg.
            </p>
            <Link to="/retailer-setup" className="btn-primary-landing btn-primary-light">
              <span>Apply as Retailer</span>
              <span className="btn-arrow">→</span>
            </Link>
          </div>
          <div className="bulk-cta-visual">
            <div className="bulk-stat">
              <span className="bulk-stat-num">10kg</span>
              <span className="bulk-stat-label">Minimum Order</span>
            </div>
            <div className="bulk-stat">
              <span className="bulk-stat-num">24hr</span>
              <span className="bulk-stat-label">Approval Time</span>
            </div>
            <div className="bulk-stat">
              <span className="bulk-stat-num">48hr</span>
              <span className="bulk-stat-label">Dispatch Time</span>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="visit-section">
        <div className="visit-grid">
          <div className="visit-item">
            <span className="visit-label">Kitchen Address</span>
            <p>A/p. Gavase, Tal. Ajara<br />Dist. Kolhapur, MH 416505</p>
          </div>
          <div className="visit-item">
            <span className="visit-label">Call / WhatsApp</span>
            <p>
              <a href="tel:+917774982725">+91 77749 82725</a><br />
              <a href="tel:+919168843668">+91 91688 43668</a>
            </p>
          </div>
          <div className="visit-item">
            <span className="visit-label">Business Hours</span>
            <p>Monday – Saturday<br />9:00 AM – 8:00 PM</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <button
        className="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <span className="btt-arrow">↑</span>
        <span className="btt-label">Back to Top</span>
      </button>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-cols">
            <div className="footer-col">
              <h4 className="footer-col-title">Wholesale</h4>
              <ul>
                <li><Link to="/products">Catalog</Link></li>
                <li><Link to="/retailer-setup">Become a Retailer</Link></li>
                <li><Link to="/bulk-order">Bulk Enquiry</Link></li>
                <li><Link to="/login">Retailer Login</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Orders</h4>
              <ul>
                <li><Link to="/cart">Order Sheet</Link></li>
                <li><Link to="/my-orders">My Orders</Link></li>
                <li><Link to="/track">Track Order</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Company</h4>
              <ul>
                <li><Link to="/">Our Story</Link></li>
                <li><Link to="/">Kitchen Location</Link></li>
                <li><Link to="/">FSSAI Certification</Link></li>
                <li><Link to="/">Wholesale Enquiry</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Contact</h4>
              <ul>
                <li><a href="tel:+917774982725">Call: 7774982725</a></li>
                <li><a href="tel:+919168843668">Call: 9168843668</a></li>
                <li><a href="https://wa.me/917774982725" target="_blank" rel="noopener noreferrer">WhatsApp Support</a></li>
              </ul>
            </div>
          </div>
        </div>

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
              <span className="footer-badge">Wholesale Only</span>
              <span className="footer-badge">Made in Kolhapur</span>
            </div>
          </div>
        </div>

        <div className="footer-legal">
          <div className="footer-legal-inner">
            <div className="footer-legal-links">
              <Link to="/">Privacy Notice</Link>
              <Link to="/">Terms & Conditions</Link>
              <Link to="/">GST Policy</Link>
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