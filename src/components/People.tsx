
import { useState } from 'react';
import { Plus, Search, MessageCircle, Phone, Users, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../hooks/useAuth';
import { useContacts } from '../hooks/useContacts';
import { useTransactions } from '../hooks/useTransactions';

export const People = () => {
  const { profile } = useAuth();
  const { contacts, addContact } = useContacts();
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [transactionData, setTransactionData] = useState({
    amount: '',
    type: 'given',
    description: ''
  });

  const getCurrencySymbol = (currencyCode: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'JPY': '¥', 'CAD': 'C$', 'AUD': 'A$'
    };
    return symbols[currencyCode] || '$';
  };

  const currencySymbol = getCurrencySymbol(profile?.currency || 'USD');

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addContact(formData);
      setFormData({ name: '', phone: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson) return;
    
    try {
      await addTransaction({
        amount: parseFloat(transactionData.amount),
        type: transactionData.type as 'given' | 'received',
        description: transactionData.description,
        contact_id: selectedPerson.id
      });
      setTransactionData({ amount: '', type: 'given', description: '' });
      setShowTransactionForm(false);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const getPersonTransactions = (contactId: string) => {
    return transactions.filter(t => t.contact_id === contactId);
  };

  const getPersonBalance = (contactId: string) => {
    return getPersonTransactions(contactId).reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">People</h1>
          <p className="text-gray-600 mt-1">Track money given and received from people</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Person
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search people..." 
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* People List */}
         <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">All People</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {contacts.map((person) => {
              const balance = getPersonBalance(person.id);
              return (
                <div 
                  key={person.id} 
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    selectedPerson?.id === person.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                  }`}
                  onClick={() => setSelectedPerson(person)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {person.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{person.name}</p>
                        <p className="text-sm text-gray-500">{person.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-semibold ${
                        balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {balance > 0 ? '+' : ''}{currencySymbol}{Math.abs(balance).toFixed(2)}
                      </span>
                      <p className="text-sm text-gray-500">
                        {balance > 0 ? 'Owes you' : balance < 0 ? 'You owe' : 'Settled'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {contacts.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                No contacts yet. Add your first contact above!
              </div>
            )}
          </div>
        </div>

        {/* Person Details */}
        {selectedPerson ? (
          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-medium text-gray-600">
                      {selectedPerson.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedPerson.name}</h3>
                    <p className="text-gray-500">{selectedPerson.phone || 'No phone'}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Current Balance</p>
                  <p className={`text-3xl font-bold ${
                    getPersonBalance(selectedPerson.id) > 0 ? 'text-green-600' : 
                    getPersonBalance(selectedPerson.id) < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {getPersonBalance(selectedPerson.id) > 0 ? '+' : ''}{currencySymbol}{Math.abs(getPersonBalance(selectedPerson.id)).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {getPersonBalance(selectedPerson.id) > 0 ? 'They owe you' : 
                     getPersonBalance(selectedPerson.id) < 0 ? 'You owe them' : 'All settled'}
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mb-6">
                <Button 
                  onClick={() => setShowTransactionForm(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add Transaction
                </Button>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Transaction History</h4>
                <div className="space-y-3">
                  {getPersonTransactions(selectedPerson.id).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-semibold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{currencySymbol}{Math.abs(transaction.amount).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-100 rounded transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {getPersonTransactions(selectedPerson.id).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No transactions yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Select a person to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Contact</h3>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter name" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Enter phone number" 
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
                  Add Contact
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-50 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Transaction</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={transactionData.amount}
                  onChange={(e) => setTransactionData({...transactionData, amount: e.target.value})}
                  placeholder="Enter amount" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select 
                  value={transactionData.type}
                  onChange={(e) => setTransactionData({...transactionData, type: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="given">Money Given</option>
                  <option value="received">Money Received</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input 
                  value={transactionData.description}
                  onChange={(e) => setTransactionData({...transactionData, description: e.target.value})}
                  placeholder="Enter description" 
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowTransactionForm(false)}
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
