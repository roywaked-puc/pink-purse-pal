/**
 * Backup completo (formato "belafy-backup", versao_formato 1): lógica pura.
 * CSVs para leitura humana, nomes de arquivos, manifesto e LEIA-ME.
 * A busca no banco/storage e o zip ficam em src/hooks/useGerarBackup.ts.
 */

export const FUSO_BACKUP = 'America/Sao_Paulo';
export const VERSAO_FORMATO_BACKUP = 1;

/** Tabelas de dados da usuária que entram no backup (nunca assinaturas/Stripe/exclusão/modelos). */
export const TABELAS_BACKUP = [
  'clients', 'services', 'categories', 'accounts', 'account_fee_types', 'appointments',
  'transactions', 'permuta_lancamentos', 'client_photos', 'anamnese_templates',
  'anamnese_template_versions', 'anamnese_questions', 'anamnese_responses', 'anamnese_answers',
  'user_settings',
] as const;
export type TabelaBackup = (typeof TABELAS_BACKUP)[number];
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- linhas cruas do banco
export type Linha = Record<string, any>;
export type DadosBackup = Record<TabelaBackup, Linha[]>;

// ---------- CSV ----------
export const BOM = '\uFEFF';

export function escaparCsv(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function gerarCsv(cabecalhos: string[], linhas: unknown[][]): string {
  return BOM + [cabecalhos, ...linhas].map((l) => l.map(escaparCsv).join(';')).join('\r\n') + '\r\n';
}

function partesSp(d: Date) {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: FUSO_BACKUP, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  return { a: g('year'), m: g('month'), d: g('day'), h: g('hour'), min: g('minute') };
}

/** dd/mm/aaaa HH:mm em São Paulo; datas puras (aaaa-mm-dd) viram dd/mm/aaaa. */
export function formatarDataBr(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  const s = String(v);
  const soData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (soData) return `${soData[3]}/${soData[2]}/${soData[1]}`;
  const dt = new Date(s);
  if (isNaN(dt.getTime())) return s;
  const p = partesSp(dt);
  return `${p.d}/${p.m}/${p.a} ${p.h}:${p.min}`;
}

/** aaaa-mm-dd em São Paulo (para nomes de arquivo). */
export function dataIsoSp(v: unknown): string {
  const dt = new Date(String(v ?? ''));
  if (isNaN(dt.getTime())) return 'sem-data';
  const p = partesSp(dt);
  return `${p.a}-${p.m}-${p.d}`;
}

export function formatarValor(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  return isNaN(n) ? String(v) : n.toFixed(2).replace('.', ',');
}

export const formatarBool = (v: unknown) => (v === null || v === undefined ? '' : v ? 'Sim' : 'Não');

/** Resposta legível de anamnese para planilha. */
export function formatarRespostaAnamnese(tipo: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  if (Array.isArray(v)) return v.map((x) => String(x)).join(', ');
  if (tipo === 'checkbox' || typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (tipo === 'sim_nao') return v === 'sim' ? 'Sim' : v === 'nao' ? 'Não' : String(v);
  if (tipo === 'data') return formatarDataBr(v);
  if (tipo === 'numero') return String(v).replace('.', ',');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

// ---------- Nomes de arquivo ----------
export function sanitizarNome(nome: string | null | undefined, max = 40): string {
  const s = (nome ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[/\\:*?"<>|]/g, '').replace(/\p{Cc}/gu, '')
    .replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^[_.]+|[_.]+$/g, '')
    .slice(0, max).replace(/[_.]+$/g, '');
  return s || 'sem_nome';
}

export const id8 = (id: string) => String(id).replace(/-/g, '').slice(0, 8);
export const nomeComId = (nome: string | null | undefined, id: string, max = 40) =>
  `${sanitizarNome(nome, max)}_${id8(id)}`;

export function extensaoDoCaminho(caminho: string, padrao = 'jpg'): string {
  const m = /\.([a-zA-Z0-9]{1,5})$/.exec(caminho);
  return m ? m[1].toLowerCase() : padrao;
}

export function nomeArquivoZip(agora: Date): string {
  const p = partesSp(agora);
  return `belafy-backup-${p.a}-${p.m}-${p.d}-${p.h}${p.min}.zip`;
}

// ---------- Planilhas ----------
const mapaPor = (linhas: Linha[], campo = 'id') => new Map(linhas.map((l) => [l[campo], l]));

export interface CaminhosNoZip {
  fotos: Map<string, string>; // client_photos.id -> caminho
  fichas: Map<string, string>; // anamnese_responses.id -> caminho
}

export function montarPlanilhas(d: DadosBackup, caminhos: CaminhosNoZip): Record<string, string> {
  const cli = mapaPor(d.clients), srv = mapaPor(d.services), cat = mapaPor(d.categories);
  const cta = mapaPor(d.accounts), tct = mapaPor(d.account_fee_types), tpl = mapaPor(d.anamnese_templates);
  const ver = mapaPor(d.anamnese_template_versions), qst = mapaPor(d.anamnese_questions);
  const rsp = mapaPor(d.anamnese_responses);
  const n = (m: Map<unknown, Linha>, id: unknown, campo = 'name') => (id ? m.get(id)?.[campo] ?? '' : '');
  const out: Record<string, string> = {};

  out['clientes.csv'] = gerarCsv(
    ['ID', 'Nome', 'Telefone', 'Aniversário', 'Recorrência (dias)', 'Paga em permuta', 'Conta padrão de permuta', 'Observações', 'Cadastrada em'],
    d.clients.map((c) => [c.id, c.name, c.phone, formatarDataBr(c.birth_date), c.recurrence_days ?? '', formatarBool(c.paga_permuta), n(cta, c.conta_permuta_padrao_id), c.notes, formatarDataBr(c.created_at)]),
  );
  out['servicos.csv'] = gerarCsv(
    ['ID', 'Descrição', 'Valor', 'Duração (min)', 'Cor', 'Técnica', 'Tipo', 'Dias mín.', 'Dias máx.', 'Possui manutenção', 'Serviço principal', 'Manutenção até (dias)', 'Observações', 'Criado em'],
    d.services.map((s) => [s.id, s.description, formatarValor(s.amount), s.duration, s.color, s.technique_name, s.tier_type, s.dias_min ?? '', s.dias_max ?? '', formatarBool(s.possui_manutencao), n(srv, s.servico_pai_id, 'description'), s.manutencao_ate_dias ?? '', s.notes, formatarDataBr(s.created_at)]),
  );
  out['categorias.csv'] = gerarCsv(['ID', 'Nome', 'Tipo', 'Escopo', 'Criada em'],
    d.categories.map((c) => [c.id, c.name, c.type, c.scope, formatarDataBr(c.created_at)]));
  out['contas.csv'] = gerarCsv(['ID', 'Nome', 'Tipo', 'Taxa (%)', 'Criada em'],
    d.accounts.map((c) => [c.id, c.name, c.type, formatarValor(c.fee_percentage), formatarDataBr(c.created_at)]));
  out['tipos_cobranca.csv'] = gerarCsv(['ID', 'Conta', 'Tipo de cobrança', 'Taxa (%)', 'Ordem', 'Criado em'],
    d.account_fee_types.map((t) => [t.id, n(cta, t.account_id), t.label, formatarValor(t.fee_percentage), t.order_index, formatarDataBr(t.created_at)]));
  out['agendamentos.csv'] = gerarCsv(
    ['ID', 'Data', 'Cliente', 'Serviço', 'Serviço (texto salvo)', 'Duração (min)', 'Valor', 'Valor pago', 'Pagamento', 'Situação', 'Permuta', 'Nº manutenção', 'Lembrete enviado em', 'Observações', 'Criado em'],
    d.appointments.map((a) => [a.id, formatarDataBr(a.date), n(cli, a.client_id) || a.client_name, n(srv, a.service_id, 'description'), a.service, a.duration, formatarValor(a.amount), formatarValor(a.paid_amount), a.payment_status, a.confirmation_status, formatarBool(a.is_permuta), a.maintenance_number ?? '', formatarDataBr(a.confirmation_sent_at), a.notes, formatarDataBr(a.created_at)]),
  );
  out['movimentacoes.csv'] = gerarCsv(
    ['ID', 'Data', 'Tipo', 'Escopo', 'Categoria', 'Conta', 'Tipo de cobrança', 'Valor', 'Valor bruto', 'Forma de pagamento', 'Cliente', 'ID do agendamento', 'Descrição', 'Criada em'],
    d.transactions.map((t) => [t.id, formatarDataBr(t.date), t.type, t.scope, n(cat, t.category_id) || t.category, n(cta, t.account_id) || t.account, n(tct, t.account_fee_type_id, 'label'), formatarValor(t.amount), formatarValor(t.gross_amount), t.payment_type, t.client_name, t.appointment_id, t.description, formatarDataBr(t.created_at)]),
  );
  out['permutas.csv'] = gerarCsv(['ID', 'Data', 'Cliente', 'Tipo', 'Valor', 'Descrição', 'ID da movimentação', 'Criado em'],
    d.permuta_lancamentos.map((p) => [p.id, formatarDataBr(p.date), n(cli, p.client_id), p.tipo, formatarValor(p.valor), p.descricao, p.transaction_id, formatarDataBr(p.created_at)]));
  out['fotos.csv'] = gerarCsv(['ID', 'Data', 'Cliente', 'Serviço', 'Observação', 'ID do agendamento', 'Arquivo no backup'],
    d.client_photos.map((f) => [f.id, formatarDataBr(f.photo_date), n(cli, f.client_id), f.service_name, f.observation, f.appointment_id, caminhos.fotos.get(f.id) ?? '']));
  out['anamneses.csv'] = gerarCsv(['ID', 'Cliente', 'Modelo', 'Versão', 'Situação', 'Preenchida em', 'Assinada em', 'Arquivo no backup'],
    d.anamnese_responses.map((r) => [r.id, n(cli, r.client_id), n(tpl, r.template_id), ver.get(r.version_id)?.version ?? '', r.status, formatarDataBr(r.filled_at), formatarDataBr(r.signed_at), caminhos.fichas.get(r.id) ?? '']));
  out['anamnese_respostas.csv'] = gerarCsv(['ID da ficha', 'Cliente', 'Modelo', 'Seção', 'Pergunta', 'Resposta'],
    d.anamnese_answers.map((a) => {
      const r = rsp.get(a.response_id); const q = qst.get(a.question_id);
      return [a.response_id, n(cli, r?.client_id), n(tpl, r?.template_id), q?.section ?? '', q?.label ?? '', formatarRespostaAnamnese(q?.type ?? '', a.value)];
    }));
  return out;
}

// ---------- Manifesto / LEIA-ME ----------
export interface FalhaBackup { tipo: 'foto' | 'ficha' | 'logo'; referencia: string; motivo: string }
export interface ArquivoStorage { bucket: string; storage_path: string; arquivo_no_zip: string }
export interface PdfFicha { response_id: string; arquivo_no_zip: string; bucket?: string; storage_path?: string }

export function montarManifesto(p: {
  geradoEm: Date; userId: string; incluiFotos: boolean; dados: DadosBackup;
  arquivosStorage: ArquivoStorage[]; pdfs: PdfFicha[]; falhas: FalhaBackup[]; sha256: Record<string, string>;
}) {
  return {
    formato: 'belafy-backup',
    versao_formato: VERSAO_FORMATO_BACKUP,
    gerado_em: p.geradoEm.toISOString(),
    fuso: FUSO_BACKUP,
    user_id: p.userId,
    inclui_fotos: p.incluiFotos,
    contagem: Object.fromEntries(TABELAS_BACKUP.map((t) => [t, p.dados[t].length])),
    arquivos_storage: p.arquivosStorage,
    pdfs: p.pdfs,
    falhas: p.falhas,
    sha256: p.sha256,
  };
}

export function montarErros(falhas: FalhaBackup[]): string {
  const nomes = { foto: 'Foto', ficha: 'Ficha de anamnese', logo: 'Logo' };
  return falhas.map((f) => `${nomes[f.tipo]} ${f.referencia}: ${f.motivo}`).join('\r\n') + '\r\n';
}

export function montarLeiaMe(geradoEm: Date, incluiFotos: boolean): string {
  return [
    'BACKUP BELAFY',
    `Gerado em ${formatarDataBr(geradoEm.toISOString())} (horário de Brasília).`,
    '',
    'O que tem aqui:',
    '- planilhas/: seus dados em planilhas. Abra no Excel ou no Google Planilhas.',
    `- fotos/: fotos das clientes, uma pasta por cliente.${incluiFotos ? '' : ' (Este backup foi feito sem fotos.)'}`,
    '- anamneses/: fichas de anamnese assinadas em PDF, prontas para imprimir, uma pasta por cliente.',
    '- marca/: a logo do seu negócio, se você cadastrou.',
    '- restauracao/ e manifesto.json: cópia fiel dos seus dados, para uma restauração no futuro. Não edite esses arquivos.',
    '- erros.txt: aparece só se algum arquivo não pôde ser copiado.',
    '',
    'ATENÇÃO: este arquivo contém dados pessoais e de saúde das suas clientes.',
    'Guarde em local seguro e não compartilhe.',
    '',
  ].join('\r\n');
}
