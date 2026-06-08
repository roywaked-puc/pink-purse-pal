import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type AnamneseQuestionType =
  | 'texto_curto' | 'texto_longo' | 'sim_nao' | 'multipla_escolha'
  | 'selecao_unica' | 'data' | 'numero' | 'checkbox';

export type AnamneseResponseStatus = 'pendente' | 'preenchida' | 'assinada' | 'arquivada';

export interface AnamneseQuestion {
  id: string;
  version_id: string;
  section: string;
  label: string;
  type: AnamneseQuestionType;
  options: string[];
  required: boolean;
  order_index: number;
}

export interface AnamneseTemplate {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

export interface AnamneseVersion {
  id: string;
  template_id: string;
  version: number;
  is_current: boolean;
  locked: boolean;
}

export interface AnamneseResponse {
  id: string;
  client_id: string;
  template_id: string;
  version_id: string;
  status: AnamneseResponseStatus;
  filled_at: string | null;
  signed_at: string | null;
  signature_data: string | null;
  pdf_path: string | null;
  share_token: string;
  created_at: string;
}

export interface AnamneseAnswer {
  id: string;
  response_id: string;
  question_id: string;
  value: unknown;
}

export function useAnamneseTemplates() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const templatesQ = useQuery({
    queryKey: ['anamnese_templates', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anamnese_templates')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as AnamneseTemplate[];
    },
  });

