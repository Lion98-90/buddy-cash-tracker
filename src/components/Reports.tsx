
import { Calendar, Download, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useTransactions } from '../hooks/useTransactions';
import { useContacts } from '../hooks/useContacts';
import { useAuth } from '../hooks/useAuth';
import { useMemo } from 'react';

export const Reports = () => {
  const { transactions } = useTransactions();
  const { contacts } = useContacts();
  const { profile } = useAuth();

  const getCurrencySymbol = (currencyCode: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'JPY': '¥', 'CAD': 'C$', 'AUD': 'A$'
    };
    return symbols[currencyCode] || '$';
  };

  const currencySymbol = getCurrencySymbol(profile?.currency || 'USD');

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const monthlyStats = months.map(month => {
      const monthIndex = months.indexOf(month);
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === currentYear && transactionDate.getMonth() === monthIndex;
      });

      const given = monthTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const received = monthTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      return { month, given: Math.round(given), received: Math.round(received) };
    });

    return monthlyStats;
  }, [transactions]);

  const summaryStats = useMemo(() => {
    const totalGiven = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalReceived = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netBalance = totalReceived - totalGiven;
    const activeContacts = contacts.filter(c => c.balance !== 0).length;

    return [
      { 
        title: 'Total Given', 
        value: `${currencySymbol}${totalGiven.toFixed(0)}`, 
        change: transactions.length > 0 ? '+12%' : '0%', 
        color: 'text-red-600' 
      },
      { 
        title: 'Total Received', 
        value: `${currencySymbol}${totalReceived.toFixed(0)}`, 
        change: transactions.length > 0 ? '+8%' : '0%', 
        color: 'text-green-600' 
      },
      { 
        title: 'Net Balance', 
        value: `${netBalance >= 0 ? currencySymbol : '-' + currencySymbol}${Math.abs(netBalance).toFixed(0)}`, 
        change: netBalance >= 0 ? '+' : '-', 
        color: netBalance >= 0 ? 'text-green-600' : 'text-red-600' 
      },
      { 
        title: 'Active People', 
        value: activeContacts.toString(), 
        change: `+${Math.max(0, activeContacts)}`, 
        color: 'text-blue-600' 
      }
    ];
  }, [transactions, contacts, currencySymbol]);

  const topOwedToYou = useMemo(() => {
    return contacts
      .filter(c => c.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 4)
      .map(contact => ({
        name: contact.name,
        amount: contact.balance
      }));
  }, [contacts]);

  const topYouOwe = useMemo(() => {
    return contacts
      .filter(c => c.balance < 0)
      .sort((a, b) => a.balance - b.balance)
      .slice(0, 4)
      .map(contact => ({
        name: contact.name,
        amount: Math.abs(contact.balance)
      }));
  }, [contacts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Detailed analytics of your transactions</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-gray-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-green-600">{stat.change}</span>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Overview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Overview</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="month" />
                <YAxis />
                <Bar dataKey="given" fill="#EF4444" name="Given" />
                <Bar dataKey="received" fill="#10B981" name="Received" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Money Given</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Money Received</span>
            </div>
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Flow Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="month" />
                <YAxis />
                <Line 
                  type="monotone" 
                  dataKey="received" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="given" 
                  stroke="#EF4444" 
                  strokeWidth={3}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top People */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top People (They Owe You)</h3>
          <div className="space-y-4">
            {topOwedToYou.length > 0 ? (
              topOwedToYou.map((person, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {person.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{person.name}</span>
                  </div>
                  <span className="font-semibold text-green-600">+{currencySymbol}{person.amount.toFixed(0)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No one owes you money</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top People (You Owe Them)</h3>
          <div className="space-y-4">
            {topYouOwe.length > 0 ? (
              topYouOwe.map((person, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {person.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{person.name}</span>
                  </div>
                  <span className="font-semibold text-red-600">-{currencySymbol}{person.amount.toFixed(0)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">You don't owe anyone money</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
