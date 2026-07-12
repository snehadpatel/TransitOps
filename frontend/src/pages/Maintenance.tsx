import React from 'react';

const Maintenance: React.FC = () => {
  const mockServiceLogs = [
    { vehicle: 'VAN-01', service: 'Oil Change', cost: '₹1,500', status: 'Completed' },
    { vehicle: 'TRK-02', service: 'Engine Repair', cost: '₹18,000', status: 'Completed' },
    { vehicle: 'VAN-03', service: 'Tyre Replace', cost: '₹4,500', status: 'In Shop' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Maintenance</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Log Service Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">LOG SERVICE RECORD</h3>
          </div>
          <div className="p-6 space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
              <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm">
                <option>Select vehicle...</option>
                <option>VAN-01</option>
                <option>TRK-02</option>
                <option>VAN-03</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <input type="text" className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="e.g. Oil Change" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹)</label>
                <input type="number" className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm">
                <option>Active / In Shop</option>
                <option>Completed / Available</option>
              </select>
            </div>

            <div className="pt-4">
              <button className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-md font-medium transition-colors">
                Save Record
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Automated Status Flow:</p>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Available</span>
                <span>&rarr;</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">In Shop</span>
                <span>&rarr;</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Available</span>
              </div>
              <p className="text-xs text-red-500 italic mt-3">
                Note: In Shop vehicles are removed from the dispatch pool.
              </p>
            </div>
          </div>
        </div>

        {/* Service Log Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">SERVICE LOG</h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">VEHICLE</th>
                  <th className="px-6 py-3 font-medium">SERVICE</th>
                  <th className="px-6 py-3 font-medium">COST</th>
                  <th className="px-6 py-3 font-medium">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockServiceLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-800 font-medium">{log.vehicle}</td>
                    <td className="px-6 py-4 text-gray-500">{log.service}</td>
                    <td className="px-6 py-4 text-gray-500">{log.cost}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
