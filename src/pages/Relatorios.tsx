import { useEffect, useRef, useState } from 'react';
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
  const tabsListRef = useRef<HTMLDivElement>(null);
  const tabClassName = 'flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-muted px-4 py-2 md:flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground';

  useEffect(() => {
    tabsListRef.current?.querySelector<HTMLElement>('[data-state="active"]')?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }, [tab]);

  return (
    <MainLayout>
      <PageHeader
        title="Relatórios"
        subtitle="Indicadores, agenda, financeiro e movimentações"
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList ref={tabsListRef} className="flex h-auto w-full flex-nowrap justify-start gap-2 overflow-x-auto rounded-none bg-transparent p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="indicadores" className={tabClassName}>
            <BarChart3 className="h-4 w-4" />
            <span>Indicadores</span>
          </TabsTrigger>
          <TabsTrigger value="agendamentos" className={tabClassName}>
            <CalendarDays className="h-4 w-4" />
            <span>Agenda</span>
          </TabsTrigger>
          <TabsTrigger value="financeiro" className={tabClassName}>
            <Wallet className="h-4 w-4" />
            <span>Financeiro</span>
          </TabsTrigger>
          <TabsTrigger value="movimentacoes" className={tabClassName}>
            <FileSpreadsheet className="h-4 w-4" />
            <span>Movim.</span>
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
