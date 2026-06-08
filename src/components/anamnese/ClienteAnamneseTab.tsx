import { useState } from 'react';
import { useAnamneseTemplates, useClientAnamneses } from '@/hooks/useAnamnese';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AnamneseForm } from './AnamneseForm';
import { AnamneseViewer } from './AnamneseViewer';
import { EmptyState } from '@/components/ds/EmptyState';
import { FileText, Plus, Eye, Archive, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const statusLabel: Record<string, { label: string; variant: any }> = {
  pendente: { label: 'Pendente', variant: 'outline' },
  preenchida: { label: 'Preenchida', variant: 'secondary' },
  assinada: { label: 'Assinada ✓', variant: 'default' },
  arquivada: { label: 'Arquivada', variant: 'outline' },
};

export function ClienteAnamneseTab({ clientId }: { clientId: string }) {
  const { templates, versions, questions } = useAnamneseTemplates();
  const { responses, createResponse, archiveResponse } = useClientAnamneses(clientId);
  const { toast } = useToast();
  const [newOpen, setNewOpen] = useState(false);
  const [selectedTpl, setSelectedTpl] = useState<string>('');
  const [editId, setEditId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  const activeTemplates = templates.filter((t) => t.active);
  const signedCount = responses.filter((r) => r.status === 'assinada').length;

  const handleStart = async () => {
    if (!selectedTpl) return;
    try {
      const resp = await createResponse.mutateAsync({ template_id: selectedTpl });
      setNewOpen(false);
      setSelectedTpl('');
      setEditId(resp.id);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="font-semibold">Anamneses</h2>
          <p className="text-xs text-muted-foreground">Prontuário digital da cliente</p>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)} disabled={activeTemplates.length === 0}>
          <Plus className="w-4 h-4 mr-1" /> Nova Anamnese
        </Button>
      </div>

      {signedCount === 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Cliente sem anamnese assinada. Preencha para registro clínico.</span>
        </div>
      )}

      {activeTemplates.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Crie um modelo em Configurações → Modelos de Anamnese antes de iniciar.
        </p>
      )}

      {responses.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma anamnese ainda"
          description="As anamneses preenchidas e assinadas aparecerão aqui."
        />
      ) : (
        <div className="space-y-2">
          {responses.map((r) => {
            const tpl = templates.find((t) => t.id === r.template_id);
            const ver = versions.find((v) => v.id === r.version_id);
            const s = statusLabel[r.status];
            return (
              <div key={r.id} className="p-3 rounded-lg bg-card border border-border flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{tpl?.name ?? 'Modelo removido'}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(r.signed_at ?? r.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {ver && ` · v${ver.version}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.variant}>{s.label}</Badge>
                  {r.status !== 'assinada' && r.status !== 'arquivada' && (
                    <Button size="sm" variant="outline" onClick={() => setEditId(r.id)}>
                      Continuar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setViewId(r.id)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  {r.status !== 'arquivada' && (
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => {
                        if (confirm('Arquivar esta anamnese?')) archiveResponse.mutate(r.id);
                      }}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New anamnese — pick template */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Anamnese</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Modelo</label>
            <Select value={selectedTpl} onValueChange={setSelectedTpl}>
              <SelectTrigger><SelectValue placeholder="Escolha um modelo" /></SelectTrigger>
              <SelectContent>
                {activeTemplates.map((t) => {
                  const ver = versions.find((v) => v.template_id === t.id && v.is_current);
                  const qCount = ver ? questions.filter((q) => q.version_id === ver.id).length : 0;
                  return (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {ver && `(v${ver.version}, ${qCount} perguntas)`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
            <Button onClick={handleStart} disabled={!selectedTpl || createResponse.isPending}>
              Iniciar preenchimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnamneseForm responseId={editId} open={!!editId} onOpenChange={(o) => !o && setEditId(null)} />
      <AnamneseViewer responseId={viewId} open={!!viewId} onOpenChange={(o) => !o && setViewId(null)} />
    </div>
  );
}
