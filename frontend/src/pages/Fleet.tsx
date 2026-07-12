import React, { useState } from 'react';

const Fleet: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);

  const mockVehicles = [
    { reg: 'MH12AB1234', name: 'VAN-01', type: 'Van', capacity: '500 kg', odo: '14,500', cost: '₹1,200,000', status: 'Available' },
    { reg: 'MH14CD5678', name: 'TRK-02', type: 'Truck', capacity: '2 Ton', odo: '48,200', cost: '₹2,500,000', status: 'On Trip' },
    { reg: 'MH12XY9012', name: 'VAN-03', type: 'Van', capacity: '500 kg', odo: '18,900', cost: '₹1,250,000', status: 'In Shop' },
    { reg: 'MH02ZZ4455', name: 'TRK-04', type: 'Truck', capacity: '3 Ton', odo: '154,000', cost: '₹3,100,000', status: 'Retired' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-700';
      case 'On Trip': return 'bg-blue-100 text-blue-700';
      case 'In Shop': return 'bg-orange-100 text-orange-700';
      case 'Retired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Vehicle Registry</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
        >
          + Add Vehicle
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex space-x-6 items-center">
        <div className="flex-1 max-w-xs">
          <input type="text" placeholder="Search Registration No..." className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <div className="flex space-x-2 items-center">
          <label className="text-sm text-gray-500">Type</label>
          <select className="border-b border-gray-300 text-sm focus:outline-none focus:border-amber-500 bg-transparent pb-1">
            <option>All</option>
            <option>Van</option>
            <option>Truck</option>
          </select>
        </div>
        <div className="flex space-x-2 items-center">
          <label className="text-sm text-gray-500">Status</label>
          <select className="border-b border-gray-300 text-sm focus:outline-none focus:border-amber-500 bg-transparent pb-1">
            <option>All</option>
            <option>Available</option>
            <option>On Trip</option>
            <option>In Shop</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">REG. NO.</th>
                <th className="px-6 py-3 font-medium">NAME/MODEL</th>
                <th className="px-6 py-3 font-medium">TYPE</th>
                <th className="px-6 py-3 font-medium">CAPACITY</th>
                <th className="px-6 py-3 font-medium">ODOMETER</th>
                <th className="px-6 py-3 font-medium">ACQUISITION COST</th>
                <th className="px-6 py-3 font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockVehicles.map((v, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800 font-medium">{v.reg}</td>
                  <td className="px-6 py-4 text-gray-500">{v.name}</td>
                  <td className="px-6 py-4 text-gray-500">{v.type}</td>
                  <td className="px-6 py-4 text-gray-500">{v.capacity}</td>
                  <td className="px-6 py-4 text-gray-500">{v.odo}</td>
                  <td className="px-6 py-4 text-gray-500">{v.cost}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(v.status)}`}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-red-500 font-medium italic">
        Note: Registration No. must be unique. Retired/In Shop vehicles are hidden from Trip Dispatcher.
      </p>

      {/* Add Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add New Vehicle</h3>
            <p className="text-sm text-gray-500 mb-4">Form implementation goes here.</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded text-sm">Cancel</button>
              <button className="px-4 py-2 bg-amber-500 text-white rounded text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fleet;
