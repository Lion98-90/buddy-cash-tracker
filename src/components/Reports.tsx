import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Calendar, Download, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip, Legend } from 'recharts';
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
  (filteredTransactions.length > 50 ? `\n\n... and ${filteredTrans
