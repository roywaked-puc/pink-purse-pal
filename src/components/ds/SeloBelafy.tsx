import { LogoBelafy } from './LogoBelafy';

/**
 * Selo discreto "feito com belafy". Usado apenas no fim do conteúdo
 * da página Meu Dia e da página Configurações (rola junto com a página).
 */
export function SeloBelafy() {
  return (
    <div className="mt-6 flex items-center justify-center gap-1.5">
      <span className="text-[13px] text-muted-foreground">feito com</span>
      <LogoBelafy tamanho={18} />
    </div>
  );
}
