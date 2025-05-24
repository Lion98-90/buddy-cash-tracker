import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'hi';

interface LanguageState {
  language: Language;
  translations: Record<string, Record<Language, string>>;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      translations: {
        dashboard: {
          en: 'Dashboard',
          hi: 'डैशबोर्ड'
        },
        transactions: {
          en: 'Transactions',
          hi: 'लेन-देन'
        },
        people: {
          en: 'People',
          hi: 'लोग'
        },
        reports: {
          en: 'Reports',
          hi: 'रिपोर्ट'
        },
        settings: {
          en: 'Settings',
          hi: 'सेटिंग्स'
        },
        'sign-out': {
          en: 'Sign Out',
          hi: 'साइन आउट'
        },
        'money-received': {
          en: 'Money Received',
          hi: 'प्राप्त धन'
        },
        'money-given': {
          en: 'Money Given',
          hi: 'दिया गया धन'
        },
        'add-transaction': {
          en: 'Add Transaction',
          hi: 'लेन-देन जोड़ें'
        },
        description: {
          en: 'Description',
          hi: 'विवरण'
        },
        amount: {
          en: 'Amount',
          hi: 'राशि'
        },
        date: {
          en: 'Date',
          hi: 'तारीख'
        },
        category: {
          en: 'Category',
          hi: 'श्रेणी'
        },
        edit: {
          en: 'Edit',
          hi: 'संपादित करें'
        },
        delete: {
          en: 'Delete',
          hi: 'हटाएं'
        },
        cancel: {
          en: 'Cancel',
          hi: 'रद्द करें'
        },
        save: {
          en: 'Save',
          hi: 'सहेजें'
        }
      },
      setLanguage: (lang: Language) => set({ language: lang }),
      t: (key: string) => {
        const { language, translations } = get();
        return translations[key]?.[language] || key;
      }
    }),
    {
      name: 'language-storage'
    }
  )
);