  const versionsQ = useQuery({
    queryKey: ['anamnese_versions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anamnese_template_versions')
        .select('*')
        .order('version', { ascending: true });
      if (error) throw error;
      return data as AnamneseVersion[];
    },
  });

  const questionsQ = useQuery({
    queryKey: ['anamnese_questions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anamnese_questions')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      return (data || []).map((q: any) => ({ ...q, options: q.options || [] })) as AnamneseQuestion[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['anamnese_templates'] });
    qc.invalidateQueries({ queryKey: ['anamnese_versions'] });
    qc.invalidateQueries({ queryKey: ['anamnese_questions'] });
  };

  const createTemplate = useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      if (!user) throw new Error('not authed');
      const { data: tpl, error } = await supabase
        .from('anamnese_templates')
        .insert({ user_id: user.id, name: input.name, description: input.description ?? null })
        .select()
        .single();
      if (error) throw error;
      const { data: ver, error: vErr } = await supabase
        .from('anamnese_template_versions')
        .insert({ user_id: user.id, template_id: tpl.id, version: 1, is_current: true, locked: false })
        .select()
        .single();
      if (vErr) throw vErr;
      return { template: tpl, version: ver };
    },
    onSuccess: () => { invalidate(); toast({ title: 'Modelo criado' }); },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const updateTemplate = useMutation({
    mutationFn: async (input: { id: string; name?: string; description?: string | null; active?: boolean }) => {
      const { id, ...rest } = input;
      const { error } = await supabase.from('anamnese_templates').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Modelo atualizado' }); },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('anamnese_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Modelo excluído' }); },
    onError: (e: any) => toast({ title: 'Erro', description: 'Não é possível excluir um modelo com anamneses respondidas.', variant: 'destructive' }),
  });

  // Add a question to current version. If version is locked, clone it first.
  const upsertQuestion = useMutation({
    mutationFn: async (input: {
      id?: string;
      template_id: string;
      section: string;
      label: string;
      type: AnamneseQuestionType;
      options?: string[];
      required?: boolean;
      order_index?: number;
    }) => {
      if (!user) throw new Error('not authed');
      const version = await ensureEditableVersion(input.template_id, user.id, qc);
      const payload: any = {
        user_id: user.id,
        version_id: version.id,
        section: input.section,
        label: input.label,
        type: input.type,
        options: input.options ?? [],
        required: input.required ?? false,
        order_index: input.order_index ?? 0,
      };
      if (input.id) {
        const { error } = await supabase.from('anamnese_questions').update(payload).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('anamnese_questions').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => invalidate(),
  });

  const deleteQuestion = useMutation({
    mutationFn: async (input: { id: string; template_id: string }) => {
      if (!user) throw new Error('not authed');
      await ensureEditableVersion(input.template_id, user.id, qc);
      const { error } = await supabase.from('anamnese_questions').delete().eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  return {
    templates: templatesQ.data ?? [],
    versions: versionsQ.data ?? [],
    questions: questionsQ.data ?? [],
    isLoading: templatesQ.isLoading || versionsQ.isLoading || questionsQ.isLoading,
    createTemplate, updateTemplate, deleteTemplate,
    upsertQuestion, deleteQuestion,
  };
}

// Ensure there's an editable (unlocked, is_current) version for this template.
// If the current version is locked (has signed responses), bump to a new version cloning questions.
async function ensureEditableVersion(templateId: string, userId: string, qc: any): Promise<AnamneseVersion> {
  const { data: versions } = await supabase
    .from('anamnese_template_versions')
    .select('*')
    .eq('template_id', templateId)
    .order('version', { ascending: false });
  const current = (versions || []).find((v) => v.is_current) || versions?.[0];
  if (current && !current.locked) return current as AnamneseVersion;

  // Lock current, create new version cloning questions
  if (current) {
    await supabase.from('anamnese_template_versions').update({ is_current: false }).eq('id', current.id);
  }
  const newVersion = (current?.version ?? 0) + 1;
  const { data: ver, error } = await supabase
    .from('anamnese_template_versions')
    .insert({ user_id: userId, template_id: templateId, version: newVersion, is_current: true, locked: false })
    .select()
    .single();
  if (error) throw error;

  if (current) {
    const { data: oldQs } = await supabase
      .from('anamnese_questions').select('*').eq('version_id', current.id);
    if (oldQs && oldQs.length) {
      await supabase.from('anamnese_questions').insert(
        oldQs.map((q: any) => ({
          user_id: userId, version_id: ver.id,
          section: q.section, label: q.label, type: q.type,
          options: q.options, required: q.required, order_index: q.order_index,
        })),
      );
    }
  }
  qc.invalidateQueries({ queryKey: ['anamnese_versions'] });
  qc.invalidateQueries({ queryKey: ['anamnese_questions'] });
  return ver as AnamneseVersion;
}

export function useClientAnamneses(clientId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const responsesQ = useQuery({
    queryKey: ['anamnese_responses', clientId, user?.id],
    enabled: !!user && !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anamnese_responses').select('*')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AnamneseResponse[];
    },
  });

  const createResponse = useMutation({
    mutationFn: async (input: { template_id: string }) => {
      if (!user || !clientId) throw new Error('faltam dados');
      const { data: versions } = await supabase
        .from('anamnese_template_versions').select('*')
        .eq('template_id', input.template_id).eq('is_current', true).limit(1);
      const version = versions?.[0];
      if (!version) throw new Error('Modelo sem versão ativa');
      const { data, error } = await supabase
        .from('anamnese_responses')
        .insert({
          user_id: user.id, client_id: clientId,
          template_id: input.template_id, version_id: version.id,
          status: 'pendente',
        })
        .select().single();
      if (error) throw error;
      return data as AnamneseResponse;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['anamnese_responses'] }),
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const archiveResponse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('anamnese_responses').update({ status: 'arquivada' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['anamnese_responses'] }); toast({ title: 'Anamnese arquivada' }); },
  });

  return {
    responses: responsesQ.data ?? [],
    isLoading: responsesQ.isLoading,
    createResponse, archiveResponse,
  };
}

export function useAnamneseResponseDetail(responseId?: string) {
  return useQuery({
    queryKey: ['anamnese_response_detail', responseId],
    enabled: !!responseId,
    queryFn: async () => {
      const [{ data: response }, { data: answers }] = await Promise.all([
        supabase.from('anamnese_responses').select('*').eq('id', responseId!).single(),
        supabase.from('anamnese_answers').select('*').eq('response_id', responseId!),
      ]);
      if (!response) throw new Error('Anamnese não encontrada');
      const { data: questions } = await supabase
        .from('anamnese_questions').select('*')
        .eq('version_id', response.version_id)
        .order('order_index', { ascending: true });
      const { data: template } = await supabase
        .from('anamnese_templates').select('*').eq('id', response.template_id).single();
      const { data: version } = await supabase
        .from('anamnese_template_versions').select('*').eq('id', response.version_id).single();
      return {
        response: response as AnamneseResponse,
        answers: (answers || []) as AnamneseAnswer[],
        questions: ((questions || []).map((q: any) => ({ ...q, options: q.options || [] }))) as AnamneseQuestion[],
        template: template as AnamneseTemplate,
        version: version as AnamneseVersion,
      };
    },
  });
}

export async function saveAnswersAndSign(params: {
  responseId: string;
  userId: string;
  answers: Record<string, unknown>; // question_id -> value
  signature?: string | null;
}) {
  const { responseId, userId, answers, signature } = params;
  // Replace existing answers
  await supabase.from('anamnese_answers').delete().eq('response_id', responseId);
  const rows = Object.entries(answers).map(([question_id, value]) => ({
    user_id: userId, response_id: responseId, question_id, value: value as any,
  }));
  if (rows.length) {
    const { error } = await supabase.from('anamnese_answers').insert(rows);
    if (error) throw error;
  }
  if (signature) {
    const { error } = await supabase.from('anamnese_responses').update({
      status: 'assinada', filled_at: new Date().toISOString(),
      signed_at: new Date().toISOString(), signature_data: signature,
    }).eq('id', responseId);
    if (error) throw error;
    // Lock the version
    const { data: resp } = await supabase
      .from('anamnese_responses').select('version_id').eq('id', responseId).single();
    if (resp?.version_id) {
      await supabase.from('anamnese_template_versions').update({ locked: true }).eq('id', resp.version_id);
    }
  } else {
    await supabase.from('anamnese_responses').update({
      status: 'preenchida', filled_at: new Date().toISOString(),
    }).eq('id', responseId);
  }
}
