
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useMemo } from 'react';

const COLORS = ['#3B82F6', '#1F2937', '#F97316', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B'];

export const ExpenseChart = () => {
  const { transactions } = useTransactions();
  const { categories } = useCategories();

  const expenseData = useMemo(() => {
    // Filter only "given" transactions (expenses)
    const expenses = transactions.filter(t => t.amount < 0);
    
    // Group by category
    const categoryTotals = new Map();
    
    expenses.forEach(transaction => {
      const categoryName = transaction.category?.name || 'Other';
      const amount = Math.abs(transaction.amount);
      
      if (categoryTotals.has(categoryName)) {
        categoryTotals.set(categoryName, categoryTotals.get(categoryName) + amount);
      } else {
        categoryTotals.set(categoryName, amount);
      }
    });

    // Convert to chart data format
    const data = Array.from(categoryTotals.entries()).map(([name, value], index) => ({
      name,
      value: Math.round(value),
      color: COLORS[index % COLORS.length]
    }));

    return data.length > 0 ? data : [{ name: 'No expenses yet', value: 1, color: '#E5E7EB' }];
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions]);

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>{currentMonth}</option>
        </select>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={expenseData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {expenseData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="space-y-2 mt-4">
        {expenseData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">₹{item.value}</span>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-sm text-gray-500">Daily</p>
          <p className="text-lg font-semibold text-gray-900">₹{(totalExpenses / 30).toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Weekly</p>
          <p className="text-lg font-semibold text-gray-900">₹{(totalExpenses / 4).toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Monthly</p>
          <p className="text-lg font-semibold text-gray-900">₹{totalExpenses.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};
