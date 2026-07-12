import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../services/api';

interface ReportsKPIs {
  fuelEfficiency: number;
  fleetUtilization: number;
  totalOperationalCost: number;
  roi: number;
  totalFuelLiters: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalDistance: number;
  completedTrips: number;
}

interface CostVehicle {
  name: string;
  cost: number;
}

const Analytics: React.FC = () => {
  const [kpis, setKpis] = useState<ReportsKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [months, setMonths] = useState(6);

  const CHART_COLORS = ['#4f6ef7', '#17c1a3', '#f5a623', '#ef4b5f', '#4fc3f7', '#6a5cf0'];

  const fetchKPIs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<ReportsKPIs>('/analytics/reports');
      setKpis(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/analytics/reports/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transitops_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('CSV export failed.');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  // Build cost breakdown chart data from KPI data
  const costData: CostVehicle[] = kpis
    ? [
        { name: 'Fuel', cost: kpis.totalFuelCost },
        { name: 'Maintenance', cost: kpis.totalMaintenanceCost },
      ]
    : [];

  const kpiCards = kpis
    ? [
        { label: 'FUEL EFFICIENCY (DIST/FUEL)', value: `${kpis.fuelEfficiency} km/l`, color: 'text-gray-800' },
        { label: 'FLEET UTILIZATION', value: `${kpis.fleetUtilization}%`, color: 'text-gray-800' },
        { label: 'OPERATIONAL COST', value: formatCurrency(kpis.totalOperationalCost), color: 'text-gray-800' },
        { label: 'VEHICLE ROI', value: `${kpis.roi}%`, color: kpis.roi >= 0 ? 'text-green-600' : 'text-red-600', note: 'ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost' },
      ]
    : [];

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('TransitOps Analytics Report', 14, 20);
    
    autoTable(doc, {
      startY: 30,
      head: [['Metric', 'Value']],
      body: kpis ? [
        ['Fuel Efficiency (Dist/Fuel)', `${kpis.fuelEfficiency} km/l`],
        ['Fleet Utilization', `${kpis.fleetUtilization}%`],
        ['Operational Cost', formatCurrency(kpis.totalOperationalCost)],
        ['Vehicle ROI', `${kpis.roi}%`]
      ] : [],
    });

    const docAny = doc as any;
    doc.text('Top Costliest Vehicles', 14, docAny.lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: docAny.lastAutoTable.finalY + 20,
      head: [['Vehicle', 'Cost']],
      body: costData.map(c => [c.name, `₹${c.cost}`]),
    });

    doc.save('transitops-analytics.pdf');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="section-title">
            <i className="fas fa-chart-line" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
            Analytics &amp; Reports
          </div>
          <div className="section-subtitle">Deep insights into fleet performance, costs and profitability</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportCSV} disabled={exporting} className="btn btn-light">
            <i className="fas fa-file-csv"></i>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button onClick={generatePDF} className="btn btn-primary">
            <i className="fas fa-file-pdf"></i> Download PDF
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="tx-card" style={{ marginBottom: '24px' }}>
        <div className="tx-card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            <i className="fas fa-calendar" style={{ marginRight: '6px', color: 'var(--tx-primary)' }}></i>
            Date Range
          </label>
          {[3, 6, 12, 24].map(m => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={months === m ? 'btn btn-primary btn-sm' : 'btn btn-light btn-sm'}
            >
              Last {m} months
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="tx-card" style={{ padding: '80px', textAlign: 'center', color: 'var(--tx-text-muted)' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.8rem', marginBottom: '12px' }}></i>
          <div>Loading analytics…</div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Fuel Efficiency', value: `${kpis?.fuelEfficiency ?? 0} km/L`, icon: 'fa-gauge-high', color: '#17c1a3' },
              { label: 'Fleet Utilization', value: `${kpis?.fleetUtilization ?? 0}%`, icon: 'fa-truck', color: '#4f6ef7' },
              { label: 'Operational Cost', value: formatCurrency(kpis?.totalOperationalCost ?? 0), icon: 'fa-coins', color: '#f5a623' },
              { label: 'Vehicle ROI', value: `${kpis?.roi ?? 0}%`, icon: 'fa-money-bill-trend-up', color: (kpis?.roi ?? 0) >= 0 ? '#17c1a3' : '#ef4b5f' },
              { label: 'Completed Trips', value: String(kpis?.completedTrips ?? 0), icon: 'fa-route', color: '#6a5cf0' },
              { label: 'Total Distance', value: `${kpis?.totalDistance ?? 0} km`, icon: 'fa-road', color: '#4fc3f7' },
              { label: 'Fuel Cost', value: formatCurrency(kpis?.totalFuelCost ?? 0), icon: 'fa-gas-pump', color: '#e0900f' },
              { label: 'Maintenance Cost', value: formatCurrency(kpis?.totalMaintenanceCost ?? 0), icon: 'fa-screwdriver-wrench', color: '#ef4b5f' },
            ].map((kpi, i) => (
              <div key={i} className="kpi-card" style={{ '--kpi-color': kpi.color, animationDelay: `${i * 0.04}s` } as React.CSSProperties}>
                <div className="kpi-icon"><i className={`fas ${kpi.icon}`}></i></div>
                <div>
                  <div className="kpi-value" style={{ fontSize: '1.4rem' }}>{kpi.value}</div>
                  <div className="kpi-label">{kpi.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Cost Breakdown Bar */}
            <div className="tx-card tx-chart-card">
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--tx-border)' }}>
                <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>
                  <i className="fas fa-chart-bar" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
                  Cost Breakdown — Fuel vs Maintenance
                </h6>
              </div>
              <div style={{ height: '260px', padding: '16px' }}>
                {costData.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px' }}>
                    <i className="fas fa-chart-bar"></i><div>No data yet</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--tx-border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--tx-text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--tx-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ background: '#1a2036', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Cost']} />
                      <Bar dataKey="cost" radius={[6, 6, 0, 0]} maxBarSize={60}>
                        {costData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Operational Summary */}
            <div className="tx-card">
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--tx-border)' }}>
                <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>
                  <i className="fas fa-clipboard-check" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
                  Operational Summary
                </h6>
              </div>
              <div className="tx-card-body">
                {kpis && [
                  { label: 'Total Fuel Consumed', value: `${kpis.totalFuelLiters.toFixed(1)} L` },
                  { label: 'Total Distance Covered', value: `${kpis.totalDistance} km` },
                  { label: 'Fuel Cost', value: formatCurrency(kpis.totalFuelCost) },
                  { label: 'Maintenance Cost', value: formatCurrency(kpis.totalMaintenanceCost) },
                  { label: 'Total Operational Cost', value: formatCurrency(kpis.totalOperationalCost), bold: true },
                ].map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: i < 4 ? '1px solid var(--tx-border)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '0.88rem', color: 'var(--tx-text-muted)', fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: row.bold ? 700 : 600, color: row.bold ? 'var(--tx-warning)' : 'var(--tx-text)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROI note */}
          {kpis && (
            <div className="rule-hint">
              <i className="fas fa-info-circle"></i>
              <span>ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost × 100. Current ROI: <strong>{kpis.roi}%</strong>. Fuel Efficiency: <strong>{kpis.fuelEfficiency} km/L</strong>.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;
