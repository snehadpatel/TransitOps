import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex space-x-6 items-center">
        <h2 className="font-medium text-gray-700">Filters:</h2>
        <div className="flex space-x-2 items-center">
          <label className="text-sm text-gray-500">Vehicle Type</label>
          <select className="border-b border-gray-300 text-sm focus:outline-none focus:border-amber-500 bg-transparent pb-1">
            <option>All</option>
            <option>Truck</option>
            <option>Van</option>
          </select>
        </div>
        <div className="flex space-x-2 items-center">
          <label className="text-sm text-gray-500">Status</label>
          <select className="border-b border-gray-300 text-sm focus:outline-none focus:border-amber-500 bg-transparent pb-1">
            <option>All</option>
            <option>Available</option>
            <option>On Trip</option>
          </select>
        </div>
        <div className="flex space-x-2 items-center">
          <label className="text-sm text-gray-500">Region</label>
          <select className="border-b border-gray-300 text-sm focus:outline-none focus:border-amber-500 bg-transparent pb-1">
            <option>All</option>
            <option>North</option>
            <option>South</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: 'ACTIVE VEHICLES', value: '53' },
          { label: 'AVAILABLE VEHICLES', value: '42' },
          { label: 'VEHICLES IN MAINTENANCE', value: '05' },
          { label: 'ACTIVE TRIPS', value: '18' },
          { label: 'PENDING TRIPS', value: '04' },
          { label: 'DRIVERS ON DUTY', value: '26' },
          { label: 'FLEET UTILIZATION', value: '87%' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{kpi.label}</p>
            <p className="text-3xl font-light text-gray-800 mt-2">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trips Table */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">RECENT TRIPS</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">TRIP</th>
                  <th className="px-6 py-3 font-medium">VEHICLE</th>
                  <th className="px-6 py-3 font-medium">DRIVER</th>
                  <th className="px-6 py-3 font-medium">STATUS</th>
                  <th className="px-6 py-3 font-medium">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 font-medium">TR001</td>
                  <td className="px-6 py-4 text-gray-500">VAN-01</td>
                  <td className="px-6 py-4 text-gray-500">Alex</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">On Trip</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">45 min</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 font-medium">TR002</td>
                  <td className="px-6 py-4 text-gray-500">TRK-02</td>
                  <td className="px-6 py-4 text-gray-500">Sam</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Dispatched</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">1h 10m</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 font-medium">TR003</td>
                  <td className="px-6 py-4 text-gray-500">VAN-05</td>
                  <td className="px-6 py-4 text-gray-500">Jordan</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Completed</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">-</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 font-medium">TR004</td>
                  <td className="px-6 py-4 text-gray-500">--</td>
                  <td className="px-6 py-4 text-gray-500">--</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">Draft</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs italic">Awaiting vehicle</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Status Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">VEHICLE STATUS</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center">
              <span className="w-24 text-sm text-gray-600">Available</span>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[60%]"></div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-sm text-gray-600">On Trip</span>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[25%]"></div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-sm text-gray-600">In Shop</span>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-[10%]"></div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-sm text-gray-600">Retired</span>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-[5%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
