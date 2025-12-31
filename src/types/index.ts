export type TransactionType = 'entrada' | 'saida' | 'ajuste';
export type TransactionScope = 'empresa' | 'pessoal';
export type PaymentStatus = 'pago' | 'nao_pago' | 'sinal';

export interface Transaction {
  id: string;
  date: Date;
  type: TransactionType;
  scope: TransactionScope;
  category: string;
  account: string;
  amount: number;
  description?: string;
}

export interface Appointment {
  id: string;
  date: Date;
  clientName: string;
  service: string;
  amount: number;
  paymentStatus: PaymentStatus;
}

export interface Category {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'dinheiro' | 'banco' | 'maquininha';
}
