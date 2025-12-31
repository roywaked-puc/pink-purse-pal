import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Transaction, Appointment, Category, Account, Client, Service } from '@/types';

interface AppContextType {
  transactions: Transaction[];
  appointments: Appointment[];
  categories: Category[];
  accounts: Account[];
  clients: Client[];
  services: Service[];
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
  addClient: (client: Omit<Client, 'id'>) => string;
  updateClient: (id: string, client: Omit<Client, 'id'>) => void;
  deleteClient: (id: string) => void;
  searchClients: (query: string) => Client[];
  getClientById: (id: string) => Client | undefined;
  addService: (service: Omit<Service, 'id'>) => string;
  updateService: (id: string, service: Omit<Service, 'id'>) => void;
  deleteService: (id: string) => void;
  searchServices: (query: string) => Service[];
  getServiceById: (id: string) => Service | undefined;
  getBusinessBalance: () => number;
  getPersonalBalance: () => number;
  getMonthlyPersonalExpenses: () => number;
  getAccountBalance: (accountId: string) => number;
  getAppointmentsWithBalance: (clientId?: string) => Appointment[];
  getAppointmentById: (id: string) => Appointment | undefined;
  updateAppointmentPayment: (id: string, paidAmount: number) => void;
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

const initialClients: Client[] = [
  { id: '1', name: 'Maria Silva', phone: '(11) 99999-1111', notes: 'Prefere horário da manhã' },
  { id: '2', name: 'Ana Costa', phone: '(11) 99999-2222', notes: '' },
];

const initialServices: Service[] = [
  { id: '1', description: 'Manicure', amount: 35, notes: 'Tempo: 40min' },
  { id: '2', description: 'Pedicure', amount: 45, notes: 'Tempo: 50min' },
  { id: '3', description: 'Manicure + Pedicure', amount: 70, notes: 'Tempo: 1h30' },
  { id: '4', description: 'Unha em gel', amount: 120, notes: 'Tempo: 2h' },
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
    clientId: '1',
    clientName: 'Maria Silva',
    service: 'Unha em gel',
    amount: 120,
    paidAmount: 30,
    paymentStatus: 'sinal',
  },
  {
    id: '2',
    date: new Date(Date.now() + 172800000),
    clientId: '2',
    clientName: 'Ana Costa',
    service: 'Manicure + Pedicure',
    amount: 80,
    paidAmount: 0,
    paymentStatus: 'nao_pago',
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [services, setServices] = useState<Service[]>(initialServices);

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

  const addClient = (client: Omit<Client, 'id'>): string => {
    const id = generateId();
    setClients(prev => [...prev, { ...client, id }]);
    return id;
  };

  const updateClient = (id: string, client: Omit<Client, 'id'>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...client, id } : c));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const searchClients = useCallback((query: string): Client[] => {
    if (!query || query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(lowerQuery));
  }, [clients]);

  const getClientById = useCallback((id: string): Client | undefined => {
    return clients.find(c => c.id === id);
  }, [clients]);

  const addService = (service: Omit<Service, 'id'>): string => {
    const id = generateId();
    setServices(prev => [...prev, { ...service, id }]);
    return id;
  };

  const updateService = (id: string, service: Omit<Service, 'id'>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...service, id } : s));
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const searchServices = useCallback((query: string): Service[] => {
    if (!query || query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return services.filter(s => s.description.toLowerCase().includes(lowerQuery));
  }, [services]);

  const getServiceById = useCallback((id: string): Service | undefined => {
    return services.find(s => s.id === id);
  }, [services]);

  const getBusinessBalance = () => {
    return transactions
      .filter(t => t.scope === 'empresa')
      .reduce((acc, t) => {
        if (t.type === 'entrada') return acc + t.amount;
        if (t.type === 'saida') return acc - t.amount;
        return acc + t.amount;
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

  const getAppointmentsWithBalance = useCallback((clientId?: string): Appointment[] => {
    return appointments.filter(a => {
      const hasBalance = a.amount - a.paidAmount > 0;
      if (clientId) {
        return hasBalance && a.clientId === clientId;
      }
      return hasBalance;
    });
  }, [appointments]);

  const getAppointmentById = useCallback((id: string): Appointment | undefined => {
    return appointments.find(a => a.id === id);
  }, [appointments]);

  const updateAppointmentPayment = (id: string, paidAmount: number) => {
    setAppointments(prev => prev.map(a => {
      if (a.id !== id) return a;
      const newPaidAmount = a.paidAmount + paidAmount;
      let newStatus: 'nao_pago' | 'sinal' | 'pago' = 'nao_pago';
      if (newPaidAmount >= a.amount) {
        newStatus = 'pago';
      } else if (newPaidAmount > 0) {
        newStatus = 'sinal';
      }
      return { ...a, paidAmount: newPaidAmount, paymentStatus: newStatus };
    }));
  };

  return (
    <AppContext.Provider value={{
      transactions,
      appointments,
      categories,
      accounts,
      clients,
      services,
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
      addClient,
      updateClient,
      deleteClient,
      searchClients,
      getClientById,
      addService,
      updateService,
      deleteService,
      searchServices,
      getServiceById,
      getBusinessBalance,
      getPersonalBalance,
      getMonthlyPersonalExpenses,
      getAccountBalance,
      getAppointmentsWithBalance,
      getAppointmentById,
      updateAppointmentPayment,
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
