import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import Pagination from '../components/Pagination';

interface AuditLog {
  id: string;
  user_name: string;
  user_email: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT';
  resource: string;
  resource_id?: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

interface AuditResponse { data: AuditLog[]; meta: { total: number } }

const ACTION_BADGE: Record<string, string> = {
  CREATE:  'badge badge-available',
  UPDATE:  'badge badge-on_trip',
  DELETE:  'badge badge-cancelled',
  LOGIN:   'badge badge-info',
  LOGOUT:  'badge badge-off_duty',
  EXPORT:  'badge badge-in_shop',
};

const ACTION_ICON: Record<string, string> = {
  CREATE:  'fa-plus',
  UPDATE:  'fa-pen',
  DELETE:  'fa-trash',
  LOGIN:   'fa-right-to-bracket',
  LOGOUT:  'fa-right-from-bracket',
  EXPORT:  'fa-download',
};

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (actionFilter) params.set('action', actionFilter);
      if (resourceFilter) params.set('resource', resourceFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('page', page.toString());
      params.set('limit', pageSize.toString());
      const res = await api.get<AuditResponse>(`/audit-logs?${params.toString()}`);
      setLogs(res.data);
      setTotal(res.meta.total);
    } catch {
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, resourceFilter, startDate, endDate, page, pageSize]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleExportCSV = () => {
    const headers = 'Timestamp,User,Action,Resource,Details,IP';
    const rows = logs.map(l =>
      `"${l.created_at}","${l.user_name}","${l.action}","${l.resource}","${l.details}","${l.ip_address || ''}"`
    );
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transitops_audit_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <div className="section-title"><i className="fas fa-clipboard-list" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Audit Logs</div>
          <div className="section-subtitle">Track all user actions and system events</div>
        </div>
        <button onClick={handleExportCSV} className="btn btn-light">
          <i className="fas fa-file-csv"></i> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="tx-table-wrap" style={{ marginBottom: '20px' }}>
        <div className="tx-table-toolbar" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <input type="text" placeholder="Search user or details..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="form-control" style={{ maxWidth: '260px' }} />
          <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} className="form-select" style={{ width: 'auto' }}>
            <option value="">All Actions</option>
            {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT'].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={resourceFilter} onChange={e => { setResourceFilter(e.target.value); setPage(1); }} className="form-select" style={{ width: 'auto' }}>
            <option value="">All Resources</option>
            {['vehicles', 'drivers', 'trips', 'maintenance', 'fuel', 'expenses', 'users'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} className="form-control" style={{ width: 'auto' }} title="Start date" />
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} className="form-control" style={{ width: 'auto' }} title="End date" />
          {(search || actionFilter || resourceFilter || startDate || endDate) && (
            <button onClick={() => { setSearch(''); setActionFilter(''); setResourceFilter(''); setStartDate(''); setEndDate(''); setPage(1); }} className="btn btn-light btn-sm">
              <i className="fas fa-xmark"></i> Clear
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--tx-text-muted)' }}>{total} entries</span>
        </div>
      </div>

      {/* Table */}
      <div className="tx-table-wrap">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--tx-text-muted)' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.4rem' }}></i>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Details</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan={6}><div className="empty-state"><i className="fas fa-clipboard-list"></i><div>No audit logs found.</div></div></td></tr>
                  ) : logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{fmtDate(log.created_at)}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.user_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--tx-text-muted)' }}>{log.user_email}</div>
                      </td>
                      <td>
                        <span className={ACTION_BADGE[log.action] ?? 'badge badge-draft'}>
                          <i className={`fas ${ACTION_ICON[log.action] ?? 'fa-circle'}`}></i>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>{log.resource}</td>
                      <td style={{ fontSize: '0.82rem', maxWidth: '300px' }}>{log.details}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--tx-text-muted)' }}>{log.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > 0 && (
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(total / pageSize)}
                totalRecords={total}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={s => { setPageSize(s); setPage(1); }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
