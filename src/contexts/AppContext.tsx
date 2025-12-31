import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { Transaction, Appointment, Category, Account, Client, Service } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useClients, useAddClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients';
import { useServices, useAddService, useUpdateService, useDeleteService } from '@/hooks/useServices';
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useAccounts, useAddAccount, useUpdateAccount, useDeleteAccount } from '@/hooks/useAccounts';
import { useAppointments, useAddAppointment, useUpdateAppointment, useDeleteAppointment, useUpdateAppointmentPayment } from '@/hooks/useAppointments';
import { useTransactions, useAddTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';

interface AppContextType {
  transactions: Transaction[];
  appointments: Appointment[];
  categories: Category[];
  accounts: Account[];
  clients: Client[];
  services: Service[];
  loading: boolean;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Queries
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments();
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();

  // Mutations
  const addClientMutation = useAddClient();
  const updateClientMutation = useUpdateClient();
  const deleteClientMutation = useDeleteClient();
  
  const addServiceMutation = useAddService();
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();
  
  const addCategoryMutation = useAddCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  
  const addAccountMutation = useAddAccount();
  const updateAccountMutation = useUpdateAccount();
  const deleteAccountMutation = useDeleteAccount();
  
  const addAppointmentMutation = useAddAppointment();
  const updateAppointmentMutation = useUpdateAppointment();
  const deleteAppointmentMutation = useDeleteAppointment();
  const updateAppointmentPaymentMutation = useUpdateAppointmentPayment();
  
  const addTransactionMutation = useAddTransaction();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  const loading = clientsLoading || servicesLoading || categoriesLoading || 
                  accountsLoading || appointmentsLoading || transactionsLoading;

  // Client functions
  const addClient = useCallback((client: Omit<Client, 'id'>): string => {
    const tempId = Math.random().toString(36).substring(2, 9);
    addClientMutation.mutate(client);
    return tempId;
  }, [addClientMutation]);

  const updateClient = useCallback((id: string, client: Omit<Client, 'id'>) => {
    updateClientMutation.mutate({ id, client });
  }, [updateClientMutation]);

  const deleteClient = useCallback((id: string) => {
    deleteClientMutation.mutate(id);
  }, [deleteClientMutation]);

  const searchClients = useCallback((query: string): Client[] => {
    if (!query || query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(lowerQuery));
  }, [clients]);

  const getClientById = useCallback((id: string): Client | undefined => {
    return clients.find(c => c.id === id);
  }, [clients]);

  // Service functions
  const addService = useCallback((service: Omit<Service, 'id'>): string => {
    const tempId = Math.random().toString(36).substring(2, 9);
    addServiceMutation.mutate(service);
    return tempId;
  }, [addServiceMutation]);

  const updateService = useCallback((id: string, service: Omit<Service, 'id'>) => {
    updateServiceMutation.mutate({ id, service });
  }, [updateServiceMutation]);

  const deleteService = useCallback((id: string) => {
    deleteServiceMutation.mutate(id);
  }, [deleteServiceMutation]);

  const searchServices = useCallback((query: string): Service[] => {
    if (!query || query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return services.filter(s => s.description.toLowerCase().includes(lowerQuery));
  }, [services]);

  const getServiceById = useCallback((id: string): Service | undefined => {
    return services.find(s => s.id === id);
  }, [services]);

  // Category functions
  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    addCategoryMutation.mutate(category);
  }, [addCategoryMutation]);

  const updateCategory = useCallback((id: string, category: Omit<Category, 'id'>) => {
    updateCategoryMutation.mutate({ id, category });
  }, [updateCategoryMutation]);

  const deleteCategory = useCallback((id: string) => {
    deleteCategoryMutation.mutate(id);
  }, [deleteCategoryMutation]);

  // Account functions
  const addAccount = useCallback((account: Omit<Account, 'id'>) => {
    addAccountMutation.mutate(account);
  }, [addAccountMutation]);

  const updateAccount = useCallback((id: string, account: Omit<Account, 'id'>) => {
    updateAccountMutation.mutate({ id, account });
  }, [updateAccountMutation]);

  const deleteAccount = useCallback((id: string) => {
    deleteAccountMutation.mutate(id);
  }, [deleteAccountMutation]);

  // Appointment functions
  const addAppointment = useCallback((appointment: Omit<Appointment, 'id'>) => {
    addAppointmentMutation.mutate(appointment);
  }, [addAppointmentMutation]);

  const updateAppointment = useCallback((id: string, appointment: Omit<Appointment, 'id'>) => {
    updateAppointmentMutation.mutate({ id, appointment });
  }, [updateAppointmentMutation]);

  const deleteAppointment = useCallback((id: string) => {
    deleteAppointmentMutation.mutate(id);
  }, [deleteAppointmentMutation]);

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

  const updateAppointmentPayment = useCallback((id: string, paidAmount: number) => {
    updateAppointmentPaymentMutation.mutate({ id, paidAmount });
  }, [updateAppointmentPaymentMutation]);

  // Transaction functions
  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    addTransactionMutation.mutate(transaction);
  }, [addTransactionMutation]);

  const updateTransaction = useCallback((id: string, transaction: Omit<Transaction, 'id'>) => {
    updateTransactionMutation.mutate({ id, transaction });
  }, [updateTransactionMutation]);

  const deleteTransaction = useCallback((id: string) => {
    deleteTransactionMutation.mutate(id);
  }, [deleteTransactionMutation]);

  // Balance functions
  const getBusinessBalance = useCallback(() => {
    return transactions
      .filter(t => t.scope === 'empresa')
      .reduce((acc, t) => {
        if (t.type === 'entrada') return acc + t.amount;
        if (t.type === 'saida') return acc - t.amount;
        return acc;
      }, 0);
  }, [transactions]);

  const getPersonalBalance = useCallback(() => {
    return transactions
      .filter(t => t.scope === 'pessoal')
      .reduce((acc, t) => {
        if (t.type === 'entrada') return acc + t.amount;
        if (t.type === 'saida') return acc - t.amount;
        return acc;
      }, 0);
  }, [transactions]);

  const getMonthlyPersonalExpenses = useCallback(() => {
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
  }, [transactions]);

  const getAccountBalance = useCallback((accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return 0;
    
    return transactions
      .filter(t => t.account === account.name || t.account === accountId)
      .reduce((acc, t) => {
        if (t.type === 'entrada') return acc + t.amount;
        if (t.type === 'saida') return acc - t.amount;
        return acc;
      }, 0);
  }, [transactions, accounts]);

  const value = useMemo(() => ({
    transactions,
    appointments,
    categories,
    accounts,
    clients,
    services,
    loading,
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
  }), [
    transactions,
    appointments,
    categories,
    accounts,
    clients,
    services,
    loading,
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
  ]);

  return (
    <AppContext.Provider value={value}>
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
