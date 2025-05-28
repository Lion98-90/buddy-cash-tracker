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
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Color scheme
  const colors = {
    primary: [34, 197, 94],     // Green
    secondary: [59, 130, 246],   // Blue
    accent: [168, 85, 247],      // Purple
    danger: [239, 68, 68],       // Red
    dark: [31, 41, 55],          // Dark gray
    light: [249, 250, 251],      // Light gray
    text: [55, 65, 81],          // Text gray
    border: [229, 231, 235]      // Border gray
  };

  // Helper functions
  const addPage = () => {
    doc.addPage();
    yPos = margin;
  };

  const checkPageBreak = (neededHeight = 30) => {
    if (yPos + neededHeight > pageHeight - margin - 50) {
      addPage();
    }
  };

  const drawCard = (x, y, width, height, fillColor = colors.light) => {
    // Card shadow
    doc.setFillColor(0, 0, 0, 0.05);
    doc.roundedRect(x + 3, y + 3, width, height, 8, 8, 'F');
    
    // Card background
    doc.setFillColor(...fillColor);
    doc.roundedRect(x, y, width, height, 8, 8, 'F');
    
    // Card border
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, width, height, 8, 8, 'S');
  };

  const drawGradientHeader = () => {
    // Gradient effect using multiple rectangles
    const gradientHeight = 120;
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const alpha = 1 - (i / steps);
      const color = colors.primary.map(c => Math.round(c + (255 - c) * (i / steps)));
      doc.setFillColor(...color);
      doc.rect(0, (gradientHeight / steps) * i, pageWidth, gradientHeight / steps, 'F');
    }
  };

  // Calculate summary statistics
  const summaryStats = {
    totalGiven: transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
    totalReceived: transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
    activeContacts: contacts.filter(c => c.balance !== 0).length,
    totalTransactions: transactions.length
  };

  const netBalance = summaryStats.totalReceived - summaryStats.totalGiven;
  const currencySymbol = getCurrencySymbol(formData.currency);

  // Page 1 - Header and Executive Summary
  drawGradientHeader();
  
  // Logo/Brand area
  doc.setFillColor(255, 255, 255, 0.9);
  doc.roundedRect(margin, 30, 200, 60, 10, 10, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(31, 41, 55);
  doc.text('BuddyCash', margin + 20, 60);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text('Financial Report', margin + 20, 78);

  // Report title and date
  yPos = 150;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(...colors.dark);
  doc.text('Financial Summary Report', margin, yPos);
  
  yPos += 35;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(...colors.text);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, margin, yPos);

  // Executive Summary Card
  yPos += 50;
  checkPageBreak(200);
  
  const cardHeight = 180;
  drawCard(margin, yPos, contentWidth, cardHeight, [248, 250, 252]);
  
  // Card header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...colors.dark);
  doc.text('Executive Summary', margin + 25, yPos + 35);
  
  // Summary metrics in a grid
  const metricsY = yPos + 65;
  const metricWidth = (contentWidth - 50) / 2;
  
  const metrics = [
    { label: 'Total Given', value: `${currencySymbol}${summaryStats.totalGiven.toLocaleString()}`, color: colors.danger },
    { label: 'Total Received', value: `${currencySymbol}${summaryStats.totalReceived.toLocaleString()}`, color: colors.primary },
    { label: 'Net Balance', value: `${netBalance >= 0 ? '' : '-'}${currencySymbol}${Math.abs(netBalance).toLocaleString()}`, color: netBalance >= 0 ? colors.primary : colors.danger },
    { label: 'Active Contacts', value: summaryStats.activeContacts.toString(), color: colors.secondary }
  ];
  
  metrics.forEach((metric, index) => {
    const x = margin + 25 + (index % 2) * metricWidth;
    const y = metricsY + Math.floor(index / 2) * 50;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...colors.text);
    doc.text(metric.label, x, y);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...metric.color);
    doc.text(metric.value, x, y + 25);
  });

  yPos += cardHeight + 40;

  // Outstanding Balances Section
  checkPageBreak(300);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...colors.dark);
  doc.text('Outstanding Balances', margin, yPos);
  yPos += 40;

  // People who owe you
  const topOwedToYou = contacts
    .filter(c => c.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 8);

  if (topOwedToYou.length > 0) {
    checkPageBreak(60 + (topOwedToYou.length * 35));
    
    drawCard(margin, yPos, contentWidth, 60 + (topOwedToYou.length * 35), [240, 253, 244]);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...colors.primary);
    doc.text('💰 People Who Owe You', margin + 25, yPos + 30);
    
    topOwedToYou.forEach((person, index) => {
      const itemY = yPos + 60 + (index * 35);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(...colors.text);
      doc.text(person.name, margin + 40, itemY);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...colors.primary);
      doc.text(`${currencySymbol}${person.balance.toLocaleString()}`, 
               pageWidth - margin - 60, itemY, { align: 'right' });
      
      // Separator line
      if (index < topOwedToYou.length - 1) {
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.5);
        doc.line(margin + 25, itemY + 15, pageWidth - margin - 25, itemY + 15);
      }
    });
    
    yPos += 80 + (topOwedToYou.length * 35);
  }

  // People you owe
  yPos += 20;
  const topYouOwe = contacts
    .filter(c => c.balance < 0)
    .sort((a, b) => a.balance - b.balance)
    .slice(0, 8);

  if (topYouOwe.length > 0) {
    checkPageBreak(60 + (topYouOwe.length * 35));
    
    drawCard(margin, yPos, contentWidth, 60 + (topYouOwe.length * 35), [254, 242, 242]);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...colors.danger);
    doc.text('💳 People You Owe', margin + 25, yPos + 30);
    
    topYouOwe.forEach((person, index) => {
      const itemY = yPos + 60 + (index * 35);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(...colors.text);
      doc.text(person.name, margin + 40, itemY);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...colors.danger);
      doc.text(`${currencySymbol}${Math.abs(person.balance).toLocaleString()}`, 
               pageWidth - margin - 60, itemY, { align: 'right' });
      
      // Separator line
      if (index < topYouOwe.length - 1) {
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.5);
        doc.line(margin + 25, itemY + 15, pageWidth - margin - 25, itemY + 15);
      }
    });
    
    yPos += 80 + (topYouOwe.length * 35);
  }

  // New page for transactions
  addPage();
  
  // Transaction History Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...colors.dark);
  doc.text('Recent Transactions', margin, yPos);
  yPos += 50;

  // Transaction table
  const recentTransactions = transactions.slice(0, 15);
  if (recentTransactions.length > 0) {
    // Table header
    drawCard(margin, yPos, contentWidth, 40, colors.secondary.map(c => Math.round(c * 0.1)));
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('Date', margin + 20, yPos + 25);
    doc.text('Type', margin + 120, yPos + 25);
    doc.text('Amount', margin + 220, yPos + 25);
    doc.text('Description', margin + 320, yPos + 25);
    
    yPos += 50;
    
    recentTransactions.forEach((transaction, index) => {
      checkPageBreak(35);
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(...colors.light);
        doc.rect(margin, yPos - 10, contentWidth, 30, 'F');
      }
      
      const date = new Date(transaction.date).toLocaleDateString();
      const type = transaction.type === 'given' ? 'Given' : 'Received';
      const amount = `${currencySymbol}${Math.abs(transaction.amount).toLocaleString()}`;
      const description = (transaction.description || 'No description').substring(0, 25);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...colors.text);
      
      doc.text(date, margin + 20, yPos + 10);
      
      // Type with color coding
      doc.setTextColor(transaction.type === 'given' ? ...colors.danger : ...colors.primary);
      doc.text(type, margin + 120, yPos + 10);
      
      // Amount with color coding
      doc.setFont('helvetica', 'bold');
      doc.text(amount, margin + 220, yPos + 10);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      doc.text(description, margin + 320, yPos + 10);
      
      yPos += 30;
    });
  }

  // Add footer to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer background
    doc.setFillColor(...colors.light);
    doc.rect(0, pageHeight - 50, pageWidth, 50, 'F');
    
    // Footer content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    
    doc.text('Generated by BuddyCash Financial Management System', 
             margin, pageHeight - 25);
    doc.text(`Page ${i} of ${totalPages}`, 
             pageWidth - margin, pageHeight - 25, { align: 'right' });
    
    doc.text(`Report Currency: ${formData.currency}`, 
             pageWidth / 2, pageHeight - 25, { align: 'center' });
  }

  // Save the PDF
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`buddycash-financial-report-${dateStr}.pdf`);
  
  toast({
    title: "Report Downloaded",
    description: "Your modern financial report has been downloaded successfully!",
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
