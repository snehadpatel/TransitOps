import React from 'react';
import { useAuth } from '../context/AuthContext';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'Fleet Manager';

  const rbacMatrix = [
    { role: 'Fleet Manager', fleet: '✓', drivers: 'view', trips: '–', fuel: '–', analytics: '–' },
    { role: 'Dispatcher', fleet: '–', drivers: 'view', trips: '✓', fuel: '–', analytics: '–' },
    { role: 'Safety Officer', fleet: '–', drivers: '✓', trips: 'view', fuel: '–', analytics: '–' },
    { role: 'Financial Analyst', fleet: 'view', drivers: '–', trips: '–', fuel: '✓', analytics: 'view' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Settings & RBAC</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">GENERAL SETTINGS</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Depot Name</label>
              <input 
                type="text" 
                defaultValue="Gandhinagar Depot (HQ)"
                disabled={!isManager}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm disabled:bg-gray-50" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select disabled={!isManager} className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm disabled:bg-gray-50">
                <option>INR (₹)</option>
                <option>USD ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distance Unit</label>
              <select disabled={!isManager} className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm disabled:bg-gray-50">
                <option>Kilometers (km)</option>
                <option>Miles (mi)</option>
              </select>
            </div>
            <div className="pt-4">
              <button 
                disabled={!isManager}
                className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* RBAC Matrix */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">ROLE-BASED ACCESS (RBAC)</h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">ROLE</th>
                  <th className="px-4 py-3 font-medium text-center">FLEET</th>
                  <th className="px-4 py-3 font-medium text-center">DRIVERS</th>
                  <th className="px-4 py-3 font-medium text-center">TRIPS</th>
                  <th className="px-4 py-3 font-medium text-center">FUEL/EXP</th>
                  <th className="px-4 py-3 font-medium text-center">ANALYTICS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rbacMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-gray-800 font-medium">{row.role}</td>
                    <td className="px-4 py-4 text-center">{row.fleet}</td>
                    <td className="px-4 py-4 text-center">{row.drivers}</td>
                    <td className="px-4 py-4 text-center">{row.trips}</td>
                    <td className="px-4 py-4 text-center">{row.fuel}</td>
                    <td className="px-4 py-4 text-center">{row.analytics}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
            Legend: ✓ = Full Edit | view = Read-only | – = No Access
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
