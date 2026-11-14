import type { jsPDF } from 'jspdf';

/**
 * Desenha a marca (nome do negócio + logo) no canto superior direito do PDF.
 * Não altera o layout existente: se não houver marca, nada é desenhado.
 */
export function adicionarMarcaPdf(
  doc: jsPDF,
  nomeNegocio: string | null,
  logoDataUrl: string | null,
) {
  if (!nomeNegocio && !logoDataUrl) return;
  const pageWidth = doc.internal.pageSize.getWidth();
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, pageWidth - 24, 8, 10, 10);
    } catch {
      // Se a imagem falhar, segue só com o nome.
    }
  }
  if (nomeNegocio) {
    doc.setFontSize(11);
    doc.text(nomeNegocio, pageWidth - (logoDataUrl ? 26 : 14), 15, { align: 'right' });
  }
}
