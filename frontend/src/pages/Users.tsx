import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface ApiResponse { data: User[]; meta: { total: number } }

const ROLES = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];

const EMPTY_FORM = { name: '', email: '', role: 'Dispatcher', password: '', status: 'ACTIVE' };

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await api.get<ApiResponse>(`/users?${params.toString()}`);
      setUsers(res.data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleOpenAdd = () => { setEditUser(null); setForm(EMPTY_FORM); setSaveError(''); setShowModal(true); };
  const handleOpenEdit = (u: User) => { setEditUser(u); setForm({ name: u.name, email: u.email, role: u.role, password: '', status: u.status }); setSaveError(''); setShowModal(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      if (editUser) {
        await api.patch(`/users/${editUser.id}`, { name: form.name, role: form.role, status: form.status });
      } else {
        await api.post('/users', form);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.patch(`/users/${user.id}`, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch { /* silent */ }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      fetchUsers();
    } catch { /* silent */ }
  };

  const statusBadge = (s: string) => s === 'ACTIVE' ? 'badge badge-available' : 'badge badge-retired';
  const roleBadge = (r: string) => {
    if (r === 'Fleet Manager') return 'badge badge-on_trip';
    if (r === 'Dispatcher') return 'badge badge-info';
    if (r === 'Safety Officer') return 'badge badge-warning';
    return 'badge badge-available';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <div className="section-title"><i className="fas fa-users-gear" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>User Management</div>
          <div className="section-subtitle">Manage system users, roles and access permissions</div>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <i className="fas fa-user-plus"></i> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="tx-table-wrap" style={{ marginBottom: '20px' }}>
        <div className="tx-table-toolbar">
          <input type="text" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} className="form-control" style={{ maxWidth: '300px' }} />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="form-select" style={{ width: 'auto' }}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--tx-text-muted)' }}>{users.length} users</span>
        </div>
      </div>

      {/* Table */}
      <div className="tx-table-wrap">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--tx-text-muted)' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.4rem' }}></i>
          </div>
        ) : (
          <table className="tx-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><i className="fas fa-users"></i><div>No users found.</div></div></td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--tx-primary), var(--tx-accent))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                        {u.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--tx-text-muted)' }}>{u.email}</td>
                  <td><span className={roleBadge(u.role)}>{u.role}</span></td>
                  <td><span className={statusBadge(u.status)}>{u.status}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleOpenEdit(u)} className="btn btn-light btn-sm"><i className="fas fa-pen"></i></button>
                      <button onClick={() => handleToggleStatus(u)} className="btn btn-light btn-sm" title={u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                        <i className={`fas fa-${u.status === 'ACTIVE' ? 'user-slash' : 'user-check'}`}></i>
                      </button>
                      <button onClick={() => handleDelete(u)} className="btn btn-danger btn-sm"><i className="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,12,20,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
          <div className="tx-card" style={{ width: '100%', maxWidth: '520px' }}>
            <div className="tx-card-body">
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>
                <i className={`fas fa-${editUser ? 'user-pen' : 'user-plus'}`} style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
                {editUser ? 'Edit User' : 'Add New User'}
              </h3>
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-control" placeholder="John Smith" />
                  </div>
                  <div>
                    <label className="form-label">Email Address *</label>
                    <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="form-control" placeholder="john@transitops.com" disabled={!!editUser} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Role *</label>
                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="form-select">
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="form-select">
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
                {!editUser && (
                  <div>
                    <label className="form-label">Password *</label>
                    <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="form-control" placeholder="Min. 8 characters" />
                  </div>
                )}
                {saveError && <div className="rule-error"><i className="fas fa-circle-exclamation"></i>{saveError}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-light" disabled={saving}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : editUser ? 'Save Changes' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
