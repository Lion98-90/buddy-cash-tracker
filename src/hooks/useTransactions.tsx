// Add updateTransaction function to useTransactions hook
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

// Add updateTransaction to the return object
return {
  transactions,
  isLoading,
  addTransaction,
  deleteTransaction,
  updateTransaction,
  refetch: fetchTransactions
};