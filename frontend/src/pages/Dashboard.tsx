import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

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
  DRAFT: 'bg-gray-100 text-gray-700',
  DISPATCHED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
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
    // Auto-refresh every 30 seconds for live dashboard
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const kpiCards = data
    ? [
        { label: 'ACTIVE VEHICLES', value: data.kpis.totalVehicles - data.kpis.retiredVehicles },
        { label: 'AVAILABLE VEHICLES', value: data.kpis.availableVehicles },
        { label: 'VEHICLES IN MAINTENANCE', value: data.kpis.inMaintenanceVehicles },
        { label: 'ACTIVE TRIPS', value: data.kpis.activeTrips },
        { label: 'PENDING TRIPS', value: data.kpis.pendingTrips },
        { label: 'DRIVERS ON DUTY', value: data.kpis.driversOnDuty },
        { label: 'FLEET UTILIZATION', value: `${data.kpis.fleetUtilization}%` },
      ]
    : [];

  const breakdown = data?.vehicleStatusBreakdown;
  const total = breakdown
    ? breakdown.available + breakdown.onTrip + breakdown.inShop + breakdown.retired
    : 0;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex space-x-6 items-center">
        <h2 className="font-medium text-gray-700">Filters:</h2>
        <div className="flex space-x-2 items-center">
          <label className="text-sm text-gray-500">Vehicle Type</label>
          <select className="border-b border-gray-300 text-sm focus:outline-none focus:border-amber-500 bg-transparent pb-1">
            <option>All</option>
            <option>Truck</option>
            <option>Van</option>
          </select>
        </div>
        <div className="flex space-x-2 items-center">
          <label className="text-sm text-gray-500">Status</label>
          <select className="border-b border-gray-300 text-sm focus:outline-none focus:border-amber-500 bg-transparent pb-1">
            <option>All</option>
            <option>Available</option>
            <option>On Trip</option>
          </select>
        </div>
        <div className="ml-auto">
          <button
            onClick={fetchDashboard}
            className="text-xs text-amber-600 hover:text-amber-800 font-medium"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="bg-white p-8 rounded-lg text-center text-gray-500">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {kpiCards.map((kpi, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{kpi.label}</p>
                <p className="text-3xl font-light text-gray-800 mt-2">{String(kpi.value).padStart(2, '0')}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Trips Table */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-800">RECENT TRIPS</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 font-medium">TRIP</th>
                      <th className="px-6 py-3 font-medium">VEHICLE</th>
                      <th className="px-6 py-3 font-medium">DRIVER</th>
                      <th className="px-6 py-3 font-medium">STATUS</th>
                      <th className="px-6 py-3 font-medium">ROUTE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(data?.recentTrips ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No recent trips.</td>
                      </tr>
                    ) : (data?.recentTrips ?? []).map((trip) => (
                      <tr key={trip.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-800 font-medium">{trip.trip_code}</td>
                        <td className="px-6 py-4 text-gray-500">{trip.vehicle.registration_number}</td>
                        <td className="px-6 py-4 text-gray-500">{trip.driver.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE[trip.status] ?? 'bg-gray-100 text-gray-700'}`}>
                            {STATUS_LABEL[trip.status] ?? trip.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs max-w-xs truncate">
                          {trip.source} → {trip.destination}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vehicle Status Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-800">VEHICLE STATUS</h3>
              </div>
              <div className="p-6 space-y-4">
                {breakdown && [
                  { label: 'Available', count: breakdown.available, color: 'bg-green-500' },
                  { label: 'On Trip', count: breakdown.onTrip, color: 'bg-blue-500' },
                  { label: 'In Shop', count: breakdown.inShop, color: 'bg-orange-500' },
                  { label: 'Retired', count: breakdown.retired, color: 'bg-red-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center">
                    <span className="w-24 text-sm text-gray-600">{item.label}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct(item.count)}%` }}
                      />
                    </div>
                    <span className="ml-3 text-xs text-gray-500 w-6 text-right">{item.count}</span>
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
