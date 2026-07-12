import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../services/api';

interface ReportRow {
  [key: string]: string | number;
}

const REPORT_TYPES = [
  { value: 'trips', label: 'Trip Report', icon: 'fa-route', color: '#4f6ef7' },
  { value: 'expenses', label: 'Expense Report', icon: 'fa-file-invoice-dollar', color: '#ef4b5f' },
  { value: 'fuel', label: 'Fuel Report', icon: 'fa-gas-pump', color: '#f5a623' },
  { value: 'maintenance', label: 'Maintenance Report', icon: 'fa-screwdriver-wrench', color: '#17c1a3' },
  { value: 'drivers', label: 'Driver Performance', icon: 'fa-id-card', color: '#6a5cf0' },
];

const COLUMNS: Record<string, string[]> = {
  trips: ['Trip Code', 'Source', 'Destination', 'Vehicle', 'Driver', 'Status', 'Date', 'Distance', 'Cost'],
  expenses: ['Vehicle', 'Category', 'Toll', 'Other', 'Total', 'Date', 'Notes'],
  fuel: ['Vehicle', 'Date', 'Liters', 'Cost', 'Efficiency', 'Driver'],
  maintenance: ['Vehicle', 'Service Type', 'Cost', 'Date', 'Status', 'Notes'],
  drivers: ['Driver', 'License', 'Category', 'Trips', 'Safety Score', 'Status'],
};

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('trips');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setGenerated(false);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (statusFilter) params.set('status', statusFilter);
      const data = await api.get<ReportRow[]>(`/reports/${reportType}?${params.toString()}`);
      setRows(data);
    } catch {
      // Fallback to empty
      setRows([]);
    } finally {
      setLoading(false);
      setGenerated(true);
    }
  };

  const handleExportCSV = () => {
    if (rows.length === 0) return;
    const cols = COLUMNS[reportType];
    const csvRows = [cols.join(','), ...rows.map(row => Object.values(row).map(v => `"${v}"`).join(','))];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transitops_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (rows.length === 0) return;
    const doc = new jsPDF();
    const reportLabel = REPORT_TYPES.find(r => r.value === reportType)?.label || 'Report';
    doc.setFontSize(16);
    doc.text(`TransitOps — ${reportLabel}`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    if (startDate || endDate) {
      doc.text(`Date Range: ${startDate || '—'} to ${endDate || '—'}`, 14, 36);
    }
    autoTable(doc, {
      startY: 44,
      head: [COLUMNS[reportType]],
      body: rows.map(row => Object.values(row).map(v => String(v))),
      headStyles: { fillColor: [79, 110, 247] },
      alternateRowStyles: { fillColor: [245, 247, 255] },
    });
    doc.save(`transitops_${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="section-title">
            <i className="fas fa-chart-column" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
            Reports
          </div>
          <div className="section-subtitle">Generate, preview and export detailed fleet reports</div>
        </div>
        {generated && rows.length > 0 && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleExportCSV} className="btn btn-light">
              <i className="fas fa-file-csv"></i> Export CSV
            </button>
            <button onClick={handleExportPDF} className="btn btn-primary">
              <i className="fas fa-file-pdf"></i> Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Report Type Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {REPORT_TYPES.map(rt => (
          <div
            key={rt.value}
            onClick={() => { setReportType(rt.value); setGenerated(false); setRows([]); }}
            className="tx-card hoverable"
            style={{
              padding: '18px',
              cursor: 'pointer',
              border: reportType === rt.value ? `2px solid ${rt.color}` : '1px solid var(--tx-border)',
              background: reportType === rt.value ? `${rt.color}12` : 'var(--tx-surface)',
              transition: 'all 0.18s ease',
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${rt.color}22`, color: rt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: '12px' }}>
              <i className={`fas ${rt.icon}`}></i>
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--tx-text)' }}>{rt.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Panel */}
      <div className="tx-card" style={{ marginBottom: '24px' }}>
        <div className="tx-card-body">
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '16px' }}>
            <i className="fas fa-filter" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
            Report Filters
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-control" />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-control" />
            </div>
            {reportType === 'trips' && (
              <div>
                <label className="form-label">Status</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select">
                  <option value="">All</option>
                  <option value="DRAFT">Draft</option>
                  <option value="DISPATCHED">Dispatched</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            )}
            <div>
              <button onClick={handleGenerate} disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Generating…</> : <><i className="fas fa-play"></i> Generate Report</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Table */}
      {generated && (
        <div className="tx-table-wrap animate-in">
          <div className="tx-table-toolbar" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
              <i className={`fas ${REPORT_TYPES.find(r => r.value === reportType)?.icon}`} style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
              {REPORT_TYPES.find(r => r.value === reportType)?.label}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--tx-text-muted)' }}>{rows.length} records</span>
          </div>
          {rows.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-chart-column"></i>
              <div>No records found for selected filters.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="tx-table">
                <thead>
                  <tr>
                    {COLUMNS[reportType].map(col => <th key={col}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((cell, j) => (
                        <td key={j}>{String(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
