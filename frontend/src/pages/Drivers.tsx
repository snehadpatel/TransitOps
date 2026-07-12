import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Pagination from '../components/Pagination';

interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry: string;
  contact_number?: string;
  safety_score: number;
  trip_completions: number;
  status: string;
}

interface ApiResponse {
  data: Driver[];
  meta: { total: number };
}

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: 'badge badge-available',
  ON_TRIP: 'badge badge-on_trip',
  OFF_DUTY: 'badge badge-off_duty',
  SUSPENDED: 'badge badge-suspended',
};

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  OFF_DUTY: 'Off Duty',
  SUSPENDED: 'Suspended',
};

const EMPTY_DRIVER = {
  name: '',
  license_number: '',
  license_category: 'LMV-TR',
  license_expiry: '',
  contact_number: '',
  safety_score: '100',
};

const Drivers: React.FC = () => {
  const { user } = useAuth();
  const isSafetyOfficer = user?.role === 'Safety Officer';

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_DRIVER);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await api.get<ApiResponse>(`/drivers?${params.toString()}`);
      setDrivers(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load drivers.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleStatusChange = async (driverId: string, newStatus: string) => {
    setUpdatingId(driverId);
    try {
      await api.patch(`/drivers/${driverId}`, { status: newStatus });
      setDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? { ...d, status: newStatus } : d))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await api.post('/drivers', {
        ...form,
        safety_score: parseFloat(form.safety_score),
        license_expiry: new Date(form.license_expiry).toISOString(),
      });
      setShowAddModal(false);
      setForm(EMPTY_DRIVER);
      fetchDrivers();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to add driver.');
    } finally {
      setSaving(false);
    }
  };

  const isExpired = (expiry: string) => new Date(expiry) <= new Date();

  const formatExpiry = (expiry: string) => {
    const date = new Date(expiry);
    return date.toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' });
  };

  const completionRate = (d: Driver) => {
    if (d.trip_completions === 0) return '0%';
    return `${d.trip_completions} trips`;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="section-title"><i className="fas fa-id-card" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Drivers & Safety Profiles</div>
          <div className="section-subtitle">Manage driver records, licenses, and safety scores</div>
        </div>
        {isSafetyOfficer && (
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <i className="fas fa-plus"></i> Add Driver
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="tx-table-wrap" style={{ marginBottom: '20px' }}>
        <div className="tx-table-toolbar">
          <div style={{ flex: 1, maxWidth: '320px' }}>
            <input
              type="text"
              placeholder="Search name or license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="tx-table-wrap">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--tx-text-muted)' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.2rem' }}></i>
            <div style={{ marginTop: '8px' }}>Loading drivers…</div>
          </div>
        ) : error ? (
          <div className="rule-error" style={{ margin: '20px' }}><i className="fas fa-circle-exclamation"></i>{error}</div>
        ) : (
          <table className="tx-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>License No.</th>
                <th>Category</th>
                <th>Expiry</th>
                <th>Contact</th>
                <th>Trips Done</th>
                <th>Safety Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <i className="fas fa-id-card" style={{ display: 'block' }}></i>
                    No drivers found.
                  </td>
                </tr>
              ) : drivers.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td>{d.license_number}</td>
                  <td>{d.license_category}</td>
                  <td>
                    <span style={{ fontWeight: 500, color: isExpired(d.license_expiry) ? 'var(--tx-danger)' : undefined }}>
                      {formatExpiry(d.license_expiry)}
                    </span>
                    {isExpired(d.license_expiry) && (
                      <span className="badge badge-cancelled" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>EXPIRED</span>
                    )}
                  </td>
                  <td>{d.contact_number ?? '—'}</td>
                  <td>{completionRate(d)}</td>
                  <td style={{ fontWeight: 600 }}>{d.safety_score}</td>
                  <td>
                    <span className={STATUS_BADGE[d.status] ?? 'badge badge-off_duty'}>
                      {STATUS_LABEL[d.status] ?? d.status}
                    </span>
                    {isSafetyOfficer && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                        {['AVAILABLE', 'OFF_DUTY', 'SUSPENDED'].map((s) => (
                          <button
                            key={s}
                            disabled={s === d.status || updatingId === d.id}
                            onClick={() => handleStatusChange(d.id, s)}
                            className={s === d.status ? 'btn btn-sm' : 'btn btn-light btn-sm'}
                            style={{
                              fontSize: '0.65rem',
                              padding: '2px 8px',
                              opacity: s === d.status ? 0.4 : 1,
                            }}
                          >
                            {STATUS_LABEL[s]}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--tx-text-muted)', marginTop: '12px', fontStyle: 'italic' }}>
        <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
        Expired license or Suspended status = blocked from trip assignment.
      </p>

      {/* Add Driver Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,12,20,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
          <div className="tx-card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="tx-card-body">
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>
                <i className="fas fa-plus-circle" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Add New Driver
              </h3>
              <form onSubmit={handleAddDriver} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-control" placeholder="e.g. Alex Kumar" />
                  </div>
                  <div>
                    <label className="form-label">License No. *</label>
                    <input required type="text" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value.toUpperCase() })} className="form-control" placeholder="DL-MH-2024-0001" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Category *</label>
                    <select value={form.license_category} onChange={(e) => setForm({ ...form, license_category: e.target.value })} className="form-select">
                      <option value="LMV">LMV</option>
                      <option value="LMV-TR">LMV-TR</option>
                      <option value="HMV">HMV</option>
                      <option value="HPMV">HPMV</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">License Expiry *</label>
                    <input required type="date" value={form.license_expiry} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} className="form-control" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Contact No.</label>
                    <input type="tel" value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} className="form-control" placeholder="+91-9876543210" />
                  </div>
                  <div>
                    <label className="form-label">Safety Score (0–100)</label>
                    <input type="number" min="0" max="100" step="0.1" value={form.safety_score} onChange={(e) => setForm({ ...form, safety_score: e.target.value })} className="form-control" />
                  </div>
                </div>

                {saveError && (
                  <div className="rule-error"><i className="fas fa-circle-exclamation"></i>{saveError}</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                  <button type="button" onClick={() => { setShowAddModal(false); setSaveError(''); setForm(EMPTY_DRIVER); }} className="btn btn-light" disabled={saving}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Driver'}
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

export default Drivers;
