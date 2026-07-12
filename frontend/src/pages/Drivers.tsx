import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

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
  AVAILABLE: 'bg-green-100 text-green-700',
  ON_TRIP: 'bg-blue-100 text-blue-700',
  OFF_DUTY: 'bg-gray-100 text-gray-700',
  SUSPENDED: 'bg-red-100 text-red-700',
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Drivers & Safety Profiles</h2>
        {isSafetyOfficer && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
          >
            + Add Driver
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex space-x-6 items-center">
        <div className="flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search name or license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading drivers...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">DRIVER</th>
                  <th className="px-6 py-3 font-medium">LICENSE NO.</th>
                  <th className="px-6 py-3 font-medium">CATEGORY</th>
                  <th className="px-6 py-3 font-medium">EXPIRY</th>
                  <th className="px-6 py-3 font-medium">CONTACT</th>
                  <th className="px-6 py-3 font-medium">TRIPS DONE</th>
                  <th className="px-6 py-3 font-medium">SAFETY SCORE</th>
                  <th className="px-6 py-3 font-medium">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-400">No drivers found.</td>
                  </tr>
                ) : drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-800 font-medium">{d.name}</td>
                    <td className="px-6 py-4 text-gray-500">{d.license_number}</td>
                    <td className="px-6 py-4 text-gray-500">{d.license_category}</td>
                    <td className={`px-6 py-4 font-medium ${isExpired(d.license_expiry) ? 'text-red-500' : 'text-gray-500'}`}>
                      {formatExpiry(d.license_expiry)}
                      {isExpired(d.license_expiry) && (
                        <span className="ml-1 text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded">EXPIRED</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{d.contact_number ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{completionRate(d)}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{d.safety_score}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE[d.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABEL[d.status] ?? d.status}
                      </span>
                      {isSafetyOfficer && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {['AVAILABLE', 'OFF_DUTY', 'SUSPENDED'].map((s) => (
                            <button
                              key={s}
                              disabled={s === d.status || updatingId === d.id}
                              onClick={() => handleStatusChange(d.id, s)}
                              className={`text-[10px] px-2 py-0.5 rounded border ${
                                s === d.status
                                  ? `opacity-50 cursor-not-allowed border-transparent ${STATUS_BADGE[s]}`
                                  : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                              }`}
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
          </div>
        )}
      </div>

      <p className="text-sm text-red-500 font-medium italic">
        Note: Expired license or Suspended status = blocked from trip assignment.
      </p>

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Add New Driver</h3>
            <form onSubmit={handleAddDriver} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. Alex Kumar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License No. *</label>
                  <input
                    required
                    type="text"
                    value={form.license_number}
                    onChange={(e) => setForm({ ...form, license_number: e.target.value.toUpperCase() })}
                    className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="DL-MH-2024-0001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={form.license_category}
                    onChange={(e) => setForm({ ...form, license_category: e.target.value })}
                    className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="LMV">LMV</option>
                    <option value="LMV-TR">LMV-TR</option>
                    <option value="HMV">HMV</option>
                    <option value="HPMV">HPMV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry *</label>
                  <input
                    required
                    type="date"
                    value={form.license_expiry}
                    onChange={(e) => setForm({ ...form, license_expiry: e.target.value })}
                    className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact No.</label>
                  <input
                    type="tel"
                    value={form.contact_number}
                    onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                    className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="+91-9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Safety Score (0–100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.safety_score}
                    onChange={(e) => setForm({ ...form, safety_score: e.target.value })}
                    className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {saveError}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setSaveError(''); setForm(EMPTY_DRIVER); }}
                  className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-white rounded text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;
