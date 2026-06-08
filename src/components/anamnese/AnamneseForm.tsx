import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SignaturePad } from './SignaturePad';
import { useAnamneseResponseDetail, saveAnswersAndSign, AnamneseQuestion } from '@/hooks/useAnamnese';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

interface Props {
  responseId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function AnamneseForm({ responseId, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useAnamneseResponseDetail(responseId ?? undefined);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useMemo(() => {
    if (data?.answers) {
      const map: Record<string, unknown> = {};
      data.answers.forEach((a) => { map[a.question_id] = a.value; });
      setAnswers(map);
    }
    if (data?.response.signature_data) setSignature(data.response.signature_data);
  }, [data?.response.id]); // eslint-disable-line

  const sections = useMemo(() => {
    const map = new Map<string, AnamneseQuestion[]>();
    (data?.questions ?? []).forEach((q) => {
      if (!map.has(q.section)) map.set(q.section, []);
      map.get(q.section)!.push(q);
    });
    return Array.from(map.entries());
  }, [data?.questions]);

  const isLocked = data?.response.status === 'assinada';

  const setAns = (qid: string, v: unknown) => setAnswers((p) => ({ ...p, [qid]: v }));

  const validate = (): string | null => {
    for (const q of data?.questions ?? []) {
      if (!q.required) continue;
      const v = answers[q.id];
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
        return `Responda: ${q.label}`;
      }
    }
    return null;
  };

  const save = async (withSignature: boolean) => {
    if (!responseId || !user) return;
    const err = validate();
    if (err) { toast({ title: 'Campos obrigatórios', description: err, variant: 'destructive' }); return; }
    if (withSignature && !signature) {
      toast({ title: 'Assinatura necessária', description: 'Solicite a assinatura da cliente.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await saveAnswersAndSign({
        responseId, userId: user.id, answers,
        signature: withSignature ? signature : null,
      });
      toast({ title: withSignature ? 'Anamnese assinada' : 'Rascunho salvo' });
      qc.invalidateQueries({ queryKey: ['anamnese_responses'] });
      qc.invalidateQueries({ queryKey: ['anamnese_response_detail'] });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {data?.template?.name ?? 'Anamnese'}
            {data?.version && <span className="text-xs text-muted-foreground ml-2">v{data.version.version}</span>}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-2">
              {sections.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Este modelo ainda não tem perguntas.
                </p>
              )}
              {sections.map(([section, qs]) => (
                <section key={section} className="space-y-3">
                  <h3 className="font-semibold text-primary border-b border-border pb-1">{section}</h3>
                  {qs.map((q) => (
                    <QuestionField
                      key={q.id} q={q}
                      value={answers[q.id]} onChange={(v) => setAns(q.id, v)}
                      disabled={isLocked}
                    />
                  ))}
                </section>
              ))}

              <section className="space-y-2 pt-2 border-t border-border">
                <Label className="font-semibold">Assinatura digital da cliente</Label>
                <SignaturePad value={signature} onChange={setSignature} disabled={isLocked} />
              </section>
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {isLocked ? 'Fechar' : 'Cancelar'}
          </Button>
          {!isLocked && (
            <>
              <Button variant="secondary" onClick={() => save(false)} disabled={submitting}>
                Salvar rascunho
              </Button>
              <Button onClick={() => save(true)} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Assinar e concluir
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuestionField({
  q, value, onChange, disabled,
}: { q: AnamneseQuestion; value: unknown; onChange: (v: unknown) => void; disabled?: boolean }) {
  const label = (
    <Label className="text-sm">
      {q.label}{q.required && <span className="text-destructive ml-1">*</span>}
    </Label>
  );

  switch (q.type) {
    case 'texto_curto':
      return <div className="space-y-1">{label}<Input value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} /></div>;
    case 'texto_longo':
      return <div className="space-y-1">{label}<Textarea value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} /></div>;
    case 'numero':
      return <div className="space-y-1">{label}<Input type="number" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} /></div>;
    case 'data':
      return <div className="space-y-1">{label}<Input type="date" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} /></div>;
    case 'sim_nao':
      return (
        <div className="space-y-1">{label}
          <RadioGroup value={(value as string) ?? ''} onValueChange={onChange} className="flex gap-4" disabled={disabled}>
            <div className="flex items-center gap-2"><RadioGroupItem value="sim" id={`${q.id}-sim`} /><Label htmlFor={`${q.id}-sim`}>Sim</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="nao" id={`${q.id}-nao`} /><Label htmlFor={`${q.id}-nao`}>Não</Label></div>
          </RadioGroup>
        </div>
      );
    case 'selecao_unica':
      return (
        <div className="space-y-1">{label}
          <RadioGroup value={(value as string) ?? ''} onValueChange={onChange} className="space-y-1" disabled={disabled}>
            {(q.options ?? []).map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                <Label htmlFor={`${q.id}-${opt}`}>{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );
    case 'multipla_escolha': {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (opt: string, checked: boolean) =>
        onChange(checked ? [...arr, opt] : arr.filter((x) => x !== opt));
      return (
        <div className="space-y-1">{label}
          <div className="space-y-1">
            {(q.options ?? []).map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox checked={arr.includes(opt)} onCheckedChange={(c) => toggle(opt, !!c)} disabled={disabled} id={`${q.id}-${opt}`} />
                <Label htmlFor={`${q.id}-${opt}`}>{opt}</Label>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <Checkbox checked={!!value} onCheckedChange={(c) => onChange(!!c)} disabled={disabled} id={q.id} />
          <Label htmlFor={q.id} className="text-sm">{q.label}{q.required && <span className="text-destructive ml-1">*</span>}</Label>
        </div>
      );
  }
}
