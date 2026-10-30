import { MapPin, Box, Plus } from 'lucide-react';

export default function Warehouses() {
  const facilities = [
    { id: '1', name: 'Delhi Central Hub', location: 'New Delhi, India', capacity: '85%', status: 'Active' },
    { id: '2', name: 'Mumbai Dock', location: 'Mumbai, Maharashtra', capacity: '42%', status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Storage Network</h2>
          <p className="mt-1 text-sm text-gray-500">Manage physical distribution centers and hubs.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Register Facility
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facilities.map((hub) => (
          <div key={hub.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:border-indigo-300 transition-colors">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Box className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{hub.name}</h3>
                </div>
                <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  {hub.status}
                </span>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {hub.location}
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">Capacity Utilization</span>
                    <span className="text-gray-500">{hub.capacity}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: hub.capacity }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-900">Manage Stock &rarr;</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}