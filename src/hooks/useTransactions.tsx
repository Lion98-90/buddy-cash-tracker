
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Transaction {
  id: string;
  amount: number;
  type: 'given' | 'received';
  description: string | null;
  date: string;
  contact_id: string | null;
  contact?: {
    id: string;
    name: string;
    phone: string | null;
  };
}

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          contact:contacts(id, name, phone)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Transaction interface
      const transformedData: Transaction[] = (data || []).map(item => ({
        id: item.id,
        amount: Number(item.amount),
        type: item.type as 'given' | 'received',
        description: item.description,
        date: item.date,
        contact_id: item.contact_id,
        contact: item.contact ? {
          id: item.contact.id,
          name: item.contact.name,
          phone: item.contact.phone
        } : undefined
      }));
      
      setTransactions(transformedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const addTransaction = async (transactionData: {
    amount: number;
    type: 'given' | 'received';
    description: string;
    contact_id?: string;
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...transactionData,
          user_id: user.id,
          amount: transactionData.type === 'given' ? -Math.abs(transactionData.amount) : Math.abs(transactionData.amount)
        })
        .select(`
          *,
          contact:contacts(id, name, phone)
        `)
        .single();

      if (error) throw error;
      
      const transformedData: Transaction = {
        id: data.id,
        amount: Number(data.amount),
        type: data.type as 'given' | 'received',
        description: data.description,
        date: data.date,
        contact_id: data.contact_id,
        contact: data.contact ? {
          id: data.contact.id,
          name: data.contact.name,
          phone: data.contact.phone
        } : undefined
      };
      
      setTransactions(prev => [transformedData, ...prev]);
      return transformedData;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  return {
    transactions,
    isLoading,
    addTransaction,
    deleteTransaction,
    refetch: fetchTransactions
  };
};
