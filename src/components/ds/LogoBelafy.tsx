import { NOME_APP } from '@/lib/constantes';
import { cn } from '@/lib/utils';

type VarianteLogo = 'claro' | 'escuro' | 'mono';

interface LogoBelafyProps {
  /** claro (padrão, fundo claro) | escuro (fundo ameixa) | mono (uma cor) */
  variante?: VarianteLogo;
  /** Altura do símbolo em px (padrão 32). O nome escala junto (~75%). */
  tamanho?: number;
  /** Esconde o nome "belafy", mostrando só o símbolo. */
  somenteSimbolo?: boolean;
  className?: string;
}

const CORES: Record<VarianteLogo, { quadrado: string; b: string; ponto: string; nome: string }> = {
  claro: { quadrado: '#4A1F3F', b: '#FFFFFF', ponto: '#FF9EBB', nome: '#4A1F3F' },
  escuro: { quadrado: '#FF9EBB', b: '#4A1F3F', ponto: '#4A1F3F', nome: '#FFFFFF' },
  mono: { quadrado: '#1F1219', b: '#FFFFFF', ponto: '#1F1219', nome: '#1F1219' },
};

/**
 * Logo da plataforma Belafy (símbolo + nome). Cores fixas de marca:
 * não acompanham o tema de Minha Marca de cada conta.
 */
export function LogoBelafy({ variante = 'claro', tamanho = 32, somenteSimbolo = false, className }: LogoBelafyProps) {
  const cores = CORES[variante];
  const mostrarPonto = variante !== 'mono' && tamanho >= 20;

  return (
    <span
      role="img"
      aria-label={NOME_APP}
      className={cn('inline-flex items-center', className)}
      style={{ gap: tamanho * 0.25 }}
    >
      <svg
        width={tamanho}
        height={tamanho}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="64" height="64" rx="16" fill={cores.quadrado} />
        <path d="M22 14v36" stroke={cores.b} strokeWidth="8" strokeLinecap="round" />
        <circle cx="33" cy="39" r="11" fill="none" stroke={cores.b} strokeWidth="8" />
        {mostrarPonto && <circle cx="48" cy="16" r="4" fill={cores.ponto} />}
      </svg>
      {!somenteSimbolo && (
        <span
          className="font-outfit font-semibold leading-none"
          style={{ fontSize: tamanho * 0.75, color: cores.nome, letterSpacing: '-0.03em' }}
        >
          belafy
        </span>
      )}
    </span>
  );
}
