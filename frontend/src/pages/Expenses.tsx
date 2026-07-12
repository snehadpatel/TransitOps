import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface FuelLog {
  id: string;
  date: string;
  liters: number;
  cost: number;
  vehicle: { registration_number: string };
  trip?: { trip_code: string } | null;
}

interface Expense {
  id: string;
  toll: number;
  other: number;
  total: number;
  category?: string;
  date: string;
  notes?: string;
  vehicle: { registration_number: string };
  trip?: { trip_code: string } | null;
}

interface FuelResponse { data: FuelLog[]; }
interface ExpenseResponse { data: Expense[]; }

interface Vehicle { id: string; registration_number: string; }
interface VehiclesResponse { data: Vehicle[]; }

const EMPTY_FUEL = { vehicle_id: '', liters: '', cost: '' };
const EMPTY_EXPENSE = { vehicle_id: '', toll: '0', other: '0', category: '', notes: '' };

const Expenses: React.FC = () => {
  const { user } = useAuth();
  const isFinancialAnalyst = user?.role === 'Financial Analyst';

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalOpCost, setTotalOpCost] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [showFuelModal, setShowFuelModal] = useState(false);
  const [fuelForm, setFuelForm] = useState(EMPTY_FUEL);
  const [savingFuel, setSavingFuel] = useState(false);
  const [fuelError, setFuelError] = useState('');

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE);
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [fuel, exp, vehs, kpis] = await Promise.all([
        api.get<FuelResponse>('/fuel?limit=20'),
        api.get<ExpenseResponse>('/expenses?limit=20'),
        api.get<VehiclesResponse>('/vehicles?limit=100'),
        api.get<{ totalOperationalCost: number }>('/analytics/reports'),
      ]);
      setFuelLogs(fuel.data);
      setExpenses(exp.data);
      setVehicles(vehs.data);
      setTotalOpCost(kpis.totalOperationalCost);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleLogFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFuel(true);
    setFuelError('');
    try {
      await api.post('/fuel', {
        vehicle_id: fuelForm.vehicle_id,
        liters: parseFloat(fuelForm.liters),
        cost: parseFloat(fuelForm.cost),
      });
      setShowFuelModal(false);
      setFuelForm(EMPTY_FUEL);
      fetchAll();
    } catch (err: unknown) {
      setFuelError(err instanceof Error ? err.message : 'Failed to log fuel.');
    } finally {
      setSavingFuel(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingExpense(true);
    setExpenseError('');
    const toll = parseFloat(expenseForm.toll) || 0;
    const other = parseFloat(expenseForm.other) || 0;
    try {
      await api.post('/expenses', {
        vehicle_id: expenseForm.vehicle_id,
        toll,
        other,
        category: expenseForm.category || undefined,
        notes: expenseForm.notes || undefined,
      });
      setShowExpenseModal(false);
      setExpenseForm(EMPTY_EXPENSE);
      fetchAll();
    } catch (err: unknown) {
      setExpenseError(err instanceof Error ? err.message : 'Failed to add expense.');
    } finally {
      setSavingExpense(false);
    }
  };

  const fmt = (val: number) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="section-title">
            <i className="fas fa-file-invoice-dollar" style={{ marginRight: '8px', color: 'var(--tx-danger)' }}></i>
            Fuel &amp; Expense Management
          </div>
          <div className="section-subtitle">Track fuel consumption and operational expenses</div>
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>

        {/* ── Fuel Logs ─────────────────────────────────────────── */}
        <div className="tx-table-wrap">
          <div className="tx-table-toolbar" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
              <i className="fas fa-gas-pump" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
              Fuel Logs
            </h3>
            {isFinancialAnalyst && (
              <button onClick={() => setShowFuelModal(true)} className="btn btn-primary btn-sm">
                <i className="fas fa-plus"></i> Log Fuel
              </button>
            )}
          </div>
          {loading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--tx-text-muted)' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.3rem' }}></i>
            </div>
          ) : fuelLogs.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px' }}>
              <i className="fas fa-gas-pump"></i>
              <div>No fuel logs yet.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Date</th>
                    <th>Liters</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>{log.vehicle.registration_number}</td>
                      <td style={{ fontSize: '0.82rem' }}>{fmtDate(log.date)}</td>
                      <td>{log.liters} L</td>
                      <td style={{ fontWeight: 600 }}>{fmt(log.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Other Expenses ────────────────────────────────────── */}
        <div className="tx-table-wrap">
          <div className="tx-table-toolbar" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
              <i className="fas fa-receipt" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>
              Other Expenses
            </h3>
            {isFinancialAnalyst && (
              <button onClick={() => setShowExpenseModal(true)} className="btn btn-outline-primary btn-sm">
                <i className="fas fa-plus"></i> Add Expense
              </button>
            )}
          </div>
          {loading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--tx-text-muted)' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.3rem' }}></i>
            </div>
          ) : expenses.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px' }}>
              <i className="fas fa-receipt"></i>
              <div>No expenses logged yet.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Toll</th>
                    <th>Other</th>
                    <th>Total</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td style={{ fontWeight: 600 }}>{exp.vehicle.registration_number}</td>
                      <td>{fmt(exp.toll)}</td>
                      <td>{fmt(exp.other)}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(exp.total)}</td>
                      <td style={{ fontSize: '0.82rem' }}>{exp.category ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Total Operational Cost ────────────────────────────── */}
      <div className="kpi-card" style={{ '--kpi-color': '#f5a623', marginTop: '20px' } as React.CSSProperties}>
        <div className="kpi-icon"><i className="fas fa-coins"></i></div>
        <div>
          <div className="kpi-value" style={{ fontSize: '1.6rem' }}>{fmt(totalOpCost)}</div>
          <div className="kpi-label">Total Operational Cost (Fuel + Maintenance)</div>
        </div>
      </div>

      {/* ── Log Fuel Modal ────────────────────────────────────── */}
      {showFuelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,12,20,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
          <div className="tx-card" style={{ width: '100%', maxWidth: '480px' }}>
            <div className="tx-card-body">
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>
                <i className="fas fa-gas-pump" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Log Fuel
              </h3>
              <form onSubmit={handleLogFuel} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Vehicle *</label>
                  <select required value={fuelForm.vehicle_id} onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })} className="form-select">
                    <option value="">Select vehicle…</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Liters *</label>
                    <input required type="number" min="0.1" step="0.1" value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} className="form-control" placeholder="50" />
                  </div>
                  <div>
                    <label className="form-label">Cost (₹) *</label>
                    <input required type="number" min="0" step="0.01" value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} className="form-control" placeholder="5000" />
                  </div>
                </div>
                {fuelError && <div className="rule-error"><i className="fas fa-circle-exclamation"></i>{fuelError}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => { setShowFuelModal(false); setFuelError(''); }} className="btn btn-light" disabled={savingFuel}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={savingFuel}>
                    {savingFuel ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Expense Modal ─────────────────────────────────── */}
      {showExpenseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,12,20,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
          <div className="tx-card" style={{ width: '100%', maxWidth: '480px' }}>
            <div className="tx-card-body">
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>
                <i className="fas fa-receipt" style={{ marginRight: '8px', color: 'var(--tx-primary)' }}></i>Add Expense
              </h3>
              <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Vehicle *</label>
                  <select required value={expenseForm.vehicle_id} onChange={(e) => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })} className="form-select">
                    <option value="">Select vehicle…</option>
                    {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Toll (₹)</label>
                    <input type="number" min="0" step="0.01" value={expenseForm.toll} onChange={(e) => setExpenseForm({ ...expenseForm, toll: e.target.value })} className="form-control" placeholder="0" />
                  </div>
                  <div>
                    <label className="form-label">Other (₹)</label>
                    <input type="number" min="0" step="0.01" value={expenseForm.other} onChange={(e) => setExpenseForm({ ...expenseForm, other: e.target.value })} className="form-control" placeholder="0" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Category</label>
                    <input type="text" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} className="form-control" placeholder="e.g. Toll, Parking" />
                  </div>
                  <div>
                    <label className="form-label">Notes</label>
                    <input type="text" value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} className="form-control" placeholder="Optional" />
                  </div>
                </div>
                {expenseError && <div className="rule-error"><i className="fas fa-circle-exclamation"></i>{expenseError}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => { setShowExpenseModal(false); setExpenseError(''); }} className="btn btn-light" disabled={savingExpense}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={savingExpense}>
                    {savingExpense ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
