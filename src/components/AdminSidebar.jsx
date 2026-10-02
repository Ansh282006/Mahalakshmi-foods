import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const NAV_GROUPS = [
  {
    label: 'OPERATIONS',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
      { to: '/admin/orders', label: 'Orders', icon: 'M3 9l9-6 9 6-9 6-9-6zM3 9v6l9 6 9-6V9', badge: 'orders' },
      { to: '/admin/products', label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', badge: 'lowstock' },
      { to: '/admin/retailers', label: 'Retailers', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87', badge: 'retailers' },
      { to: '/admin/video-calls', label: 'Video Calls', icon: 'M23 7l-7 5 7 5V7zM1 5h15a2 2 0 012 2v10a2 2 0 01-2 2H1V5z', badge: 'videocalls' },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      { to: '/admin/analytics', label: 'Analytics', icon: 'M3 3v18h18M7 14l4-4 4 4 6-6' },
    ],
  },
  {
    label: 'TEAM',
    items: [
      { to: '/admin/team', label: 'Admins', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
    ],
  },
  {
    label: 'STORE',
    items: [
      { to: '/', label: 'View Site', icon: 'M3 9l1-5h16l1 5M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM9 21V13h6v8' },
    ],
  },
];

export default function AdminSidebar({ active, counts = {} }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!confirm('Log out of admin panel?')) return;
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const isActive = (path) => location.pathname === path || active === path;

  const renderIcon = (d) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );

  return (
    <aside className="prem-admin-sidebar">
      <Link to="/admin/dashboard" className="prem-admin-brand" style={{ textDecoration: 'none' }}>
        <span className="prem-admin-brand-mark">M</span>
        <span className="prem-admin-brand-text">
          MAHALAXMI<em>ADMIN PANEL</em>
        </span>
      </Link>

      <nav className="prem-admin-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="prem-admin-nav-group">
            <span className="prem-admin-nav-label">{group.label}</span>
            {group.items.map((item) => {
              const badgeCount = item.badge ? counts[item.badge] : null;
              const isAlert = item.badge === 'orders' && badgeCount > 0;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`prem-admin-link ${isActive(item.to) ? 'active' : ''}`}
                >
                  <span className="prem-admin-link-icon">{renderIcon(item.icon)}</span>
                  <span>{item.label}</span>
                  {badgeCount > 0 && (
                    <span className={`prem-admin-link-count ${isAlert ? 'alert' : ''}`}>
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <button className="prem-admin-logout" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
}