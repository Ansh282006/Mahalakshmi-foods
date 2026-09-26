import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import TrackOrder from './pages/TrackOrder';
import CustomerLogin from './pages/CustomerLogin';
import CustomerSignup from './pages/CustomerSignup';
import MyOrders from './pages/MyOrders';
import Wishlist from './pages/Wishlist';
import BulkOrder from './pages/BulkOrder';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminOrders from './pages/AdminOrders';
import AdminProducts from './pages/AdminProducts';
import './App.css';

function App() {
  return (
    <CartProvider>
      <PWAInstallPrompt />
      <BrowserRouter>
        <CartDrawer />
        <Routes>
          {/* Customer routes */}
          <Route path="/" element={<><Navbar /><Home /></>} />
          <Route path="/products" element={<><Navbar /><Products /></>} />
          <Route path="/track" element={<><Navbar /><TrackOrder /></>} />
          <Route path="/cart" element={<><Navbar /><Cart /></>} />
          <Route path="/checkout" element={<><Navbar /><Checkout /></>} />
          <Route path="/order-confirmed/:orderId" element={<><Navbar /><OrderConfirmation /></>} />
          <Route path="/login" element={<><Navbar /><CustomerLogin /></>} />
          <Route path="/signup" element={<><Navbar /><CustomerSignup /></>} />
          <Route path="/my-orders" element={<><Navbar /><MyOrders /></>} />
          <Route path="/wishlist" element={<><Navbar /><Wishlist /></>} />
          <Route path="/bulk-order" element={<><Navbar /><BulkOrder /></>} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/products" element={<AdminProducts />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;