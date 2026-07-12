import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Analytics: React.FC = () => {
  const revenueData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 5000 },
    { name: 'Apr', revenue: 4500 },
    { name: 'May', revenue: 6000 },
    { name: 'Jun', revenue: 5500 },
  ];

  const costData = [
    { name: 'TRK-02', cost: 18450 },
    { name: 'VAN-03', cost: 8250 },
    { name: 'VAN-01', cost: 4650 },
  ];

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('TransitOps Analytics Report', 14, 20);
    
    autoTable(doc, {
      startY: 30,
      head: [['Metric', 'Value']],
      body: [
        ['Fuel Efficiency (Dist/Fuel)', '8.4 km/l'],
        ['Fleet Utilization', '87%'],
        ['Operational Cost', '₹34,000'],
        ['Vehicle ROI', '14.2%']
      ],
    });

    doc.text('Top Costliest Vehicles', 14, doc.lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Vehicle', 'Cost']],
      body: costData.map(c => [c.name, `₹${c.cost}`]),
    });

    doc.save('transitops-analytics.pdf');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 page-title">Reports & Analytics</h2>
        <div className="flex gap-2">
          <button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md font-medium text-sm flex items-center transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
          <button onClick={generatePDF} className="bg-amber-500 border border-amber-600 text-white hover:bg-amber-600 px-4 py-2 rounded-md font-medium text-sm flex items-center transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">FUEL EFFICIENCY (DIST/FUEL)</p>
          <p className="text-3xl font-light text-gray-800 mt-2">8.4 km/l</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">FLEET UTILIZATION</p>
          <p className="text-3xl font-light text-gray-800 mt-2">87%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">OPERATIONAL COST</p>
          <p className="text-3xl font-light text-gray-800 mt-2">₹34,000</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">VEHICLE ROI</p>
          <p className="text-3xl font-light text-green-600 mt-2">14.2%</p>
          <p className="text-[9px] text-gray-400 mt-1 italic">ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 uppercase mb-4">MONTHLY REVENUE</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 uppercase mb-4">TOP COSTLIEST VEHICLES</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="cost" fill="#F97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
