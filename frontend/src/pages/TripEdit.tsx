import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

interface EditTripData {
  id: string;
  trip_code: string;
  source: string;
  destination: string;
  vehicle_id: string;
  driver_id: string;
  cargo_weight: number;
  planned_distance: number;
  eta?: string;
  status: string;
}

const TripEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<EditTripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ source: '', destination: '', cargo_weight: '', planned_distance: '', eta: '' });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await api.get<EditTripData>(`/trips/${id}`);
        setTrip(data);
        setForm({
          source: data.source,
          destination: data.destination,
          cargo_weight: String(data.cargo_weight),
          planned_distance: String(data.planned_distance),
          eta: data.eta ? data.eta.slice(0, 10) : '',
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load trip.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;
    setSaving(true);
    setError('');
    try {
      await api.patch(`/trips/${trip.id}`, {
        source: form.source,
        destination: form.destination,
        cargo_weight: parseFloat(form.cargo_weight),
        planned_distance: parseFloat(form.planned_distance),
        ...(form.eta ? { eta: form.eta } : {}),
      });
      navigate(`/trips/${trip.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save trip.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="tx-card" style={{ padding: '60px', textAlign: 'center' }}><i className="fas fa-spinner fa-spin"></i></div>;
  if (error || !trip) return <div className="rule-error"><i className="fas fa-circle-exclamation"></i>{error || 'Trip not found.'}</div>;
  if (trip.status !== 'DRAFT') return <div className="rule-error"><i className="fas fa-circle-exclamation"></i>Only draft trips can be edited.</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <div className="section-title">Edit {trip.trip_code}</div>
          <div className="section-subtitle">Update the draft trip before dispatch</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="tx-card">
        <div className="tx-card-body" style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div><label className="form-label">Source</label><input className="form-control" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
            <div><label className="form-label">Destination</label><input className="form-control" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div><label className="form-label">Cargo Weight (kg)</label><input className="form-control" type="number" step="0.1" value={form.cargo_weight} onChange={(e) => setForm({ ...form, cargo_weight: e.target.value })} /></div>
            <div><label className="form-label">Planned Distance (km)</label><input className="form-control" type="number" step="0.1" value={form.planned_distance} onChange={(e) => setForm({ ...form, planned_distance: e.target.value })} /></div>
          </div>
          <div><label className="form-label">ETA</label><input className="form-control" type="date" value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })} /></div>
          {error && <div className="rule-error"><i className="fas fa-circle-exclamation"></i>{error}</div>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-light" onClick={() => navigate(`/trips/${trip.id}`)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TripEdit;