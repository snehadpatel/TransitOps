import React from 'react';

const Expenses: React.FC = () => {
  const fuelLogs = [
    { vehicle: 'VAN-01', date: '08 Jul 2026', liters: '45 L', cost: '₹4,500' },
    { vehicle: 'TRK-02', date: '08 Jul 2026', liters: '120 L', cost: '₹11,800' },
    { vehicle: 'VAN-03', date: '07 Jul 2026', liters: '38 L', cost: '₹3,750' },
  ];

  const otherExpenses = [
    { trip: 'TR001', vehicle: 'VAN-01', toll: '₹150', other: '₹0', maintenance: '-', total: '₹150', status: 'Completed' },
    { trip: 'TR002', vehicle: 'TRK-02', toll: '₹400', other: '₹50', maintenance: '₹18,000', total: '₹18,450', status: 'Completed' },
  ];

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
            <button className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
              + Log Fuel
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
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
                {fuelLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-800 font-medium">{log.vehicle}</td>
                    <td className="px-6 py-4 text-gray-500">{log.date}</td>
                    <td className="px-6 py-4 text-gray-500">{log.liters}</td>
                    <td className="px-6 py-4 text-gray-800 font-medium">{log.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Other Expenses */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">OTHER EXPENSES (TOLL / MISC)</h3>
            <button className="border border-amber-500 text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded text-sm font-medium transition-colors">
              + Add Expense
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">TRIP</th>
                  <th className="px-6 py-3 font-medium">VEHICLE</th>
                  <th className="px-6 py-3 font-medium">TOLL</th>
                  <th className="px-6 py-3 font-medium">OTHER</th>
                  <th className="px-6 py-3 font-medium">LINKED MAINT.</th>
                  <th className="px-6 py-3 font-medium">TOTAL</th>
                  <th className="px-6 py-3 font-medium">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {otherExpenses.map((exp, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-800 font-medium">{exp.trip}</td>
                    <td className="px-6 py-4 text-gray-500">{exp.vehicle}</td>
                    <td className="px-6 py-4 text-gray-500">{exp.toll}</td>
                    <td className="px-6 py-4 text-gray-500">{exp.other}</td>
                    <td className="px-6 py-4 text-gray-500">{exp.maintenance}</td>
                    <td className="px-6 py-4 text-gray-800 font-medium">{exp.total}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        {exp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800 uppercase tracking-wider">TOTAL OPERATIONAL COST (CARGO + FUEL + MAINTENANCE)</h3>
        <p className="text-3xl font-light text-amber-500">₹38,650</p>
      </div>
    </div>
  );
};

export default Expenses;
