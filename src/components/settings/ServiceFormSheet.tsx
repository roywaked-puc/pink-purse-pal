import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { Pencil, Plus, X } from 'lucide-react';
import { FormSheet } from '@/components/ds/FormSheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useSaveServiceWithFaixas, FaixaDraft } from '@/hooks/useServices';
import { calcularFaixas, getFaixasDoServico } from '@/lib/serviceFaixas';
import { cn } from '@/lib/utils';
import type { Service } from '@/types';

export const SERVICE_COLORS = [
  { name: 'Tomate', value: '#D50000' },
  { name: 'Flamingo', value: '#E67C73' },
  { name: 'Tangerina', value: '#F4511E' },
  { name: 'Banana', value: '#F6BF26' },
  { name: 'Salvia', value: '#33B679' },
  { name: 'Manjericão', value: '#0B8043' },
  { name: 'Pavão', value: '#039BE5' },
  { name: 'Mirtilo', value: '#3F51B5' },
  { name: 'Lavanda', value: '#7986CB' },
  { name: 'Uva', value: '#8E24AA' },
  { name: 'Grafite', value: '#616161' },
];

export const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type LocalFaixa = FaixaDraft & { key: string };

const serviceSchema = z
  .object({
    description: z.string().trim().min(1, 'Informe o nome do serviço'),
    faixas: z.array(z.object({ ate: z.number().int().positive('Até deve ser maior que zero') })),
  })
  .superRefine((val, ctx) => {
    const dias = val.faixas.map(f => f.ate);
    if (new Set(dias).size !== dias.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Há faixas com dias repetidos' });
    }
  });

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  service: Service | null;
  services: Service[];
}

let keySeq = 0;
const newKey = () => `k${++keySeq}`;

