import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, CalendarPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings';
import { MarcaForm } from '@/components/settings/MarcaForm';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

/**
 * Boas-vindas do primeiro acesso: 3 passos (marca, preços, tudo pronto),
 * cada um com "Pular". Aparece quando onboarding_concluido_em é NULL ou
 * quando ainda não existe linha em user_settings.
 */
export function BoasVindasSheet() {
  const { user } = useAuth();
  const { services, updateService, loading: appLoading } = useApp();
  const { data: settings, isLoading: settingsLoading } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [aberto, setAberto] = useState(false);
  const [passo, setPasso] = useState(0);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [reservaAtiva, setReservaAtiva] = useState(false);
  const [reservaValor, setReservaValor] = useState('0');
  const [concluindo, setConcluindo] = useState(false);

  const precisaOnboarding =
    !!user && !settingsLoading && (!settings || !settings.onboarding_concluido_em);

  useEffect(() => {
    if (precisaOnboarding && !appLoading) {
      setAberto(true);
    }
  }, [precisaOnboarding, appLoading]);

  useEffect(() => {
    if (settings) {
      setReservaAtiva(settings.caixa_reserva_ativo);
      setReservaValor(String(settings.caixa_reserva_valor || 0));
    }
  }, [settings]);

  // Serviços principais com suas faixas de manutenção.
  const grupos = useMemo(() => {
    const principais = services.filter((s) => !s.servicoPaiId);
    return principais.map((p) => ({
      principal: p,
      faixas: services.filter((s) => s.servicoPaiId === p.id),
    }));
  }, [services]);

  const concluir = async (destino?: string) => {
    setConcluindo(true);
    try {
      await updateSettings.mutateAsync({ onboarding_concluido_em: new Date().toISOString() });
      setAberto(false);
      if (destino) navigate(destino);
    } catch (e) {
      toast({
        title: 'Não foi possível concluir',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setConcluindo(false);
    }
  };

  const pular = () => {
    if (passo < 2) {
      setPasso(passo + 1);
    } else {
      concluir();
    }
  };

  const salvarValor = async (serviceId: string) => {
    const texto = valores[serviceId];
    if (texto === undefined) return;
    const novo = Number(texto.replace(',', '.'));
    if (isNaN(novo) || novo < 0) return;
    const servico = services.find((s) => s.id === serviceId);
    if (!servico || servico.amount === novo) return;
    const { id, ...rest } = servico;
    updateService(id, { ...rest, amount: novo });
  };

  const salvarReserva = async (ativo: boolean, valor: string) => {
    const numero = Number(valor.replace(',', '.'));
    await updateSettings.mutateAsync({
      caixa_reserva_ativo: ativo,
      caixa_reserva_valor: isNaN(numero) || numero < 0 ? 0 : numero,
    });
  };

  const titulos = ['Sua marca', 'Seus preços', 'Tudo pronto'];
  const descricoes = [
    'Como seu negócio aparece no app, nas fichas e nos PDFs',
    'Já deixamos um catálogo pronto. Ajuste os valores para os seus.',
    'Últimos detalhes para começar',
  ];

  return (
    <Sheet open={aberto} onOpenChange={(o) => { if (!o) concluir(); }}>
      <SheetContent side="bottom" className="max-h-[92vh] rounded-t-3xl flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">{titulos[passo]}</SheetTitle>
            <span className="text-xs text-muted-foreground">Passo {passo + 1} de 3</span>
          </div>
          <SheetDescription className="text-sm">{descricoes[passo]}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {passo === 0 && <MarcaForm onSaved={() => setPasso(1)} />}

          {passo === 1 && (
            <div className="space-y-3">
              {grupos.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum serviço cadastrado ainda. Você pode criar depois em Configurações.
                </p>
              )}
              {grupos.map(({ principal, faixas }) => (
                <div key={principal.id} className="rounded-lg border border-border p-3 space-y-2">
                  <LinhaValor
                    descricao={principal.description}
                    valor={principal.amount}
                    valorEditado={valores[principal.id]}
                    onChange={(v) => setValores((prev) => ({ ...prev, [principal.id]: v }))}
                    onBlur={() => salvarValor(principal.id)}
                  />
                  {faixas.map((f) => (
                    <div key={f.id} className="pl-3 border-l-2 border-border">
                      <LinhaValor
                        descricao={f.description}
                        valor={f.amount}
                        valorEditado={valores[f.id]}
                        onChange={(v) => setValores((prev) => ({ ...prev, [f.id]: v }))}
                        onBlur={() => salvarValor(f.id)}
                      />
                    </div>
                  ))}
                </div>
              ))}
              <Button className="w-full" onClick={() => setPasso(2)}>
                Continuar
              </Button>
            </div>
          )}

          {passo === 2 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">
                    Separar automaticamente um valor de cada atendimento para as contas do negócio?
                  </p>
                  <Switch
                    checked={reservaAtiva}
                    onCheckedChange={(v) => {
                      setReservaAtiva(v);
                      salvarReserva(v, reservaValor);
                    }}
                  />
                </div>
                {reservaAtiva && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={reservaValor}
                      onChange={(e) => setReservaValor(e.target.value)}
                      onBlur={() => salvarReserva(true, reservaValor)}
                      className="w-28"
                    />
                    <span className="text-sm text-muted-foreground">por atendimento</span>
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                onClick={() => concluir('/agendamentos')}
                disabled={concluindo}
              >
                {concluindo ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CalendarPlus className="h-4 w-4 mr-2" />
                )}
                Criar meu primeiro agendamento
              </Button>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border bg-muted/30">
          <Button variant="ghost" className="w-full" onClick={pular} disabled={concluindo}>
            {passo < 2 ? 'Pular este passo' : 'Pular e começar a usar'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LinhaValor({
  descricao,
  valor,
  valorEditado,
  onChange,
  onBlur,
}: {
  descricao: string;
  valor: number;
  valorEditado?: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm truncate flex-1">{descricao}</span>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs text-muted-foreground">R$</span>
        <Input
          type="number"
          min="0"
          step="0.01"
          className="w-24 h-8 text-right"
          value={valorEditado ?? String(valor)}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      </div>
    </div>
  );
}
