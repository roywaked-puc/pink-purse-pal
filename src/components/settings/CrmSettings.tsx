import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings';
import { toast } from 'sonner';
import { MensagemConfirmacaoSettings } from './MensagemConfirmacaoSettings';
import { TEMPLATE_CONFIRMACAO_PADRAO } from '@/lib/whatsapp';
import { politicaCancelamentoSchema } from '@/lib/lembretesConfirmacao';

export function CrmSettings() {
  const { data: settings, isLoading } = useUserSettings();
  const { mutateAsync, isPending } = useUpdateUserSettings();

  const [inactiveDays, setInactiveDays] = useState(45);
  const [confirmDays, setConfirmDays] = useState(3);
  const [vipCount, setVipCount] = useState(10);
  const [monthlyGoal, setMonthlyGoal] = useState(0);
  const [textoConfirmacao, setTextoConfirmacao] = useState(TEMPLATE_CONFIRMACAO_PADRAO);
  const [horasAviso, setHorasAviso] = useState(48);
  const [taxaCancelamento, setTaxaCancelamento] = useState(50);

  useEffect(() => {
    if (settings) {
      setInactiveDays(settings.crm_inactive_days);
      setConfirmDays(settings.crm_confirm_days);
      setVipCount(settings.crm_vip_count);
      setMonthlyGoal(settings.crm_monthly_goal ?? 0);
      setTextoConfirmacao(settings.confirm_message_template?.trim() ? settings.confirm_message_template : TEMPLATE_CONFIRMACAO_PADRAO);
      setHorasAviso(settings.cancellation_notice_hours);
      setTaxaCancelamento(settings.cancellation_fee);
    }
  }, [settings]);

  const handleSave = async () => {
    const politica = politicaCancelamentoSchema.safeParse({ cancellation_notice_hours: horasAviso, cancellation_fee: taxaCancelamento });
    if (!politica.success) {
      toast.error(politica.error.issues[0]?.message ?? 'Revise a política de cancelamento');
      return;
    }
    try {
      await mutateAsync({
        crm_inactive_days: inactiveDays,
        crm_confirm_days: confirmDays,
        crm_vip_count: vipCount,
        crm_monthly_goal: monthlyGoal,
        confirm_message_template: textoConfirmacao.trim() ? textoConfirmacao : null,
        ...politica.data,
      });
      toast.success('Configurações do CRM salvas');
    } catch (e) {
      toast.error('Erro ao salvar', { description: e instanceof Error ? e.message : undefined });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 py-2">
      <div className="space-y-2">
        <Label htmlFor="inactiveDays">Dias para considerar cliente inativa</Label>
        <Input
          id="inactiveDays"
          type="number"
          min={1}
          value={inactiveDays}
          onChange={(e) => setInactiveDays(parseInt(e.target.value, 10) || 0)}
          className="max-w-[140px]"
        />
        <p className="text-xs text-muted-foreground">
          Padrão 45. Clientes sem atendimento há mais que isso aparecem em "Inativas".
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmDays">Dias antes para confirmação de agenda</Label>
        <Input
          id="confirmDays"
          type="number"
          min={1}
          max={30}
          value={confirmDays}
          onChange={(e) => setConfirmDays(parseInt(e.target.value, 10) || 0)}
          className="max-w-[140px]"
        />
        <p className="text-xs text-muted-foreground">
          Padrão 3. Mostra agendamentos pendentes dentro desse período.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vipCount">Quantidade de clientes VIP</Label>
        <Input
          id="vipCount"
          type="number"
          min={1}
          max={50}
          value={vipCount}
          onChange={(e) => setVipCount(parseInt(e.target.value, 10) || 0)}
          className="max-w-[140px]"
        />
        <p className="text-xs text-muted-foreground">
          Padrão 10. Top clientes por faturamento e frequência.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="monthlyGoal">Meta mensal de faturamento (R$)</Label>
        <Input
          id="monthlyGoal"
          type="number"
          min={0}
          step="0.01"
          value={monthlyGoal}
          onChange={(e) => setMonthlyGoal(parseFloat(e.target.value) || 0)}
          className="max-w-[180px]"
        />
        <p className="text-xs text-muted-foreground">
          Define a meta usada no card "Produção do Mês". Deixe 0 para ocultar a barra de progresso.
        </p>
      </div>


      <MensagemConfirmacaoSettings texto={textoConfirmacao} horas={horasAviso} taxa={taxaCancelamento} dias={confirmDays}
        onTexto={setTextoConfirmacao} onHoras={setHorasAviso} onTaxa={setTaxaCancelamento} />
      <Button onClick={handleSave} disabled={isPending} className="w-full">
        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Salvar configurações
      </Button>
    </div>
  );
}
