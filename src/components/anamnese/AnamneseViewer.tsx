import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, Loader2 } from 'lucide-react';
import { useAnamneseResponseDetail } from '@/hooks/useAnamnese';
import { useApp } from '@/contexts/AppContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useLogoUrl } from '@/hooks/useMarca';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';
import { montarDocumentoAnamnese, rotuloRespostaAnamnese as labelForValue } from '@/lib/anamneseImpressao';

interface Props {
  responseId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function AnamneseViewer({ responseId, open, onOpenChange }: Props) {
  const { data, isLoading } = useAnamneseResponseDetail(responseId ?? undefined);
  const { getClientById } = useApp();
  const { data: settings } = useUserSettings();
  const logoUrl = useLogoUrl();
  const client = data ? getClientById(data.response.client_id) : null;
  const temMarca = !!(settings?.nome_negocio || logoUrl);

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
    if (!data) return;
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.write(montarDocumentoAnamnese({
      nomeModelo: data.template.name,
      versao: data.version.version,
      nomeCliente: client?.name ?? null,
      status: data.response.status,
      signedAt: data.response.signed_at,
      signatureData: data.response.signature_data,
      perguntas: data.questions,
      respostas: answerMap,
      nomeNegocio: settings?.nome_negocio ?? null,
      logoSrc: logoUrl,
    }));
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
              {temMarca && (
                <div className="marca">
                  {logoUrl && <img src={logoUrl} alt="Logo do negócio" />}
                  {settings?.nome_negocio && <span className="nome">{settings.nome_negocio}</span>}
                </div>
              )}
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
