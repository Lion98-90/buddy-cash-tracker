
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Contact {
  id: string;
  name: string;
  phone: string | null;
  balance?: number;
}

export const useContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      // Calculate balances for each contact
      const contactsWithBalances = await Promise.all(
        (data || []).map(async (contact) => {
          const { data: transactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('contact_id', contact.id);

          const balance = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
          return { ...contact, balance };
        })
      );

      setContacts(contactsWithBalances);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user]);

  const addContact = async (contactData: { name: string; phone?: string }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...contactData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setContacts(prev => [...prev, { ...data, balance: 0 }]);
      return data;
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  };

  return {
    contacts,
    isLoading,
    addContact,
    refetch: fetchContacts
  };
};
