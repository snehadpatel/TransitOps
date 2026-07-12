import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'];
const EMPTY_FORM = { name: '', license_number: '', license_category: '', license_expiry: '', contact_number: '', safety_score: 100, status: 'AVAILABLE' };

export default function Drivers() {
  const { user } = useAuth();
  const canEdit = user?.role === 'SAFETY_OFFICER';

  const [drivers, setDrivers] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20, ...(search && { search }), ...(filterStatus && { status: filterStatus }) };
    api.get('/drivers', { params })
      .then(({ data }) => { setDrivers(data.data); setMeta(data.meta); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); };
  const openEdit = (d) => {
    setEditing(d);
    setForm({
      name: d.name, license_number: d.license_number, license_category: d.license_category,
      license_expiry: d.license_expiry?.slice(0, 10) || '', contact_number: d.contact_number || '',
      safety_score: d.safety_score, status: d.status,
    });
    setFormError(''); setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      const payload = { ...form, license_expiry: new Date(form.license_expiry).toISOString(), safety_score: parseFloat(form.safety_score) };
      if (editing) {
        const { license_number, ...rest } = payload;
        await api.patch(`/drivers/${editing.id}`, rest);
      } else {
        await api.post('/drivers', payload);
      }
      setModalOpen(false); load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save driver.');
    } finally { setSaving(false); }
  };

  const handleStatusToggle = async (d, newStatus) => {
    try { await api.patch(`/drivers/${d.id}`, { status: newStatus }); load(); }
    catch (err) { alert(err.response?.data?.error || 'Failed to update status.'); }
  };

  const handleDelete = async (d) => {
    if (!confirm(`Delete driver "${d.name}"?`)) return;
    try { await api.delete(`/drivers/${d.id}`); load(); }
    catch (err) { alert(err.response?.data?.error || 'Cannot delete driver.'); }
  };

  const isExpired = (expiry) => expiry && new Date(expiry) < new Date();

  return (
    <div className="space-y-5 animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Drivers & Safety Profiles</h1>
          <p className="text-sm text-gray-500">Manage driver records and compliance</p>
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={openCreate}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Add Driver
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <input className="form-input max-w-xs" placeholder="Search name or license…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="form-select w-44" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="rule-hint">
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span>Drivers with an <strong>expired license</strong> or <strong>Suspended</strong> status are blocked from trip assignment by the server.</span>
      </div>

      {loading ? <PageLoader /> : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr>
              <th>Driver</th><th>License No.</th><th>Category</th>
              <th>Expiry</th><th>Contact</th><th>Safety Score</th><th>Status</th>
              {canEdit && <th>Actions</th>}
            </tr></thead>
            <tbody>
              {drivers.length === 0 && <tr><td colSpan={8} className="text-center text-gray-400 py-10">No drivers found.</td></tr>}
              {drivers.map((d) => {
                const expired = isExpired(d.license_expiry);
                return (
                  <tr key={d.id} className={expired ? 'bg-red-50/50' : ''}>
                    <td className="font-medium">{d.name}</td>
                    <td className="font-mono text-xs">{d.license_number}</td>
                    <td><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{d.license_category}</span></td>
                    <td>
                      <span className={expired ? 'text-red-600 font-semibold text-xs' : 'text-xs'}>
                        {d.license_expiry ? new Date(d.license_expiry).toLocaleDateString() : '—'}
                        {expired && ' ⚠ Expired'}
                      </span>
                    </td>
                    <td className="text-sm text-gray-500">{d.contact_number || '—'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${d.safety_score}%` }} />
                        </div>
                        <span className="text-xs font-medium">{d.safety_score}</span>
                      </div>
                    </td>
                    <td><Badge status={d.status} /></td>
                    {canEdit && (
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          <button className="btn-ghost btn-sm" onClick={() => openEdit(d)}>Edit</button>
                          {d.status !== 'SUSPENDED' && (
                            <button className="btn-ghost btn-sm text-red-500 hover:bg-red-50" onClick={() => handleStatusToggle(d, 'SUSPENDED')}>Suspend</button>
                          )}
                          {d.status === 'SUSPENDED' && (
                            <button className="btn-ghost btn-sm text-green-600 hover:bg-green-50" onClick={() => handleStatusToggle(d, 'AVAILABLE')}>Reinstate</button>
                          )}
                          <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => handleDelete(d)}>Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <button className="btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>Page {meta.page} of {meta.totalPages}</span>
          <button className="btn-secondary btn-sm" disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit Driver — ${editing.name}` : 'Add New Driver'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <div className="rule-error">{formError}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="form-label">License Number *</label><input className="form-input" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} disabled={!!editing} required /></div>
            <div><label className="form-label">License Category *</label><input className="form-input" placeholder="e.g. LMV-TR, HMV" value={form.license_category} onChange={(e) => setForm({ ...form, license_category: e.target.value })} required /></div>
            <div><label className="form-label">License Expiry *</label><input type="date" className="form-input" value={form.license_expiry} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} required /></div>
            <div><label className="form-label">Contact Number</label><input className="form-input" value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} /></div>
            <div><label className="form-label">Safety Score (0–100)</label><input type="number" className="form-input" min={0} max={100} value={form.safety_score} onChange={(e) => setForm({ ...form, safety_score: e.target.value })} /></div>
            <div><label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Driver'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
