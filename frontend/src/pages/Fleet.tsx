import React, { useState } from 'react';

const Fleet: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<{name: string, url: string}[]>([]);

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

  const handleOpenDocs = async (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setShowDocsModal(true);
    // Fetch docs from API
    try {
      const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      // In real implementation we'd use the actual ID. Using reg as mock ID
      const res = await fetch(`${VITE_API_URL}/vehicles/${vehicle.reg}/documents`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setDocs(await res.json());
      }
    } catch(err) { console.error(err); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedVehicle) return;
    setUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('document', file);
    
    try {
      const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const res = await fetch(`${VITE_API_URL}/vehicles/${selectedVehicle.reg}/documents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (res.ok) {
        const newDoc = await res.json();
        setDocs([newDoc, ...docs]);
      }
    } catch (err) { console.error(err); }
    setUploading(false);
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
                <th className="px-6 py-3 font-medium text-right">ACTIONS</th>
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
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenDocs(v)} className="text-amber-500 hover:text-amber-600 font-medium text-sm">
                      Documents
                    </button>
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
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Add New Vehicle</h3>
            <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">Form implementation goes here.</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded text-sm dark:text-gray-300 dark:border-gray-600">Cancel</button>
              <button className="px-4 py-2 bg-amber-500 text-white rounded text-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocsModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-bold mb-2 dark:text-white">Documents - {selectedVehicle.name}</h3>
            <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">Upload and view vehicle documents (PDF/PNG).</p>
            
            <div className="mb-4">
              <input type="file" id="docUpload" className="hidden" accept=".pdf,image/*" onChange={handleUpload} />
              <label htmlFor="docUpload" className="cursor-pointer flex items-center justify-center w-full py-2 px-4 border border-dashed border-gray-400 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {uploading ? 'Uploading...' : '+ Upload Document'}
              </label>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {docs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No documents found.</p>
              ) : (
                docs.map((d, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate pr-4">{d.name}</span>
                    <a href={`http://localhost:5001${d.url}`} target="_blank" rel="noreferrer" className="text-amber-500 hover:text-amber-600 text-sm font-medium whitespace-nowrap">View</a>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowDocsModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fleet;
