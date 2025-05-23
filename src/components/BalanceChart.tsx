
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from 'recharts';

const data = [
  { month: 'Jan', value: 30 },
  { month: 'Feb', value: 45 },
  { month: 'Mar', value: 35 },
  { month: 'Apr', value: 50 },
  { month: 'May', value: 40 }
];

export const BalanceChart = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Balance</h3>
        <div className="flex space-x-2">
          <button className="text-sm text-gray-500 hover:text-gray-700">All Time</button>
          <button className="text-sm bg-orange-500 text-white px-3 py-1 rounded-full">1 Year</button>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">Sale Generated</p>
          <p className="text-2xl font-bold text-gray-900">$39,800.00</p>
        </div>
        <button className="text-sm text-orange-500 hover:text-orange-600">View Report</button>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              className="text-xs text-gray-500"
            />
            <YAxis hide />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#colorGradient)"
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#1F2937"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm font-medium text-blue-900">$19,690.00</p>
        <p className="text-xs text-blue-600">Peak this month</p>
      </div>
    </div>
  );
};
