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
        change: filteredTransactions.length > 0 ? '' : '0%', 
        color: 'text-red-600' 
      },
      { 
        title: 'Total Received', 
        value: `${currencySymbol}${totalReceived.toFixed(0)}`, 
        change: filteredTransactions.length > 0 ? '' : '0%', 
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

  const handleExportReport = async () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const autoTable = (doc as any).autoTable;
    const rawContent = generateDetailedPDFContent();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40; // Standard margin in points

    let yPos = margin; // Initial y position, starting from top margin

    const baseFontSize = 10;
    const titleFontSize = 18;
    const headerFontSize = 14;
    const chartTitleFontSize = 12; // Slightly smaller for chart titles if needed, or use headerFontSize
    const lineSpacing = baseFontSize * 1.4; 
    const sectionSpacing = baseFontSize * 2;

    // Helper function to add new page if content overflows
    const checkAndAddPage = (currentY: number, neededHeight: number) => {
      if (currentY + neededHeight > pageHeight - margin) {
        doc.addPage();
        return margin; // Reset yPos for new page
      }
      return currentY;
    };
    
    // Main Title
    doc.setFontSize(titleFontSize);
    doc.setFont(undefined, 'bold');
    doc.text("BuddyCash Detailed Analytics Report", pageWidth / 2, yPos, { align: 'center' });
    yPos += titleFontSize * 1.5; // Space after title
    doc.setFont(undefined, 'normal');

    // --- Chart Integration ---
    const monthlyOverviewChartEl = document.getElementById('monthlyOverviewChartContainer');
    const netFlowTrendChartEl = document.getElementById('netFlowTrendChartContainer');
    let chartYPos = yPos;

    if (monthlyOverviewChartEl) {
      try {
        yPos = checkAndAddPage(yPos, headerFontSize + lineSpacing + 200); // Approximate height for chart + title
        doc.setFontSize(headerFontSize); // Use headerFontSize for chart titles for consistency
        doc.setFont(undefined, 'bold');
        doc.text("Monthly Overview Chart", margin, yPos);
        yPos += headerFontSize * 1.2; // Consistent spacing after header
        doc.setFont(undefined, 'normal');
        
        const canvas = await html2canvas(monthlyOverviewChartEl, { scale: 1.5, backgroundColor: '#FFFFFF', useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const imgWidth = pageWidth - margin * 2;
        // Maintain aspect ratio, but cap height to avoid overly tall images
        const imgHeight = Math.min((imgProps.height * imgWidth) / imgProps.width, pageHeight / 2.5); 
        
        yPos = checkAndAddPage(yPos, imgHeight);
        doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + sectionSpacing;
        chartYPos = yPos; // Update chartYPos to be after the first chart
      } catch (error) {
        console.error("Error capturing monthly overview chart:", error);
        yPos = checkAndAddPage(yPos, lineSpacing);
        doc.setFontSize(baseFontSize);
        doc.text("Monthly Overview Chart: Could not be rendered.", margin, yPos);
        yPos += lineSpacing;
        chartYPos = yPos;
      }
    }

    if (netFlowTrendChartEl) {
      try {
        yPos = checkAndAddPage(chartYPos, headerFontSize + lineSpacing + 200); // Use chartYPos
        doc.setFontSize(headerFontSize); // Use headerFontSize
        doc.setFont(undefined, 'bold');
        doc.text("Net Flow Trend Chart", margin, yPos);
        yPos += headerFontSize * 1.2; // Consistent spacing
        doc.setFont(undefined, 'normal');

        const canvas = await html2canvas(netFlowTrendChartEl, { scale: 1.5, backgroundColor: '#FFFFFF', useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = Math.min((imgProps.height * imgWidth) / imgProps.width, pageHeight / 2.5);

        yPos = checkAndAddPage(yPos, imgHeight);
        doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + sectionSpacing;
      } catch (error) {
        console.error("Error capturing net flow trend chart:", error);
        yPos = checkAndAddPage(yPos, lineSpacing);
        doc.setFontSize(baseFontSize);
        doc.text("Net Flow Trend Chart: Could not be rendered.", margin, yPos);
        yPos += lineSpacing;
      }
    }
    // --- End Chart Integration ---
    
    const sections = rawContent.split(/\n={2,}\n/).map(s => s.trim());

    sections.forEach(section => {
      if (!section) return;
      const lines = section.split('\n');
      const header = lines.shift()?.trim();

      // Skip the main title section if it was part of rawContent parsing
      // Also skip sections that are only for footer, handled globally now.
      if (!header || header === "BUDDYCASH DETAILED ANALYTICS REPORT" || 
          header.startsWith("Report generated by BuddyCash") || header.startsWith("For support,")) {
        // Add specific text from under main title (Generated, Date Range, Currency)
        if (header === "BUDDYCASH DETAILED ANALYTICS REPORT") {
            lines.forEach(line => {
                if (line.trim()) {
                    yPos = checkAndAddPage(yPos, lineSpacing);
                    doc.setFontSize(baseFontSize);
                    doc.text(line.trim(), margin, yPos, { maxWidth: pageWidth - margin * 2 });
                    yPos += lineSpacing;
                }
            });
            yPos += sectionSpacing / 2;
        }
        return; 
      }
      
      yPos = checkAndAddPage(yPos, sectionSpacing); // Space before new section
      doc.setFontSize(headerFontSize);
      doc.setFont(undefined, 'bold');
      doc.text(header, margin, yPos);
      yPos += headerFontSize * 1.2; // Space after header
      doc.setFontSize(baseFontSize);
      doc.setFont(undefined, 'normal');

      if (header.startsWith("EXECUTIVE SUMMARY")) {
        lines.forEach(line => {
          yPos = checkAndAddPage(yPos, lineSpacing);
          doc.text(line.trim(), margin, yPos, { maxWidth: pageWidth - margin * 2 });
          yPos += lineSpacing;
        });
      } else if (header.startsWith("MONTHLY BREAKDOWN")) {
        const tableHeaderOriginal = lines.shift()?.split('|').map(s => s.trim()); 
        lines.shift(); // Skip ---- line
        const tableBody = lines.map(line => line.split('|').map(s => s.trim()));
        if (tableHeaderOriginal && tableBody.length > 0) {
           yPos = checkAndAddPage(yPos); 
           autoTable({
            head: [tableHeaderOriginal],
            body: tableBody,
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133], halign: 'center', fontStyle: 'bold' }, // Teal
            styles: { fontSize: baseFontSize -1, cellPadding: 3 },
            columnStyles: {
                0: { halign: 'left', cellWidth: 'auto'}, // Month
                1: { halign: 'right', cellWidth: 70 }, // Given
                2: { halign: 'right', cellWidth: 70 }, // Received
                3: { halign: 'right', cellWidth: 70 }  // Net Balance
            },
            margin: { left: margin, right: margin },
            didDrawPage: () => { yPos = margin; }
          });
          yPos = autoTable.previous.finalY + sectionSpacing;
        }
      } else if (header.startsWith("TOP PEOPLE WHO OWE YOU:")) {
        const tableData = lines.filter(line => line.trim() && !line.startsWith('No outstanding')).map(line => {
          const parts = line.match(/(\d+)\.\s*(.+?)\s+([\D\$€£₹¥CFA]+[\d,]+\.\d{2})/);
          return parts ? [parts[1], parts[2].trim(), parts[3].trim()] : null;
        }).filter(row => row !== null);
        if (tableData.length > 0) {
          yPos = checkAndAddPage(yPos);
          autoTable({
            head: [['#', 'Name', 'Amount']],
            body: tableData,
            startY: yPos,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185], halign: 'center', fontStyle: 'bold' }, // Blue
            styles: { fontSize: baseFontSize -1, cellPadding: 3 },
            margin: { left: margin, right: margin },
            didDrawPage: () => { yPos = margin; }
          });
          yPos = autoTable.previous.finalY + sectionSpacing;
        } else {
          yPos = checkAndAddPage(yPos, lineSpacing);
          doc.text('No outstanding amounts owed to you.', margin, yPos, { maxWidth: pageWidth - margin * 2 });
          yPos += lineSpacing;
        }
      } else if (header.startsWith("TOP PEOPLE YOU OWE:")) {
         const tableData = lines.filter(line => line.trim() && !line.startsWith('No outstanding')).map(line => {
          const parts = line.match(/(\d+)\.\s*(.+?)\s+([\D\$€£₹¥CFA]+[\d,]+\.\d{2})/);
          return parts ? [parts[1], parts[2].trim(), parts[3].trim()] : null;
        }).filter(row => row !== null);
        if (tableData.length > 0) {
          yPos = checkAndAddPage(yPos);
          autoTable({
            head: [['#', 'Name', 'Amount']],
            body: tableData,
            startY: yPos,
            theme: 'striped',
            headStyles: { fillColor: [231, 76, 60], halign: 'center', fontStyle: 'bold' }, // Red
            styles: { fontSize: baseFontSize -1, cellPadding: 3 },
            margin: { left: margin, right: margin },
            didDrawPage: () => { yPos = margin; }
          });
          yPos = autoTable.previous.finalY + sectionSpacing;
        } else {
          yPos = checkAndAddPage(yPos, lineSpacing);
          doc.text('No outstanding amounts you owe.', margin, yPos, { maxWidth: pageWidth - margin * 2 });
          yPos += lineSpacing;
        }
      } else if (header.startsWith("DETAILED TRANSACTION HISTORY")) {
        const summaryLineOriginal = lines.find(l => l.startsWith("Total Transactions in Period:"));
        const actualLinesForTable = lines.filter(l => !l.startsWith("Total Transactions in Period:") && !l.startsWith("... and") && l.includes('|'));
        const andMoreLineOriginal = lines.find(l => l.startsWith("... and"));

        if(summaryLineOriginal) {
            yPos = checkAndAddPage(yPos, lineSpacing);
            doc.text(summaryLineOriginal.trim(), margin, yPos, { maxWidth: pageWidth - margin * 2 });
            yPos += lineSpacing * 1.5; // More space after summary line
        }
        const tableData = actualLinesForTable.map(line => {
          const parts = line.match(/(\d+)\.\s*([\d\/]+)\s*\|\s*(GIVEN|RECEIVED)\s*\|\s*([\D\$€£₹¥CFA]+[\d,]+\.\d{2})\s*\|\s*(.*)/);
          return parts ? [parts[1], parts[2].trim(), parts[3].trim(), parts[4].trim(), parts[5].trim()] : null;
        }).filter(row => row !== null);

        if (tableData.length > 0) {
          yPos = checkAndAddPage(yPos);
          autoTable({
            head: [['#', 'Date', 'Type', 'Amount', 'Description']],
            body: tableData,
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: [52, 152, 219], halign: 'center', fontStyle: 'bold' }, // Light Blue
            styles: { fontSize: baseFontSize -1, cellPadding: 3 },
             columnStyles: {
                0: { cellWidth: 30 }, // #
                1: { cellWidth: 65 }, // Date
                2: { cellWidth: 60 }, // Type
                3: { cellWidth: 75, halign: 'right' }, // Amount
                4: { cellWidth: 'auto' } // Description
            },
            margin: { left: margin, right: margin },
            didDrawPage: () => { yPos = margin; }
          });
          yPos = autoTable.previous.finalY + sectionSpacing;
        } else {
          yPos = checkAndAddPage(yPos, lineSpacing);
          const noTransactionsText = lines.find(l => l.includes("No transactions found")) || 'No transactions found for the selected period.';
          doc.text(noTransactionsText, margin, yPos, { maxWidth: pageWidth - margin * 2 });
          yPos += lineSpacing;
        }
        if(andMoreLineOriginal) {
            yPos = checkAndAddPage(yPos, lineSpacing);
            doc.text(andMoreLineOriginal.trim(), margin, yPos, { maxWidth: pageWidth - margin * 2 });
            yPos += lineSpacing;
        }
      } else if (header.startsWith("FINANCIAL INSIGHTS") || header.startsWith("RECOMMENDATIONS")) {
        lines.forEach(line => {
          if (line.trim()) {
            yPos = checkAndAddPage(yPos, lineSpacing);
            const text = line.startsWith('•') ? line.trim() : `• ${line.trim()}`;
            doc.text(text, margin + (line.startsWith('•') ? 0 : 10) , yPos, { maxWidth: pageWidth - margin * 2 - (line.startsWith('•') ? 0 : 10) });
            yPos += lineSpacing * 1.1; 
          }
        });
      } else { // Fallback for any other text not caught by specific handlers
         lines.forEach(line => {
          if (line.trim()){
            yPos = checkAndAddPage(yPos, lineSpacing);
            doc.text(line.trim(), margin, yPos, { maxWidth: pageWidth - margin * 2 });
            yPos += lineSpacing;
          }
        });
      }
      yPos += sectionSpacing / 2; // Space after a section's content
    });

    // Footer on all pages
    const footerTextLine1 = "Report generated by BuddyCash Financial Management System";
    const footerTextLine2 = "For support, contact: support@buddycash.com";
    const footerPageNumText = (pgNum: number, totalPgs: number) => `Page ${pgNum} of ${totalPgs}`;
    const numPages = doc.internal.getNumberOfPages();
    
    doc.setFontSize(baseFontSize - 2); // Smaller font for footer
    doc.setFont(undefined, 'italic');

    for (let i = 1; i <= numPages; i++) {
        doc.setPage(i);
        const currentYForFooter = pageHeight - margin + (baseFontSize - 2); // Position just above bottom margin
        doc.text(footerTextLine1, margin, currentYForFooter, { baseline: 'bottom' });
        doc.text(footerTextLine2, margin, currentYForFooter + (baseFontSize - 2 + 2), { baseline: 'bottom' }); // Line 2 below line 1
        doc.text(footerPageNumText(i, numPages), pageWidth - margin, currentYForFooter + (baseFontSize - 2 + 2), { align: 'right', baseline: 'bottom' });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`buddycash-analytics-report-${dateRange}-${dateStr}.pdf`);
    
    toast({
      title: "Report Exported",
      description: "Your detailed analytics report has been exported as a PDF.",
    });
  };

  return (
    <div className="space-y-6">
      
{/* Header */}
     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
       <div>
         <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports</h1>
         <p className="text-sm sm:text-base text-gray-600 mt-1">Detailed analytics of your transactions</p>
       </div>
       <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
         <select 
           value={dateRange}
           onChange={(e) => setDateRange(e.target.value)}
           className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
         >
           <option value="all">All Time</option>
           <option value="week">Last 7 Days</option>
           <option value="month">Last Month</option>
           <option value="quarter">Last 3 Months</option>
           <option value="year">Last Year</option>
         </select>
         <Button variant="outline" onClick={handleExportReport} className="w-full sm:w-auto justify-center">
           <Download className="w-4 h-4 mr-2" />
           Export Report
         </Button>
       </div>
     </div>
```

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
        <div id="monthlyOverviewChartContainer" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Overview</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <XAxis dataKey="month" fontSize={10} />
                <YAxis fontSize={10} tickFormatter={(value) => `${currencySymbol}${value}`} />
                <Tooltip formatter={(value) => `${currencySymbol}${value}`}/>
                <Legend wrapperStyle={{fontSize: "12px"}}/>
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
        <div id="netFlowTrendChartContainer" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Flow Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <XAxis dataKey="month" fontSize={10} />
                <YAxis fontSize={10} tickFormatter={(value) => `${currencySymbol}${value}`} />
                <Tooltip formatter={(value) => `${currencySymbol}${value}`}/>
                <Legend wrapperStyle={{fontSize: "12px"}}/>
                <Line 
                  type="monotone" 
                  dataKey="received" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Received"
                  dot={{ fill: '#10B981', strokeWidth: 1, r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="given" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Given"
                  dot={{ fill: '#EF4444', strokeWidth: 1, r: 3 }}
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
