-- =============================================
-- TABELAS COM SEGURANÇA RLS
-- Cada usuário só pode ver/editar seus próprios dados
-- =============================================

-- Tabela de Clientes
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Serviços
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Categorias
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  scope TEXT NOT NULL CHECK (scope IN ('empresa', 'pessoal')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Contas
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dinheiro', 'banco', 'maquininha')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Agendamentos
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'nao_pago' CHECK (payment_status IN ('nao_pago', 'sinal', 'pago')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Movimentações
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  scope TEXT NOT NULL CHECK (scope IN ('empresa', 'pessoal')),
  category TEXT NOT NULL,
  account TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  payment_type TEXT CHECK (payment_type IS NULL OR payment_type IN ('sinal', 'pagamento')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS - CLIENTS
-- =============================================

CREATE POLICY "Users can view own clients"
ON public.clients FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
ON public.clients FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
ON public.clients FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- POLÍTICAS RLS - SERVICES
-- =============================================

CREATE POLICY "Users can view own services"
ON public.services FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own services"
ON public.services FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services"
ON public.services FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own services"
ON public.services FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- POLÍTICAS RLS - CATEGORIES
-- =============================================

CREATE POLICY "Users can view own categories"
ON public.categories FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
ON public.categories FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
ON public.categories FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- POLÍTICAS RLS - ACCOUNTS
-- =============================================

CREATE POLICY "Users can view own accounts"
ON public.accounts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
ON public.accounts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
ON public.accounts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
ON public.accounts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- POLÍTICAS RLS - APPOINTMENTS
-- =============================================

CREATE POLICY "Users can view own appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments"
ON public.appointments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- POLÍTICAS RLS - TRANSACTIONS
-- =============================================

CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
ON public.transactions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
ON public.transactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_services_user_id ON public.services(user_id);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_date ON public.appointments(date);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);

-- =============================================
-- FUNÇÃO PARA CRIAR DADOS INICIAIS DO USUÁRIO
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir categorias padrão - Empresa Entrada
  INSERT INTO public.categories (user_id, name, type, scope) VALUES
    (NEW.id, 'Serviços', 'entrada', 'empresa'),
    (NEW.id, 'Vendas de Produtos', 'entrada', 'empresa'),
    (NEW.id, 'Outros', 'entrada', 'empresa');
  
  -- Inserir categorias padrão - Empresa Saída
  INSERT INTO public.categories (user_id, name, type, scope) VALUES
    (NEW.id, 'Aluguel', 'saida', 'empresa'),
    (NEW.id, 'Produtos', 'saida', 'empresa'),
    (NEW.id, 'Equipamentos', 'saida', 'empresa'),
    (NEW.id, 'Marketing', 'saida', 'empresa'),
    (NEW.id, 'Funcionários', 'saida', 'empresa'),
    (NEW.id, 'Impostos', 'saida', 'empresa'),
    (NEW.id, 'Outros', 'saida', 'empresa');
  
  -- Inserir categorias padrão - Pessoal Entrada
  INSERT INTO public.categories (user_id, name, type, scope) VALUES
    (NEW.id, 'Salário', 'entrada', 'pessoal'),
    (NEW.id, 'Outros', 'entrada', 'pessoal');
  
  -- Inserir categorias padrão - Pessoal Saída
  INSERT INTO public.categories (user_id, name, type, scope) VALUES
    (NEW.id, 'Alimentação', 'saida', 'pessoal'),
    (NEW.id, 'Transporte', 'saida', 'pessoal'),
    (NEW.id, 'Lazer', 'saida', 'pessoal'),
    (NEW.id, 'Saúde', 'saida', 'pessoal'),
    (NEW.id, 'Outros', 'saida', 'pessoal');
  
  -- Inserir contas padrão
  INSERT INTO public.accounts (user_id, name, type) VALUES
    (NEW.id, 'Dinheiro', 'dinheiro'),
    (NEW.id, 'Nubank', 'banco'),
    (NEW.id, 'Maquininha Stone', 'maquininha');
  
  RETURN NEW;
END;
$$;

-- Trigger para criar dados quando novo usuário se cadastra
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();