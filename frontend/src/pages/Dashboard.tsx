import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

interface DashboardKPIs {
  totalVehicles: number;
  availableVehicles: number;
  inMaintenanceVehicles: number;
  onTripVehicles: number;
  retiredVehicles: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilization: number;
}

interface RecentTrip {
  id: string;
  trip_code: string;
  source: string;
  destination: string;
  status: string;
  eta?: string;
  vehicle: { registration_number: string; name_model: string };
  driver: { name: string };
}

interface VehicleStatusBreakdown {
  available: number;
  onTrip: number;
  inShop: number;
  retired: number;
}

interface DashboardResponse {
  kpis: DashboardKPIs;
  vehicleStatusBreakdown: VehicleStatusBreakdown;
  recentTrips: RecentTrip[];
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'badge badge-draft',
  DISPATCHED: 'badge badge-dispatched',
  COMPLETED: 'badge badge-completed',
  CANCELLED: 'badge badge-cancelled',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  DISPATCHED: 'On Trip',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<DashboardResponse>('/analytics/dashboard');
      setData(res);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = () => {
      console.log('Real-time update received! Re-fetching dashboard data...');
      fetchDashboard();
    };
    socket.on('trip-updated', handleUpdate);
    socket.on('vehicle-updated', handleUpdate);
    return () => {
      socket.off('trip-updated', handleUpdate);
      socket.off('vehicle-updated', handleUpdate);
    };
  }, [fetchDashboard]);

  const kpiCards = data
    ? [
        { label: 'Active Vehicles', value: data.kpis.totalVehicles - data.kpis.retiredVehicles, icon: 'fa-truck', color: '#4f6ef7' },
        { label: 'Available', value: data.kpis.availableVehicles, icon: 'fa-square-check', color: '#17c1a3' },
        { label: 'In Maintenance', value: data.kpis.inMaintenanceVehicles, icon: 'fa-screwdriver-wrench', color: '#f5a623' },
        { label: 'Active Trips', value: data.kpis.activeTrips, icon: 'fa-route', color: '#6a5cf0' },
        { label: 'Pending Trips', value: data.kpis.pendingTrips, icon: 'fa-hourglass-half', color: '#4fc3f7' },
        { label: 'Drivers On Duty', value: data.kpis.driversOnDuty, icon: 'fa-id-card', color: '#ef4b5f' },
        { label: 'Fleet Utilization', value: `${data.kpis.fleetUtilization}%`, icon: 'fa-gauge-high', color: '#17a082' },
      ]
    : [];

  const breakdown = data?.vehicleStatusBreakdown;
  const total = breakdown
    ? breakdown.available + breakdown.onTrip + breakdown.inShop + breakdown.retired
    : 0;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <div className="section-title">Welcome back, {firstName} 👋</div>
          <div className="section-subtitle">Here's what's happening across your fleet today, {today}.</div>
        </div>
        <button onClick={fetchDashboard} className="btn btn-light btn-sm">
          <i className="fas fa-arrows-rotate"></i> Refresh
        </button>
      </div>

      {loading ? (
        <div className="tx-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--tx-text-muted)' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '12px' }}></i>
          <div>Loading dashboard…</div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {kpiCards.map((kpi, idx) => (
              <div
                key={idx}
                className="kpi-card"
                style={{ '--kpi-color': kpi.color, animationDelay: `${idx * 0.06}s` } as React.CSSProperties}
              >
                <div className="kpi-icon"><i className={`fas ${kpi.icon}`}></i></div>
                <div>
                  <div className="kpi-value">{String(kpi.value).padStart(2, '0')}</div>
                  <div className="kpi-label">{kpi.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            {/* Recent Trips */}
            <div className="tx-table-wrap">
              <div className="tx-table-toolbar">
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
                  <i className="fas fa-route" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
                  Recent Trips
                </h3>
              </div>
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Trip</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th>Route</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentTrips ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--tx-text-muted)' }}>
                        <i className="fas fa-route" style={{ fontSize: '1.5rem', opacity: 0.4, display: 'block', marginBottom: '8px' }}></i>
                        No recent trips
                      </td>
                    </tr>
                  ) : (data?.recentTrips ?? []).map((trip) => (
                    <tr key={trip.id}>
                      <td style={{ fontWeight: 600 }}>{trip.trip_code}</td>
                      <td>{trip.vehicle.registration_number}</td>
                      <td>{trip.driver.name}</td>
                      <td>
                        <span className={STATUS_BADGE[trip.status] ?? 'badge badge-draft'}>
                          {STATUS_LABEL[trip.status] ?? trip.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', maxWidth: '180px' }}>
                        {trip.source} → {trip.destination}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vehicle Status Breakdown */}
            <div className="tx-card">
              <div className="tx-card-body">
                <h3 style={{ margin: '0 0 20px 0', fontWeight: 700, fontSize: '0.95rem' }}>
                  <i className="fas fa-chart-pie" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
                  Vehicle Status
                </h3>
                {breakdown && [
                  { label: 'Available', count: breakdown.available, color: '#17c1a3' },
                  { label: 'On Trip', count: breakdown.onTrip, color: '#4f6ef7' },
                  { label: 'In Shop', count: breakdown.inShop, color: '#f5a623' },
                  { label: 'Retired', count: breakdown.retired, color: '#ef4b5f' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span style={{ width: '80px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--tx-text-muted)' }}>{item.label}</span>
                    <div className="progress" style={{ flex: 1 }}>
                      <div
                        className="progress-bar"
                        style={{ width: `${pct(item.count)}%`, background: item.color }}
                      />
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, width: '28px', textAlign: 'right' }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
