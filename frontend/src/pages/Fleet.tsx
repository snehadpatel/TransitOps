import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import Pagination from '../components/Pagination';

interface Vehicle {
  id: string;
  registration_number: string;
  name_model: string;
  type: string;
  max_load_capacity: number;
  odometer: number;
  acquisition_cost: number;
  status: string;
  region?: string;
}

interface ApiResponse {
  data: Vehicle[];
  meta: { total: number };
}

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: 'badge badge-available',
  ON_TRIP: 'badge badge-on_trip',
  IN_SHOP: 'badge badge-in_shop',
  RETIRED: 'badge badge-retired',
};

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  IN_SHOP: 'In Shop',
  RETIRED: 'Retired',
};

const EMPTY_FORM = {
  registration_number: '',
  name_model: '',
  type: 'VAN',
  max_load_capacity: '',
  odometer: '0',
  acquisition_cost: '',
  region: '',
};

const Fleet: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<{name: string, url: string}[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', pageSize.toString());
      const res = await api.get<ApiResponse>(`/vehicles?${params.toString()}`);
      setVehicles(res.data);
      setTotal(res.meta?.total ?? res.data.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await api.post('/vehicles', {
        ...form,
        max_load_capacity: parseFloat(form.max_load_capacity),
        odometer: parseFloat(form.odometer),
        acquisition_cost: parseFloat(form.acquisition_cost),
      });
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      fetchVehicles();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to add vehicle.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDocs = async (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setShowDocsModal(true);
    try {
      const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const res = await fetch(`${VITE_API_URL}/vehicles/${vehicle.id || vehicle.reg}/documents`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setDocs(await res.json());
      }
    } catch(err) { console.error(err); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedVehicle) return;
    setUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('document', file);
    
    try {
      const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const res = await fetch(`${VITE_API_URL}/vehicles/${selectedVehicle.id || selectedVehicle.reg}/documents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (res.ok) {
        const newDoc = await res.json();
        setDocs([newDoc, ...docs]);
      }
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  const formatCurrency = (val: number) =>
    `₹${val.toLocaleString('en-IN')}`;

  const formatKm = (val: number) =>
    `${val.toLocaleString('en-IN')} km`;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="section-title"><i className="fas fa-truck" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Vehicle Registry</div>
          <div className="section-subtitle">Manage and track all vehicles in your fleet</div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <i className="fas fa-plus"></i> Add Vehicle
        </button>
      </div>

      {/* Filter Bar */}
      <div className="tx-table-wrap" style={{ marginBottom: '20px' }}>
        <div className="tx-table-toolbar">
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Search Registration / Model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ maxWidth: '320px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="form-select" style={{ width: 'auto', minWidth: '100px' }}>
              <option value="">All</option>
              <option value="VAN">Van</option>
              <option value="TRUCK">Truck</option>
              <option value="BUS">Bus</option>
              <option value="MOTORCYCLE">Motorcycle</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select" style={{ width: 'auto', minWidth: '120px' }}>
              <option value="">All</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="IN_SHOP">In Shop</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="tx-table-wrap">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--tx-text-muted)' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.2rem' }}></i>
            <div style={{ marginTop: '8px' }}>Loading vehicles…</div>
          </div>
        ) : error ? (
          <div className="rule-error" style={{ margin: '20px' }}><i className="fas fa-circle-exclamation"></i>{error}</div>
        ) : (
          <table className="tx-table">
            <thead>
              <tr>
                <th>Reg. No.</th>
                <th>Name / Model</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Odometer</th>
                <th>Acq. Cost</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <i className="fas fa-truck" style={{ display: 'block' }}></i>
                    No vehicles found.
                  </td>
                </tr>
              ) : vehicles.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 600 }}>{v.registration_number}</td>
                  <td>{v.name_model}</td>
                  <td>{v.type}</td>
                  <td>{v.max_load_capacity} kg</td>
                  <td>{formatKm(v.odometer)}</td>
                  <td>{formatCurrency(v.acquisition_cost)}</td>
                  <td>
                    <span className={STATUS_BADGE[v.status] ?? 'badge badge-draft'}>
                      {STATUS_LABEL[v.status] ?? v.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => handleOpenDocs(v)} className="btn btn-outline-primary btn-sm">
                      <i className="fas fa-folder-open"></i> Docs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--tx-text-muted)', marginTop: '12px', fontStyle: 'italic' }}>
        <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
        Registration No. must be unique. Retired/In Shop vehicles are hidden from Trip Dispatcher.
      </p>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,12,20,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
          <div className="tx-card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="tx-card-body">
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>
                <i className="fas fa-plus-circle" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Add New Vehicle
              </h3>
              <form onSubmit={handleAddVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Registration No. *</label>
                    <input required type="text" value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value.toUpperCase() })} className="form-control" placeholder="e.g. MH12AB1234" />
                  </div>
                  <div>
                    <label className="form-label">Name / Model *</label>
                    <input required type="text" value={form.name_model} onChange={(e) => setForm({ ...form, name_model: e.target.value })} className="form-control" placeholder="e.g. Toyota HiAce" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Type *</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="form-select">
                      <option value="VAN">Van</option>
                      <option value="TRUCK">Truck</option>
                      <option value="BUS">Bus</option>
                      <option value="MOTORCYCLE">Motorcycle</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Region</label>
                    <input type="text" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="form-control" placeholder="e.g. North" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Max Load (kg) *</label>
                    <input required type="number" min="1" step="0.1" value={form.max_load_capacity} onChange={(e) => setForm({ ...form, max_load_capacity: e.target.value })} className="form-control" placeholder="500" />
                  </div>
                  <div>
                    <label className="form-label">Odometer (km)</label>
                    <input type="number" min="0" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} className="form-control" placeholder="0" />
                  </div>
                  <div>
                    <label className="form-label">Acq. Cost (₹) *</label>
                    <input required type="number" min="1" value={form.acquisition_cost} onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })} className="form-control" placeholder="1200000" />
                  </div>
                </div>

                {saveError && (
                  <div className="rule-error"><i className="fas fa-circle-exclamation"></i>{saveError}</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                  <button type="button" onClick={() => { setShowAddModal(false); setSaveError(''); setForm(EMPTY_FORM); }} className="btn btn-light" disabled={saving}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Vehicle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocsModal && selectedVehicle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,12,20,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
          <div className="tx-card" style={{ width: '100%', maxWidth: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="tx-card-body" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>
                <i className="fas fa-folder-open" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Documents
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--tx-text-muted)', marginBottom: '16px' }}>Upload and view vehicle documents (PDF/PNG).</p>
              
              <div style={{ marginBottom: '16px' }}>
                <input type="file" id="docUpload" style={{ display: 'none' }} accept=".pdf,image/*" onChange={handleUpload} />
                <label htmlFor="docUpload" className="btn btn-light" style={{ width: '100%', justifyContent: 'center', cursor: 'pointer', border: '2px dashed var(--tx-border)' }}>
                  <i className="fas fa-cloud-arrow-up"></i>
                  {uploading ? 'Uploading…' : 'Upload Document'}
                </label>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {docs.length === 0 ? (
                  <div className="empty-state" style={{ padding: '30px' }}>
                    <i className="fas fa-file-lines" style={{ display: 'block' }}></i>
                    No documents found.
                  </div>
                ) : docs.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--tx-bg-alt)', borderRadius: '10px', border: '1px solid var(--tx-border)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}><i className="fas fa-file" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>{d.name}</span>
                    <a href={`http://localhost:5001${d.url}`} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm">View</a>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button onClick={() => setShowDocsModal(false)} className="btn btn-light">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fleet;
