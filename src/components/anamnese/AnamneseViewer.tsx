import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, Loader2 } from 'lucide-react';
import { useAnamneseResponseDetail } from '@/hooks/useAnamnese';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';

interface Props {
  responseId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const labelForValue = (type: string, v: unknown): string => {
  if (v === undefined || v === null || v === '') return '—';
  if (Array.isArray(v)) return v.join(', ') || '—';
  if (type === 'checkbox') return v ? 'Sim' : 'Não';
  if (type === 'sim_nao') return v === 'sim' ? 'Sim' : v === 'nao' ? 'Não' : String(v);
  return String(v);
};

export function AnamneseViewer({ responseId, open, onOpenChange }: Props) {
  const { data, isLoading } = useAnamneseResponseDetail(responseId ?? undefined);
  const { getClientById } = useApp();
  const client = data ? getClientById(data.response.client_id) : null;

  const sections = useMemo(() => {
    const map = new Map<string, typeof data.questions>();
    (data?.questions ?? []).forEach((q) => {
      if (!map.has(q.section)) map.set(q.section, [] as any);
      map.get(q.section)!.push(q);
    });
    return Array.from(map.entries());
  }, [data?.questions]);

  const answerMap = useMemo(() => {
    const m: Record<string, unknown> = {};
    data?.answers.forEach((a) => { m[a.question_id] = a.value; });
    return m;
  }, [data?.answers]);

  const handlePrint = () => {
    const el = document.getElementById('anamnese-print-area');
    if (!el) return;
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Anamnese</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 32px; color: #111; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        h2 { font-size: 14px; margin: 16px 0 6px; padding-bottom: 4px; border-bottom: 1px solid #ddd; color: #b8336a; }
        p { margin: 4px 0; font-size: 13px; }
        .q { margin-bottom: 6px; }
        .lbl { font-weight: 600; }
        .meta { color: #666; font-size: 12px; }
        img { max-width: 320px; border: 1px solid #ddd; }
        @media print { body { padding: 0; } }
      </style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {isLoading || !data ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4 mr-1" /> Fechar
              </Button>
              <Button size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-1" /> Imprimir / PDF
              </Button>
            </div>

            <div id="anamnese-print-area">
              <h1>{data.template.name}</h1>
              <p className="meta">
                Cliente: <strong>{client?.name ?? '—'}</strong> · Versão {data.version.version} ·{' '}
                {data.response.signed_at
                  ? `Assinada em ${format(new Date(data.response.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                  : `Status: ${data.response.status}`}
              </p>

              {sections.map(([section, qs]) => (
                <div key={section}>
                  <h2>{section}</h2>
                  {qs.map((q) => (
                    <div key={q.id} className="q">
                      <p><span className="lbl">{q.label}:</span> {labelForValue(q.type, answerMap[q.id])}</p>
                    </div>
                  ))}
                </div>
              ))}

              {data.response.signature_data && (
                <>
                  <h2>Assinatura</h2>
                  <img src={data.response.signature_data} alt="Assinatura" />
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
