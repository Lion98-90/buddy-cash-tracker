
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
      setTransactions(data || []);
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
      
      setTransactions(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  return {
    transactions,
    isLoading,
    addTransaction,
    refetch: fetchTransactions
  };
};
