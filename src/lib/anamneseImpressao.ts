import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Documento de impressão da ficha de anamnese (o mesmo que a aba Anamnese da ficha
 * abre em "Imprimir / PDF"). Usado também pelo backup, para que a cópia seja idêntica.
 */

export interface DadosImpressaoAnamnese {
  nomeModelo: string;
  versao: number;
  nomeCliente: string | null;
  status: string;
  signedAt: string | null;
  signatureData: string | null;
  perguntas: { id: string; section: string; label: string; type: string; order_index?: number }[];
  respostas: Record<string, unknown>;
  nomeNegocio: string | null;
  logoSrc: string | null;
}

export const rotuloRespostaAnamnese = (type: string, v: unknown): string => {
  if (v === undefined || v === null || v === '') return '—';
  if (Array.isArray(v)) return v.join(', ') || '—';
  if (type === 'checkbox') return v ? 'Sim' : 'Não';
  if (type === 'sim_nao') return v === 'sim' ? 'Sim' : v === 'nao' ? 'Não' : String(v);
  return String(v);
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Agrupa perguntas por seção, na ordem em que chegam. */
export function agruparPorSecao<T extends { section: string }>(perguntas: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  perguntas.forEach((q) => {
    if (!map.has(q.section)) map.set(q.section, []);
    map.get(q.section)!.push(q);
  });
  return Array.from(map.entries());
}

export const ESTILO_IMPRESSAO_ANAMNESE = `
        body { font-family: -apple-system, sans-serif; padding: 32px; color: #111; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        h2 { font-size: 14px; margin: 16px 0 6px; padding-bottom: 4px; border-bottom: 1px solid #ddd; color: #b8336a; }
        p { margin: 4px 0; font-size: 13px; }
        .q { margin-bottom: 6px; }
        .lbl { font-weight: 600; }
        .meta { color: #666; font-size: 12px; }
        img { max-width: 320px; border: 1px solid #ddd; }
        .marca { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .marca img { width: 48px; height: 48px; max-width: 48px; border-radius: 50%; object-fit: cover; }
        .marca .nome { font-size: 16px; font-weight: 700; }
        @media print { body { padding: 0; } }
      `;

export function montarCorpoAnamnese(d: DadosImpressaoAnamnese): string {
  let h = '';
  if (d.nomeNegocio || d.logoSrc) {
    h += '<div class="marca">';
    if (d.logoSrc) h += `<img src="${esc(d.logoSrc)}" alt="Logo do negócio">`;
    if (d.nomeNegocio) h += `<span class="nome">${esc(d.nomeNegocio)}</span>`;
    h += '</div>';
  }
  h += `<h1>${esc(d.nomeModelo)}</h1>`;
  const situacao = d.signedAt
    ? `Assinada em ${format(new Date(d.signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
    : `Status: ${d.status}`;
  h += `<p class="meta">Cliente: <strong>${esc(d.nomeCliente ?? '—')}</strong> · Versão ${d.versao} · ${esc(situacao)}</p>`;
  for (const [secao, qs] of agruparPorSecao(d.perguntas)) {
    h += `<div><h2>${esc(secao)}</h2>`;
    for (const q of qs) {
      h += `<div class="q"><p><span class="lbl">${esc(q.label)}:</span> ${esc(rotuloRespostaAnamnese(q.type, d.respostas[q.id]))}</p></div>`;
    }
    h += '</div>';
  }
  if (d.signatureData) {
    h += `<h2>Assinatura</h2><img src="${esc(d.signatureData)}" alt="Assinatura">`;
  }
  return h;
}

/** Documento HTML completo, pronto para abrir e imprimir/salvar em PDF. */
export function montarDocumentoAnamnese(d: DadosImpressaoAnamnese): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Anamnese</title>
      <style>${ESTILO_IMPRESSAO_ANAMNESE}</style></head><body>${montarCorpoAnamnese(d)}</body></html>`;
}
