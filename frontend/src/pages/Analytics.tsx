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
    <div className="space-y-6 max-w-7xl mx-auto animate-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 page-title">Reports & Analytics</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md font-medium text-sm flex items-center transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button onClick={generatePDF} className="bg-amber-500 border border-amber-600 text-white hover:bg-amber-600 px-4 py-2 rounded-md font-medium text-sm flex items-center transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-lg text-center text-gray-500">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((kpi, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{kpi.label}</p>
                <p className={`text-3xl font-light mt-2 ${kpi.color}`}>{kpi.value}</p>
                {kpi.note && <p className="text-[9px] text-gray-400 mt-1 italic">{kpi.note}</p>}
              </div>
            ))}
          </div>

          {/* Additional KPIs row */}
          {kpis && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">COMPLETED TRIPS</p>
                <p className="text-2xl font-light text-gray-800 mt-2">{kpis.completedTrips}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">TOTAL DISTANCE</p>
                <p className="text-2xl font-light text-gray-800 mt-2">{kpis.totalDistance} km</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">FUEL COST</p>
                <p className="text-2xl font-light text-gray-800 mt-2">{formatCurrency(kpis.totalFuelCost)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">MAINTENANCE COST</p>
                <p className="text-2xl font-light text-gray-800 mt-2">{formatCurrency(kpis.totalMaintenanceCost)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 uppercase mb-4">COST BREAKDOWN (FUEL vs MAINTENANCE)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Cost']} />
                    <Bar dataKey="cost" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-center">
              <h3 className="text-sm font-semibold text-gray-800 uppercase mb-6">OPERATIONAL SUMMARY</h3>
              {kpis && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Total Fuel Consumed</span>
                    <span className="text-sm font-medium text-gray-800">{kpis.totalFuelLiters.toFixed(1)} L</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Total Distance Covered</span>
                    <span className="text-sm font-medium text-gray-800">{kpis.totalDistance} km</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Fuel Cost</span>
                    <span className="text-sm font-medium text-gray-800">{formatCurrency(kpis.totalFuelCost)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Maintenance Cost</span>
                    <span className="text-sm font-medium text-gray-800">{formatCurrency(kpis.totalMaintenanceCost)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm font-semibold text-gray-800">TOTAL OPERATIONAL COST</span>
                    <span className="text-sm font-bold text-amber-600">{formatCurrency(kpis.totalOperationalCost)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
