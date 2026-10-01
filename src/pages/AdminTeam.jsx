import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const PRIMARY_ADMIN = 'admin@mahalaxmi.com';

export default function AdminTeam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const isPrimaryAdmin = user?.email === PRIMARY_ADMIN;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/admin');
    });
    fetchAdmins();
  }, [navigate]);

  async function fetchAdmins() {
    const { data } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: true });
    setAdmins(data || []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!isPrimaryAdmin) {
      toast.error('Only the primary admin can add new admins');
      return;
    }

    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }

    setAdding(true);
    const { error } = await supabase
      .from('admin_users')
      .insert({ email, added_by: user.id });
    setAdding(false);

    if (error) {
      toast.error(error.message.includes('duplicate')
        ? 'This email is already an admin'
        : 'Failed to add admin: ' + error.message);
      return;
    }

    toast.success(`${email} added as admin`);
    setNewEmail('');
    fetchAdmins();
  }

  async function handleRemove(admin) {
    if (!isPrimaryAdmin) {
      toast.error('Only the primary admin can remove admins');
      return;
    }
    if (admin.email === PRIMARY_ADMIN) {
      toast.error('Cannot remove the primary admin');
      return;
    }
    if (!confirm(`Remove ${admin.email} as admin?`)) return;

    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', admin.id);

    if (error) {
      toast.error('Failed to remove: ' + error.message);
      return;
    }

    toast.success('Admin removed');
    fetchAdmins();
  }

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <h2>MAHALAXMI</h2>
        <nav>
          <Link to="/admin/dashboard">Dashboard</Link>
          <Link to="/admin/analytics">Analytics</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/products">Products</Link>
          <Link to="/admin/team" className="active">Team</Link>
          <Link to="/">View Site</Link>
        </nav>
        <button
          className="logout-btn"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate('/admin');
          }}
        >
          Logout
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-top-bar">
          <div className="admin-top-left">
            <h1>Admin Team</h1>
            <p className="admin-welcome">
              {admins.length} {admins.length === 1 ? 'administrator' : 'administrators'}
            </p>
          </div>
        </div>

        {/* Add new admin (only for primary) */}
        {isPrimaryAdmin && (
          <div className="add-admin-card">
            <h3>Add New Admin</h3>
            <p className="add-admin-desc">
              Enter the email address of a person you want to give admin access. They must
              sign up first before they can log in.
            </p>
            <form onSubmit={handleAdd} className="add-admin-form">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="staff@example.com"
                disabled={adding}
                required
              />
              <button type="submit" disabled={adding || !newEmail.trim()}>
                {adding ? 'Adding...' : 'Add Admin'}
              </button>
            </form>
          </div>
        )}

        {!isPrimaryAdmin && (
          <div className="admin-info-banner">
            Only the primary admin (<strong>{PRIMARY_ADMIN}</strong>) can add or remove administrators.
          </div>
        )}

        {/* Admins list */}
        <h2 className="section-heading">Current Admins</h2>
        <div className="admins-list">
          {loading ? (
            <p className="admin-subtext">Loading...</p>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="admin-team-card">
                <div className="admin-team-avatar">
                  {admin.email.charAt(0).toUpperCase()}
                </div>
                <div className="admin-team-info">
                  <strong>{admin.email}</strong>
                  <span>
                    {admin.email === PRIMARY_ADMIN ? 'Primary Admin' : 'Administrator'}
                    {' · '}
                    Added {new Date(admin.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                </div>
                {isPrimaryAdmin && admin.email !== PRIMARY_ADMIN && (
                  <button
                    className="admin-team-remove"
                    onClick={() => handleRemove(admin)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
