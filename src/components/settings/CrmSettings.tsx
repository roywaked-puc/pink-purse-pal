import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings';
import { toast } from 'sonner';

export function CrmSettings() {
  const { data: settings, isLoading } = useUserSettings();
  const { mutateAsync, isPending } = useUpdateUserSettings();

  const [inactiveDays, setInactiveDays] = useState(45);
  const [confirmDays, setConfirmDays] = useState(3);
  const [vipCount, setVipCount] = useState(10);

  useEffect(() => {
    if (settings) {
      setInactiveDays(settings.crm_inactive_days);
      setConfirmDays(settings.crm_confirm_days);
      setVipCount(settings.crm_vip_count);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await mutateAsync({
        crm_inactive_days: inactiveDays,
        crm_confirm_days: confirmDays,
        crm_vip_count: vipCount,
      });
      toast.success('Configurações do CRM salvas');
    } catch (e: any) {
      toast.error('Erro ao salvar', { description: e?.message });
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

      <Button onClick={handleSave} disabled={isPending} className="w-full">
        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Salvar configurações
      </Button>
    </div>
  );
}
