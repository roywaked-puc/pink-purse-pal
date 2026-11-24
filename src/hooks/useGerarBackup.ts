import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { zip, strToU8, type Zippable } from 'fflate';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SAFE_COLUMNS } from '@/hooks/useUserSettings';
import { LOGOS_BUCKET } from '@/hooks/useMarca';
import { sanitizeDbError } from '@/lib/sanitizeError';
import { montarDocumentoAnamnese } from '@/lib/anamneseImpressao';
import {
  TABELAS_BACKUP, type DadosBackup, type Linha, type FalhaBackup, type ArquivoStorage, type PdfFicha,
  montarPlanilhas, montarManifesto, montarLeiaMe, montarErros, nomeArquivoZip, nomeComId,
  sanitizarNome, id8, dataIsoSp, extensaoDoCaminho,
} from '@/lib/backup';

const FOTOS_BUCKET = 'client-photos';
const PAGINA = 1000;
const CONCORRENCIA_FOTOS = 4;

export interface ProgressoBackup { etapa: string; percentual: number }
export interface ResumoBackup {
  clientes: number; agendamentos: number; movimentacoes: number; fotos: number; fichas: number; falhas: number;
}
export interface ResultadoBackup { blob: Blob; nome: string; resumo: ResumoBackup }

const abortar = (signal: AbortSignal) => {
  if (signal.aborted) throw new DOMException('Backup cancelado', 'AbortError');
};

async function sha256Hex(dados: Uint8Array): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', dados);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const motivo = (e: unknown) => (e instanceof Error && e.message ? e.message : 'falha ao baixar');

/** Quantidade de fotos (consulta só de contagem). */
export function useContagemFotos() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['backup-contagem-fotos', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('client_photos').select('id', { count: 'exact', head: true }).eq('user_id', user!.id);
      if (error) throw sanitizeDbError(error);
      return count ?? 0;
    },
  });
}

