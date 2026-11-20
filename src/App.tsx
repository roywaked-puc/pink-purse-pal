import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import Index from "./pages/Index";
import Movimentacoes from "./pages/Movimentacoes";
import Agendamentos from "./pages/Agendamentos";
import Relatorios from "./pages/Relatorios";
import RelatorioFinanceiro from "./pages/RelatorioFinanceiro";
import RelatorioMovimentacoes from "./pages/RelatorioMovimentacoes";
import RelatorioAgendamentos from "./pages/RelatorioAgendamentos";
import RelatorioIndicadores from "./pages/RelatorioIndicadores";
import Configuracoes from "./pages/Configuracoes";
import CRM from "./pages/CRM";
import ClienteFicha from "./pages/ClienteFicha";
import Auth from "./pages/Auth";
import RecuperarSenha from "./pages/RecuperarSenha";
import NotFound from "./pages/NotFound";
import Ajuda from "./pages/Ajuda";
import DocumentoLegal from "./pages/DocumentoLegal";
import { Loader2 } from "lucide-react";
import { useExclusaoConta } from '@/hooks/useExclusaoConta';
import { ContaEmExclusao } from '@/components/conta/ContaEmExclusao';
import { Button } from '@/components/ui/button';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const exclusao = useExclusaoConta();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (exclusao.isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (exclusao.data) return <ContaEmExclusao exclusao={exclusao.data} />;
  if (exclusao.isError) return <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-background"><p>Não foi possível consultar sua conta.</p><Button onClick={() => void exclusao.refetch()}>Tentar novamente</Button></div>;
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/recuperar-senha" element={<RecuperarSenha />} />
      <Route path="/termos" element={<DocumentoLegal />} />
      <Route path="/privacidade" element={<DocumentoLegal />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/movimentacoes" element={
        <ProtectedRoute>
          <Movimentacoes />
        </ProtectedRoute>
      } />
      <Route path="/agendamentos" element={
        <ProtectedRoute>
          <Agendamentos />
        </ProtectedRoute>
      } />
      <Route path="/relatorios" element={
        <ProtectedRoute>
          <Relatorios />
        </ProtectedRoute>
      } />
      <Route path="/relatorio-movimentacoes" element={
        <ProtectedRoute>
          <RelatorioMovimentacoes />
        </ProtectedRoute>
      } />
      <Route path="/relatorio-agendamentos" element={
        <ProtectedRoute>
          <RelatorioAgendamentos />
        </ProtectedRoute>
      } />
      <Route path="/relatorio-indicadores" element={
        <ProtectedRoute>
          <RelatorioIndicadores />
        </ProtectedRoute>
      } />
      <Route path="/configuracoes" element={
        <ProtectedRoute>
          <Configuracoes />
        </ProtectedRoute>
      } />
      <Route path="/crm" element={
        <ProtectedRoute>
          <CRM />
        </ProtectedRoute>
      } />
      <Route path="/cliente/:id" element={
        <ProtectedRoute>
          <ClienteFicha />
        </ProtectedRoute>
      } />
      <Route path="/ajuda" element={
        <ProtectedRoute>
          <Ajuda />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
