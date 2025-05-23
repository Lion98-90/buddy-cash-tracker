
import { useState } from 'react';
import { Plus, Search, MessageCircle, Phone, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../hooks/useAuth';

export const People = () => {
  const { user } = useAuth();
  const [selectedPerson, setSelectedPerson] = useState(null);

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
    return symbols[currencyCode] || '$';
  };

  const currencySymbol = getCurrencySymbol(user?.currency || 'USD');

  const people = [
    { 
      id: 1, 
      name: 'John Doe', 
      balance: 250, 
      phone: '+1 234 567 8901',
      transactions: [
        { date: '2024-01-15', amount: 250, type: 'received', description: 'Lunch payment' },
        { date: '2024-01-10', amount: -100, type: 'given', description: 'Movie tickets' }
      ]
    },  
    { 
      id: 2, 
      name: 'Emma Wilson', 
      balance: -300, 
      phone: '+1 234 567 8904',
      transactions: [
        { date: '2024-01-12', amount: -300, type: 'given', description: 'Rent contribution' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">People</h1>
          <p className="text-gray-600 mt-1">Track money given and received from people</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">All People</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {people.map((person) => (
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
                      <p className="text-sm text-gray-500">{person.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-semibold ${
                      person.balance > 0 ? 'text-green-600' : person.balance < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {person.balance > 0 ? '+' : ''}{currencySymbol}{Math.abs(person.balance)}
                    </span>
                    <p className="text-sm text-gray-500">
                      {person.balance > 0 ? 'Owes you' : person.balance < 0 ? 'You owe' : 'Settled'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Person Details */}
        {selectedPerson ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
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
                    <p className="text-gray-500">{selectedPerson.phone}</p>
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
                    selectedPerson.balance > 0 ? 'text-green-600' : selectedPerson.balance < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {selectedPerson.balance > 0 ? '+' : ''}{currencySymbol}{Math.abs(selectedPerson.balance)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedPerson.balance > 0 ? 'They owe you' : selectedPerson.balance < 0 ? 'You owe them' : 'All settled'}
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mb-6">
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  Add Received
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  Add Given
                </Button>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Transaction History</h4>
                <div className="space-y-3">
                  {selectedPerson.transactions.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-xs text-gray-500">{transaction.date}</p>
                      </div>
                      <span className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{currencySymbol}{Math.abs(transaction.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Select a person to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
