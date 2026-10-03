import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import BrandMarquee from '../components/BrandMarquee';
import useSEO from '../hooks/useSEO';
import { organizationSchema } from '../utils/seo';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [retailer, setRetailer] = useState(null);
  const [stats, setStats] = useState({ products: 0, orders: 0, retailers: 0 });
  const { user } = useAuth();

  useSEO({
    title: 'Mahalaxmi Chips — Wholesale Chips for Retailers',
    description:
      'Wholesale Kolhapuri chips for kirana stores, supermarkets, and distributors. 1kg and 5kg packs. FSSAI certified. GST invoices. Pan-Maharashtra dispatch.',
    structuredData: organizationSchema(),
  });

  useEffect(() => {
    async function fetchData() {
      const [prodRes, ordRes, retRes] = await Promise.all([
        supabase.from('products').select('*').eq('is_available', true),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('retailers').select('id', { count: 'exact', head: true }).eq('status', 'Approved'),
      ]);
      setProducts(prodRes.data || []);
      setStats({
        products: prodRes.data?.length || 0,
        orders: ordRes.count || 0,
        retailers: retRes.count || 0,
      });

      if (user) {
        const { data: ret } = await supabase
          .from('retailers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        setRetailer(ret);
      }
    }
    fetchData();
  }, [user]);

  const isApprovedRetailer = retailer?.status === 'Approved';

  return (
    <div className="prem-page">
      {/* HERO */}
      <section className="prem-hero">
        <div className="prem-hero-inner">
          <div className="prem-hero-split">
            <div>
              <span className="prem-kicker">WHOLESALE SUPPLY</span>
              <h1 className="prem-hero-title">
                Bulk Chips for<br />
                Your Store.<br />
                <em>Delivered Fresh.</em>
              </h1>
              <p className="prem-hero-sub">
                We supply traditional Kolhapuri banana and jackfruit chips to
                kirana stores, supermarkets, and distributors across Maharashtra.
                1kg and 5kg packs. FSSAI certified. GST invoices. Minimum order 10kg.
              </p>

              <div className="prem-hero-cta">
                {!user && (
                  <>
                    <Link to="/retailer-setup" className="prem-btn-primary">
                      Apply as Retailer
                    </Link>
                    <Link to="/products" className="prem-btn-outline">
                      Browse Catalog
                    </Link>
                  </>
                )}
                {user && !isApprovedRetailer && (
                  <Link to="/retailer-setup" className="prem-btn-primary">
                    Complete Your Profile
                  </Link>
                )}
                {user && isApprovedRetailer && (
                  <Link to="/products" className="prem-btn-primary">
                    Shop the Catalog
                  </Link>
                )}
              </div>

              <div className="prem-hero-stats">
                <div className="prem-hero-stat">
                  <span className="prem-hero-stat-num">{stats.retailers || '25'}+</span>
                  <span className="prem-hero-stat-label">Retailers</span>
                </div>
                <div className="prem-hero-stat">
                  <span className="prem-hero-stat-num">{stats.products || 0}</span>
                  <span className="prem-hero-stat-label">Product SKUs</span>
                </div>
                <div className="prem-hero-stat">
                  <span className="prem-hero-stat-num">FSSAI</span>
                  <span className="prem-hero-stat-label">Certified</span>
                </div>
              </div>
            </div>

            {products[0] && (
              <div className="prem-hero-visual">
                <img src={products[0].image_url} alt={products[0].name} />
              </div>
            )}
          </div>
        </div>
      </section>

      <BrandMarquee />

      {/* WHY CHOOSE US */}
      <section className="prem-section">
        <div className="prem-section-header">
          <div>
            <span className="prem-kicker">WHY MAHALAXMI</span>
            <h2 className="prem-section-title">
              Built for <em>retailers.</em>
            </h2>
          </div>
        </div>

        <div className="prem-landing-grid" style={{ padding: 0 }}>
          <div className="prem-landing-card">
            <div className="prem-landing-num">01</div>
            <h3>Wholesale Pricing</h3>
            <p>
              Transparent rates on 1kg and 5kg packs. No hidden margins.
              Rates locked per season.
            </p>
          </div>
          <div className="prem-landing-card">
            <div className="prem-landing-num">02</div>
            <h3>GST Invoices</h3>
            <p>
              Every order includes a proper GST invoice with HSN 2005.
              Clean accounting and input credit.
            </p>
          </div>
          <div className="prem-landing-card">
            <div className="prem-landing-num">03</div>
            <h3>Transport Dispatch</h3>
            <p>
              We dispatch via your preferred transporter or ours. LR number
              shared for tracking.
            </p>
          </div>
          <div className="prem-landing-card">
            <div className="prem-landing-num">04</div>
            <h3>Fresh from Kolhapur</h3>
            <p>
              Fried in small batches, sealed same day. Every pack has a fried-on
              date. No preservatives.
            </p>
          </div>
        </div>
      </section>

      {/* STATUS BANNERS */}
      {user && !retailer && (
        <div className="prem-b2b-banner warn" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <strong>Complete your retailer profile</strong>
            <span>We need your shop details before you can place orders.</span>
          </div>
          <Link to="/retailer-setup" className="prem-admin-action gold">Complete Setup</Link>
        </div>
      )}

      {user && retailer?.status === 'Pending' && (
        <div className="prem-b2b-banner warn" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <strong>Profile under review</strong>
            <span>We approve new retailers within 24 hours.</span>
          </div>
        </div>
      )}

      {/* HOW IT WORKS */}
      <section className="why-section" style={{ marginTop: 'var(--s-5)' }}>
        <div className="why-inner">
          <span className="section-kicker section-kicker-light">HOW IT WORKS</span>
          <h2 className="section-title-landing section-title-light">
            From enquiry to delivery in <em>4 steps.</em>
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
              <p>Pick products, confirm address, submit.</p>
            </div>
            <div className="prem-landing-step">
              <div className="prem-landing-step-num">04</div>
              <h3>Receive Stock</h3>
              <p>We dispatch via transport. LR number shared.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bulk-cta-landing">
        <div className="bulk-cta-inner">
          <div className="bulk-cta-text">
            <span className="section-kicker section-kicker-light">READY TO STOCK?</span>
            <h2 className="section-title-landing section-title-light">
              Open your wholesale account <em>today.</em>
            </h2>
            <p>
              Fill a short form, get approved in 24 hours, and start ordering
              wholesale chips. Minimum order just 10kg.
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
    </div>
  );
}