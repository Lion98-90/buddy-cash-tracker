import { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Camera, Edit, Shield, CreditCard, Globe, LogOut, Settings as SettingsIcon, Download, FileText, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { useAuth } from '../hooks/useAuth';
import { useTransactions } from '../hooks/useTransactions';
import { useContacts } from '../hooks/useContacts';
import { PreferencesModal } from './PreferencesModal';
import { useToast } from '../hooks/use-toast';

export const Settings = () => {
  const { profile, updateProfile, signOut } = useAuth();
  const { transactions } = useTransactions();
  const { contacts } = useContacts();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    currency: profile?.currency || 'USD'
  });

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await signOut();
        window.location.href = '/';
        toast({
          title: "Account Deleted",
          description: "Your account has been deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting account:', error);
        toast({
          title: "Error",
          description: "Failed to delete account. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const getCurrencySymbol = (currencyCode: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'JPY': '¥', 'CAD': 'C$', 'AUD': 'A$'
    };
    return symbols[currencyCode] || '$';
  };

  const currencySymbol = getCurrencySymbol(formData.currency);

  const generatePDFContent = () => {
    const summaryStats = {
      totalGiven: transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalReceived: transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
      activeContacts: contacts.filter(c => c.balance !== 0).length
    };

    const netBalance = summaryStats.totalReceived - summaryStats.totalGiven;

    const topOwedToYou = contacts
      .filter(c => c.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);

    const topYouOwe = contacts
      .filter(c => c.balance < 0)
      .sort((a, b) => a.balance - b.balance)
      .slice(0, 5);

    return `
BUDDYCASH FINANCIAL REPORT
=========================
Generated: ${new Date().toLocaleDateString()}
Currency: ${formData.currency}

EXECUTIVE SUMMARY
================
Total Given:     ${currencySymbol}${summaryStats.totalGiven.toFixed(2)}
Total Received:  ${currencySymbol}${summaryStats.totalReceived.toFixed(2)}
Net Balance:     ${netBalance >= 0 ? currencySymbol : '-' + currencySymbol}${Math.abs(netBalance).toFixed(2)}
Active Contacts: ${summaryStats.activeContacts}

OUTSTANDING BALANCES
===================

PEOPLE WHO OWE YOU:
${topOwedToYou.length > 0 ? 
  topOwedToYou.map((person, i) => 
    `${i + 1}. ${person.name.padEnd(25)} ${currencySymbol}${person.balance.toFixed(2)}`
  ).join('\n') : 
  'No outstanding amounts owed to you'
}

PEOPLE YOU OWE:
${topYouOwe.length > 0 ? 
  topYouOwe.map((person, i) => 
    `${i + 1}. ${person.name.padEnd(25)} ${currencySymbol}${Math.abs(person.balance).toFixed(2)}`
  ).join('\n') : 
  'No outstanding amounts you owe'
}

RECENT TRANSACTION HISTORY
=========================
${transactions.slice(0, 20).map((t, i) => {
  const date = new Date(t.date).toLocaleDateString();
  const type = t.type === 'given' ? 'GIVEN' : 'RECEIVED';
  const amount = `${currencySymbol}${Math.abs(t.amount).toFixed(2)}`;
  const description = (t.description || 'No description').substring(0, 30);
  return `${(i + 1).toString().padStart(2)}. ${date} | ${type.padEnd(8)} | ${amount.padStart(10)} | ${description}`;
}).join('\n')}

CONTACT SUMMARY
==============
Total Contacts: ${contacts.length}
Contacts with Positive Balance: ${contacts.filter(c => c.balance > 0).length}
Contacts with Negative Balance: ${contacts.filter(c => c.balance < 0).length}
Contacts with Zero Balance: ${contacts.filter(c => c.balance === 0).length}

Report generated by BuddyCash Financial Management System
=========================================================
    `.trim();
  };

  const handleExportData = () => {
    const exportData = {
      profile,
      transactions,
      contacts,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buddycash-data-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Your data has been exported successfully",
    });
  };

  const handleDownloadReport = () => {
    const rawContent = generatePDFContent();
    const doc = new jsPDF('p', 'pt', 'a4');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const autoTable = (doc as any).autoTable;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;

    let yPos = margin;
    
    const baseFontSize = 10;
    const titleFontSize = 18;
    const headerFontSize = 14;
    const lineSpacing = baseFontSize * 1.4;
    const sectionSpacing = baseFontSize * 2;

    const checkAndAddPage = (currentY: number, neededHeight: number = 0) => {
      if (currentY + neededHeight > pageHeight - margin) {
        doc.addPage();
        return margin;
      }
      return currentY;
    };
    
    doc.setFontSize(titleFontSize);
    doc.setFont(undefined, 'bold');
    doc.text("BuddyCash Financial Report", pageWidth / 2, yPos, { align: 'center' });
    yPos += titleFontSize * 1.5;
    doc.setFont(undefined, 'normal');

    const sections = rawContent.split('=========================');
    
    sections.forEach((section) => {
      yPos = checkAndAddPage(yPos, sectionSpacing);
      const sectionLines = section.trim().split('\n');
      if (sectionLines.length === 0 || sectionLines[0].trim() === "") return;

      const header = sectionLines.shift()?.trim();
      
      if (header === "BUDDYCASH FINANCIAL REPORT") {
        sectionLines.forEach(line => {
          if (line.trim()) {
            yPos = checkAndAddPage(yPos, lineSpacing);
            doc.setFontSize(baseFontSize);
            doc.text(line.trim(), margin, yPos);
            yPos += lineSpacing;
          }
        });
        yPos += sectionSpacing / 2;
        return; 
      }

      if (header) {
        yPos = checkAndAddPage(yPos, headerFontSize * 1.2);
        doc.setFontSize(headerFontSize);
        doc.setFont(undefined, 'bold');
        doc.text(header, margin, yPos);
        yPos += headerFontSize * 1.2;
        doc.setFont(undefined, 'normal');
      }
      
      doc.setFontSize(baseFontSize);

      if (header === "EXECUTIVE SUMMARY" || header === "CONTACT SUMMARY") {
        sectionLines.forEach(line => {
          if (line.trim()) {
            yPos = checkAndAddPage(yPos, lineSpacing);
            doc.text(line.trim(), margin, yPos, { maxWidth: pageWidth - margin * 2 });
            yPos += lineSpacing;
          }
        });
      } else if (header === "OUTSTANDING BALANCES") {
      } else if (header === "PEOPLE WHO OWE YOU:") {
        const tableData = sectionLines.filter(line => line.trim() && !line.startsWith('No outstanding amounts')).map(line => {
          const parts = line.match(/(\d+)\.\s*(.+?)\s+([\D\$€£₹¥CFA]+[\d,]+\.\d{2})/);
          return parts ? [parts[1], parts[2].trim(), parts[3].trim()] : null;
        }).filter(row => row !== null);

        yPos = checkAndAddPage(yPos);
        if (tableData.length > 0) {
          autoTable({
            head: [['#', 'Name', 'Amount']],
            body: tableData,
            startY: yPos,
            theme: 'striped',
            headStyles: { fillColor: [22, 160, 133], halign: 'center', fontStyle: 'bold' },
            styles: { fontSize: baseFontSize -1, cellPadding: 3 },
            margin: { left: margin, right: margin },
            didDrawPage: () => { yPos = margin; }
          });
          yPos = autoTable.previous.finalY + sectionSpacing;
        } else {
          doc.text('No outstanding amounts owed to you', margin, yPos);
          yPos += lineSpacing;
        }
      } else if (header === "PEOPLE YOU OWE:") {
         const tableData = sectionLines.filter(line => line.trim() && !line.startsWith('No outstanding amounts')).map(line => {
          const parts = line.match(/(\d+)\.\s*(.+?)\s+([\D\$€£₹¥CFA]+[\d,]+\.\d{2})/);
          return parts ? [parts[1], parts[2].trim(), parts[3].trim()] : null;
        }).filter(row => row !== null);
        
        yPos = checkAndAddPage(yPos);
        if (tableData.length > 0) {
          autoTable({
            head: [['#', 'Name', 'Amount']],
            body: tableData,
            startY: yPos,
            theme: 'striped',
            headStyles: { fillColor: [231, 76, 60], halign: 'center', fontStyle: 'bold' },
            styles: { fontSize: baseFontSize -1, cellPadding: 3 },
            margin: { left: margin, right: margin },
            didDrawPage: () => { yPos = margin; }
          });
          yPos = autoTable.previous.finalY + sectionSpacing;
        } else {
          doc.text('No outstanding amounts you owe', margin, yPos);
          yPos += lineSpacing;
        }
      } else if (header === "RECENT TRANSACTION HISTORY") {
        const tableData = sectionLines.filter(line => line.trim()).map(line => {
          const parts = line.match(/(\d+)\.\s*([\d\/]+)\s*\|\s*(GIVEN|RECEIVED)\s*\|\s*([\D\$€£₹¥CFA]+[\d,]+\.\d{2})\s*\|\s*(.*)/);
          return parts ? [parts[1], parts[2].trim(), parts[3].trim(), parts[4].trim(), parts[5].trim()] : null;
        }).filter(row => row !== null);
        
        yPos = checkAndAddPage(yPos);
        if (tableData.length > 0) {
          autoTable({
            head: [['#', 'Date', 'Type', 'Amount', 'Description']],
            body: tableData,
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: [52, 152, 219], halign: 'center', fontStyle: 'bold' },
            styles: { fontSize: baseFontSize -1, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 60 },
                2: { cellWidth: 55 },
                3: { cellWidth: 70, halign: 'right' },
                4: { cellWidth: 'auto' }
            },
            margin: { left: margin, right: margin },
            didDrawPage: () => { yPos = margin; }
          });
          yPos = autoTable.previous.finalY + sectionSpacing;
        } else {
          doc.text('No recent transactions to display.', margin, yPos);
          yPos += lineSpacing;
        }
      } else if (sectionLines.join('').trim().startsWith("Report generated by BuddyCash")) {
        return;
      } else {
        sectionLines.forEach(line => {
          if (line.trim()) {
            yPos = checkAndAddPage(yPos, lineSpacing);
            doc.text(line.trim(), margin, yPos, { maxWidth: pageWidth - margin * 2 });
            yPos += lineSpacing;
          }
        });
      }
      yPos += sectionSpacing / 2;
    });
    
    const footerText = "Report generated by BuddyCash Financial Management System";
    const footerPageNumText = (pgNum: number, totalPgs: number) => `Page ${pgNum} of ${totalPgs}`;
    const numPages = doc.internal.getNumberOfPages();
    doc.setFontSize(baseFontSize - 2);
    doc.setFont(undefined, 'italic');

    for (let i = 1; i <= numPages; i++) {
      doc.setPage(i);
      yPos = checkAndAddPage(yPos);
      doc.text(footerText, margin, pageHeight - margin + 15, { baseline: 'bottom' });
      doc.text(footerPageNumText(i, numPages), pageWidth - margin, pageHeight - margin + 15, { align: 'right', baseline: 'bottom' });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`buddycash-financial-report-${dateStr}.pdf`);
    
    toast({
      title: "Report Downloaded",
      description: "Your financial report has been downloaded as a PDF.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
            
            <div className="flex items-center space-x-6 mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {profile?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </span>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">{profile?.name}</h4>
                <p className="text-gray-500">{profile?.email}</p>
                <p className="text-sm text-gray-400">Member since January 2024</p>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <Input 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <Input 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="123 Main Street, City, State 12345"
                  />
                </div>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <p className="text-gray-900">{profile?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{profile?.email || 'Not set'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900">{profile?.phone || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-gray-900">{profile?.address || 'Not set'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Currency Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData({...formData, currency: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.currency !== profile?.currency && (
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save Currency
                </Button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <h4 className="font-medium text-gray-900">Change Password</h4>
                  <p className="text-sm text-gray-500">Update your password to keep your account secure</p>
                </div>
                <Button variant="outline">Change</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { icon: Shield, label: 'Privacy', desc: 'Control your privacy settings', action: () => toast({ title: "Coming Soon", description: "Privacy settings will be available soon" }) },
                { icon: CreditCard, label: 'Billing', desc: 'Manage your subscription', action: () => toast({ title: "Coming Soon", description: "Billing management will be available soon" }) },
                { icon: Globe, label: 'Language', desc: 'Change app language', action: () => toast({ title: "Coming Soon", description: "Language selection will be available soon" }) },
                { icon: SettingsIcon, label: 'Preferences', desc: 'App preferences and themes', action: () => setShowPreferences(true) }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <button 
                    key={index} 
                    onClick={item.action}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleExportData}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleDownloadReport}
              >
                <FileText className="w-4 h-4 mr-2" />
                Download Report
              </Button>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PreferencesModal 
        isOpen={showPreferences} 
        onClose={() => setShowPreferences(false)} 
      />
    </div>
  );
};