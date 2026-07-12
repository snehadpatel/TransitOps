import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
  monthlyFuelCost?: number;
  monthlyExpenses?: number;
  totalOperationalCost?: number;
  totalRevenue?: number;
  totalProfit?: number;
  monthlyMaintenanceCost?: number;
}

interface RecentTrip {
  id: string; trip_code: string; source: string; destination: string;
  status: string; vehicle: { registration_number: string }; driver: { name: string };
}
interface MaintenanceAlert { id: string; registration_number: string; service_type: string; start_date: string; }
interface DriverAlert { id: string; name: string; license_number: string; license_expiry: string; daysUntil: number; }
interface VehicleAlert { id: string; registration_number: string; name_model: string; insurance_expiry: string; daysUntil: number; }
interface ExpenseEntry { id: string; registration_number: string; category: string; amount: number; date: string; }
interface FuelEntry { id: string; registration_number: string; fuel_quantity: number; fuel_cost: number; }
interface VehicleStatusBreakdown { available: number; onTrip: number; inShop: number; retired: number; }
interface MonthlyData { month: string; trips?: number; fuel?: number; maintenance?: number; revenue?: number; expenses?: number; }

interface DashboardResponse {
  kpis: DashboardKPIs;
  vehicleStatusBreakdown: VehicleStatusBreakdown;
  recentTrips: RecentTrip[];
  upcomingMaintenance?: MaintenanceAlert[];
  licenseAlerts?: DriverAlert[];
  insuranceAlerts?: VehicleAlert[];
  latestExpenses?: ExpenseEntry[];
  latestFuelLogs?: FuelEntry[];
  monthlyData?: MonthlyData[];
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'badge badge-draft', DISPATCHED: 'badge badge-on_trip',
  COMPLETED: 'badge badge-completed', CANCELLED: 'badge badge-cancelled',
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft', DISPATCHED: 'On Trip', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};
const CHART_COLORS = ['#4f6ef7', '#17c1a3', '#f5a623', '#ef4b5f', '#4fc3f7', '#6a5cf0'];
const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<DashboardResponse>('/analytics/dashboard');
      setData(res);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = () => fetchDashboard();
    socket.on('trip-updated', handleUpdate);
    socket.on('vehicle-updated', handleUpdate);
    return () => { socket.off('trip-updated', handleUpdate); socket.off('vehicle-updated', handleUpdate); };
  }, [fetchDashboard]);

  const k = data?.kpis;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const firstName = user?.name?.split(' ')[0] ?? '';

  const kpiCards = k ? [
    { label: 'Active Vehicles', value: k.totalVehicles - k.retiredVehicles, icon: 'fa-truck', color: '#4f6ef7' },
    { label: 'Available', value: k.availableVehicles, icon: 'fa-square-check', color: '#17c1a3' },
    { label: 'In Maintenance', value: k.inMaintenanceVehicles, icon: 'fa-screwdriver-wrench', color: '#f5a623' },
    { label: 'Active Trips', value: k.activeTrips, icon: 'fa-route', color: '#6a5cf0' },
    { label: 'Pending Trips', value: k.pendingTrips, icon: 'fa-hourglass-half', color: '#4fc3f7' },
    { label: 'Drivers On Duty', value: k.driversOnDuty, icon: 'fa-id-card', color: '#ef4b5f' },
    { label: 'Fleet Utilization', value: `${k.fleetUtilization}%`, icon: 'fa-gauge-high', color: '#17a082' },
    { label: 'Monthly Fuel Cost', value: fmt(k.monthlyFuelCost ?? 0), icon: 'fa-gas-pump', color: '#e0900f' },
    { label: 'Monthly Expenses', value: fmt(k.monthlyExpenses ?? 0), icon: 'fa-file-invoice-dollar', color: '#d43850' },
    { label: 'Operational Cost', value: fmt(k.totalOperationalCost ?? 0), icon: 'fa-coins', color: '#3b52d6' },
  ] : [];

  const financeCards = k ? [
    { label: 'Total Revenue', value: fmt(k.totalRevenue ?? 0), icon: 'fa-sack-dollar', color: '#17c1a3' },
    { label: 'Estimated Profit', value: fmt(k.totalProfit ?? 0), icon: 'fa-money-bill-trend-up', color: '#ef4b5f' },
    { label: 'Maintenance Cost', value: fmt(k.monthlyMaintenanceCost ?? 0), icon: 'fa-screwdriver-wrench', color: '#f5a623' },
  ] : [];

  const breakdown = data?.vehicleStatusBreakdown;
  const total = breakdown ? breakdown.available + breakdown.onTrip + breakdown.inShop + breakdown.retired : 0;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const pieData = breakdown ? [
    { name: 'Available', value: breakdown.available },
    { name: 'On Trip', value: breakdown.onTrip },
    { name: 'In Shop', value: breakdown.inShop },
    { name: 'Retired', value: breakdown.retired },
  ] : [];
  const monthlyData = data?.monthlyData ?? [];

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="section-title">Welcome back, {firstName} 👋</div>
          <div className="section-subtitle">Here's what's happening across your fleet today, {today}.</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a href="/reports" className="btn btn-light btn-sm"><i className="fas fa-file-export"></i> Reports</a>
          <a href="/analytics" className="btn btn-light btn-sm"><i className="fas fa-chart-line"></i> Analytics</a>
          <button onClick={fetchDashboard} className="btn btn-light btn-sm"><i className="fas fa-arrows-rotate"></i> Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="tx-card" style={{ padding: '80px', textAlign: 'center', color: 'var(--tx-text-muted)' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.8rem', marginBottom: '14px' }}></i>
          <div>Loading dashboard…</div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {kpiCards.map((kpi, idx) => (
              <div key={idx} className="kpi-card" style={{ '--kpi-color': kpi.color, animationDelay: `${idx * 0.04}s` } as React.CSSProperties}>
                <div className="kpi-icon"><i className={`fas ${kpi.icon}`}></i></div>
                <div>
                  <div className="kpi-value">{typeof kpi.value === 'number' ? String(kpi.value).padStart(2, '0') : kpi.value}</div>
                  <div className="kpi-label">{kpi.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Finance Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {financeCards.map((c, i) => (
              <div key={i} className="kpi-card" style={{ '--kpi-color': c.color } as React.CSSProperties}>
                <div className="kpi-icon"><i className={`fas ${c.icon}`}></i></div>
                <div>
                  <div className="kpi-value" style={{ fontSize: '1.4rem' }}>{c.value}</div>
                  <div className="kpi-label">{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Trips per Month */}
            <div className="tx-card tx-chart-card">
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--tx-border)' }}>
                <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}><i className="fas fa-route" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Trips per Month</h6>
              </div>
              <div style={{ height: '260px', padding: '16px' }}>
                {monthlyData.length === 0 ? <div className="empty-state" style={{ padding: '40px' }}><i className="fas fa-chart-bar"></i><div>No data yet</div></div> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--tx-border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--tx-text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--tx-text-muted)' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1a2036', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="trips" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Vehicle Utilization Pie */}
            <div className="tx-card tx-chart-card">
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--tx-border)' }}>
                <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}><i className="fas fa-truck" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Vehicle Utilization</h6>
              </div>
              <div style={{ height: '260px', padding: '16px' }}>
                {pieData.every(p => p.value === 0) ? <div className="empty-state" style={{ padding: '40px' }}><i className="fas fa-chart-pie"></i><div>No data yet</div></div> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1a2036', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.78rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Fuel Consumption */}
            <div className="tx-card tx-chart-card">
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--tx-border)' }}>
                <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}><i className="fas fa-gas-pump" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Fuel Consumption Trend</h6>
              </div>
              <div style={{ height: '240px', padding: '16px' }}>
                {monthlyData.length === 0 ? <div className="empty-state" style={{ padding: '40px' }}><i className="fas fa-chart-line"></i><div>No data yet</div></div> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--tx-border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--tx-text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--tx-text-muted)' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1a2036', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Line type="monotone" dataKey="fuel" stroke={CHART_COLORS[2]} strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Maintenance Cost */}
            <div className="tx-card tx-chart-card">
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--tx-border)' }}>
                <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}><i className="fas fa-screwdriver-wrench" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Maintenance Cost Trend</h6>
              </div>
              <div style={{ height: '240px', padding: '16px' }}>
                {monthlyData.length === 0 ? <div className="empty-state" style={{ padding: '40px' }}><i className="fas fa-chart-bar"></i><div>No data yet</div></div> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--tx-border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--tx-text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--tx-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                      <Tooltip contentStyle={{ background: '#1a2036', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Cost']} />
                      <Bar dataKey="maintenance" fill={CHART_COLORS[2]} radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Widgets Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Recent Trips */}
            <div className="tx-table-wrap">
              <div className="tx-table-toolbar" style={{ justifyContent: 'space-between' }}>
                <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}><i className="fas fa-route" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Recent Trips</h6>
                <a href="/trips" style={{ fontSize: '0.82rem', color: 'var(--tx-primary)' }}>View all</a>
              </div>
              {(data?.recentTrips ?? []).length === 0 ? (
                <div className="empty-state" style={{ padding: '40px' }}><i className="fas fa-route"></i><div>No recent trips</div></div>
              ) : (
                <table className="tx-table">
                  <thead><tr><th>Trip</th><th>Vehicle</th><th>Driver</th><th>Status</th></tr></thead>
                  <tbody>
                    {(data?.recentTrips ?? []).map(t => (
                      <tr key={t.id}>
                        <td><div style={{ fontWeight: 600 }}>{t.trip_code}</div><div style={{ fontSize: '0.75rem', color: 'var(--tx-text-muted)' }}>{t.source} → {t.destination}</div></td>
                        <td>{t.vehicle.registration_number}</td>
                        <td>{t.driver.name}</td>
                        <td><span className={STATUS_BADGE[t.status] ?? 'badge badge-draft'}>{STATUS_LABEL[t.status] ?? t.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Vehicle Status + Upcoming Maintenance */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Vehicle Status Bars */}
              <div className="tx-card">
                <div className="tx-card-body">
                  <h6 style={{ margin: '0 0 18px', fontWeight: 700, fontSize: '0.9rem' }}><i className="fas fa-chart-pie" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Vehicle Status</h6>
                  {breakdown && [
                    { label: 'Available', count: breakdown.available, color: '#17c1a3' },
                    { label: 'On Trip', count: breakdown.onTrip, color: '#4f6ef7' },
                    { label: 'In Shop', count: breakdown.inShop, color: '#f5a623' },
                    { label: 'Retired', count: breakdown.retired, color: '#ef4b5f' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ width: '70px', fontSize: '0.82rem', color: 'var(--tx-text-muted)', fontWeight: 500 }}>{item.label}</span>
                      <div className="progress" style={{ flex: 1 }}>
                        <div className="progress-bar" style={{ width: `${pct(item.count)}%`, background: item.color }} />
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, width: '24px', textAlign: 'right' }}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Maintenance */}
              {(data?.upcomingMaintenance ?? []).length > 0 && (
                <div className="tx-card">
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--tx-border)', display: 'flex', justifyContent: 'space-between' }}>
                    <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}><i className="fas fa-screwdriver-wrench" style={{ marginRight: '8px', color: 'var(--tx-warning)' }}></i>Open Maintenance</h6>
                    <a href="/maintenance" style={{ fontSize: '0.82rem', color: 'var(--tx-primary)' }}>View all</a>
                  </div>
                  {(data?.upcomingMaintenance ?? []).map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid var(--tx-border)', fontSize: '0.85rem' }}>
                      <div><div style={{ fontWeight: 600 }}>{m.registration_number}</div><div style={{ fontSize: '0.75rem', color: 'var(--tx-text-muted)' }}>{m.service_type}</div></div>
                      <div style={{ color: 'var(--tx-text-muted)', fontSize: '0.78rem' }}>{fmtDate(m.start_date)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Alerts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* License Expiry Alerts */}
            <div className="tx-card">
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--tx-border)', display: 'flex', justifyContent: 'space-between' }}>
                <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}><i className="fas fa-id-card" style={{ marginRight: '8px', color: 'var(--tx-danger)' }}></i>License Expiry Alerts</h6>
                <a href="/drivers" style={{ fontSize: '0.82rem', color: 'var(--tx-primary)' }}>View all</a>
              </div>
              {(data?.licenseAlerts ?? []).length === 0 ? (
                <div className="empty-state" style={{ padding: '30px' }}><i className="fas fa-circle-check"></i><div>No expiring licenses</div></div>
              ) : (data?.licenseAlerts ?? []).map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--tx-border)' }}>
                  <div><div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{d.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--tx-text-muted)' }}>{d.license_number}</div></div>
                  <span className={d.daysUntil < 0 ? 'badge badge-cancelled' : 'badge badge-in_shop'}>{d.daysUntil < 0 ? 'Expired' : `${d.daysUntil}d left`}</span>
                </div>
              ))}
            </div>

            {/* Insurance Expiry Alerts */}
            <div className="tx-card">
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--tx-border)', display: 'flex', justifyContent: 'space-between' }}>
                <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}><i className="fas fa-file-shield" style={{ marginRight: '8px', color: 'var(--tx-danger)' }}></i>Insurance Expiry Alerts</h6>
                <a href="/fleet" style={{ fontSize: '0.82rem', color: 'var(--tx-primary)' }}>View all</a>
              </div>
              {(data?.insuranceAlerts ?? []).length === 0 ? (
                <div className="empty-state" style={{ padding: '30px' }}><i className="fas fa-circle-check"></i><div>No expiring insurance</div></div>
              ) : (data?.insuranceAlerts ?? []).map(v => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--tx-border)' }}>
                  <div><div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{v.registration_number}</div><div style={{ fontSize: '0.75rem', color: 'var(--tx-text-muted)' }}>{v.name_model}</div></div>
                  <span className={v.daysUntil < 0 ? 'badge badge-cancelled' : 'badge badge-in_shop'}>{v.daysUntil < 0 ? 'Expired' : `${v.daysUntil}d left`}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Expenses & Fuel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="tx-table-wrap">
              <div className="tx-table-toolbar" style={{ justifyContent: 'space-between' }}>
                <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}><i className="fas fa-file-invoice-dollar" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Latest Expenses</h6>
                <a href="/expenses" style={{ fontSize: '0.82rem', color: 'var(--tx-primary)' }}>View all</a>
              </div>
              {(data?.latestExpenses ?? []).length === 0 ? (
                <div className="empty-state" style={{ padding: '30px' }}><i className="fas fa-receipt"></i><div>No expenses logged</div></div>
              ) : (
                <table className="tx-table">
                  <thead><tr><th>Vehicle</th><th>Category</th><th>Amount</th><th>Date</th></tr></thead>
                  <tbody>{(data?.latestExpenses ?? []).map(e => (
                    <tr key={e.id}><td style={{ fontWeight: 600 }}>{e.registration_number ?? '—'}</td><td>{e.category}</td><td>{fmt(e.amount)}</td><td style={{ fontSize: '0.78rem' }}>{fmtDate(e.date)}</td></tr>
                  ))}</tbody>
                </table>
              )}
            </div>

            <div className="tx-table-wrap">
              <div className="tx-table-toolbar" style={{ justifyContent: 'space-between' }}>
                <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}><i className="fas fa-gas-pump" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Latest Fuel Logs</h6>
                <a href="/expenses" style={{ fontSize: '0.82rem', color: 'var(--tx-primary)' }}>View all</a>
              </div>
              {(data?.latestFuelLogs ?? []).length === 0 ? (
                <div className="empty-state" style={{ padding: '30px' }}><i className="fas fa-gas-pump"></i><div>No fuel logs</div></div>
              ) : (
                <table className="tx-table">
                  <thead><tr><th>Vehicle</th><th>Qty (L)</th><th>Cost</th></tr></thead>
                  <tbody>{(data?.latestFuelLogs ?? []).map(f => (
                    <tr key={f.id}><td style={{ fontWeight: 600 }}>{f.registration_number}</td><td>{f.fuel_quantity}</td><td>{fmt(f.fuel_cost)}</td></tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
