import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminRetailers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [retailers, setRetailers] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/admin');
    });
    fetchRetailers();
  }, [navigate]);

  async function fetchRetailers() {
    const { data } = await supabase
      .from('retailers')
      .select('*')
      .order('created_at', { ascending: false });
    setRetailers(data || []);
    setLoading(false);
  }

  async function updateStatus(retailer, status) {
    const updates = {
      status,
      approved_at: status === 'Approved' ? new Date().toISOString() : null,
      approved_by: status === 'Approved' ? user.id : null,
    };
    const { error } = await supabase
      .from('retailers')
      .update(updates)
      .eq('id', retailer.id);
    if (error) return toast.error('Failed: ' + error.message);
    toast.success(`Retailer ${status.toLowerCase()}`);
    fetchRetailers();
  }

  async function updateTerms(retailer, field, value) {
    const { error } = await supabase
      .from('retailers')
      .update({ [field]: value })
      .eq('id', retailer.id);
    if (error) return toast.error('Failed to update');
    toast.success('Updated');
    fetchRetailers();
  }

  const counts = {
    Pending: retailers.filter((r) => r.status === 'Pending').length,
    Approved: retailers.filter((r) => r.status === 'Approved').length,
    Rejected: retailers.filter((r) => r.status === 'Rejected').length,
    Suspended: retailers.filter((r) => r.status === 'Suspended').length,
  };

  const filtered = retailers.filter((r) => r.status === filter);

  const sidebarCounts = { retailers: counts.Pending };

  return (
    <div className="prem-admin">
      <AdminSidebar counts={sidebarCounts} active="/admin/retailers" />

      <main className="prem-admin-main">
        <header className="prem-admin-topbar">
          <div>
            <span className="prem-kicker">RETAILERS</span>
            <h1 className="prem-admin-page-title">
              Retailer <em>Accounts.</em>
            </h1>
            <p className="prem-admin-page-sub">
              <strong>{retailers.length}</strong> registered · <strong>{counts.Pending}</strong> pending approval
            </p>
          </div>
        </header>

        {/* Filter tabs */}
        <div className="prem-admin-filters">
          {['Pending', 'Approved', 'Rejected', 'Suspended'].map((s) => {
            const c = counts[s];
            return (
              <button
                key={s}
                className={`prem-admin-filter ${filter === s ? 'active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s}
                {c > 0 && <span className="prem-admin-filter-count">{c}</span>}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="prem-admin-loading"><p>Loading retailers...</p></div>
        ) : filtered.length === 0 ? (
          <div className="prem-admin-table-wrap">
            <p className="empty-row">No retailers with status &quot;{filter}&quot;</p>
          </div>
        ) : (
          <div className="prem-admin-orders-list">
            {filtered.map((r) => {
              const isOpen = expanded === r.id;
              return (
                <article key={r.id} className={`prem-admin-order ${isOpen ? 'open' : ''}`}>
                  <header
                    className="prem-admin-order-head"
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                  >
                    <div className="prem-admin-order-head-left">
                      <span className="prem-admin-order-name">{r.shop_name}</span>
                      <span className="prem-admin-order-phone">{r.owner_name}</span>
                      <span className="prem-admin-order-phone">{r.district}</span>
                    </div>
                    <div className="prem-admin-order-head-right">
                      <span className={`prem-admin-badge ${r.status.toLowerCase()}`}>
                        {r.status}
                      </span>
                      <span className={`prem-admin-order-caret ${isOpen ? 'open' : ''}`}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </div>
                  </header>

                  {isOpen && (
                    <div className="prem-admin-order-body">
                      <div className="prem-admin-order-details">
                        <div>
                          <span className="prem-admin-detail-label">Contact Phone</span>
                          <span className="prem-admin-detail-value">{r.phone}</span>
                        </div>
                        <div>
                          <span className="prem-admin-detail-label">Email</span>
                          <span className="prem-admin-detail-value">{r.email || '—'}</span>
                        </div>
                        <div>
                          <span className="prem-admin-detail-label">GSTIN</span>
                          <span className="prem-admin-detail-value">{r.gstin || 'Not provided'}</span>
                        </div>
                        <div>
                          <span className="prem-admin-detail-label">District</span>
                          <span className="prem-admin-detail-value">{r.district} {r.pincode && `· ${r.pincode}`}</span>
                        </div>
                        <div className="full">
                          <span className="prem-admin-detail-label">Shop Address</span>
                          <span className="prem-admin-detail-value">{r.address}</span>
                        </div>
                        <div>
                          <span className="prem-admin-detail-label">Registered On</span>
                          <span className="prem-admin-detail-value">
                            {new Date(r.created_at).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {r.notes && (
                        <>
                          <h3 className="prem-admin-subhead">Retailer Notes</h3>
                          <p style={{ fontSize: '0.9rem', color: 'var(--charcoal-700)', lineHeight: 1.6, marginBottom: 'var(--s-3)' }}>
                            {r.notes}
                          </p>
                        </>
                      )}

                      {/* Credit terms */}
                      {r.status === 'Approved' && (
                        <>
                          <h3 className="prem-admin-subhead">Payment Terms</h3>
                          <div className="prem-admin-dp-grid">
                            <div className="prem-admin-dp-field">
                              <label>Payment Type</label>
                              <select
                                defaultValue={r.payment_terms || 'Advance'}
                                onChange={(e) => updateTerms(r, 'payment_terms', e.target.value)}
                              >
                                <option value="Advance">Advance</option>
                                <option value="Credit">Credit</option>
                                <option value="Partial">Partial</option>
                              </select>
                            </div>
                            <div className="prem-admin-dp-field">
                              <label>Credit Limit (₹)</label>
                              <input
                                type="number"
                                defaultValue={r.credit_limit || 0}
                                onBlur={(e) => {
                                  const val = Number(e.target.value);
                                  if (val === r.credit_limit) return;
                                  updateTerms(r, 'credit_limit', val);
                                }}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Actions */}
                      <div className="prem-admin-order-actions">
                        {r.status === 'Pending' && (
                          <>
                            <a
                              href={`https://wa.me/91${r.phone}?text=${encodeURIComponent(`Namaste ${r.owner_name} ji, this is Mahalaxmi Chips. Your retailer application for ${r.shop_name} has been received. We will confirm shortly.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="prem-admin-action primary"
                            >
                              Message on WhatsApp
                            </a>
                            <button
                              className="prem-admin-action gold"
                              onClick={() => updateStatus(r, 'Approved')}
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="prem-admin-action danger"
                              onClick={() => {
                                if (confirm(`Reject ${r.shop_name}?`)) updateStatus(r, 'Rejected');
                              }}
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}
                        {r.status === 'Approved' && (
                          <button
                            className="prem-admin-action danger"
                            onClick={() => {
                              if (confirm(`Suspend ${r.shop_name}?`)) updateStatus(r, 'Suspended');
                            }}
                          >
                            Suspend Account
                          </button>
                        )}
                        {r.status === 'Rejected' && (
                          <button
                            className="prem-admin-action gold"
                            onClick={() => updateStatus(r, 'Approved')}
                          >
                            Approve Anyway
                          </button>
                        )}
                        {r.status === 'Suspended' && (
                          <button
                            className="prem-admin-action gold"
                            onClick={() => updateStatus(r, 'Approved')}
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}