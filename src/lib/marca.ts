// Minha Marca: cor principal, derivação de tema e utilitários de logo.
// O tema é aplicado em tempo de execução sobrescrevendo os tokens semânticos
// de cor primária definidos em src/index.css. Nunca altera cores de serviços,
// status, timeline da ficha ou retenção.

export const MARCA_COR_PADRAO = '#EC4899';
export const MARCA_STORAGE_KEY = 'marca-cor-primaria';

export const CORES_PRONTAS: { nome: string; hex: string }[] = [
  { nome: 'Rosa', hex: '#EC4899' },
  { nome: 'Vinho', hex: '#9D174D' },
  { nome: 'Lilás', hex: '#A855F7' },
  { nome: 'Azul', hex: '#3B82F6' },
  { nome: 'Verde-água', hex: '#14B8A6' },
  { nome: 'Terracota', hex: '#C2410C' },
  { nome: 'Dourado', hex: '#B8860B' },
  { nome: 'Grafite', hex: '#374151' },
];

export const HEX_VALIDO = /^#[0-9A-Fa-f]{6}$/;

export function hexParaHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const TOKENS_TEMA = [
  '--primary',
  '--primary-foreground',
  '--ring',
  '--secondary',
  '--secondary-foreground',
  '--accent',
  '--accent-foreground',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--sidebar-accent',
  '--sidebar-accent-foreground',
  '--sidebar-ring',
];

/** Aplica a cor principal derivando os tons claros. NULL volta ao rosa padrão do CSS. */
export function aplicarTema(hex: string | null) {
  const root = document.documentElement;
  if (!hex || !HEX_VALIDO.test(hex)) {
    TOKENS_TEMA.forEach((t) => root.style.removeProperty(t));
    localStorage.removeItem(MARCA_STORAGE_KEY);
    return;
  }
  const { h, s, l } = hexParaHsl(hex);
  // Contraste: texto escuro sobre cores claras, branco sobre escuras.
  const fg = l >= 62 ? '340 10% 20%' : '0 0% 100%';
  const primaria = `${h} ${s}% ${l}%`;
  root.style.setProperty('--primary', primaria);
  root.style.setProperty('--primary-foreground', fg);
  root.style.setProperty('--ring', primaria);
  root.style.setProperty('--secondary', `${h} ${Math.min(s, 30)}% 95%`);
  root.style.setProperty('--secondary-foreground', `${h} ${Math.min(s, 30)}% 35%`);
  root.style.setProperty('--accent', `${h} ${Math.min(s, 50)}% 90%`);
  root.style.setProperty('--accent-foreground', `${h} ${Math.min(s, 50)}% 30%`);
  root.style.setProperty('--sidebar-primary', primaria);
  root.style.setProperty('--sidebar-primary-foreground', fg);
  root.style.setProperty('--sidebar-accent', `${h} ${Math.min(s, 30)}% 95%`);
  root.style.setProperty('--sidebar-accent-foreground', `${h} ${Math.min(s, 30)}% 35%`);
  root.style.setProperty('--sidebar-ring', primaria);
  localStorage.setItem(MARCA_STORAGE_KEY, hex);
}

/** Limpa o tema personalizado (usado no logout). */
export function limparTema() {
  aplicarTema(null);
}

/** Reaplica a cor guardada (usado no carregamento inicial). */
export function aplicarTemaDoStorage() {
  const hex = localStorage.getItem(MARCA_STORAGE_KEY);
  if (hex && HEX_VALIDO.test(hex)) {
    aplicarTema(hex);
  }
}

/** Recorta a imagem em quadrado central e devolve um Blob no formato original. */
export async function recortarQuadrado(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      i.src = url;
    });
    const lado = Math.min(img.width, img.height);
    const canvas = document.createElement('canvas');
    canvas.width = lado;
    canvas.height = lado;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível processar a imagem.');
    ctx.drawImage(
      img,
      (img.width - lado) / 2,
      (img.height - lado) / 2,
      lado,
      lado,
      0,
      0,
      lado,
      lado,
    );
    const tipo = file.type === 'image/webp' ? 'image/webp' : file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao gerar a imagem.'))), tipo, 0.92);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Carrega uma imagem por URL e devolve data URL (para embutir em PDF). */
export async function carregarImagemDataUrl(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Falha ao ler imagem.'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
