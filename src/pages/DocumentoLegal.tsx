import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { termos, privacidade, type BlocoLegal } from '@/content/legal';

function Bloco({ bloco }: { bloco: BlocoLegal }) {
  if (bloco.tipo === 'paragrafo') return (
    <ReactMarkdown components={{ a: ({ children, ...props }) => <a {...props} className="text-primary underline underline-offset-4" /> }}>
      {bloco.texto}
    </ReactMarkdown>
  );
  if (bloco.tipo === 'lista') return <ul className="list-disc pl-5 space-y-2">{bloco.itens.map((item) => <li key={item}>{item}</li>)}</ul>;
  return (
    <>
      <div className="space-y-3 md:hidden">
        {bloco.linhas.map((linha) => (
          <dl key={linha.join('|')} className="border border-border rounded-lg bg-card p-4 space-y-3 shadow-sm">
            {linha.map((valor, i) => (
              <div key={i}>
                <dt className="text-xs text-muted-foreground">{bloco.colunas[i]}</dt>
                <dd className={i === 0 ? 'font-semibold' : ''}>{valor}</dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
      <table className="hidden md:table w-full table-fixed text-sm border border-border">
        <thead className="bg-muted/50"><tr>{bloco.colunas.map((coluna) => <th key={coluna} scope="col" className="p-3 text-left align-top font-semibold">{coluna}</th>)}</tr></thead>
        <tbody>{bloco.linhas.map((linha) => <tr key={linha.join('|')} className="border-t border-border">{linha.map((valor, i) => <td key={i} className="p-3 align-top">{valor}</td>)}</tr>)}</tbody>
      </table>
    </>
  );
}

export default function DocumentoLegal() {
  const { pathname } = useLocation();
  const documento = pathname === '/termos' ? termos : privacidade;
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-10 break-words">
        <Button variant="ghost" asChild className="min-h-11 mb-6 -ml-3">
          <Link to="/auth"><ArrowLeft className="mr-2 h-4 w-4" />Voltar para entrar</Link>
        </Button>
        <header className="border-b border-border pb-6 mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold leading-tight">{documento.titulo}</h1>
          <p className="text-sm text-muted-foreground mt-3">{documento.data}</p>
        </header>
        <article className="text-sm sm:text-base leading-relaxed space-y-8">
          <div className="space-y-4">{documento.introducao.map((bloco, i) => <Bloco key={i} bloco={bloco} />)}</div>
          {documento.secoes.map((secao) => (
            <section key={secao.titulo} className="space-y-4">
              <h2 className="font-semibold text-lg leading-snug">{secao.titulo}</h2>
              {secao.blocos.map((bloco, i) => <Bloco key={i} bloco={bloco} />)}
            </section>
          ))}
        </article>
        <nav aria-label="Documentos legais" className="border-t border-border mt-10 pt-5 flex flex-wrap gap-x-6">
          <Button variant="link" asChild className="min-h-11 px-0"><Link to="/termos">Termos de Uso</Link></Button>
          <Button variant="link" asChild className="min-h-11 px-0"><Link to="/privacidade">Política de Privacidade</Link></Button>
        </nav>
      </main>
    </div>
  );
}