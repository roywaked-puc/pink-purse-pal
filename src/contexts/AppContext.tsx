import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Transaction, Appointment, Category, Account } from '@/types';

interface AppContextType {
  transactions: Transaction[];
  appointments: Appointment[];
  categories: Category[];
  accounts: Account[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, appointment: Omit<Appointment, 'id'>) => void;
  deleteAppointment: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, account: Omit<Account, 'id'>) => void;
  deleteAccount: (id: string) => void;
  getBusinessBalance: () => number;
  getPersonalBalance: () => number;
  getMonthlyPersonalExpenses: () => number;
  getAccountBalance: (accountId: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substring(2, 9);

const initialCategories: Category[] = [
  { id: '1', name: 'Alimentação' },
  { id: '2', name: 'Transporte' },
  { id: '3', name: 'Beleza' },
  { id: '4', name: 'Saúde' },
  { id: '5', name: 'Lazer' },
  { id: '6', name: 'Casa' },
];

const initialAccounts: Account[] = [
  { id: '1', name: 'Dinheiro', type: 'dinheiro' },
  { id: '2', name: 'Nubank', type: 'banco' },
  { id: '3', name: 'Maquininha Stone', type: 'maquininha' },
];

const initialTransactions: Transaction[] = [
  {
    id: '1',
    date: new Date(),
    type: 'entrada',
    scope: 'empresa',
    category: 'Serviço',
    account: '2',
    amount: 350,
    description: 'Manicure + Pedicure',
  },
  {
    id: '2',
    date: new Date(),
    type: 'saida',
    scope: 'pessoal',
    category: 'Alimentação',
    account: '1',
    amount: 45,
    description: 'Almoço',
  },
];

const initialAppointments: Appointment[] = [
  {
    id: '1',
    date: new Date(Date.now() + 86400000),
    clientName: 'Maria Silva',
    service: 'Unha em gel',
    amount: 120,
    paymentStatus: 'sinal',
  },
  {
    id: '2',
    date: new Date(Date.now() + 172800000),
    clientName: 'Ana Costa',
    service: 'Manicure + Pedicure',
    amount: 80,
    paymentStatus: 'nao_pago',
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [...prev, { ...transaction, id: generateId() }]);
  };

  const updateTransaction = (id: string, transaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...transaction, id } : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addAppointment = (appointment: Omit<Appointment, 'id'>) => {
    setAppointments(prev => [...prev, { ...appointment, id: generateId() }]);
  };

  const updateAppointment = (id: string, appointment: Omit<Appointment, 'id'>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...appointment, id } : a));
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...category, id: generateId() }]);
  };

  const updateCategory = (id: string, category: Omit<Category, 'id'>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...category, id } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addAccount = (account: Omit<Account, 'id'>) => {
    setAccounts(prev => [...prev, { ...account, id: generateId() }]);
  };

  const updateAccount = (id: string, account: Omit<Account, 'id'>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...account, id } : a));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const getBusinessBalance = () => {
    return transactions
      .filter(t => t.scope === 'empresa')
      .reduce((acc, t) => {
        if (t.type === 'entrada') return acc + t.amount;
        if (t.type === 'saida') return acc - t.amount;
        return acc + t.amount; // ajuste
      }, 0);
  };

  const getPersonalBalance = () => {
    return transactions
      .filter(t => t.scope === 'pessoal')
      .reduce((acc, t) => {
        if (t.type === 'entrada') return acc + t.amount;
        if (t.type === 'saida') return acc - t.amount;
        return acc + t.amount;
      }, 0);
  };

  const getMonthlyPersonalExpenses = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.scope === 'pessoal' &&
          t.type === 'saida' &&
          tDate.getMonth() === currentMonth &&
          tDate.getFullYear() === currentYear;
      })
      .reduce((acc, t) => acc + t.amount, 0);
  };

  const getAccountBalance = (accountId: string) => {
    return transactions
      .filter(t => t.account === accountId)
      .reduce((acc, t) => {
        if (t.type === 'entrada') return acc + t.amount;
        if (t.type === 'saida') return acc - t.amount;
        return acc + t.amount;
      }, 0);
  };

  return (
    <AppContext.Provider value={{
      transactions,
      appointments,
      categories,
      accounts,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      addCategory,
      updateCategory,
      deleteCategory,
      addAccount,
      updateAccount,
      deleteAccount,
      getBusinessBalance,
      getPersonalBalance,
      getMonthlyPersonalExpenses,
      getAccountBalance,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
