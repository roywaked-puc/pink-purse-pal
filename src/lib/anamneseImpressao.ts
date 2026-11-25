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

/** Gera um PDF A4 da ficha, com a mesma estrutura do documento de impressão. */
export async function gerarPdfAnamnese(d: DadosImpressaoAnamnese): Promise<Uint8Array> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margem = 14;
  const largura = doc.internal.pageSize.getWidth() - margem * 2;
  const alturaPagina = doc.internal.pageSize.getHeight();
  let y = margem;
  const garantir = (h: number) => { if (y + h > alturaPagina - margem) { doc.addPage(); y = margem; } };
  const texto = (t: string, tam: number, estilo: 'normal' | 'bold', cor: [number, number, number] = [17, 17, 17]) => {
    doc.setFont('helvetica', estilo); doc.setFontSize(tam); doc.setTextColor(...cor);
    const linhas = doc.splitTextToSize(t, largura) as string[];
    const h = tam * 0.42;
    for (const l of linhas) { garantir(h); doc.text(l, margem, y + h * 0.8); y += h; }
  };

  if (d.nomeNegocio || d.logoSrc) {
    let x = margem;
    if (d.logoSrc) {
      try { doc.addImage(d.logoSrc, margem, y, 13, 13); x += 16; } catch { /* segue sem logo */ }
    }
    if (d.nomeNegocio) { doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(17, 17, 17); doc.text(d.nomeNegocio, x, y + 8.5); }
    y += 17;
  }
  texto(d.nomeModelo, 16, 'bold');
  y += 1;
  const situacao = d.signedAt
    ? `Assinada em ${format(new Date(d.signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
    : `Status: ${d.status}`;
  texto(`Cliente: ${d.nomeCliente ?? '—'} · Versão ${d.versao} · ${situacao}`, 9.5, 'normal', [102, 102, 102]);

  const secao = (titulo: string) => {
    y += 4; garantir(10);
    texto(titulo, 11, 'bold', [184, 51, 106]);
    doc.setDrawColor(221, 221, 221); doc.line(margem, y + 1, margem + largura, y + 1); y += 3;
  };
  for (const [s, qs] of agruparPorSecao(d.perguntas)) {
    secao(s);
    for (const q of qs) {
      texto(`${q.label}: ${rotuloRespostaAnamnese(q.type, d.respostas[q.id])}`, 10, 'normal');
      y += 1.2;
    }
  }
  if (d.signatureData) {
    secao('Assinatura');
    try {
      const p = doc.getImageProperties(d.signatureData);
      const w = Math.min(85, largura); const h = (p.height / p.width) * w;
      garantir(h + 2);
      doc.setDrawColor(221, 221, 221); doc.rect(margem, y, w, h);
      doc.addImage(d.signatureData, margem, y, w, h); y += h;
    } catch { texto('(assinatura não pôde ser incluída)', 9, 'normal', [102, 102, 102]); }
  }
  return new Uint8Array(doc.output('arraybuffer'));
}
