import { useState } from 'react';
import { useAnamneseTemplates, AnamneseQuestionType, AnamneseQuestion } from '@/hooks/useAnamnese';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, FileText, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { seedDefaultLashLiftingTemplate } from '@/lib/anamneseSeeds';
import { useAuth } from '@/contexts/AuthContext';

const TYPE_LABELS: Record<AnamneseQuestionType, string> = {
  texto_curto: 'Texto Curto',
  texto_longo: 'Texto Longo',
  sim_nao: 'Sim / Não',
  multipla_escolha: 'Múltipla Escolha',
  selecao_unica: 'Seleção Única',
  data: 'Data',
  numero: 'Número',
  checkbox: 'Checkbox',
};

export function AnamneseTemplatesSettings() {
  const { user } = useAuth();
  const { templates, versions, questions, createTemplate, updateTemplate, deleteTemplate, upsertQuestion, deleteQuestion } = useAnamneseTemplates();
  const { toast } = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [tplForm, setTplForm] = useState({ open: false, id: '' as string | null, name: '', description: '' });
  const [qForm, setQForm] = useState<{
    open: boolean; id?: string; template_id: string;
    section: string; label: string; type: AnamneseQuestionType;
    options: string; required: boolean;
  }>({ open: false, template_id: '', section: 'Geral', label: '', type: 'texto_curto', options: '', required: false });

  const openTplCreate = () => setTplForm({ open: true, id: null, name: '', description: '' });
  const openTplEdit = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setTplForm({ open: true, id: t.id, name: t.name, description: t.description ?? '' });
  };

  const saveTpl = async () => {
    if (!tplForm.name.trim()) return;
    if (tplForm.id) {
      await updateTemplate.mutateAsync({ id: tplForm.id, name: tplForm.name, description: tplForm.description || null });
    } else {
      await createTemplate.mutateAsync({ name: tplForm.name, description: tplForm.description });
    }
    setTplForm({ ...tplForm, open: false });
  };

  const openQCreate = (templateId: string) => setQForm({
    open: true, template_id: templateId, section: 'Geral', label: '',
    type: 'texto_curto', options: '', required: false,
  });
  const openQEdit = (q: AnamneseQuestion, templateId: string) => setQForm({
    open: true, id: q.id, template_id: templateId, section: q.section, label: q.label,
    type: q.type, options: (q.options ?? []).join('\n'), required: q.required,
  });

  const saveQ = async () => {
    if (!qForm.label.trim()) return;
    const needsOpts = qForm.type === 'multipla_escolha' || qForm.type === 'selecao_unica';
    const opts = needsOpts ? qForm.options.split('\n').map((s) => s.trim()).filter(Boolean) : [];
    await upsertQuestion.mutateAsync({
      id: qForm.id, template_id: qForm.template_id,
      section: qForm.section || 'Geral', label: qForm.label, type: qForm.type,
      options: opts, required: qForm.required,
      order_index: Date.now() % 100000,
    });
    setQForm({ ...qForm, open: false });
  };

  const seed = async () => {
    if (!user) return;
    try {
      await seedDefaultLashLiftingTemplate(user.id);
      toast({ title: 'Modelo Lash Lifting criado' });
      window.location.reload();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Crie modelos personalizados de anamnese. Modelos já usados em anamneses assinadas geram nova versão ao editar.
        </p>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button size="sm" variant="outline" onClick={seed}>
              Importar modelo Lash Lifting
            </Button>
          )}
          <Button size="sm" onClick={openTplCreate}>
            <Plus className="w-4 h-4 mr-1" /> Novo modelo
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Nenhum modelo cadastrado
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => {
            const tplVersions = versions.filter((v) => v.template_id === t.id);
            const current = tplVersions.find((v) => v.is_current);
            const tplQuestions = current ? questions.filter((q) => q.version_id === current.id) : [];
            const sections = Array.from(new Set(tplQuestions.map((q) => q.section)));
            const isOpen = editing === t.id;
            return (
              <div key={t.id} className="rounded-lg border border-border bg-card">
                <div className="p-3 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    className="flex items-center gap-2 min-w-0 text-left flex-1"
                    onClick={() => setEditing(isOpen ? null : t.id)}
                  >
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        v{current?.version ?? 1} · {tplQuestions.length} perguntas · {t.active ? 'Ativo' : 'Inativo'}
                        {current?.locked && <span className="inline-flex items-center gap-1 ml-2"><Lock className="w-3 h-3" /> bloqueada</span>}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <Switch checked={t.active} onCheckedChange={(c) => updateTemplate.mutate({ id: t.id, active: c })} />
                    <Button size="icon" variant="ghost" onClick={() => openTplEdit(t.id)}><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => {
                      if (confirm(`Excluir o modelo "${t.name}"?`)) deleteTemplate.mutate(t.id);
                    }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-border p-3 space-y-3">
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => openQCreate(t.id)}>
                        <Plus className="w-4 h-4 mr-1" /> Adicionar pergunta
                      </Button>
                    </div>
                    {tplQuestions.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">Sem perguntas neste modelo.</p>
                    ) : (
                      sections.map((sec) => (
                        <div key={sec} className="space-y-1">
                          <p className="text-xs font-semibold text-primary uppercase">{sec}</p>
                          {tplQuestions.filter((q) => q.section === sec).map((q) => (
                            <div key={q.id} className="flex items-center justify-between gap-2 p-2 rounded bg-muted/40">
                              <div className="min-w-0">
                                <p className="text-sm truncate">{q.label}{q.required && <span className="text-destructive ml-1">*</span>}</p>
                                <p className="text-xs text-muted-foreground">{TYPE_LABELS[q.type]}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={() => openQEdit(q, t.id)}><Edit className="w-4 h-4" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => {
                                  if (confirm('Excluir pergunta?')) deleteQuestion.mutate({ id: q.id, template_id: t.id });
                                }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Template Form */}
      <Dialog open={tplForm.open} onOpenChange={(o) => setTplForm({ ...tplForm, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{tplForm.id ? 'Editar modelo' : 'Novo modelo'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={tplForm.name} onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })} placeholder="Ex: Anamnese Lash Lifting" /></div>
            <div><Label>Descrição</Label><Textarea value={tplForm.description} onChange={(e) => setTplForm({ ...tplForm, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTplForm({ ...tplForm, open: false })}>Cancelar</Button>
            <Button onClick={saveTpl}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Form */}
      <Dialog open={qForm.open} onOpenChange={(o) => setQForm({ ...qForm, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{qForm.id ? 'Editar pergunta' : 'Nova pergunta'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Seção</Label><Input value={qForm.section} onChange={(e) => setQForm({ ...qForm, section: e.target.value })} placeholder="Ex: Alergias" /></div>
            <div><Label>Pergunta</Label><Input value={qForm.label} onChange={(e) => setQForm({ ...qForm, label: e.target.value })} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={qForm.type} onValueChange={(v) => setQForm({ ...qForm, type: v as AnamneseQuestionType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABELS) as AnamneseQuestionType[]).map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(qForm.type === 'multipla_escolha' || qForm.type === 'selecao_unica') && (
              <div>
                <Label>Opções (uma por linha)</Label>
                <Textarea value={qForm.options} onChange={(e) => setQForm({ ...qForm, options: e.target.value })} placeholder={'Opção 1\nOpção 2'} />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={qForm.required} onCheckedChange={(c) => setQForm({ ...qForm, required: c })} />
              <Label>Obrigatória</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQForm({ ...qForm, open: false })}>Cancelar</Button>
            <Button onClick={saveQ}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