export function ServiceFormSheet({ open, onOpenChange, service, services }: Props) {
  const { toast } = useToast();
  const save = useSaveServiceWithFaixas();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState<string | undefined>();
  const [possui, setPossui] = useState(false);
  const [faixas, setFaixas] = useState<LocalFaixa[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [tab, setTab] = useState('dados');
  const [confirmOff, setConfirmOff] = useState(false);

  // Sub-sheet de faixa
  const [faixaOpen, setFaixaOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [fAte, setFAte] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fDuration, setFDuration] = useState('60');
  const [confirmRemoveFaixa, setConfirmRemoveFaixa] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(service?.description ?? '');
    setAmount(service ? String(service.amount) : '');
    setDuration(service ? String(service.duration) : '60');
    setNotes(service?.notes ?? '');
    setColor(service?.color);
    setTab('dados');
    setRemoved([]);
    const existing = service ? getFaixasDoServico(service.id, services) : [];
    setFaixas(existing.map(f => ({ id: f.id, ate: f.ate, ateOriginal: f.ate, amount: f.amount, duration: f.duration, key: newKey() })));
    setPossui(service ? !!service.possuiManutencao || existing.length > 0 : false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, service?.id]);

  const calc = useMemo(() => calcularFaixas(faixas), [faixas]);
  const lastAte = calc.length ? calc[calc.length - 1].ate : 0;

  // ---- Faixa editor ----
  const editingIdx = editingKey ? calc.findIndex(f => f.key === editingKey) : -1;
  const faixaDe = editingIdx >= 0 ? calc[editingIdx].de : lastAte + 1;
  const nextFaixa = editingIdx >= 0 ? calc[editingIdx + 1] : undefined;
  const fAteNum = parseInt(fAte, 10);
  const ateError = !fAte
    ? 'Informe até quantos dias'
    : !(fAteNum > faixaDe - 1) || fAteNum < faixaDe
      ? `Até precisa ser maior ou igual a ${faixaDe}`
      : nextFaixa && fAteNum >= nextFaixa.ate
        ? `Não pode passar de ${nextFaixa.ate - 1} (fim da faixa seguinte é ${nextFaixa.ate})`
        : calc.some(f => f.key !== editingKey && f.ate === fAteNum)
          ? 'Já existe uma faixa terminando nesse dia'
          : null;

  const openNewFaixa = () => {
    setEditingKey(null);
    setFAte('');
    setFAmount(amount || '');
    setFDuration(duration || '60');
    setFaixaOpen(true);
  };
  const openEditFaixa = (f: LocalFaixa) => {
    setEditingKey(f.key);
    setFAte(String(f.ate));
    setFAmount(String(f.amount));
    setFDuration(String(f.duration));
    setFaixaOpen(true);
  };
  const saveFaixa = () => {
    if (ateError) return;
    const data = { ate: fAteNum, amount: parseFloat(fAmount) || 0, duration: parseInt(fDuration) || 60 };
    if (editingKey) setFaixas(prev => prev.map(f => (f.key === editingKey ? { ...f, ...data } : f)));
    else setFaixas(prev => [...prev, { ...data, key: newKey() }]);
    setFaixaOpen(false);
  };
  const removeFaixa = () => {
    const f = faixas.find(x => x.key === editingKey);
    if (f?.id) setRemoved(r => [...r, f.id!]);
    setFaixas(prev => prev.filter(x => x.key !== editingKey));
    setConfirmRemoveFaixa(false);
    setFaixaOpen(false);
  };

  const togglePossui = (v: boolean) => {
    if (!v && faixas.length > 0) { setConfirmOff(true); return; }
    setPossui(v);
    if (!v) setTab('dados');
  };

  const handleSave = async () => {
    const parsed = serviceSchema.safeParse({ description: name, faixas: possui ? faixas : [] });
    if (!parsed.success) {
      toast({ title: 'Verifique os dados', description: parsed.error.issues[0].message, variant: 'destructive' });
      return;
    }
    try {
      await save.mutateAsync({
        id: service?.id,
        description: name.trim(),
        amount: parseFloat(amount) || 0,
        duration: parseInt(duration) || 60,
        notes: notes.trim() || undefined,
        color,
        possuiManutencao: possui,
        techniqueName: service?.techniqueName,
        faixas: possui ? faixas : faixas.filter(f => f.id),
        removeFaixaIds: removed,
      });
      toast({ title: 'Serviço salvo' });
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Não foi possível salvar', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const totalDias = Math.max(lastAte, 1);

  const dados = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="svc-name">Nome</Label>
        <Input id="svc-name" className="h-11" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Volume Brasileiro - Colocação" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="svc-amount">Valor (R$)</Label>
          <Input id="svc-amount" className="h-11" type="number" inputMode="decimal" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="svc-duration">Duração (min)</Label>
          <Input id="svc-duration" className="h-11" type="number" inputMode="numeric" min="15" step="15" value={duration} onChange={e => setDuration(e.target.value)} />
        </div>
      </div>
      <label className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 min-h-11 cursor-pointer">
        <div>
          <p className="font-medium text-sm">Possui manutenção</p>
          <p className="text-xs text-muted-foreground">Ligue se a cliente volta para manutenção com preço por faixa de dias</p>
        </div>
        <Switch checked={possui} onCheckedChange={togglePossui} />
      </label>
      <div className="space-y-1.5">
        <Label htmlFor="svc-notes">Observação</Label>
        <Input id="svc-notes" className="h-11" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" />
      </div>
      <div className="space-y-2">
        <Label>Cor</Label>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-label="Sem cor" onClick={() => setColor(undefined)}
            className={cn('w-11 h-11 rounded-full border-2 flex items-center justify-center', !color ? 'border-primary' : 'border-border')}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          {SERVICE_COLORS.map(c => (
            <button key={c.value} type="button" title={c.name} aria-label={c.name} onClick={() => setColor(c.value)}
              className={cn('w-11 h-11 rounded-full border-2', color === c.value ? 'border-foreground ring-2 ring-offset-2 ring-primary' : 'border-transparent')}
              style={{ backgroundColor: c.value }} />
          ))}
        </div>
      </div>
    </div>
  );

  const manutencoes = calc.length === 0 ? (
    <div className="text-center py-6 space-y-3">
      <p className="font-medium">Nenhuma faixa ainda</p>
      <Button className="h-11" onClick={openNewFaixa}><Plus className="h-4 w-4 mr-1" />Adicionar primeira faixa</Button>
      <div className="text-xs text-muted-foreground space-y-0.5">
        <p>Exemplo:</p>
        <p>1ª · De 1 até 15 dias · R$ 100,00</p>
        <p>2ª · De 16 até 20 dias · R$ 120,00</p>
        <p>3ª · De 21 até 25 dias · R$ 140,00</p>
      </div>
    </div>
  ) : (
    <div className="space-y-4">
      {/* Régua */}
      <div className="space-y-1">
        <div className="flex h-10 w-full overflow-hidden rounded-lg border border-border">
          {calc.map((f, i) => (
            <div key={f.key} style={{ width: `${((f.ate - f.de + 1) / totalDias) * 100}%` }}
              className={cn('flex items-center justify-center text-[11px] font-semibold border-r border-background last:border-r-0 truncate px-1',
                i % 2 === 0 ? 'bg-primary/20 text-primary' : 'bg-primary/40 text-primary-foreground')}>
              {formatBRL(f.amount).replace(',00', '')}
            </div>
          ))}
        </div>
        <div className="relative h-4 text-[10px] text-muted-foreground">
          <span className="absolute left-0">1</span>
          {calc.map(f => (
            <span key={f.key} className="absolute -translate-x-1/2 last:translate-x-[-100%]" style={{ left: `${(f.ate / totalDias) * 100}%` }}>{f.ate}</span>
          ))}
        </div>
      </div>
      {/* Lista */}
      <div className="space-y-2">
        {calc.map((f, i) => (
          <div key={f.key} className="flex items-center gap-2 rounded-lg border border-border p-3">
            <p className="flex-1 text-sm">
              <span className="font-semibold">{i + 1}ª</span> · De {f.de} até {f.ate} dias · <span className="font-semibold text-primary">{formatBRL(f.amount)}</span> · {f.duration} min
            </p>
            <Button size="icon" variant="ghost" className="h-11 w-11" aria-label="Editar faixa" onClick={() => openEditFaixa(f)}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" className="w-full h-11" onClick={openNewFaixa}>
        <Plus className="h-4 w-4 mr-1" />Adicionar faixa (a partir de {lastAte + 1} dias)
      </Button>
    </div>
  );

  const editingOriginal = editingIdx >= 0 ? calc[editingIdx].ate : null;

  return (
    <>
      <FormSheet
        open={open}
        onOpenChange={onOpenChange}
        side="bottom"
        title={service ? 'Editar serviço' : 'Novo serviço'}
        onSubmit={handleSave}
        submitLabel="Salvar serviço"
        submitting={save.isPending}
      >
        {possui ? (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-2 w-full h-11 mb-4">
              <TabsTrigger value="dados" className="h-9">Dados</TabsTrigger>
              <TabsTrigger value="manutencoes" className="h-9">Manutenções ({calc.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="dados">{dados}</TabsContent>
            <TabsContent value="manutencoes">{manutencoes}</TabsContent>
          </Tabs>
        ) : dados}
      </FormSheet>

      <FormSheet
        open={faixaOpen}
        onOpenChange={setFaixaOpen}
        side="bottom"
        size="sm"
        title={editingKey ? 'Editar faixa' : 'Nova faixa'}
        onSubmit={saveFaixa}
        submitLabel="Salvar faixa"
        submitDisabled={!!ateError}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>De (dias)</Label>
              <Input className="h-11" value={faixaDe} disabled readOnly />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="faixa-ate">Até (dias)</Label>
              <Input id="faixa-ate" className="h-11" type="number" inputMode="numeric" min={faixaDe} value={fAte} onChange={e => setFAte(e.target.value)} autoFocus />
            </div>
          </div>
          {fAte && ateError && <p className="text-xs text-destructive">{ateError}</p>}
          {editingKey && nextFaixa && !ateError && fAteNum !== editingOriginal && (
            <p className="text-xs rounded-md bg-muted p-2">A faixa seguinte passa a começar em {fAteNum + 1} dias.</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="faixa-valor">Valor (R$)</Label>
              <Input id="faixa-valor" className="h-11" type="number" inputMode="decimal" step="0.01" min="0" value={fAmount} onChange={e => setFAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="faixa-dur">Duração (min)</Label>
              <Input id="faixa-dur" className="h-11" type="number" inputMode="numeric" min="15" step="15" value={fDuration} onChange={e => setFDuration(e.target.value)} />
            </div>
          </div>
          {!ateError && (
            <p className="text-sm rounded-md bg-primary/10 text-primary p-3">
              Cliente que voltar entre {faixaDe} e {fAteNum} dias paga {formatBRL(parseFloat(fAmount) || 0)}
            </p>
          )}
          {editingKey && (
            <Button variant="ghost" className="w-full h-11 text-destructive hover:text-destructive" onClick={() => setConfirmRemoveFaixa(true)}>
              Remover esta faixa
            </Button>
          )}
        </div>
      </FormSheet>

      <DeleteConfirmDialog
        open={confirmRemoveFaixa}
        onOpenChange={setConfirmRemoveFaixa}
        onConfirm={removeFaixa}
        title="Remover faixa"
        description="A faixa será removida ao salvar o serviço."
      />

      <AlertDialog open={confirmOff} onOpenChange={setConfirmOff}>
        <AlertDialogContent className="max-w-[90%] sm:max-w-md rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Desligar manutenção?</AlertDialogTitle>
            <AlertDialogDescription>
              As {faixas.length} faixas serão removidas ao salvar o serviço.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 mt-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="flex-1" onClick={() => { setPossui(false); setTab('dados'); setConfirmOff(false); }}>
              Desligar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
