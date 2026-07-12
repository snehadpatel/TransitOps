import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

interface TripDetailData {
  id: string;
  trip_code: string;
  source: string;
  destination: string;
  status: string;
  cargo_weight: number;
  planned_distance: number;
  eta?: string;
  final_odometer?: number;
  fuel_consumed?: number;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  created_at: string;
  vehicle: { id: string; registration_number: string; name_model: string; status: string; max_load_capacity: number; odometer: number };
  driver: { id: string; name: string; license_number: string; status: string; safety_score: number };
  fuel_logs: { id: string; date: string; liters: number; cost: number }[];
  expenses: { id: string; date: string; category?: string; total: number; toll: number; other: number }[];
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'badge badge-draft',
  DISPATCHED: 'badge badge-on_trip',
  COMPLETED: 'badge badge-completed',
  CANCELLED: 'badge badge-cancelled',
};

const TripDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        setTrip(await api.get<TripDetailData>(`/trips/${id}`));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load trip.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const fmtDate = (value?: string) => (value ? new Date(value).toLocaleString('en-IN') : '—');
  const money = (value?: number) => `₹${(value ?? 0).toLocaleString('en-IN')}`;

  const handleComplete = async () => {
    if (!trip) return;
    const finalOdometer = prompt('Enter final odometer reading (km):');
    const fuelConsumed = prompt('Enter fuel consumed (liters):');
    await api.patch(`/trips/${trip.id}/complete`, {
      final_odometer: finalOdometer ? parseFloat(finalOdometer) : undefined,
      fuel_consumed: fuelConsumed ? parseFloat(fuelConsumed) : undefined,
    });
    navigate(0);
  };

  const handleCancel = async () => {
    if (!trip) return;
    if (!confirm('Cancel this trip?')) return;
    await api.patch(`/trips/${trip.id}/cancel`, {});
    navigate(0);
  };

  if (loading) {
    return <div className="tx-card" style={{ padding: '60px', textAlign: 'center' }}><i className="fas fa-spinner fa-spin"></i></div>;
  }

  if (error || !trip) {
    return <div className="rule-error"><i className="fas fa-circle-exclamation"></i>{error || 'Trip not found.'}</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <div className="section-title">{trip.trip_code}</div>
          <div className="section-subtitle">{trip.source} → {trip.destination}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {trip.status === 'DRAFT' && <Link to={`/trips/${trip.id}/edit`} className="btn btn-primary"><i className="fas fa-pen"></i>Edit</Link>}
          {trip.status === 'DISPATCHED' && <button onClick={handleComplete} className="btn btn-success"><i className="fas fa-check"></i>Complete</button>}
          {trip.status === 'DISPATCHED' && <button onClick={handleCancel} className="btn btn-danger"><i className="fas fa-xmark"></i>Cancel</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div className="tx-card"><div className="tx-card-body"><span className={STATUS_BADGE[trip.status]}>{trip.status}</span><h3 style={{ marginTop: '14px' }}>Route</h3><p>{trip.source} → {trip.destination}</p><p>Created: {fmtDate(trip.created_at)}</p><p>ETA: {fmtDate(trip.eta)}</p></div></div>
        <div className="tx-card"><div className="tx-card-body"><h3>Vehicle</h3><p>{trip.vehicle.registration_number}</p><p>{trip.vehicle.name_model}</p><p>Capacity: {trip.vehicle.max_load_capacity} kg</p><p>Odometer: {trip.vehicle.odometer} km</p></div></div>
        <div className="tx-card"><div className="tx-card-body"><h3>Driver</h3><p>{trip.driver.name}</p><p>{trip.driver.license_number}</p><p>Safety score: {trip.driver.safety_score}</p></div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div className="tx-table-wrap">
          <div className="tx-table-toolbar"><strong>Cost Breakdown</strong></div>
          <table className="tx-table">
            <tbody>
              <tr><td>Cargo weight</td><td>{trip.cargo_weight} kg</td></tr>
              <tr><td>Planned distance</td><td>{trip.planned_distance} km</td></tr>
              <tr><td>Fuel consumed</td><td>{trip.fuel_consumed ?? '—'}</td></tr>
              <tr><td>Final odometer</td><td>{trip.final_odometer ?? '—'}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="tx-table-wrap">
          <div className="tx-table-toolbar"><strong>Timeline</strong></div>
          <table className="tx-table">
            <tbody>
              <tr><td>Created</td><td>{fmtDate(trip.created_at)}</td></tr>
              <tr><td>Started</td><td>{fmtDate(trip.started_at)}</td></tr>
              <tr><td>Completed</td><td>{fmtDate(trip.completed_at)}</td></tr>
              <tr><td>Cancelled</td><td>{fmtDate(trip.cancelled_at)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div className="tx-table-wrap">
          <div className="tx-table-toolbar"><strong>Fuel Logs</strong></div>
          {trip.fuel_logs.length === 0 ? <div className="empty-state"><i className="fas fa-gas-pump"></i><div>No fuel logs</div></div> : <table className="tx-table"><thead><tr><th>Date</th><th>Liters</th><th>Cost</th></tr></thead><tbody>{trip.fuel_logs.map((log) => <tr key={log.id}><td>{fmtDate(log.date)}</td><td>{log.liters}</td><td>{money(log.cost)}</td></tr>)}</tbody></table>}
        </div>
        <div className="tx-table-wrap">
          <div className="tx-table-toolbar"><strong>Expenses</strong></div>
          {trip.expenses.length === 0 ? <div className="empty-state"><i className="fas fa-file-invoice-dollar"></i><div>No expenses</div></div> : <table className="tx-table"><thead><tr><th>Date</th><th>Category</th><th>Total</th></tr></thead><tbody>{trip.expenses.map((expense) => <tr key={expense.id}><td>{fmtDate(expense.date)}</td><td>{expense.category || 'Expense'}</td><td>{money(expense.total)}</td></tr>)}</tbody></table>}
        </div>
      </div>
    </div>
  );
};

export default TripDetail;