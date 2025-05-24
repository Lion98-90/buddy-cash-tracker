import { useState } from 'react';
import { X, Calendar, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useTransactions, Transaction } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

interface TransactionModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export const TransactionModal = ({ transaction, isOpen, onClose, onUpdate }: TransactionModalProps) => {
  const { profile } = useAuth();
  const { deleteTransaction, updateTransaction } = useTransactions();
  const { categories } = useCategories();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    amount: Math.abs(transaction.amount).toString(),
    description: transaction.description || '',
    categoryId: transaction.category_id || '',
    date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '',
    type: transaction.amount > 0 ? 'received' : 'given'
  });

  const getCurrencySymbol = (currencyCode: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'JPY': '¥', 'CAD': 'C$', 'AUD': 'A$'
    };
    return symbols[currencyCode] || '$';
  };

  const currencySymbol = getCurrencySymbol(profile?.currency || 'USD');

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(transaction.id);
        onUpdate?.();
        onClose();
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const handleEdit = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      await updateTransaction(transaction.id, {
        amount: parseFloat(editData.amount) * (editData.type === 'given' ? -1 : 1),
        description: editData.description,
        category_id: editData.categoryId || null,
        date: editData.date
      });
      
      onUpdate?.();
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{t('transaction-details')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Contact Info */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="font-medium text-gray-600">
                {(transaction.contact?.name || 'Unknown').split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{transaction.contact?.name || 'Unknown'}</p>
              <p className="text-sm text-gray-500">{transaction.contact?.phone || 'No phone'}</p>
            </div>
          </div>

          {/* Amount */}
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-1">Amount</p>
            <p className={`text-3xl font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {transaction.amount > 0 ? '+' : ''}{currencySymbol}{Math.abs(transaction.amount).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {transaction.amount > 0 ? 'Money Received' : 'Money Given'}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded">{transaction.description || 'No description'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded">{transaction.category?.name || 'No category'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded">
                {new Date(transaction.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button 
              onClick={handleEdit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button 
              onClick={handleDelete}
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};