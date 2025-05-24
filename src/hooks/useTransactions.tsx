import { useAuth } from './useAuth';
import { supabase } from '../integrations/supabase/client';

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          contact:contacts(id, name, phone),
          category:categories(id, name)
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

  const addTransaction = async (transaction) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          user_id: user.id
        })
        .select(`
          *,
          contact:contacts(id, name, phone),
          category:categories(id, name)
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

  const updateTransaction = async (transactionId: string, updates: {
    amount: number;
    description?: string;
    category_id?: string | null;
    date?: string;
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', transactionId)
        .eq('user_id', user.id)
        .select(`
          *,
          contact:contacts(id, name, phone),
          category:categories(id, name)
        `)
        .single();

      if (error) throw error;
      
      setTransactions(prev => prev.map(t => 
        t.id === transactionId 
          ? {
              ...t,
              amount: Number(data.amount),
              description: data.description,
              date: data.date,
              category_id: data.category_id,
              category: data.category
            }
          : t
      ));
      
      return data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  return {
    transactions,
    isLoading,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    refetch: fetchTransactions
  };
};