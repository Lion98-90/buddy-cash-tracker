import { DollarSign, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { ExpenseChart } from './ExpenseChart';
import { useAuth } from '../hooks/useAuth';
import { useTransactions } from '../hooks/useTransactions';
import { useContacts } from '../hooks/useContacts';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { profile } = useAuth();
  const { transactions } = useTransactions();
  const { contacts } = useContacts();
  const navigate = useNavigate();
  
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
    return symbols[currencyCode] || '₹';
  };

  const currencySymbol = getCurrencySymbol(profile?.currency || 'USD');

  const stats = useMemo(() => {
    const totalGiven = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalReceived = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const activeContacts = contacts.filter(c => c.balance !== 0).length;

    return [
      {
        title: 'Total Expenses',
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

  const handleProfileClick = () => {
    navigate('/settings');
  };

  return (
    <div className="space-y-6">
      {/* Header - Fixed for mobile responsiveness */}
      <div className="flex items-center justify-between gap-4 px-2 lg:px-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">Dashboard</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base hidden sm:block">Welcome back, {profile?.name}! Here's your financial overview</p>
        </div>
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="flex -space-x-2">
            {profile?.avatar ? (
              <img 
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white cursor-pointer" 
                src={profile.avatar} 
                alt="Profile" 
                onClick={handleProfileClick}
              />
            ) : (
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white cursor-pointer" onClick={handleProfileClick}>
                <span className="text-xs font-bold text-white">
                  {profile?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </span>
              </div>
            )}
          </div>
          <span className="text-xs sm:text-sm text-gray-500 hidden md:block">{profile?.name}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
                </div>
                <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expense Chart */}
      <div className="grid grid-cols-1 gap-6">
        <ExpenseChart />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs md:text-sm font-medium text-gray-600">
                      {transaction.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm md:text-base">{transaction.name}</p>
                    <p className="text-xs md:text-sm text-gray-500">{transaction.time}</p>
                  </div>
                </div>
                <span className={`font-semibold ${transaction.type === 'received' ? 'text-green-600' : 'text-red-600'} text-sm md:text-base`}>
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
  );
};
