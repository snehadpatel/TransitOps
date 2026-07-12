import { useState, useEffect } from 'react';
import api from '../services/api';
import Badge from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';

function KPICard({ label, value, icon, color = 'amber', sub }) {
  const colors = {
    amber:  'text-amber-600 bg-amber-50',
    green:  'text-green-600 bg-green-50',
    blue:   'text-blue-600 bg-blue-50',
    orange: 'text-orange-600 bg-orange-50',
    red:    'text-red-600 bg-red-50',
    gray:   'text-gray-600 bg-gray-100',
  };
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="kpi-label">{label}</p>
          <p className="kpi-value mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBar({ breakdown = {} }) {
  const total = (breakdown.available || 0) + (breakdown.onTrip || 0) + (breakdown.inShop || 0) + (breakdown.retired || 0);
  if (total === 0) return <div className="text-sm text-gray-400">No vehicles registered.</div>;

  const segments = [
    { key: 'available', label: 'Available', value: breakdown.available || 0, color: '#22C55E' },
    { key: 'onTrip',    label: 'On Trip',   value: breakdown.onTrip    || 0, color: '#3B82F6' },
    { key: 'inShop',    label: 'In Shop',   value: breakdown.inShop    || 0, color: '#F97316' },
    { key: 'retired',   label: 'Retired',   value: breakdown.retired   || 0, color: '#EF4444' },
  ].filter((s) => s.value > 0);

  return (
    <div>
      {/* Bar */}
      <div className="h-4 rounded-full overflow-hidden flex gap-0.5 mb-3">
        {segments.map((seg) => (
          <div
            key={seg.key}
            style={{ width: `${(seg.value / total) * 100}%`, background: seg.color }}
            className="rounded-sm transition-all"
            title={`${seg.label}: ${seg.value}`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }} />
            <span className="font-medium">{seg.label}</span>
            <span className="text-gray-400">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return <p className="text-gray-500">Failed to load dashboard.</p>;

  const { kpis, vehicleStatusBreakdown, recentTrips } = data;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Live fleet overview</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Vehicles"   value={kpis.totalVehicles}   color="gray"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM1 1h4l2.68 13.39a2 2 0 001.98 1.61H19a2 2 0 001.98-1.71L23 6H6"/></svg>}
        />
        <KPICard label="Available Vehicles" value={kpis.availableVehicles} color="green"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
        />
        <KPICard label="In Maintenance" value={kpis.inMaintenanceVehicles} color="orange"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
        />
        <KPICard label="Fleet Utilization" value={`${kpis.fleetUtilization}%`} color="blue"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>}
        />
        <KPICard label="Active Trips"  value={kpis.activeTrips}  color="blue"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>}
        />
        <KPICard label="Pending Trips" value={kpis.pendingTrips} color="amber"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <KPICard label="Drivers on Duty" value={kpis.driversOnDuty} color="green"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20H7a2 2 0 01-2-2v-1a5 5 0 015-5h4a5 5 0 015 5v1a2 2 0 01-2 2zM12 11a4 4 0 100-8 4 4 0 000 8z"/></svg>}
        />
        <KPICard label="Retired Vehicles" value={kpis.retiredVehicles} color="red"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>}
        />
      </div>

      {/* Vehicle Status Bar */}
      <div className="card card-body">
        <h2 className="font-semibold text-gray-800 mb-4">Vehicle Status Breakdown</h2>
        <StatusBar breakdown={vehicleStatusBreakdown} />
      </div>

      {/* Recent Trips */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-gray-800">Recent Trips</h2>
        </div>
        <div className="table-container rounded-none border-0 border-t border-gray-100">
          <table className="data-table">
            <thead>
              <tr>
                <th>Trip Code</th>
                <th>Route</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.length === 0 && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-8">No active trips.</td></tr>
              )}
              {recentTrips.map((trip) => (
                <tr key={trip.id}>
                  <td className="font-mono text-xs">{trip.trip_code}</td>
                  <td>{trip.source} → {trip.destination}</td>
                  <td>{trip.vehicle?.registration_number}</td>
                  <td>{trip.driver?.name}</td>
                  <td><Badge status={trip.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
