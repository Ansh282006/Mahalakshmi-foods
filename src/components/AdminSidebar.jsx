import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// ─── 4 MAIN GROUPS with sub-buttons ───
const NAV_GROUPS = [
  {
    id: 'operations',
    label: 'Operations',
    icon: 'M3 12l9-9 9 9M5 10v10h14V10',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard' },
      { to: '/admin/orders', label: 'Orders', badge: 'orders' },
      { to: '/admin/products', label: 'Products', badge: 'lowstock' },
    ],
  },
  {
    id: 'users',
    label: 'Users & Team',
    icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    items: [
      { to: '/admin/retailers', label: 'Retailers', badge: 'retailers' },
      { to: '/admin/users', label: 'All Users' },
      { to: '/admin/team', label: 'Admins' },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: 'M3 3v18h18M7 14l4-4 4 4 6-6',
    items: [
      { to: '/admin/analytics', label: 'Analytics' },
      { to: '/admin/security', label: 'Security' },
    ],
  },
  {
    id: 'store',
    label: 'Store',
    icon: 'M3 9l1-5h16l1 5M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM9 21V13h6v8',
    items: [
      { to: '/', label: 'View Site' },
    ],
  },
];

export default function AdminSidebar({ active, counts = {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);

  // Auto-open the group that contains the current page
  useEffect(() => {
    const currentGroup = NAV_GROUPS.find((g) =>
      g.items.some((item) => item.to === active || item.to === location.pathname)
    );
    if (currentGroup) setOpenGroup(currentGroup.id);
  }, [active, location.pathname]);

  const handleLogout = async () => {
    if (!confirm('Log out of admin panel?')) return;
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const toggleGroup = (groupId) => {
    setOpenGroup((prev) => (prev === groupId ? null : groupId));
  };

  const renderIcon = (d) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );

  // Which group is currently showing?
  const showingGroup = hovered || openGroup;

  return (
    <aside
      className="prem-admin-sidebar"
      onMouseLeave={() => setHovered(null)}
    >
      {/* Brand */}
      <Link to="/admin/dashboard" className="prem-admin-brand" style={{ textDecoration: 'none' }}>
        <span className="prem-admin-brand-mark">M</span>
        <span className="prem-admin-brand-text">
          MAHALAXMI<em>ADMIN PANEL</em>
        </span>
      </Link>

      {/* Nav */}
      <nav className="prem-admin-nav">
        {NAV_GROUPS.map((group) => {
          const isOpen = showingGroup === group.id;
          const hasActiveChild = group.items.some(
            (item) => item.to === active || item.to === location.pathname
          );

          // Sum up badges for main button
          const totalBadge = group.items.reduce((sum, item) => {
            const count = item.badge ? counts[item.badge] || 0 : 0;
            return sum + count;
          }, 0);

          return (
            <div
              key={group.id}
              className={`prem-nav-group ${isOpen ? 'open' : ''} ${hasActiveChild ? 'has-active' : ''}`}
              onMouseEnter={() => setHovered(group.id)}
            >
              {/* Main button */}
              <button
                className="prem-nav-main-btn"
                onClick={() => toggleGroup(group.id)}
              >
                <span className="prem-nav-main-icon">{renderIcon(group.icon)}</span>
                <span className="prem-nav-main-label">{group.label}</span>
                {totalBadge > 0 && (
                  <span className="prem-nav-main-badge">{totalBadge}</span>
                )}
                <span className={`prem-nav-caret ${isOpen ? 'open' : ''}`}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>

              {/* Sub items */}
              <div className="prem-nav-sub">
                {group.items.map((item) => {
                  const badgeCount = item.badge ? counts[item.badge] : null;
                  const isItemActive = active === item.to || location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`prem-nav-sub-item ${isItemActive ? 'active' : ''}`}
                    >
                      <span>{item.label}</span>
                      {badgeCount > 0 && (
                        <span className="prem-nav-sub-badge">{badgeCount}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <button className="prem-admin-logout" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
}