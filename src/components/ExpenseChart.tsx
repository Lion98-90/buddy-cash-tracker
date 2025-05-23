
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { name: 'Food', value: 35, color: '#3B82F6' },
  { name: 'Rent', value: 45, color: '#1F2937' },
  { name: 'Utilities', value: 20, color: '#F97316' }
];

export const ExpenseChart = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>August</option>
          <option>September</option>
          <option>October</option>
        </select>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="space-y-2 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-600">{item.name}</span>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-sm text-gray-500">Daily</p>
          <p className="text-lg font-semibold text-gray-900">$623.51</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Weekly</p>
          <p className="text-lg font-semibold text-gray-900">$5,512</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Monthly</p>
          <p className="text-lg font-semibold text-gray-900">$17,153</p>
        </div>
      </div>
    </div>
  );
};
