export type TransactionType = 'entrada' | 'saida';
export type TransactionScope = 'empresa' | 'pessoal';
export type PaymentStatus = 'pago' | 'nao_pago' | 'sinal';
export type ConfirmationStatus = 'pendente' | 'confirmado' | 'atendido' | 'cancelado' | 'retorno_previsto';

export interface Transaction {
  id: string;
  date: Date;
  type: TransactionType;
  scope: TransactionScope;
  category: string;
  categoryId?: string;
  account: string;
  accountId?: string;
  amount: number;
  grossAmount?: number;
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
  recurrenceDays?: number;
  birthDate?: string; // ISO date 'YYYY-MM-DD'
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
  duration: number;
  notes?: string;
  googleEventId?: string;
  parentAppointmentId?: string;
  isPermuta?: boolean;
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
  duration: number;
  notes?: string;
  color?: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  google_calendar_enabled: boolean;
  google_client_id: string | null;
  google_client_secret: string | null;
  google_token_expiry: string | null;
  retention_intervals: number[];
  retention_reminder_days: number;
  retention_color_previsto: string;
  retention_color_aguardando: string;
  retention_color_confirmado: string;
  crm_inactive_days: number;
  crm_confirm_days: number;
  crm_vip_count: number;
  crm_monthly_goal: number;
}

export interface ClientPhoto {
  id: string;
  clientId: string;
  appointmentId?: string;
  photoDate: Date;
  storagePath: string;
  observation?: string;
  serviceName?: string;
  createdAt: Date;
}
