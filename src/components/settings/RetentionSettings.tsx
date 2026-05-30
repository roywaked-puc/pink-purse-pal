import { useEffect, useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserSettings, useUpdateUserSettings, retentionDefaults } from '@/hooks/useUserSettings';
import { toast } from 'sonner';

export function RetentionSettings() {
  const { data: settings, isLoading } = useUserSettings();
  const { mutateAsync, isPending } = useUpdateUserSettings();
  const defaults = retentionDefaults();

  const [intervals, setIntervals] = useState<number[]>(defaults.retention_intervals);
  const [newInterval, setNewInterval] = useState('');
  const [reminderDays, setReminderDays] = useState(defaults.retention_reminder_days);
  const [colorPrevisto, setColorPrevisto] = useState(defaults.retention_color_previsto);
  const [colorAguardando, setColorAguardando] = useState(defaults.retention_color_aguardando);
  const [colorConfirmado, setColorConfirmado] = useState(defaults.retention_color_confirmado);

  useEffect(() => {
    if (settings) {
      setIntervals(settings.retention_intervals);
      setReminderDays(settings.retention_reminder_days);
      setColorPrevisto(settings.retention_color_previsto);
      setColorAguardando(settings.retention_color_aguardando);
      setColorConfirmado(settings.retention_color_confirmado);
    }
  }, [settings]);

  const addInterval = () => {
    const n = parseInt(newInterval, 10);
    if (!n || n < 1) return;
    if (intervals.includes(n)) {
      setNewInterval('');
      return;
    }
    setIntervals([...intervals, n].sort((a, b) => a - b));
    setNewInterval('');
  };

  const removeInterval = (n: number) => {
    setIntervals(intervals.filter((i) => i !== n));
  };

  const handleSave = async () => {
    try {
      await mutateAsync({
        retention_intervals: intervals,
        retention_reminder_days: reminderDays,
        retention_color_previsto: colorPrevisto,
        retention_color_aguardando: colorAguardando,
        retention_color_confirmado: colorConfirmado,
      });
      toast.success('Configurações de retenção salvas');
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
        <Label>Intervalos sugeridos (dias)</Label>
        <div className="flex flex-wrap gap-2">
          {intervals.map((n) => (
            <span
              key={n}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-sm"
            >
              {n} dias
              <button
                type="button"
                onClick={() => removeInterval(n)}
                className="hover:bg-primary/20 rounded-full p-0.5"
                aria-label={`Remover ${n} dias`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            placeholder="Ex: 15"
            value={newInterval}
            onChange={(e) => setNewInterval(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addInterval();
              }
            }}
            className="max-w-[120px]"
          />
          <Button type="button" variant="outline" size="sm" onClick={addInterval}>
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reminderDays">Dias antes para lembrar da confirmação</Label>
        <Input
          id="reminderDays"
          type="number"
          min={0}
          max={30}
          value={reminderDays}
          onChange={(e) => setReminderDays(parseInt(e.target.value, 10) || 0)}
          className="max-w-[120px]"
        />
      </div>

      <div className="space-y-3">
        <Label>Cores dos agendamentos de retorno</Label>
        <ColorPicker label="Retorno previsto" value={colorPrevisto} onChange={setColorPrevisto} />
        <ColorPicker
          label="Aguardando confirmação"
          value={colorAguardando}
          onChange={setColorAguardando}
        />
        <ColorPicker label="Retorno confirmado" value={colorConfirmado} onChange={setColorConfirmado} />
      </div>

      <Button onClick={handleSave} disabled={isPending} className="w-full">
        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Salvar configurações
      </Button>
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded border border-border cursor-pointer bg-transparent"
        />
        <span className="text-xs text-muted-foreground font-mono">{value}</span>
      </div>
    </div>
  );
}
