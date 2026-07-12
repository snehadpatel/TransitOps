import React, { useState, useEffect } from 'react';
import { getSocket } from '../services/socket';

const Trips: React.FC = () => {
  const [cargoWeight, setCargoWeight] = useState('');
  const [vehicle, setVehicle] = useState('');
  const capacity = vehicle === 'VAN-01' ? 500 : (vehicle === 'TRK-02' ? 2000 : 0);
  const cargoExceeded = vehicle && cargoWeight && Number(cargoWeight) > capacity;

  useEffect(() => {
    const socket = getSocket();
    
    const handleUpdate = () => {
      console.log('Real-time update received! Re-fetching trips and vehicles...');
      // In a real implementation, this would trigger a re-fetch of the live board
    };

    socket.on('trip-updated', handleUpdate);
    socket.on('vehicle-updated', handleUpdate);

    return () => {
      socket.off('trip-updated', handleUpdate);
      socket.off('vehicle-updated', handleUpdate);
    };
  }, []);

  const mockLiveBoard = [
    { id: 'TR001', route: 'Gandhinagar Depot -> Ahmedabad Hub', vehicle: 'VAN-01', driver: 'Alex', status: 'On Trip', eta: '45 min' },
    { id: 'TR002', route: 'Vatva Industrial Area -> Sanand Warehouses', vehicle: 'TRK-02', driver: 'Sam', status: 'Dispatched', eta: '1h 10m' },
    { id: 'TR003', route: 'Mundra -> Kandla Port', vehicle: 'VAN-05', driver: 'Jordan', status: 'Cancelled', eta: '-' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Trip Dispatcher</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Trip Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">CREATE TRIP</h3>
          </div>
          <div className="p-6 space-y-4">
            
            {/* Stepper */}
            <div className="flex items-center justify-between mb-8 px-4">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">1</div>
                <span className="text-[10px] mt-1 text-gray-500 uppercase">Draft</span>
              </div>
              <div className="flex-1 h-px bg-gray-300 mx-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs">2</div>
                <span className="text-[10px] mt-1 text-gray-500 uppercase">Dispatched</span>
              </div>
              <div className="flex-1 h-px bg-gray-300 mx-2"></div>
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs">3</div>
                <span className="text-[10px] mt-1 text-gray-500 uppercase">Completed</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <input type="text" className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="e.g. Gandhinagar Depot" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <input type="text" className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="e.g. Ahmedabad Hub" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle (Available Only)</label>
                <select 
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm"
                >
                  <option value="">Select...</option>
                  <option value="VAN-01">VAN-01 - 500 kg capacity</option>
                  <option value="TRK-02">TRK-02 - 2000 kg capacity</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver (Available Only)</label>
                <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm">
                  <option>Select...</option>
                  <option>Alex (Valid)</option>
                  <option>Jordan (Valid)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Weight (kg)</label>
                <input 
                  type="number" 
                  value={cargoWeight}
                  onChange={(e) => setCargoWeight(e.target.value)}
                  className={`w-full p-2 border rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm ${cargoExceeded ? 'border-red-500' : 'border-gray-300'}`} 
                  placeholder="0" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Planned Distance (km)</label>
                <input type="number" className="w-full p-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="0" />
              </div>
            </div>

            {cargoExceeded && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start text-sm text-red-700">
                <svg className="h-5 w-5 mr-2 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  <strong>Capacity exceeded!</strong> Vehicle Capacity: {capacity} kg, Cargo Weight: {cargoWeight} kg &mdash; Capacity exceeded by {Number(cargoWeight) - capacity} kg &rarr; dispatch blocked.
                </span>
              </div>
            )}

            <div className="pt-4 flex space-x-3">
              <button 
                disabled={cargoExceeded || !cargoWeight || !vehicle}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 disabled:cursor-not-allowed text-white py-2 rounded-md font-medium transition-colors"
              >
                Dispatch Shipment
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Live Board */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-800">LIVE BOARD</h3>
          </div>
          <div className="p-0">
            <ul className="divide-y divide-gray-200">
              {mockLiveBoard.map((trip) => (
                <li key={trip.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{trip.id}</p>
                      <p className="text-sm text-gray-600 mt-1">{trip.route}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        <span className="font-medium text-gray-700">{trip.vehicle}</span> &bull; {trip.driver}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-2">ETA: {trip.eta}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trip.status === 'On Trip' ? 'bg-blue-100 text-blue-700' :
                        trip.status === 'Dispatched' ? 'bg-blue-50 text-blue-600' :
                        trip.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trips;
