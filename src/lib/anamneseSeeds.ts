import { supabase } from '@/integrations/supabase/client';

type SeedQ = { section: string; label: string; type: string; options?: string[]; required?: boolean };

const LASH_LIFTING_QUESTIONS: SeedQ[] = [
  // Dados Pessoais
  { section: 'Dados Pessoais', label: 'Nome completo', type: 'texto_curto', required: true },
  { section: 'Dados Pessoais', label: 'Telefone', type: 'texto_curto' },
  { section: 'Dados Pessoais', label: 'E-mail', type: 'texto_curto' },
  { section: 'Dados Pessoais', label: 'Data de nascimento', type: 'data' },
  { section: 'Dados Pessoais', label: 'Endereço', type: 'texto_longo' },

  // Histórico
  { section: 'Histórico do Procedimento', label: 'Já realizou Lash Lifting anteriormente?', type: 'sim_nao' },

  // Alergias
  { section: 'Alergias', label: 'Alergia a látex', type: 'sim_nao' },
  { section: 'Alergias', label: 'Alergia a maquiagem', type: 'sim_nao' },
  { section: 'Alergias', label: 'Alergia a colágeno', type: 'sim_nao' },
  { section: 'Alergias', label: 'Alergia a bandaid', type: 'sim_nao' },
  { section: 'Alergias', label: 'Alergia a acrilato', type: 'sim_nao' },

  // Saúde Geral
  { section: 'Saúde Geral', label: 'Bronquite', type: 'sim_nao' },
  { section: 'Saúde Geral', label: 'Asma', type: 'sim_nao' },
  { section: 'Saúde Geral', label: 'Rinite', type: 'sim_nao' },
  { section: 'Saúde Geral', label: 'Sinusite', type: 'sim_nao' },
  { section: 'Saúde Geral', label: 'Diabetes', type: 'sim_nao' },
  { section: 'Saúde Geral', label: 'Tireoide', type: 'sim_nao' },
  { section: 'Saúde Geral', label: 'Gestação', type: 'sim_nao' },
  { section: 'Saúde Geral', label: 'Lactação', type: 'sim_nao' },
  { section: 'Saúde Geral', label: 'Ansiedade', type: 'sim_nao' },
  { section: 'Saúde Geral', label: 'Síndrome do pânico', type: 'sim_nao' },

  // Saúde Ocular
  { section: 'Saúde Ocular', label: 'Irritação ocular', type: 'sim_nao' },
  { section: 'Saúde Ocular', label: 'Sensibilidade à luz', type: 'sim_nao' },
  { section: 'Saúde Ocular', label: 'Inflamações', type: 'sim_nao' },
  { section: 'Saúde Ocular', label: 'Blefaroplastia', type: 'sim_nao' },
  { section: 'Saúde Ocular', label: 'Micropigmentação recente', type: 'sim_nao' },
  { section: 'Saúde Ocular', label: 'Lentes de contato', type: 'sim_nao' },
  { section: 'Saúde Ocular', label: 'Cirurgias recentes', type: 'sim_nao' },

  // Medicamentos
  { section: 'Medicamentos', label: 'Medicamentos controlados', type: 'texto_longo' },
  { section: 'Medicamentos', label: 'Esteroides', type: 'sim_nao' },
  { section: 'Medicamentos', label: 'Tratamentos hormonais', type: 'sim_nao' },

  // Termo
  { section: 'Termo de Consentimento', label: 'Declaro que as informações prestadas são verdadeiras e autorizo a realização do procedimento, ciente dos cuidados pré e pós-atendimento.', type: 'checkbox', required: true },
];

export async function seedDefaultLashLiftingTemplate(userId: string) {
  const { data: tpl, error } = await supabase
    .from('anamnese_templates')
    .insert({ user_id: userId, name: 'Anamnese Lash Lifting', description: 'Modelo padrão importado' })
    .select().single();
  if (error) throw error;
  const { data: ver, error: vErr } = await supabase
    .from('anamnese_template_versions')
    .insert({ user_id: userId, template_id: tpl.id, version: 1, is_current: true, locked: false })
    .select().single();
  if (vErr) throw vErr;
  const rows = LASH_LIFTING_QUESTIONS.map((q, i) => ({
    user_id: userId, version_id: ver.id, section: q.section, label: q.label,
    type: q.type as any, options: q.options ?? [], required: !!q.required, order_index: i,
  }));
  const { error: qErr } = await supabase.from('anamnese_questions').insert(rows);
  if (qErr) throw qErr;
}
