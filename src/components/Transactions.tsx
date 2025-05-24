
import { useState } from 'react';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useTransactions } from '../hooks/useTransactions';
import { useContacts } from '../hooks/useContacts';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../hooks/useAuth';

export const Transactions = () => {
  const { profile } = useAuth();
  const { transactions, addTransaction } = useTransactions();
  const { contacts, addContact } = useContacts();
  const { categories } = useCategories();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    personName: '',
    amount: '',
    type: 'given',
    description: '',
    categoryId: ''
  });

  const getCurrencySymbol = (currencyCode: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'JPY': '¥', 'CAD': 'C$', 'AUD': 'A$'
    };
    return symbols[currencyCode] || '$';
  };

  const currencySymbol = getCurrencySymbol(profile?.currency || 'USD');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let contactId = null;
      
      // Find existing contact or create new one
      const existingContact = contacts.find(c => 
        c.name.toLowerCase() === formData.personName.toLowerCase()
      );
      
      if (existingContact) {
        contactId = existingContact.id;
      } else if (formData.personName.trim()) {
        const newContact = await addContact({ name: formData.personName.trim() });
        contactId = newContact?.id || null;
      }

      await addTransaction({
        amount: parseFloat(formData.amount),
        type: formData.type as 'given' | 'received',
        description: formData.description,
        contact_id: contactId,
        category_id: formData.categoryId || null
      });

      setFormData({ personName: '', amount: '', type: 'given', description: '', categoryId: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">Manage all your money transactions</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Search transactions..." 
                className="pl-10"
              />
            </div>
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {(transaction.contact?.name || 'Unknown').split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.contact?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{transaction.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>{new Date(transaction.date).toLocaleDateString()}</span>
                        {transaction.category && (
                          <>
                            <span>•</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">{transaction.category.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-semibold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{currencySymbol}{Math.abs(transaction.amount).toFixed(2)}
                    </span>
                    <p className="text-sm text-gray-500">
                      {transaction.amount > 0 ? 'Received' : 'Given'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No transactions yet. Add your first transaction above!
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Transaction</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Person Name</label>
                <Input 
                  value={formData.personName}
                  onChange={(e) => setFormData({...formData, personName: e.target.value})}
                  placeholder="Enter person name" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="Enter amount" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="given">Money Given</option>
                  <option value="received">Money Received</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  value={formData.categoryId}
                  onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter description" 
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add Transaction
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
