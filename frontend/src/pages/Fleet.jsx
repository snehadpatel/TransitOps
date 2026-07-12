import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { VEHICLE_TYPES } from '../utils/constants';

const VEHICLE_STATUSES = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];
const EMPTY_FORM = {
  registration_number: '', name_model: '', type: 'VAN',
  max_load_capacity: '', odometer: '', acquisition_cost: '', region: '', status: 'AVAILABLE',
};

export default function Fleet() {
  const { user } = useAuth();
  const canEdit = user?.role === 'FLEET_MANAGER';

  const [vehicles, setVehicles] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20, ...(search && { search }), ...(filterStatus && { status: filterStatus }), ...(filterType && { type: filterType }) };
    api.get('/vehicles', { params })
      .then(({ data }) => { setVehicles(data.data); setMeta(data.meta); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, filterStatus, filterType]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); };
  const openEdit = (v) => {
    setEditing(v);
    setForm({ registration_number: v.registration_number, name_model: v.name_model, type: v.type, max_load_capacity: v.max_load_capacity, odometer: v.odometer, acquisition_cost: v.acquisition_cost, region: v.region || '', status: v.status });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      const payload = {
        ...form,
        max_load_capacity: parseFloat(form.max_load_capacity),
        odometer: parseFloat(form.odometer) || 0,
        acquisition_cost: parseFloat(form.acquisition_cost),
      };
      if (editing) {
        const { registration_number, ...rest } = payload;
        await api.patch(`/vehicles/${editing.id}`, rest);
      } else {
        await api.post('/vehicles', payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save vehicle.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (v) => {
    if (!confirm(`Retire vehicle "${v.registration_number}"? This sets status to RETIRED.`)) return;
    try { await api.delete(`/vehicles/${v.id}`); load(); }
    catch (err) { alert(err.response?.data?.error || 'Failed to retire vehicle.'); }
  };

  return (
    <div className="space-y-5 animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicle Registry</h1>
          <p className="text-sm text-gray-500">Manage your fleet of vehicles</p>
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={openCreate}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Add Vehicle
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input className="form-input max-w-xs" placeholder="Search reg. no or model…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="form-select w-40" value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          {VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="form-select w-40" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {VEHICLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Rule hint */}
      <div className="rule-hint">
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span><strong>Registration numbers must be unique.</strong> Vehicles with status IN_SHOP or RETIRED do not appear in the Trip Dispatcher vehicle dropdown.</span>
      </div>

      {/* Table */}
      {loading ? <PageLoader /> : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr>
              <th>Reg. No.</th><th>Name / Model</th><th>Type</th>
              <th>Capacity (kg)</th><th>Odometer (km)</th><th>Acq. Cost</th>
              <th>Region</th><th>Status</th>{canEdit && <th>Actions</th>}
            </tr></thead>
            <tbody>
              {vehicles.length === 0 && <tr><td colSpan={9} className="text-center text-gray-400 py-10">No vehicles found.</td></tr>}
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td className="font-mono text-xs font-semibold">{v.registration_number}</td>
                  <td className="font-medium">{v.name_model}</td>
                  <td><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{v.type}</span></td>
                  <td>{v.max_load_capacity.toLocaleString()}</td>
                  <td>{v.odometer.toLocaleString()}</td>
                  <td>₹{v.acquisition_cost.toLocaleString()}</td>
                  <td>{v.region || '—'}</td>
                  <td><Badge status={v.status} /></td>
                  {canEdit && (
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-ghost btn-sm" onClick={() => openEdit(v)}>Edit</button>
                        {v.status !== 'RETIRED' && (
                          <button className="btn-ghost btn-sm text-red-500 hover:bg-red-50" onClick={() => handleDelete(v)}>Retire</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <button className="btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>Page {meta.page} of {meta.totalPages}</span>
          <button className="btn-secondary btn-sm" disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit Vehicle — ${editing.registration_number}` : 'Add New Vehicle'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <div className="rule-error">{formError}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Registration Number *</label>
              <input className="form-input" value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value.toUpperCase() })} disabled={!!editing} required />
              {editing && <p className="form-error">Registration number cannot be changed.</p>}
            </div>
            <div>
              <label className="form-label">Name / Model *</label>
              <input className="form-input" value={form.name_model} onChange={(e) => setForm({ ...form, name_model: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Max Load Capacity (kg) *</label>
              <input type="number" className="form-input" value={form.max_load_capacity} onChange={(e) => setForm({ ...form, max_load_capacity: e.target.value })} min={1} required />
            </div>
            <div>
              <label className="form-label">Odometer (km)</label>
              <input type="number" className="form-input" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} min={0} />
            </div>
            <div>
              <label className="form-label">Acquisition Cost (₹) *</label>
              <input type="number" className="form-input" value={form.acquisition_cost} onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })} min={1} required />
            </div>
            <div>
              <label className="form-label">Region</label>
              <input className="form-input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="e.g. North, South" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {VEHICLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Vehicle'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
