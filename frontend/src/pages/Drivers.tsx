import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Drivers: React.FC = () => {
  const { user } = useAuth();
  const isSafetyOfficer = user?.role === 'Safety Officer';

  const mockDrivers = [
    { id: '1', name: 'Alex', license: 'DL-14920', category: 'LMV', expiry: '12/2026', contact: '9876543210', completion: '92%', safety: 98, status: 'Available' },
    { id: '2', name: 'Sam', license: 'DL-99231', category: 'HMV', expiry: '03/2023 EXPIRED', contact: '9876543211', completion: '81%', safety: 72, status: 'Suspended' },
    { id: '3', name: 'Jordan', license: 'DL-11223', category: 'LMV', expiry: '05/2027', contact: '9876543212', completion: '100%', safety: 95, status: 'On Trip' },
    { id: '4', name: 'Priya', license: 'DL-88342', category: 'HMV', expiry: '01/2028', contact: '9876543213', completion: '89%', safety: 88, status: 'Off Duty' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-700';
      case 'On Trip': return 'bg-blue-100 text-blue-700';
      case 'Off Duty': return 'bg-gray-100 text-gray-700';
      case 'Suspended': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusButtons = (currentStatus: string) => {
    if (!isSafetyOfficer) return null;
    
    return (
      <div className="flex space-x-2 mt-2">
        {['Available', 'On Trip', 'Off Duty', 'Suspended'].map(s => (
          <button
            key={s}
            disabled={s === currentStatus}
            className={`text-[10px] px-2 py-1 rounded border ${
              s === currentStatus 
                ? 'opacity-50 cursor-not-allowed border-transparent ' + getStatusBadge(s)
                : 'border-gray-300 hover:bg-gray-50 text-gray-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Drivers & Safety Profiles</h2>
        {user?.role === 'Fleet Manager' && (
          <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors">
            + Add Driver
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex space-x-6 items-center">
        <div className="flex-1 max-w-xs">
          <input type="text" placeholder="Search..." className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:border-amber-500" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">DRIVER</th>
                <th className="px-6 py-3 font-medium">LICENSE NO.</th>
                <th className="px-6 py-3 font-medium">CATEGORY</th>
                <th className="px-6 py-3 font-medium">EXPIRY</th>
                <th className="px-6 py-3 font-medium">CONTACT</th>
                <th className="px-6 py-3 font-medium">TRIP COMP. %</th>
                <th className="px-6 py-3 font-medium">SAFETY SCORE</th>
                <th className="px-6 py-3 font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockDrivers.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 font-medium">{d.name}</td>
                  <td className="px-6 py-4 text-gray-500">{d.license}</td>
                  <td className="px-6 py-4 text-gray-500">{d.category}</td>
                  <td className={`px-6 py-4 ${d.expiry.includes('EXPIRED') ? 'text-red-500 font-medium' : 'text-gray-500'}`}>{d.expiry}</td>
                  <td className="px-6 py-4 text-gray-500">{d.contact}</td>
                  <td className="px-6 py-4 text-gray-500">{d.completion}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{d.safety}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(d.status)}`}>
                      {d.status}
                    </span>
                    {getStatusButtons(d.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-red-500 font-medium italic">
        Note: Expired license or Suspended status = blocked from trip assignment.
      </p>
    </div>
  );
};

export default Drivers;
