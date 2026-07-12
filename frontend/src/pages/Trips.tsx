import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DRAFT: 'badge badge-draft',
  DISPATCHED: 'badge badge-on_trip',
  COMPLETED: 'badge badge-completed',
  CANCELLED: 'badge badge-cancelled',
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
  const navigate = useNavigate();
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
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="section-title"><i className="fas fa-route" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Trip Dispatcher</div>
          <div className="section-subtitle">Create and manage trips with live status tracking</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
        {/* Create & Dispatch Trip Form */}
        <div className="tx-card">
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--tx-border)' }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
              <i className="fas fa-truck-fast" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
              Create &amp; Dispatch Trip
            </h3>
          </div>
          <div className="tx-card-body">

            {/* Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '0 8px' }}>
              {[{ n: 1, label: 'Draft', active: true }, { n: 2, label: 'Dispatched', active: true }, { n: 3, label: 'Completed', active: false }].map((step, i, arr) => (
                <React.Fragment key={step.n}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step.active ? 'linear-gradient(135deg, var(--tx-primary), #6a5cf0)' : 'var(--tx-bg-alt)', color: step.active ? '#fff' : 'var(--tx-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, boxShadow: step.active ? '0 4px 12px rgba(79,110,247,0.35)' : 'none' }}>{step.n}</div>
                    <span style={{ fontSize: '0.65rem', marginTop: '6px', color: 'var(--tx-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{step.label}</span>
                  </div>
                  {i < arr.length - 1 && <div style={{ flex: 1, height: '2px', background: 'var(--tx-border)', margin: '0 8px', marginBottom: '18px' }} />}
                </React.Fragment>
              ))}
            </div>

            <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Source</label>
                  <input required type="text" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="form-control" placeholder="e.g. Gandhinagar Depot" />
                </div>
                <div>
                  <label className="form-label">Destination</label>
                  <input required type="text" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="form-control" placeholder="e.g. Ahmedabad Hub" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Vehicle (Available Only)</label>
                  <select required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} className="form-select" disabled={loadingResources}>
                    <option value="">Select...</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.registration_number} — {v.max_load_capacity} kg</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Driver (Available Only)</label>
                  <select required value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })} className="form-select" disabled={loadingResources}>
                    <option value="">Select...</option>
                    {availableDrivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.license_category})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Cargo Weight (kg)</label>
                  <input required type="number" min="0.1" step="0.1" value={form.cargo_weight} onChange={(e) => setForm({ ...form, cargo_weight: e.target.value })} className="form-control" style={capacityExceeded ? { borderColor: 'var(--tx-danger)' } : {}} placeholder="0" />
                </div>
                <div>
                  <label className="form-label">Planned Distance (km)</label>
                  <input required type="number" min="1" step="0.1" value={form.planned_distance} onChange={(e) => setForm({ ...form, planned_distance: e.target.value })} className="form-control" placeholder="0" />
                </div>
              </div>

              {capacityExceeded && selectedVehicle && (
                <div className="rule-error">
                  <i className="fas fa-triangle-exclamation"></i>
                  <span><strong>Capacity exceeded!</strong> Vehicle: {selectedVehicle.max_load_capacity} kg, Cargo: {cargoWeight} kg — exceeded by {(cargoWeight - selectedVehicle.max_load_capacity).toFixed(1)} kg → dispatch blocked.</span>
                </div>
              )}
              {dispatchError && <div className="rule-error"><i className="fas fa-circle-exclamation"></i>{dispatchError}</div>}
              {dispatchSuccess && (
                <div className="rule-hint" style={{ background: 'rgba(23,193,163,0.1)', borderColor: 'rgba(23,193,163,0.3)', color: '#0e8f78' }}>
                  <i className="fas fa-circle-check"></i>{dispatchSuccess}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
                <button type="submit" disabled={capacityExceeded || dispatching || !form.cargo_weight || !form.vehicle_id || !form.driver_id} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <i className="fas fa-truck-fast"></i>
                  {dispatching ? 'Dispatching...' : 'Dispatch Shipment'}
                </button>
                <button type="button" onClick={() => { setForm(EMPTY_FORM); setDispatchError(''); setDispatchSuccess(''); }} className="btn btn-light">Clear</button>
              </div>
            </form>
          </div>
        </div>

        {/* Live Board */}
        <div className="tx-card">
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--tx-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
              <i className="fas fa-signal" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
              Live Board
            </h3>
            <button onClick={fetchTrips} className="btn btn-light btn-sm">
              <i className="fas fa-arrows-rotate"></i> Refresh
            </button>
          </div>
          <div>
            {loadingTrips ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--tx-text-muted)' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.4rem' }}></i>
                <div style={{ marginTop: '10px', fontSize: '0.875rem' }}>Loading trips...</div>
              </div>
            ) : trips.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-route"></i>
                <div>No trips yet. Dispatch your first trip!</div>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {trips.map((trip) => (
                  <li key={trip.id} onClick={() => navigate(`/trips/${trip.id}`)} style={{ padding: '16px 22px', borderBottom: '1px solid var(--tx-border)', transition: 'background 0.15s ease', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--tx-primary-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx-text)' }}>{trip.trip_code}</p>
                        <p style={{ margin: '5px 0', fontSize: '0.83rem', color: 'var(--tx-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.source} → {trip.destination}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--tx-text-muted)' }}>
                          <span style={{ fontWeight: 600, color: 'var(--tx-text)' }}>{trip.vehicle.registration_number}</span> &bull; {trip.driver.name}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: '12px', flexShrink: 0 }}>
                        <span className={STATUS_BADGE[trip.status] ?? 'badge badge-draft'}>
                          {STATUS_LABEL[trip.status] ?? trip.status}
                        </span>
                        {trip.status === 'DISPATCHED' && (
                          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                            <button onClick={() => handleComplete(trip.id)} disabled={actioningId === trip.id} className="btn btn-success btn-sm" style={{ fontSize: '0.7rem', padding: '4px 10px' }}>
                              <i className="fas fa-check"></i> Complete
                            </button>
                            <button onClick={() => handleCancel(trip.id)} disabled={actioningId === trip.id} className="btn btn-danger btn-sm" style={{ fontSize: '0.7rem', padding: '4px 10px' }}>
                              <i className="fas fa-xmark"></i> Cancel
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
