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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Fuel & Expense Management</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Logs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">FUEL LOGS</h3>
            {isFinancialAnalyst && (
              <button
                onClick={() => setShowFuelModal(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                + Log Fuel
              </button>
            )}
          </div>
          <div className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500 text-sm">Loading...</div>
            ) : fuelLogs.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No fuel logs yet.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">VEHICLE</th>
                    <th className="px-6 py-3 font-medium">DATE</th>
                    <th className="px-6 py-3 font-medium">LITERS</th>
                    <th className="px-6 py-3 font-medium">COST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fuelLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-800 font-medium">{log.vehicle.registration_number}</td>
                      <td className="px-6 py-4 text-gray-500">{fmtDate(log.date)}</td>
                      <td className="px-6 py-4 text-gray-500">{log.liters} L</td>
                      <td className="px-6 py-4 text-gray-800 font-medium">{fmt(log.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Other Expenses */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">OTHER EXPENSES (TOLL / MISC)</h3>
            {isFinancialAnalyst && (
              <button
                onClick={() => setShowExpenseModal(true)}
                className="border border-amber-500 text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                + Add Expense
              </button>
            )}
          </div>
          <div className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500 text-sm">Loading...</div>
            ) : expenses.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No expenses logged yet.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">VEHICLE</th>
                    <th className="px-6 py-3 font-medium">TOLL</th>
                    <th className="px-6 py-3 font-medium">OTHER</th>
                    <th className="px-6 py-3 font-medium">TOTAL</th>
                    <th className="px-6 py-3 font-medium">CATEGORY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-800 font-medium">{exp.vehicle.registration_number}</td>
                      <td className="px-6 py-4 text-gray-500">{fmt(exp.toll)}</td>
                      <td className="px-6 py-4 text-gray-500">{fmt(exp.other)}</td>
                      <td className="px-6 py-4 text-gray-800 font-medium">{fmt(exp.total)}</td>
                      <td className="px-6 py-4 text-gray-500">{exp.category ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Total Operational Cost */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800 uppercase tracking-wider">TOTAL OPERATIONAL COST (FUEL + MAINTENANCE)</h3>
        <p className="text-3xl font-light text-amber-500">{fmt(totalOpCost)}</p>
      </div>

      {/* Log Fuel Modal */}
      {showFuelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Log Fuel</h3>
            <form onSubmit={handleLogFuel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
                <select
                  required
                  value={fuelForm.vehicle_id}
                  onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })}
                  className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.registration_number}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Liters *</label>
                  <input
                    required
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={fuelForm.liters}
                    onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
                    className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={fuelForm.cost}
                    onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })}
                    className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="5000"
                  />
                </div>
              </div>
              {fuelError && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{fuelError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setShowFuelModal(false); setFuelError(''); }} className="px-4 py-2 border rounded text-sm" disabled={savingFuel}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded text-sm disabled:opacity-50" disabled={savingFuel}>
                  {savingFuel ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
                <select
                  required
                  value={expenseForm.vehicle_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })}
                  className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.registration_number}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toll (₹)</label>
                  <input type="number" min="0" step="0.01" value={expenseForm.toll} onChange={(e) => setExpenseForm({ ...expenseForm, toll: e.target.value })} className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other (₹)</label>
                  <input type="number" min="0" step="0.01" value={expenseForm.other} onChange={(e) => setExpenseForm({ ...expenseForm, other: e.target.value })} className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input type="text" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none" placeholder="e.g. Toll, Parking" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input type="text" value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} className="w-full p-2 border rounded text-sm focus:border-amber-500 focus:outline-none" placeholder="Optional" />
                </div>
              </div>
              {expenseError && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{expenseError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setShowExpenseModal(false); setExpenseError(''); }} className="px-4 py-2 border rounded text-sm" disabled={savingExpense}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded text-sm disabled:opacity-50" disabled={savingExpense}>
                  {savingExpense ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
