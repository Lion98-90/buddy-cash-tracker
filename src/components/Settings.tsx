import { useState, useEffect } from 'react';
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

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
  lastAutoTable: { finalY?: number };
}

export const Settings = () => {
  const { profile, updateProfile, signOut } = useAuth();
  const { transactions } = useTransactions();
  const { contacts } = useContacts();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    currency: 'USD'
  });
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        currency: profile.currency || 'USD'
      });
    }
  }, [profile]);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch('/assets/logo.png');
        if (!response.ok) {
          console.warn('Logo image not found at /assets/logo.png. Report will not include logo.');
          toast({ title: "Logo Missing", description: "App logo not found. Report will be generated without it.", variant: "default" });
          return;
        }
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoDataUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Error loading logo:', error);
        toast({ title: "Logo Error", description: "Could not load app logo for the report.", variant: "default" });
      }
    };
    fetchLogo();
  }, [toast]);


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
        // Note: Actual user data deletion from Supabase should be handled server-side or via a Supabase function
        // For now, this just signs out and simulates deletion.
        await signOut(); 
        window.location.href = '/';
        toast({
          title: "Account Deleted",
          description: "Your account has been signed out. For full data deletion, contact support.", // Placeholder message
        });
      } catch (error) {
        console.error('Error deleting account:', error);
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
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

  const handleDownloadReport = async () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'pt',
      format: 'a4'
    }) as jsPDFWithAutoTable;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let yPos = margin;

    // --- Styles ---
    const FONT_REGULAR = 'Helvetica';
    const FONT_BOLD = 'Helvetica-Bold';
    
    const COLOR_PRIMARY = '#2563EB'; // Tailwind blue-600
    const COLOR_TEXT_DARK = '#1F2937'; // Tailwind gray-800
    const COLOR_TEXT_LIGHT = '#6B7280'; // Tailwind gray-500
    const COLOR_BORDER = '#E5E7EB';   // Tailwind gray-200

    // --- Helper Functions ---
    const addPageIfNeeded = (neededHeight: number) => {
      if (yPos + neededHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        addReportHeader(); // Add header to new page
        addReportFooter(); // Add footer to new page (will be drawn on current page, then overwritten by content)
      }
    };
    
    const addReportHeader = () => {
      const headerY = margin / 2;
      if (logoDataUrl) {
        try {
          const imgProps = doc.getImageProperties(logoDataUrl);
          const imgWidth = 40;
          const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
          doc.addImage(logoDataUrl, 'PNG', margin, headerY, imgWidth, imgHeight);
        } catch (e) {
          console.error("Error adding logo to PDF:", e);
          doc.setFont(FONT_REGULAR);
          doc.setFontSize(10);
          doc.setTextColor(COLOR_TEXT_LIGHT);
          doc.text('BuddyCash', margin, headerY + 10);
        }
      } else {
        doc.setFont(FONT_BOLD);
        doc.setFontSize(16);
        doc.setTextColor(COLOR_PRIMARY);
        doc.text('BuddyCash', margin, headerY + 12);
      }

      doc.setFont(FONT_REGULAR);
      doc.setFontSize(10);
      doc.setTextColor(COLOR_TEXT_LIGHT);
      doc.text('Financial Report', pageWidth - margin, headerY + 10, { align: 'right' });
      doc.text(new Date().toLocaleDateString(), pageWidth - margin, headerY + 25, { align: 'right' });
      
      yPos = headerY + (logoDataUrl ? 40 : 20) + 30; // Initial yPos after header
      
      // Draw a line below header
      doc.setDrawColor(COLOR_BORDER);
      doc.line(margin, yPos - 15, pageWidth - margin, yPos - 15);
    };

    const addReportFooter = () => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFont(FONT_REGULAR);
      doc.setFontSize(8);
      doc.setTextColor(COLOR_TEXT_LIGHT);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Page ${i} of ${pageCount} | Generated by BuddyCash`,
          pageWidth / 2,
          pageHeight - margin / 2,
          { align: 'center' }
        );
      }
    };

    const addSectionTitle = (title: string) => {
      addPageIfNeeded(40);
      doc.setFont(FONT_BOLD);
      doc.setFontSize(14);
      doc.setTextColor(COLOR_PRIMARY);
      doc.text(title, margin, yPos);
      yPos += 25;
      doc.setDrawColor(COLOR_BORDER);
      doc.line(margin, yPos -10, margin + 100, yPos - 10); // Accent line
      yPos += 5;
    };
    
    const addKeyValuePair = (key: string, value: string) => {
      addPageIfNeeded(20);
      doc.setFont(FONT_BOLD);
      doc.setFontSize(10);
      doc.setTextColor(COLOR_TEXT_DARK);
      doc.text(key, margin, yPos);
      doc.setFont(FONT_REGULAR);
      doc.setTextColor(COLOR_TEXT_LIGHT);
      doc.text(value, margin + 120, yPos); // Adjust alignment as needed
      yPos += 20;
    };

    // --- Report Content ---
    addReportHeader();

    // Profile Information
    addSectionTitle('Profile Information');
    addKeyValuePair('Name:', profile?.name || 'N/A');
    addKeyValuePair('Email:', profile?.email || 'N/A');
    if (profile?.phone) addKeyValuePair('Phone:', profile.phone);
    yPos += 10; // Extra space after section

    // Financial Summary
    const currencySymbol = getCurrencySymbol(formData.currency);
    const summaryStats = {
      totalGiven: transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalReceived: transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
      activeContacts: contacts.filter(c => c.balance !== 0).length
    };
    const netBalance = summaryStats.totalReceived - summaryStats.totalGiven;

    addSectionTitle('Financial Overview');
    addKeyValuePair('Default Currency:', formData.currency);
    addKeyValuePair('Total Given:', `${currencySymbol}${summaryStats.totalGiven.toFixed(2)}`);
    addKeyValuePair('Total Received:', `${currencySymbol}${summaryStats.totalReceived.toFixed(2)}`);
    addKeyValuePair('Net Balance:', `${netBalance >= 0 ? '' : '-'}${currencySymbol}${Math.abs(netBalance).toFixed(2)}`);
    yPos += 10;

    // Outstanding Balances
    addSectionTitle('Outstanding Balances');
    const topOwedToYou = contacts
      .filter(c => c.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .map(c => [c.name, `${currencySymbol}${c.balance.toFixed(2)}`]);

    const topYouOwe = contacts
      .filter(c => c.balance < 0)
      .sort((a, b) => a.balance - b.balance)
      .map(c => [c.name, `${currencySymbol}${Math.abs(c.balance).toFixed(2)}`]);

    if (topOwedToYou.length > 0) {
      addPageIfNeeded(20 + topOwedToYou.length * 20); // Estimate height
      doc.setFont(FONT_BOLD);
      doc.setFontSize(11);
      doc.setTextColor(COLOR_TEXT_DARK);
      doc.text('People Who Owe You:', margin, yPos);
      yPos += 20;
      doc.autoTable({
        head: [['Name', 'Amount']],
        body: topOwedToYou,
        startY: yPos,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: '#FFFFFF', fontStyle: 'bold' }, // blue-600
        styles: { font: FONT_REGULAR, fontSize: 9, cellPadding: 5 },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => { yPos = margin; addReportHeader(); } // Reset yPos for new page
      });
      yPos = doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY + 20 : yPos + 20;
    } else {
      addKeyValuePair('People Who Owe You:', 'None');
    }
    
    yPos += 10;

    if (topYouOwe.length > 0) {
      addPageIfNeeded(20 + topYouOwe.length * 20);
      doc.setFont(FONT_BOLD);
      doc.setFontSize(11);
      doc.setTextColor(COLOR_TEXT_DARK);
      doc.text('People You Owe:', margin, yPos);
      yPos += 20;
      doc.autoTable({
        head: [['Name', 'Amount']],
        body: topYouOwe,
        startY: yPos,
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38], textColor: '#FFFFFF', fontStyle: 'bold' }, // red-600
        styles: { font: FONT_REGULAR, fontSize: 9, cellPadding: 5 },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => { yPos = margin; addReportHeader(); }
      });
      yPos = doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY + 20 : yPos + 20;
    } else {
      addKeyValuePair('People You Owe:', 'None');
    }
    yPos += 10;

    // Recent Transactions
    addSectionTitle('Recent Transactions (Last 20)');
    const recentTransactionsData = transactions.slice(0, 20).map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type === 'given' ? 'Given' : 'Received',
      `${t.amount < 0 ? '-' : ''}${currencySymbol}${Math.abs(t.amount).toFixed(2)}`,
      t.contact?.name || '-',
      t.description?.substring(0,40) || '-'
    ]);

    if (recentTransactionsData.length > 0) {
      addPageIfNeeded(20 + recentTransactionsData.length * 20);
      doc.autoTable({
        head: [['Date', 'Type', 'Amount', 'Contact', 'Description']],
        body: recentTransactionsData,
        startY: yPos,
        theme: 'grid',
        headStyles: { fillColor: COLOR_TEXT_DARK, textColor: '#FFFFFF', fontStyle: 'bold' },
        styles: { font: FONT_REGULAR, fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 60 }, // Date
          1: { cellWidth: 50 }, // Type
          2: { cellWidth: 70, halign: 'right' }, // Amount
          3: { cellWidth: 80 }, // Contact
          4: { cellWidth: 'auto' } // Description
        },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => { yPos = margin; addReportHeader(); }
      });
      yPos = doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY + 20 : yPos + 20;
    } else {
      addKeyValuePair('Recent Transactions:', 'No transactions found.');
    }
    yPos += 10;

    // Contact Summary
    addSectionTitle('Contact Summary');
    addKeyValuePair('Total Contacts:', contacts.length.toString());
    addKeyValuePair('Contacts Who Owe You:', contacts.filter(c => c.balance > 0).length.toString());
    addKeyValuePair('Contacts You Owe:', contacts.filter(c => c.balance < 0).length.toString());
    addKeyValuePair('Contacts with Zero Balance:', contacts.filter(c => c.balance === 0).length.toString());

    // --- Finalize PDF ---
    addReportFooter(); // Call footer once all content is added to ensure it's on all pages
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
                      {profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
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
                <p className="text-sm text-gray-400">Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}</p>
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
                  onValueChange={(value) => {
                    setFormData({...formData, currency: value});
                    // Automatically save currency change
                    updateProfile({ ...formData, currency: value })
                      .then(() => toast({ title: "Currency Updated", description: `Default currency set to ${value}`}))
                      .catch(() => toast({ title: "Error", description: "Failed to update currency", variant: "destructive" }));
                  }}
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
                <Button variant="outline" onClick={() => toast({ title: "Coming Soon", description: "Password change functionality will be available soon."})}>Change</Button>
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
                Export Data (JSON)
              </Button>
              <Button 
                variant="default" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleDownloadReport}
              >
                <FileText className="w-4 h-4 mr-2" />
                Download Report (PDF)
              </Button>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
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
