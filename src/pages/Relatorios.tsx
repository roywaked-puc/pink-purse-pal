import { useState } from 'react';
import { BarChart3, CalendarDays, FileSpreadsheet, Wallet } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RelatorioIndicadores from './RelatorioIndicadores';
import RelatorioFinanceiro from './RelatorioFinanceiro';
import RelatorioAgendamentos from './RelatorioAgendamentos';
import RelatorioMovimentacoes from './RelatorioMovimentacoes';

export default function Relatorios() {
  const [tab, setTab] = useState('indicadores');

  return (
    <MainLayout>
      <PageHeader
        title="Relatórios"
        subtitle="Indicadores, agenda, financeiro e movimentações"
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="indicadores" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Indicadores</span>
          </TabsTrigger>
          <TabsTrigger value="agendamentos" className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Agenda</span>
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="flex items-center gap-1.5">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Financeiro</span>
          </TabsTrigger>
          <TabsTrigger value="movimentacoes" className="flex items-center gap-1.5">
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Movim.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="indicadores" className="mt-4">
          <RelatorioIndicadores embedded />
        </TabsContent>
        <TabsContent value="agendamentos" className="mt-4">
          <RelatorioAgendamentos embedded />
        </TabsContent>
        <TabsContent value="financeiro" className="mt-4">
          <RelatorioFinanceiro embedded />
        </TabsContent>
        <TabsContent value="movimentacoes" className="mt-4">
          <RelatorioMovimentacoes embedded />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
