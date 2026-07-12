import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

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
  AVAILABLE: 'bg-green-100 text-green-700',
  ON_TRIP: 'bg-blue-100 text-blue-700',
  IN_SHOP: 'bg-orange-100 text-orange-700',
  RETIRED: 'bg-red-100 text-red-700',
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
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get<ApiResponse>(`/vehicles?${params.toString()}`);
      setVehicles(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter]);

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

  const formatCurrency = (val: number) =>
    `₹${val.toLocaleString('en-IN')}`;

  const formatKm = (val: number) =>
    `${val.toLocaleString('en-IN')} km`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Vehicle Registry</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
        >
          + Add Vehicle
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-48">
          <input
            type="text"
            placeholder="Search Registration / Model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex space-x-2 items-center">
          <label className="text-sm text-gray-500">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border-b border-gray-300 text-sm focus:outline-none focus:border-amber-500 bg-transparent pb-1"
          >
            <option value="">All</option>
            <option value="VAN">Van</option>
            <option value="TRUCK">Truck</option>
            <option value="BUS">Bus</option>
            <option value="MOTORCYCLE">Motorcycle</option>
          </select>
        </div>
        <div className="flex space-x-2 items-center">
          <label className="text-sm text-gray-500">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-b border-gray-300 text-sm focus:outline-none focus:border-amber-500 bg-transparent pb-1"
          >
            <option value="">All</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="IN_SHOP">In Shop</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading vehicles...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">REG. NO.</th>
                  <th className="px-6 py-3 font-medium">NAME/MODEL</th>
                  <th className="px-6 py-3 font-medium">TYPE</th>
                  <th className="px-6 py-3 font-medium">CAPACITY</th>
                  <th className="px-6 py-3 font-medium">ODOMETER</th>
                  <th className="px-6 py-3 font-medium">ACQUISITION COST</th>
                  <th className="px-6 py-3 font-medium">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">No vehicles found.</td>
                  </tr>
                ) : vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-800 font-medium">{v.registration_number}</td>
                    <td className="px-6 py-4 text-gray-500">{v.name_model}</td>
                    <td className="px-6 py-4 text-gray-500">{v.type}</td>
                    <td className="px-6 py-4 text-gray-500">{v.max_load_capacity} kg</td>
                    <td className="px-6 py-4 text-gray-500">{formatKm(v.odometer)}</td>
                    <td className="px-6 py-4 text-gray-500">{formatCurrency(v.acquisition_cost)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE[v.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABEL[v.status] ?? v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-red-500 font-medium italic">
        Note: Registration No. must be unique. Retired/In Shop vehicles are hidden from Trip Dispatcher.
      </p>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Add New Vehicle</h3>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration No. *</label>
                  <input
                    required
                    type="text"
                    value={form.registration_number}
                    onChange={(e) => setForm({ ...form, registration_number: e.target.value.toUpperCase() })}
                    className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. MH12AB1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name / Model *</label>
                  <input
                    required
                    type="text"
                    value={form.name_model}
                    onChange={(e) => setForm({ ...form, name_model: e.target.value })}
                    className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. Toyota HiAce"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="VAN">Van</option>
                    <option value="TRUCK">Truck</option>
                    <option value="BUS">Bus</option>
                    <option value="MOTORCYCLE">Motorcycle</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <input
                    type="text"
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. North"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Load (kg) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.1"
                    value={form.max_load_capacity}
                    onChange={(e) => setForm({ ...form, max_load_capacity: e.target.value })}
                    className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Odometer (km)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.odometer}
                    onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                    className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Acq. Cost (₹) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.acquisition_cost}
                    onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })}
                    className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="1200000"
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
                  onClick={() => { setShowAddModal(false); setSaveError(''); setForm(EMPTY_FORM); }}
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
                  {saving ? 'Saving...' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fleet;
