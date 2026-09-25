import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const { addToCart, openDrawer } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    async function fetchOrders() {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(quantity, price_at_time, products(id, name, weight, image_url))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load orders');
      } else {
        setOrders(data || []);
      }
      setLoading(false);
    }
    fetchOrders();
  }, [user, authLoading, navigate]);

  const handleReorder = (order) => {
    const items = order.order_items || [];
    if (items.length === 0) {
      toast.error('No items to reorder');
      return;
    }
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

  if (authLoading || loading) {
    return <div className="app-container"><div className="loader">Loading your orders...</div></div>;
  }

  return (
    <div className="app-container">
      <h1 className="page-title">My Orders</h1>

      {orders.length === 0 && (
        <div className="track-empty">
          <div className="empty-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Your past orders will appear here once you place one.</p>
          <Link to="/products" className="track-shop-link">Browse Products →</Link>
        </div>
      )}

      <div className="my-orders-list">
        {orders.map((order) => (
          <div key={order.id} className="my-order-card">
            <div className="my-order-header">
              <div>
                <span className="track-code">{order.order_code}</span>
                <span className="my-order-date">
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </span>
              </div>
              <span className={`status-badge status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {order.status}
              </span>
            </div>

            <div className="my-order-items">
              {(order.order_items || []).map((item, idx) => (
                <div key={idx} className="my-order-item">
                  {item.products?.image_url && (
                    <img src={item.products.image_url} alt={item.products.name} />
                  )}
                  <div>
                    <strong>{item.products?.name || 'Product'}</strong>
                    <span>{item.products?.weight} × {item.quantity}</span>
                  </div>
                  <span className="my-order-price">₹{item.price_at_time}</span>
                </div>
              ))}
            </div>

            <div className="my-order-footer">
              <span className="my-order-total">Total: <strong>₹{order.total_amount}</strong></span>
              <div className="my-order-actions">
                <button className="my-order-track" onClick={() => navigate(`/track`)}>Track</button>
                <button className="my-order-reorder" onClick={() => handleReorder(order)}>
                  🔁 Reorder
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}