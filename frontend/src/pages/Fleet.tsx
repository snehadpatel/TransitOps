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

  const handleOpenDocs = async (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setShowDocsModal(true);
    // Fetch docs from API
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
                  <th className="px-6 py-3 font-medium text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-400">No vehicles found.</td>
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
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenDocs(v)} className="text-amber-500 hover:text-amber-600 font-medium text-sm">
                        Documents
                      </button>
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
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Add New Vehicle</h3>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registration No. *</label>
                  <input
                    required
                    type="text"
                    value={form.registration_number}
                    onChange={(e) => setForm({ ...form, registration_number: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:border-amber-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                    placeholder="e.g. MH12AB1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name / Model *</label>
                  <input
                    required
                    type="text"
                    value={form.name_model}
                    onChange={(e) => setForm({ ...form, name_model: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:border-amber-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                    placeholder="e.g. Toyota HiAce"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:border-amber-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                  >
                    <option value="VAN">Van</option>
                    <option value="TRUCK">Truck</option>
                    <option value="BUS">Bus</option>
                    <option value="MOTORCYCLE">Motorcycle</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Region</label>
                  <input
                    type="text"
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:border-amber-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                    placeholder="e.g. North"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Load (kg) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.1"
                    value={form.max_load_capacity}
                    onChange={(e) => setForm({ ...form, max_load_capacity: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:border-amber-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Odometer (km)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.odometer}
                    onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:border-amber-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Acq. Cost (₹) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.acquisition_cost}
                    onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:border-amber-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                    placeholder="1200000"
                  />
                </div>
              </div>

              {saveError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
                  {saveError}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setSaveError(''); setForm(EMPTY_FORM); }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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

      {/* Documents Modal */}
      {showDocsModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-bold mb-2 dark:text-white">Documents - {selectedVehicle.name}</h3>
            <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">Upload and view vehicle documents (PDF/PNG).</p>
            
            <div className="mb-4">
              <input type="file" id="docUpload" className="hidden" accept=".pdf,image/*" onChange={handleUpload} />
              <label htmlFor="docUpload" className="cursor-pointer flex items-center justify-center w-full py-2 px-4 border border-dashed border-gray-400 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {uploading ? 'Uploading...' : '+ Upload Document'}
              </label>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {docs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No documents found.</p>
              ) : (
                docs.map((d, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate pr-4">{d.name}</span>
                    <a href={`http://localhost:5001${d.url}`} target="_blank" rel="noreferrer" className="text-amber-500 hover:text-amber-600 text-sm font-medium whitespace-nowrap">View</a>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowDocsModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fleet;
