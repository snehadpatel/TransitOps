import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

interface Vehicle {
  id: string;
  registration_number: string;
  name_model: string;
  max_load_capacity: number;
}

interface Driver {
  id: string;
  name: string;
  license_category: string;
}

interface Trip {
  id: string;
  trip_code: string;
  source: string;
  destination: string;
  status: string;
  eta?: string;
  created_at: string;
  vehicle: { registration_number: string; name_model: string };
  driver: { name: string };
  cargo_weight: number;
}

interface TripsResponse {
  data: Trip[];
  meta: { total: number };
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  DISPATCHED: 'bg-blue-50 text-blue-600',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  DISPATCHED: 'Dispatched',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const EMPTY_FORM = {
  source: '',
  destination: '',
  vehicle_id: '',
  driver_id: '',
  cargo_weight: '',
  planned_distance: '',
};

const Trips: React.FC = () => {
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState('');
  const [dispatchSuccess, setDispatchSuccess] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  const selectedVehicle = availableVehicles.find((v) => v.id === form.vehicle_id);
  const cargoWeight = parseFloat(form.cargo_weight) || 0;
  const capacityExceeded =
    !!selectedVehicle && cargoWeight > 0 && cargoWeight > selectedVehicle.max_load_capacity;

  const fetchResources = useCallback(async () => {
    setLoadingResources(true);
    try {
      const [vehicles, drivers] = await Promise.all([
        api.get<Vehicle[]>('/vehicles/available'),
        api.get<Driver[]>('/drivers/available'),
      ]);
      setAvailableVehicles(vehicles);
      setAvailableDrivers(drivers);
    } catch {
      // silently fail — will show empty selects
    } finally {
      setLoadingResources(false);
    }
  }, []);

  const fetchTrips = useCallback(async () => {
    setLoadingTrips(true);
    try {
      const res = await api.get<TripsResponse>('/trips?limit=20');
      setTrips(res.data);
    } catch {
      // silently fail
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
    fetchTrips();
  }, [fetchResources, fetchTrips]);

  useEffect(() => {
    const socket = getSocket();
    
    const handleUpdate = () => {
      console.log('Real-time update received! Re-fetching trips and vehicles...');
      fetchResources();
      fetchTrips();
    };

    socket.on('trip-updated', handleUpdate);
    socket.on('vehicle-updated', handleUpdate);

    return () => {
      socket.off('trip-updated', handleUpdate);
      socket.off('vehicle-updated', handleUpdate);
    };
  }, [fetchResources, fetchTrips]);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchError('');
    setDispatchSuccess('');

    if (capacityExceeded) {
      setDispatchError('Cargo weight exceeds vehicle capacity. Dispatch blocked.');
      return;
    }

    setDispatching(true);
    try {
      // Step 1: Create trip (DRAFT)
      const newTrip = await api.post<Trip>('/trips', {
        source: form.source,
        destination: form.destination,
        vehicle_id: form.vehicle_id,
        driver_id: form.driver_id,
        cargo_weight: parseFloat(form.cargo_weight),
        planned_distance: parseFloat(form.planned_distance),
      });

      // Step 2: Dispatch immediately
      await api.patch(`/trips/${newTrip.id}/dispatch`, {});

      setDispatchSuccess(`Trip ${newTrip.trip_code} dispatched successfully!`);
      setForm(EMPTY_FORM);
      fetchResources();
      fetchTrips();
    } catch (err: unknown) {
      setDispatchError(err instanceof Error ? err.message : 'Dispatch failed.');
    } finally {
      setDispatching(false);
    }
  };

  const handleComplete = async (tripId: string) => {
    const finalOdo = prompt('Enter final odometer reading (km):');
    const fuelConsumed = prompt('Enter fuel consumed (liters):');
    setActioningId(tripId);
    try {
      await api.patch(`/trips/${tripId}/complete`, {
        final_odometer: finalOdo ? parseFloat(finalOdo) : undefined,
        fuel_consumed: fuelConsumed ? parseFloat(fuelConsumed) : undefined,
      });
      fetchTrips();
      fetchResources();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to complete trip.');
    } finally {
      setActioningId(null);
    }
  };

  const handleCancel = async (tripId: string) => {
    if (!confirm('Cancel this trip? Vehicle and driver will be restored to Available.')) return;
    setActioningId(tripId);
    try {
      await api.patch(`/trips/${tripId}/cancel`, {});
      fetchTrips();
      fetchResources();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to cancel trip.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Trip Dispatcher</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create & Dispatch Trip Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">CREATE & DISPATCH TRIP</h3>
          </div>
          <div className="p-6 space-y-4">

            {/* Stepper */}
            <div className="flex items-center justify-between mb-4 px-4">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">1</div>
                <span className="text-[10px] mt-1 text-gray-500 uppercase">Draft</span>
              </div>
              <div className="flex-1 h-px bg-gray-300 mx-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">2</div>
                <span className="text-[10px] mt-1 text-gray-500 uppercase">Dispatched</span>
              </div>
              <div className="flex-1 h-px bg-gray-300 mx-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs">3</div>
                <span className="text-[10px] mt-1 text-gray-500 uppercase">Completed</span>
              </div>
            </div>

            <form onSubmit={handleDispatch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <input
                  required
                  type="text"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="e.g. Gandhinagar Depot"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <input
                  required
                  type="text"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="e.g. Ahmedabad Hub"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle (Available Only)</label>
                  <select
                    required
                    value={form.vehicle_id}
                    onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm"
                    disabled={loadingResources}
                  >
                    <option value="">Select...</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} — {v.max_load_capacity} kg
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver (Available Only)</label>
                  <select
                    required
                    value={form.driver_id}
                    onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm"
                    disabled={loadingResources}
                  >
                    <option value="">Select...</option>
                    {availableDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.license_category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Weight (kg)</label>
                  <input
                    required
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={form.cargo_weight}
                    onChange={(e) => setForm({ ...form, cargo_weight: e.target.value })}
                    className={`w-full p-2 border rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm ${capacityExceeded ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planned Distance (km)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.1"
                    value={form.planned_distance}
                    onChange={(e) => setForm({ ...form, planned_distance: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              {capacityExceeded && selectedVehicle && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start text-sm text-red-700">
                  <svg className="h-5 w-5 mr-2 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>
                    <strong>Capacity exceeded!</strong> Vehicle capacity: {selectedVehicle.max_load_capacity} kg, Cargo: {cargoWeight} kg — exceeded by {(cargoWeight - selectedVehicle.max_load_capacity).toFixed(1)} kg → dispatch blocked.
                  </span>
                </div>
              )}

              {dispatchError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  {dispatchError}
                </div>
              )}

              {dispatchSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                  ✅ {dispatchSuccess}
                </div>
              )}

              <div className="pt-2 flex space-x-3">
                <button
                  type="submit"
                  disabled={capacityExceeded || dispatching || !form.cargo_weight || !form.vehicle_id || !form.driver_id}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 disabled:cursor-not-allowed text-white py-2 rounded-md font-medium transition-colors"
                >
                  {dispatching ? 'Dispatching...' : 'Dispatch Shipment'}
                </button>
                <button
                  type="button"
                  onClick={() => { setForm(EMPTY_FORM); setDispatchError(''); setDispatchSuccess(''); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Live Board */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">LIVE BOARD</h3>
            <button
              onClick={fetchTrips}
              className="text-xs text-amber-600 hover:text-amber-800 font-medium"
            >
              ↻ Refresh
            </button>
          </div>
          <div className="p-0">
            {loadingTrips ? (
              <div className="p-8 text-center text-gray-500 text-sm">Loading trips...</div>
            ) : trips.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No trips yet. Dispatch your first trip!</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {trips.map((trip) => (
                  <li key={trip.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">{trip.trip_code}</p>
                        <p className="text-sm text-gray-600 mt-1 truncate">{trip.source} → {trip.destination}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium text-gray-700">{trip.vehicle.registration_number}</span> • {trip.driver.name}
                        </p>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE[trip.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_LABEL[trip.status] ?? trip.status}
                        </span>
                        {trip.status === 'DISPATCHED' && (
                          <div className="flex space-x-1 mt-2">
                            <button
                              onClick={() => handleComplete(trip.id)}
                              disabled={actioningId === trip.id}
                              className="text-[10px] px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleCancel(trip.id)}
                              disabled={actioningId === trip.id}
                              className="text-[10px] px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trips;
