import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';

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
    if (!isPrimaryAdmin) return toast.error('Only the primary admin can add new admins');

    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error('Enter a valid email');

    setAdding(true);
    const { error } = await supabase.from('admin_users').insert({ email, added_by: user.id });
    setAdding(false);

    if (error) {
      toast.error(error.message.includes('duplicate')
        ? 'This email is already an admin'
        : 'Failed to add admin');
      return;
    }
    toast.success(`${email} added`);
    setNewEmail('');
    fetchAdmins();
  }

  async function handleRemove(admin) {
    if (!isPrimaryAdmin) return toast.error('Only the primary admin can remove admins');
    if (admin.email === PRIMARY_ADMIN) return toast.error('Cannot remove the primary admin');
    if (!confirm(`Remove ${admin.email} as admin?`)) return;

    const { error } = await supabase.from('admin_users').delete().eq('id', admin.id);
    if (error) return toast.error('Failed to remove: ' + error.message);
    toast.success('Admin removed');
    fetchAdmins();
  }

  return (
    <div className="prem-admin">
      <AdminSidebar active="/admin/team" />

      <main className="prem-admin-main">
        <header className="prem-admin-topbar">
          <div>
            <span className="prem-kicker">TEAM</span>
            <h1 className="prem-admin-page-title">
              Admin <em>Access.</em>
            </h1>
            <p className="prem-admin-page-sub">
              <strong>{admins.length}</strong> {admins.length === 1 ? 'administrator' : 'administrators'} with dashboard access
            </p>
          </div>
        </header>

        {/* Add new admin */}
        {isPrimaryAdmin ? (
          <section className="prem-admin-section">
            <h2 className="prem-admin-section-title">
              Add New <em>Administrator</em>
            </h2>
            <div className="prem-admin-add-form-wrap">
              <p className="prem-admin-add-desc">
                Enter the email address of a person you want to grant admin access.
                They must sign up first at <strong>/signup</strong> before they can log in.
              </p>
              <form onSubmit={handleAdd} className="prem-admin-add-form">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="staff@example.com"
                  disabled={adding}
                  required
                />
                <button type="submit" className="prem-admin-action gold" disabled={adding || !newEmail.trim()}>
                  {adding ? 'Adding...' : 'Add Admin'}
                </button>
              </form>
            </div>
          </section>
        ) : (
          <div className="prem-admin-alert" style={{ background: 'linear-gradient(90deg, rgba(201, 162, 39, 0.15) 0%, transparent 100%)' }}>
            <div className="prem-admin-alert-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="prem-admin-alert-text">
              <strong>Limited Access</strong>
              <span>Only the primary admin ({PRIMARY_ADMIN}) can add or remove administrators.</span>
            </div>
          </div>
        )}

        {/* Admins list */}
        <section className="prem-admin-section">
          <h2 className="prem-admin-section-title">
            Current <em>Administrators</em>
            <span className="prem-admin-section-count">{admins.length} total</span>
          </h2>

          {loading ? (
            <div className="prem-admin-loading"><p>Loading team...</p></div>
          ) : (
            <div className="prem-admin-team-list">
              {admins.map((admin) => (
                <article key={admin.id} className="prem-admin-team-card">
                  <div className="prem-admin-team-avatar">
                    {admin.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="prem-admin-team-info">
                    <strong className="prem-admin-team-email">{admin.email}</strong>
                    <span className="prem-admin-team-role">
                      {admin.email === PRIMARY_ADMIN ? 'Primary Administrator' : 'Administrator'}
                    </span>
                    <span className="prem-admin-team-date">
                      Added {new Date(admin.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </span>
                  </div>
                  {admin.email === PRIMARY_ADMIN && (
                    <span className="prem-admin-badge pending">PRIMARY</span>
                  )}
                  {isPrimaryAdmin && admin.email !== PRIMARY_ADMIN && (
                    <button className="prem-admin-action danger" onClick={() => handleRemove(admin)}>
                      Remove
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}