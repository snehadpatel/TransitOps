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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Maintenance</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Log Service Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">LOG SERVICE RECORD</h3>
          </div>
          <div className="p-6 space-y-4">

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
                <select
                  required
                  value={form.vehicle_id}
                  onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm"
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} — {v.name_model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
                <input
                  required
                  type="text"
                  value={form.service_type}
                  onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="e.g. Oil Change, Tyre Replace"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{saveError}</div>
              )}
              {saveSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">✅ {saveSuccess}</div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Automated Status Flow:</p>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Available</span>
                <span>→</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">In Shop</span>
                <span>→</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Available</span>
              </div>
              <p className="text-xs text-red-500 italic mt-3">
                Note: In Shop vehicles are removed from the dispatch pool.
              </p>
            </div>
          </div>
        </div>

        {/* Service Log Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">SERVICE LOG</h3>
          </div>
          <div className="p-0 overflow-x-auto">
            {loadingLogs ? (
              <div className="p-8 text-center text-gray-500 text-sm">Loading records...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No maintenance records yet.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">VEHICLE</th>
                    <th className="px-4 py-3 font-medium">SERVICE</th>
                    <th className="px-4 py-3 font-medium">COST</th>
                    <th className="px-4 py-3 font-medium">DATE</th>
                    <th className="px-4 py-3 font-medium">STATUS</th>
                    <th className="px-4 py-3 font-medium">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800 font-medium">{log.vehicle.registration_number}</td>
                      <td className="px-4 py-3 text-gray-500">{log.service_type}</td>
                      <td className="px-4 py-3 text-gray-500">{formatCost(log.cost)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(log.date)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${log.status === 'CLOSED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {log.status === 'CLOSED' ? 'Completed' : 'In Shop'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {log.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleClose(log.id)}
                            disabled={closingId === log.id}
                            className="text-xs text-green-600 hover:text-green-800 font-medium"
                          >
                            Close
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
