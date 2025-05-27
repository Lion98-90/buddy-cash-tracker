import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';

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

  const deleteContact = async (contactId: string) => {
    if (!user) return;

    try {
      // Delete associated transactions first (due to foreign key constraints)
      const { error: transactionError } = await supabase
        .from('transactions')
        .delete()
        .eq('contact_id', contactId)
        .eq('user_id', user.id); // Ensure user owns the transaction

      if (transactionError) throw transactionError;

      // Then delete the contact
      const { error: contactError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)
        .eq('user_id', user.id); // Ensure user owns the contact

      if (contactError) throw contactError;

      // Update state to remove the deleted contact
      setContacts(prev => prev.filter(contact => contact.id !== contactId));

    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  };


  return {
    contacts,
    isLoading,
    addContact,
    deleteContact, // Add deleteContact to the returned object
    refetch: fetchContacts
  };
};
