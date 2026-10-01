import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { generateInvoice } from '../utils/invoice';

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const { addToCart, openDrawer } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }

    async function fetchOrders() {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(quantity, price_at_time, products(id, name, weight, image_url))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) toast.error('Failed to load orders');
      else setOrders(data || []);
      setLoading(false);
    }
    fetchOrders();
  }, [user, authLoading, navigate]);

  const handleReorder = (order) => {
    const items = order.order_items || [];
    if (!items.length) return toast.error('No items to reorder');
    items.forEach((item) => {
      if (item.products) {
        addToCart({
          id: item.products.id,
          name: item.products.name,
          price: item.price_at_time,
          weight: item.products.weight,
          image_url: item.products.image_url,
        });
      }
    });
    toast.success(`Added ${items.length} item(s) to your cart`);
    openDrawer();
  };

  const handleDownloadInvoice = (order) => {
    const items = (order.order_items || []).map((item) => ({
      quantity: item.quantity,
      price_at_time: item.price_at_time,
      products: item.products,
    }));
    generateInvoice(order, items);
  };

  if (authLoading || loading) {
    return (
      <div className="prem-page">
        <div className="prem-empty-cart">
          <p className="prem-empty-cart-text">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prem-page">
      <section className="prem-hero">
        <div className="prem-hero-inner">
          <span className="prem-kicker">YOUR ACCOUNT</span>
          <h1 className="prem-hero-title">
            Order <em>History.</em>
          </h1>
          <p className="prem-hero-sub">
            Every order you have placed with us, in one place. Track, download
            invoices, or reorder with a single click.
          </p>
        </div>
      </section>

      {orders.length === 0 ? (
        <div className="prem-empty-cart">
          <div className="prem-empty-icon">
            <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <h2 className="prem-empty-cart-title">No orders yet</h2>
          <p className="prem-empty-cart-text">
            Your past orders will appear here once you place one.
          </p>
          <Link to="/shop" className="prem-btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="prem-orders-list">
          {orders.map((order) => (
            <article key={order.id} className="prem-order-card">
              <header className="prem-order-head">
                <div className="prem-order-head-left">
                  <div className="prem-order-code">{order.order_code}</div>
                  <div className="prem-order-date">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </div>
                </div>
                <span className={`prem-order-status status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {order.status}
                </span>
              </header>

              <div className="prem-order-items">
                {(order.order_items || []).map((item, idx) => (
                  <div key={idx} className="prem-order-item">
                    {item.products?.image_url && (
                      <img src={item.products.image_url} alt={item.products.name} />
                    )}
                    <div className="prem-order-item-info">
                      <div className="prem-order-item-name">{item.products?.name || 'Product'}</div>
                      <div className="prem-order-item-meta">
                        {item.products?.weight} × {item.quantity}
                      </div>
                    </div>
                    <div className="prem-order-item-price">
                      ₹{(item.price_at_time * item.quantity).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>

              <footer className="prem-order-foot">
                <div className="prem-order-total">
                  <span className="prem-order-total-label">Total</span>
                  <span className="prem-order-total-value">₹{order.total_amount}</span>
                </div>
                <div className="prem-order-actions">
                  <button
                    className="prem-order-btn"
                    onClick={() => navigate('/track')}
                  >
                    Track
                  </button>
                  <button
                    className="prem-order-btn"
                    onClick={() => handleDownloadInvoice(order)}
                  >
                    Invoice
                  </button>
                  <button
                    className="prem-order-btn gold"
                    onClick={() => handleReorder(order)}
                  >
                    Reorder
                  </button>
                </div>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}