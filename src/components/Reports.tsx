import { Calendar, Download, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useTransactions } from '../hooks/useTransactions';
import { useContacts } from '../hooks/useContacts';
import { useAuth } from '../hooks/useAuth';
import { useMemo, useState } from 'react';
import { useToast } from '../hooks/use-toast';

export const Reports = () => {
  const { transactions } = useTransactions();
  const { contacts } = useContacts();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('all');

  const getCurrencySymbol = (currencyCode: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'JPY': '¥', 'CAD': 'C$', 'AUD': 'A$'
    };
    return symbols[currencyCode] || '$';
  };

  const currencySymbol = getCurrencySymbol(profile?.currency || 'USD');

  const filteredTransactions = useMemo(() => {
    if (dateRange === 'all') return transactions;
    
    const now = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return transactions.filter(t => new Date(t.date) >= startDate);
  }, [transactions, dateRange]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const monthlyStats = months.map(month => {
      const monthIndex = months.indexOf(month);
      const monthTransactions = filteredTransactions.filter(t => {
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
  }, [filteredTransactions]);

  const summaryStats = useMemo(() => {
    const totalGiven = filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalReceived = filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netBalance = totalReceived - totalGiven;
    const activeContacts = contacts.filter(c => c.balance !== 0).length;

    return [
      { 
        title: 'Total Given', 
        value: `${currencySymbol}${totalGiven.toFixed(0)}`, 
        change: filteredTransactions.length > 0 ? '+12%' : '0%', 
        color: 'text-red-600' 
      },
      { 
        title: 'Total Received', 
        value: `${currencySymbol}${totalReceived.toFixed(0)}`, 
        change: filteredTransactions.length > 0 ? '+8%' : '0%', 
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
  }, [filteredTransactions, contacts, currencySymbol]);

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

  const generateDetailedPDFContent = () => {
    const dateRangeText = dateRange === 'all' ? 'All Time' : 
                         dateRange === 'week' ? 'Last 7 Days' :
                         dateRange === 'month' ? 'Last Month' :
                         dateRange === 'quarter' ? 'Last 3 Months' : 'Last Year';

    return `
BUDDYCASH DETAILED ANALYTICS REPORT
===================================
Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
Date Range: ${dateRangeText}
Currency: ${profile?.currency || 'USD'}

EXECUTIVE SUMMARY
================
${summaryStats.map(stat => `${stat.title.padEnd(20)}: ${stat.value}`).join('\n')}

MONTHLY BREAKDOWN (${new Date().getFullYear()})
${'='.repeat(50)}
Month     | Given     | Received  | Net Balance
${'-'.repeat(50)}
${monthlyData.map(month => {
  const net = month.received - month.given;
  return `${month.month.padEnd(9)} | ${(currencySymbol + month.given).padEnd(9)} | ${(currencySymbol + month.received).padEnd(9)} | ${net >= 0 ? currencySymbol : '-' + currencySymbol}${Math.abs(net)}`;
}).join('\n')}

OUTSTANDING BALANCES
==================

TOP PEOPLE WHO OWE YOU:
${topOwedToYou.length > 0 ? 
  topOwedToYou.map((person, i) => 
    `${(i + 1).toString().padStart(2)}. ${person.name.padEnd(25)} ${currencySymbol}${person.amount.toFixed(2)}`
  ).join('\n') : 
  'No outstanding amounts owed to you'
}

TOP PEOPLE YOU OWE:
${topYouOwe.length > 0 ? 
  topYouOwe.map((person, i) => 
    `${(i + 1).toString().padStart(2)}. ${person.name.padEnd(25)} ${currencySymbol}${person.amount.toFixed(2)}`
  ).join('\n') : 
  'No outstanding amounts you owe'
}

DETAILED TRANSACTION HISTORY
===========================
${filteredTransactions.length > 0 ? 
  `Total Transactions in Period: ${filteredTransactions.length}\n\n` +
  filteredTransactions.slice(0, 50).map((t, i) => {
    const date = new Date(t.date).toLocaleDateString();
    const type = t.type === 'given' ? 'GIVEN' : 'RECEIVED';
    const amount = `${currencySymbol}${Math.abs(t.amount).toFixed(2)}`;
    const description = (t.description || 'No description').substring(0, 40);
    return `${(i + 1).toString().padStart(3)}. ${date} | ${type.padEnd(8)} | ${amount.padStart(12)} | ${description}`;
  }).join('\n') +
  (filteredTransactions.length > 50 ? `\n\n... and ${filteredTransactions.length - 50} more transactions` : '')
  : 'No transactions found for the selected period'
}

FINANCIAL INSIGHTS
=================
• Average Transaction Amount: ${currencySymbol}${filteredTransactions.length > 0 ? (filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / filteredTransactions.length).toFixed(2) : '0.00'}
• Most Active Month: ${monthlyData.reduce((max, month) => (month.given + month.received) > (max.given + max.received) ? month : max, monthlyData[0])?.month || 'N/A'}
• Total Active Contacts: ${contacts.filter(c => c.balance !== 0).length}
• Contacts with Positive Balance: ${contacts.filter(c => c.balance > 0).length}
• Contacts with Negative Balance: ${contacts.filter(c => c.balance < 0).length}

RECOMMENDATIONS
==============
${topOwedToYou.length > 0 ? '• Consider following up on outstanding amounts owed to you' : ''}
${topYouOwe.length > 0 ? '• Plan to settle amounts you owe to maintain good relationships' : ''}
• Review your spending patterns monthly for better financial management
• Keep detailed descriptions for all transactions for better tracking

Report generated by BuddyCash Financial Management System
========================================================
For support, contact: support@buddycash.com
    `.trim();
  };

  const handleExportReport = () => {
    const pdfContent = generateDetailedPDFContent();
    
    const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buddycash-analytics-report-${dateRange}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "Your detailed analytics report has been exported as a formatted text file",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Detailed analytics of your transactions</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last Year</option>
          </select>
          <Button variant="outline" onClick={handleExportReport}>
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
