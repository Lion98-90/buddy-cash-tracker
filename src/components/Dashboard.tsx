
import { DollarSign, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { ExpenseChart } from './ExpenseChart';
import { BalanceChart } from './BalanceChart';
import { useAuth } from '../hooks/useAuth';
import { useTransactions } from '../hooks/useTransactions';
import { useContacts } from '../hooks/useContacts';
import { useMemo } from 'react';

export const Dashboard = () => {
  const { profile } = useAuth();
  const { transactions } = useTransactions();
  const { contacts } = useContacts();
  
  const getCurrencySymbol = (currencyCode: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$'
    };
    return symbols[currencyCode] || '$';
  };

  const currencySymbol = getCurrencySymbol(profile?.currency || 'USD');

  const stats = useMemo(() => {
    const totalGiven = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalReceived = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalBalance = totalReceived - totalGiven;
    const activeContacts = contacts.filter(c => c.balance !== 0).length;

    return [
      {
        title: 'Total Balance',
        value: `${currencySymbol}${totalBalance.toFixed(2)}`,
        change: '+8.2%',
        trend: 'up',
        icon: DollarSign,
        color: totalBalance >= 0 ? 'text-green-600' : 'text-red-600',
        bgColor: totalBalance >= 0 ? 'bg-green-50' : 'bg-red-50'
      },
      {
        title: 'Money Given',
        value: `${currencySymbol}${totalGiven.toFixed(2)}`,
        change: '+2.1%',
        trend: 'up',
        icon: TrendingUp,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      },
      {
        title: 'Money Received',
        value: `${currencySymbol}${totalReceived.toFixed(2)}`,
        change: '-1.5%',
        trend: 'down',
        icon: TrendingDown,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Active People',
        value: activeContacts.toString(),
        change: `+${Math.max(0, activeContacts - 20)}`,
        trend: 'up',
        icon: Users,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      }
    ];
  }, [transactions, contacts, currencySymbol]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 4).map(transaction => ({
      name: transaction.contact?.name || 'Unknown',
      amount: `${transaction.amount > 0 ? '+' : ''}${currencySymbol}${Math.abs(transaction.amount).toFixed(2)}`,
      type: transaction.amount > 0 ? 'received' : 'given',
      time: new Date(transaction.date).toLocaleDateString()
    }));
  }, [transactions, currencySymbol]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {profile?.name}! Here's your financial overview</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-2">
           <img className="w-8 h-8 rounded-full border-2 border-white" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" alt="User" />
           <img className="w-8 h-8 rounded-full border-2 border-white" src="https://images.unsplash.com/photo-1494790108755-2616b612b1ab?w=32&h=32&fit=crop&crop=face" alt="User" />
           <img className="w-8 h-8 rounded-full border-2 border-white" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" alt="User" />
          </div>
          <span className="text-sm text-gray-500">{profile?.name}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart />
        <BalanceChart />
      </div>

      {/* Portfolio Score and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Portfolio Score</h3>
            <div className="text-2xl font-bold text-gray-900">86.32 <span className="text-sm text-gray-500">{profile?.currency || 'USD'}</span></div>
          </div>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-sm">🏆</span>
            </div>
            <span className="text-gray-700">Portfolio Score</span>
          </div>
          <div className="space-y-2">
            {[40, 60, 30, 80, 45, 70, 55, 90, 35].map((height, index) => (
              <div key={index} className="flex items-end space-x-1">
                <div 
                  className="bg-orange-200 rounded-sm" 
                  style={{ width: '8px', height: `${height * 0.5}px` }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {transaction.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.name}</p>
                      <p className="text-sm text-gray-500">{transaction.time}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${transaction.type === 'received' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
