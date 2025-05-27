import { useState } from 'react';
import { Camera, Edit, Shield, CreditCard, Globe, LogOut, Settings, Download, FileText, Trash2 } from 'lucide-react';

// Mock data for demonstration
const mockProfile = {
  name: 'Ansh Singh',
  email: 'opphising6@gmail.com',
  phone: '987654321',
  address: 'Navi Mumbai',
  currency: 'INR',
  avatar: null
};

const mockTransactions = [
  { id: 1, date: '2024-01-15', type: 'given', amount: -500, contact: 'John Doe', description: 'Lunch payment' },
  { id: 2, date: '2024-01-14', type: 'received', amount: 300, contact: 'Jane Smith', description: 'Shared taxi fare' },
  { id: 3, date: '2024-01-13', type: 'given', amount: -150, contact: 'Mike Johnson', description: 'Coffee' },
  { id: 4, date: '2024-01-12', type: 'received', amount: 800, contact: 'Sarah Wilson', description: 'Dinner split' },
  { id: 5, date: '2024-01-11', type: 'given', amount: -200, contact: 'Tom Brown', description: 'Movie tickets' }
];

const mockContacts = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', balance: 500 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '098-765-4321', balance: -300 },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', phone: '555-123-4567', balance: 150 },
  { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', phone: '444-987-6543', balance: -800 },
  { id: 5, name: 'Tom Brown', email: 'tom@example.com', phone: '777-555-1234', balance: 200 }
];

// Mock UI Components
const Button = ({ children, onClick, variant = 'default', className = '', disabled = false }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  };
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

const Input = ({ value, onChange, placeholder, type = 'text', disabled = false, className = '' }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${disabled ? 'bg-gray-100' : ''} ${className}`}
  />
);

const Select = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {value || 'Select...'}
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
};

const SelectItem = ({ value, children, onSelect }) => (
  <div
    onClick={() => onSelect(value)}
    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
  >
    {children}
  </div>
);

const Label = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
    {children}
  </label>
);

const toast = ({ title, description, variant = 'default' }) => {
  // Mock toast function - in a real app this would show a toast notification
  console.log(`Toast: ${title} - ${description} (${variant})`);
  alert(`${title}: ${description}`);
};

export default function Settings() {
  const [profile] = useState(mockProfile);
  const [transactions] = useState(mockTransactions);
  const [contacts] = useState(mockContacts);
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
      // Mock update profile function
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
      toast({
        title: "Success",
        description: "Signed out successfully",
      });
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

  const getCurrencySymbol = (currencyCode) => {
    const symbols = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'JPY': '¥', 'CAD': 'C$', 'AUD': 'A$'
    };
    return symbols[currencyCode] || '$';
  };

  const currencySymbol = getCurrencySymbol(formData.currency);

  const generateTextReport = () => {
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

    return `BUDDYCASH FINANCIAL REPORT
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
=========================================================`;
  };

  const handleExportData = () => {
    try {
      const reportContent = generateTextReport();
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buddycash-data-export-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Your data has been exported successfully",
      });
    } catch (error) {
      console.error('Error generating export:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating your export",
        variant: "destructive",
      });
    }
  };

  const handleDownloadReport = () => {
    try {
      const reportContent = generateTextReport();
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buddycash-financial-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Downloaded",
        description: "Your financial report has been downloaded",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Download Failed",
        description: "There was an error generating your report",
        variant: "destructive",
      });
    }
  };

  const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' }
  ];

  const selectedCurrencyLabel = currencyOptions.find(opt => opt.value === formData.currency)?.label || 'Select currency';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
                    value={selectedCurrencyLabel} 
                    onValueChange={(value) => setFormData({...formData, currency: value})}
                  >
                    {currencyOptions.map(option => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        onSelect={(value) => setFormData({...formData, currency: value})}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
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
                  { icon: Settings, label: 'Preferences', desc: 'App preferences and themes', action: () => setShowPreferences(true) }
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

        {showPreferences && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
              <p className="text-gray-600 mb-6">Preference settings will be available in the full version.</p>
              <Button onClick={() => setShowPreferences(false)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
