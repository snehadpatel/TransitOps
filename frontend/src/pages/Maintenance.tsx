import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface Vehicle {
  id: string;
  registration_number: string;
  name_model: string;
  status: string;
}

interface MaintenanceLog {
  id: string;
  service_type: string;
  cost: number;
  date: string;
  status: string;
  notes?: string;
  vehicle: { registration_number: string; name_model: string };
}

interface MaintenanceResponse {
  data: MaintenanceLog[];
  meta: { total: number };
}

interface VehiclesResponse {
  data: Vehicle[];
}

const EMPTY_FORM = {
  vehicle_id: '',
  service_type: '',
  cost: '',
  notes: '',
};

const Maintenance: React.FC = () => {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [closingId, setClosingId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await api.get<MaintenanceResponse>('/maintenance?limit=20');
      setLogs(res.data);
    } catch {
      // silent fail
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      // Get all vehicles (not just available — maintenance can be on any non-retired non-on-trip)
      const res = await api.get<VehiclesResponse>('/vehicles?limit=100');
      const eligible = res.data.filter((v) => v.status !== 'ON_TRIP' && v.status !== 'RETIRED');
      setVehicles(eligible);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchVehicles();
  }, [fetchLogs, fetchVehicles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      await api.post('/maintenance', {
        vehicle_id: form.vehicle_id,
        service_type: form.service_type,
        cost: parseFloat(form.cost),
        notes: form.notes || undefined,
      });
      setSaveSuccess('Service record logged. Vehicle status set to In Shop.');
      setForm(EMPTY_FORM);
      fetchLogs();
      fetchVehicles();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save maintenance record.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (logId: string) => {
    if (!confirm('Close this maintenance record? Vehicle will be restored to Available.')) return;
    setClosingId(logId);
    try {
      await api.patch(`/maintenance/${logId}/close`, {});
      fetchLogs();
      fetchVehicles();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to close record.');
    } finally {
      setClosingId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatCost = (c: number) => `₹${c.toLocaleString('en-IN')}`;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="section-title"><i className="fas fa-screwdriver-wrench" style={{ marginRight: '8px', color: 'var(--tx-warning)' }}></i>Maintenance &amp; Service</div>
          <div className="section-subtitle">Log service records and track vehicle maintenance</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
        {/* Log Service Form */}
        <div className="tx-card">
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--tx-border)' }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
              <i className="fas fa-clipboard-list" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
              Log Service Record
            </h3>
          </div>
          <div className="tx-card-body">

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Vehicle *</label>
                <select required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} className="form-select">
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.registration_number} — {v.name_model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Service Type *</label>
                <input required type="text" value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} className="form-control" placeholder="e.g. Oil Change, Tyre Replace" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Cost (₹) *</label>
                  <input required type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="form-control" placeholder="0.00" />
                </div>
                <div>
                  <label className="form-label">Notes</label>
                  <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="form-control" placeholder="Optional notes" />
                </div>
              </div>

              {saveError && <div className="rule-error"><i className="fas fa-circle-exclamation"></i>{saveError}</div>}
              {saveSuccess && (
                <div className="rule-hint" style={{ background: 'rgba(23,193,163,0.1)', borderColor: 'rgba(23,193,163,0.3)', color: '#0e8f78' }}>
                  <i className="fas fa-circle-check"></i>{saveSuccess}
                </div>
              )}

              <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {saving ? 'Saving...' : <><i className="fas fa-save"></i> Save Record</>}
              </button>
            </form>

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--tx-border)' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--tx-text)', marginBottom: '10px' }}>Automated Status Flow:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--tx-text)' }}>
                <span className="badge badge-available">Available</span>
                <i className="fas fa-arrow-right" style={{ color: 'var(--tx-text-muted)' }}></i>
                <span className="badge badge-in_shop">In Shop</span>
                <i className="fas fa-arrow-right" style={{ color: 'var(--tx-text-muted)' }}></i>
                <span className="badge badge-available">Available</span>
              </div>
              <p className="rule-hint" style={{ marginTop: '12px', fontSize: '0.75rem' }}>
                <i className="fas fa-info-circle"></i>
                In Shop vehicles are removed from the dispatch pool.
              </p>
            </div>
          </div>
        </div>

        {/* Service Log Table */}
        <div className="tx-card">
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--tx-border)' }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
              <i className="fas fa-list-check" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
              Service Log
            </h3>
          </div>
          <div>
            {loadingLogs ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--tx-text-muted)' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.4rem' }}></i>
                <div style={{ marginTop: '10px', fontSize: '0.875rem' }}>Loading records...</div>
              </div>
            ) : logs.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-clipboard-list"></i>
                <div>No maintenance records yet.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Service</th>
                      <th>Cost</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 600 }}>{log.vehicle.registration_number}</td>
                        <td>{log.service_type}</td>
                        <td>{formatCost(log.cost)}</td>
                        <td style={{ fontSize: '0.8rem' }}>{formatDate(log.date)}</td>
                        <td>
                          <span className={log.status === 'CLOSED' ? 'badge badge-completed' : 'badge badge-in_shop'}>
                            {log.status === 'CLOSED' ? 'Completed' : 'In Shop'}
                          </span>
                        </td>
                        <td>
                          {log.status === 'ACTIVE' && (
                            <button onClick={() => handleClose(log.id)} disabled={closingId === log.id} className="btn btn-success btn-sm">
                              <i className="fas fa-check"></i> Close
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