export function useGerarBackup() {
  const { user } = useAuth();

  return useCallback(async (opcoes: {
    incluirFotos: boolean; signal: AbortSignal; onProgresso: (p: ProgressoBackup) => void;
  }): Promise<ResultadoBackup> => {
    const { incluirFotos, signal, onProgresso } = opcoes;
    if (!user) throw new Error('Sessão expirada. Entre novamente.');
    const geradoEm = new Date();

    // 1) Leitura paginada de todas as tabelas, direto do banco.
    const dados = {} as DadosBackup;
    for (let i = 0; i < TABELAS_BACKUP.length; i++) {
      const tabela = TABELAS_BACKUP[i];
      onProgresso({ etapa: 'Lendo seus dados…', percentual: Math.round((i / TABELAS_BACKUP.length) * 20) });
      const colunas = tabela === 'user_settings' ? SAFE_COLUMNS : '*';
      const linhas: Linha[] = [];
      for (let de = 0; ; de += PAGINA) {
        abortar(signal);
        const { data, error } = await (supabase.from(tabela as any) as any)
          .select(colunas).eq('user_id', user.id).order('id').range(de, de + PAGINA - 1);
        if (error) throw sanitizeDbError(error);
        linhas.push(...(data ?? []));
        if (!data || data.length < PAGINA) break;
      }
      dados[tabela] = linhas;
    }

    const arquivos: Zippable = {};
    const semCompressao = new Set<string>();
    const falhas: FalhaBackup[] = [];
    const arquivosStorage: ArquivoStorage[] = [];
    const pdfs: PdfFicha[] = [];
    const caminhosFotos = new Map<string, string>();
    const caminhosFichas = new Map<string, string>();
    const clientes = new Map(dados.clients.map((c) => [c.id, c]));
    const pastaCliente = (clientId: string) => nomeComId(clientes.get(clientId)?.name, clientId);

    // 2) Fotos (no máximo 4 downloads ao mesmo tempo, guardadas sem recompactar).
    let fotosOk = 0;
    if (incluirFotos && dados.client_photos.length) {
      const fila = [...dados.client_photos];
      const total = fila.length;
      let feitas = 0;
      const trabalhador = async () => {
        for (let f = fila.shift(); f; f = fila.shift()) {
          abortar(signal);
          const caminho = `fotos/${pastaCliente(f.client_id)}/${dataIsoSp(f.photo_date)}_${sanitizarNome(f.service_name || 'foto', 30)}_${id8(f.id)}.${extensaoDoCaminho(f.storage_path)}`;
          try {
            const { data, error } = await supabase.storage.from(FOTOS_BUCKET).download(f.storage_path);
            if (error || !data) throw error ?? new Error('arquivo não encontrado');
            arquivos[caminho] = new Uint8Array(await data.arrayBuffer());
            semCompressao.add(caminho);
            caminhosFotos.set(f.id, caminho);
            arquivosStorage.push({ bucket: FOTOS_BUCKET, storage_path: f.storage_path, arquivo_no_zip: caminho });
            fotosOk++;
          } catch (e) {
            falhas.push({ tipo: 'foto', referencia: `${f.id} (${f.storage_path})`, motivo: motivo(e) });
          }
          feitas++;
          onProgresso({ etapa: `Baixando fotos ${feitas} de ${total}`, percentual: 20 + Math.round((feitas / total) * 50) });
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCORRENCIA_FOTOS, total) }, trabalhador));
      abortar(signal);
    }

    // 3) Logo da marca.
    const settings = dados.user_settings[0];
    let logoDataUrl: string | null = null;
    if (settings?.logo_path) {
      try {
        const { data, error } = await supabase.storage.from(LOGOS_BUCKET).download(settings.logo_path);
        if (error || !data) throw error ?? new Error('arquivo não encontrado');
        const bytes = new Uint8Array(await data.arrayBuffer());
        const caminho = `marca/logo.${extensaoDoCaminho(settings.logo_path, 'png')}`;
        arquivos[caminho] = bytes;
        semCompressao.add(caminho);
        arquivosStorage.push({ bucket: LOGOS_BUCKET, storage_path: settings.logo_path, arquivo_no_zip: caminho });
        logoDataUrl = await new Promise<string>((res, rej) => {
          const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(data);
        });
      } catch (e) {
        falhas.push({ tipo: 'logo', referencia: settings.logo_path, motivo: motivo(e) });
      }
    }

    // 4) Fichas de anamnese assinadas — mesmo documento da aba Anamnese, uma de cada vez.
    const assinadas = dados.anamnese_responses.filter((r) => r.signed_at);
    const modelos = new Map(dados.anamnese_templates.map((t) => [t.id, t]));
    const versoes = new Map(dados.anamnese_template_versions.map((v) => [v.id, v]));
    let fichasOk = 0;
    for (let i = 0; i < assinadas.length; i++) {
      abortar(signal);
      const r = assinadas[i];
      onProgresso({ etapa: `Gerando fichas ${i + 1} de ${assinadas.length}`, percentual: 70 + Math.round(((i + 1) / assinadas.length) * 20) });
      const modelo = modelos.get(r.template_id);
      const base = `anamneses/${pastaCliente(r.client_id)}/${dataIsoSp(r.signed_at)}_${sanitizarNome(modelo?.name || 'anamnese', 30)}_${id8(r.id)}`;
      try {
        if (r.pdf_path) {
          const { data } = await supabase.storage.from(FOTOS_BUCKET).download(r.pdf_path);
          if (data) {
            const caminho = `${base}.pdf`;
            arquivos[caminho] = new Uint8Array(await data.arrayBuffer());
            semCompressao.add(caminho);
            caminhosFichas.set(r.id, caminho);
            pdfs.push({ response_id: r.id, arquivo_no_zip: caminho, bucket: FOTOS_BUCKET, storage_path: r.pdf_path });
            fichasOk++;
            continue;
          }
        }
        const perguntas = dados.anamnese_questions
          .filter((q) => q.version_id === r.version_id)
          .sort((a, b) => a.order_index - b.order_index);
        const respostas: Record<string, unknown> = {};
        dados.anamnese_answers.filter((a) => a.response_id === r.id).forEach((a) => { respostas[a.question_id] = a.value; });
        const html = montarDocumentoAnamnese({
          nomeModelo: modelo?.name ?? 'Anamnese',
          versao: versoes.get(r.version_id)?.version ?? 1,
          nomeCliente: clientes.get(r.client_id)?.name ?? null,
          status: r.status,
          signedAt: r.signed_at,
          signatureData: r.signature_data,
          perguntas,
          respostas,
          nomeNegocio: settings?.nome_negocio ?? null,
          logoSrc: logoDataUrl,
        });
        const caminho = `${base}.html`;
        arquivos[caminho] = strToU8(html);
        caminhosFichas.set(r.id, caminho);
        pdfs.push({ response_id: r.id, arquivo_no_zip: caminho });
        fichasOk++;
      } catch (e) {
        falhas.push({ tipo: 'ficha', referencia: r.id, motivo: motivo(e) });
      }
    }

    // 5) Planilhas, restauração, LEIA-ME, erros e manifesto.
    abortar(signal);
    onProgresso({ etapa: 'Compactando…', percentual: 92 });
    const planilhas = montarPlanilhas(dados, { fotos: caminhosFotos, fichas: caminhosFichas });
    for (const [nome, csv] of Object.entries(planilhas)) arquivos[`planilhas/${nome}`] = strToU8(csv);
    for (const t of TABELAS_BACKUP) arquivos[`restauracao/${t}.json`] = strToU8(JSON.stringify(dados[t], null, 2));
    arquivos['LEIA-ME.txt'] = strToU8(montarLeiaMe(geradoEm, incluirFotos));
    if (falhas.length) arquivos['erros.txt'] = strToU8(montarErros(falhas));

    const sha256: Record<string, string> = {};
    for (const [nome, conteudo] of Object.entries(arquivos)) {
      abortar(signal);
      sha256[nome] = await sha256Hex(conteudo as Uint8Array);
    }
    arquivos['manifesto.json'] = strToU8(JSON.stringify(montarManifesto({
      geradoEm, userId: user.id, incluiFotos: incluirFotos, dados, arquivosStorage, pdfs, falhas, sha256,
    }), null, 2));

    const entrada: Zippable = {};
    for (const [nome, conteudo] of Object.entries(arquivos)) {
      entrada[nome] = semCompressao.has(nome) ? [conteudo as Uint8Array, { level: 0 }] : conteudo;
    }
    const bytes = await new Promise<Uint8Array>((res, rej) => {
      const termina = zip(entrada, { level: 6 }, (err, out) => (err ? rej(err) : res(out)));
      signal.addEventListener('abort', () => { termina(); rej(new DOMException('Backup cancelado', 'AbortError')); }, { once: true });
    });
    abortar(signal);
    onProgresso({ etapa: 'Pronto!', percentual: 100 });

    return {
      blob: new Blob([bytes], { type: 'application/zip' }),
      nome: nomeArquivoZip(geradoEm),
      resumo: {
        clientes: dados.clients.length, agendamentos: dados.appointments.length,
        movimentacoes: dados.transactions.length, fotos: fotosOk, fichas: fichasOk, falhas: falhas.length,
      },
    };
  }, [user]);
}
