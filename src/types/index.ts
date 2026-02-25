export type TransactionType = 'entrada' | 'saida';
export type TransactionScope = 'empresa' | 'pessoal';
export type PaymentStatus = 'pago' | 'nao_pago' | 'sinal';
export type ConfirmationStatus = 'pendente' | 'confirmado' | 'atendido' | 'cancelado';

export interface Transaction {
  id: string;
  date: Date;
  type: TransactionType;
  scope: TransactionScope;
  category: string;
  account: string;
  amount: number;
  grossAmount?: number; // Valor bruto (antes da taxa de operadora)
  description?: string;
  clientName?: string;
  appointmentId?: string;
  paymentType?: 'sinal' | 'pagamento';
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  date: Date;
  clientId?: string;
  clientName: string;
  serviceId?: string;
  service: string;
  amount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  confirmationStatus: ConfirmationStatus;
  duration: number; // em minutos
  notes?: string;
  googleEventId?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'entrada' | 'saida';
  scope: 'empresa' | 'pessoal';
}

export interface Account {
  id: string;
  name: string;
  type: 'dinheiro' | 'banco' | 'maquininha';
  feePercentage?: number;
}

export interface Service {
  id: string;
  description: string;
  amount: number;
  duration: number; // em minutos
  notes?: string;
  color?: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  google_calendar_enabled: boolean;
  google_client_id: string | null;
  google_client_secret: string | null;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expiry: string | null;
}
