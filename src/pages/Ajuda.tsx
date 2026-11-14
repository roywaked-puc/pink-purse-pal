import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, SearchX } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ds/EmptyState';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PrimeirosPassos } from '@/components/ajuda/PrimeirosPassos';
import { comoFaco, secoesManual, normalizarBusca, type BlocoManual, type SecaoManual } from '@/content/manual';

function textoBloco(b: BlocoManual): string {
  if (b.tipo === 'paragrafo') return `${b.destaque ?? ''} ${b.texto}`;
  if (b.tipo === 'lista') return b.itens.join(' ');
  if (b.tipo === 'subtitulo') return b.texto;
  return [...b.colunas, ...b.linhas.flat()].join(' ');
}

/** Filtra uma seção: título casa → seção inteira; senão só blocos/linhas que casam. */
function filtrarSecao(s: SecaoManual, termo: string): SecaoManual | null {
  if (!termo) return s;
  if (normalizarBusca(`${s.titulo} ${s.resumo}`).includes(termo)) return s;
  const blocos = s.blocos
    .map((b): BlocoManual | null => {
      if (b.tipo === 'tabela') {
        const linhas = b.linhas.filter((l) => normalizarBusca(l.join(' ')).includes(termo));
        return linhas.length ? { ...b, linhas } : null;
      }
      if (b.tipo === 'lista') {
        const itens = b.itens.filter((i) => normalizarBusca(i).includes(termo));
        return itens.length ? { ...b, itens } : null;
      }
      return normalizarBusca(textoBloco(b)).includes(termo) ? b : null;
    })
    .filter((b): b is BlocoManual => b !== null);
  return blocos.length ? { ...s, blocos } : null;
}

function Bloco({ b }: { b: BlocoManual }) {
  if (b.tipo === 'subtitulo') return <h3 className="font-semibold text-sm mt-4">{b.texto}</h3>;
  if (b.tipo === 'paragrafo')
    return <p className="text-sm leading-relaxed">{b.destaque && <strong>{b.destaque} </strong>}{b.texto}</p>;
  if (b.tipo === 'lista') {
    const Tag = b.ordenada ? 'ol' : 'ul';
    return (
      <Tag className={`text-sm space-y-1.5 pl-5 ${b.ordenada ? 'list-decimal' : 'list-disc'}`}>
        {b.itens.map((i) => <li key={i}>{i}</li>)}
      </Tag>
    );
  }
  return (
    <>
      <div className="space-y-2 md:hidden">
        {b.linhas.map((l) => (
          <div key={l.join('|')} className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="font-medium text-sm">{l[0]}</p>
            {l.slice(1).map((c, i) => (
              <p key={i} className="text-sm mt-1">
                <span className="text-xs text-muted-foreground block">{b.colunas[i + 1]}</span>{c}
              </p>
            ))}
          </div>
        ))}
      </div>
      <table className="hidden md:table w-full text-sm border border-border rounded-lg overflow-hidden">
        <thead className="bg-muted/50">
          <tr>{b.colunas.map((c) => <th key={c} className="text-left font-medium p-2">{c}</th>)}</tr>
        </thead>
        <tbody>
          {b.linhas.map((l) => (
            <tr key={l.join('|')} className="border-t border-border">
              {l.map((c, i) => <td key={i} className={`p-2 align-top ${i === 0 ? 'font-medium' : ''}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

const Ajuda = () => {
  const { hash } = useLocation();
  const [busca, setBusca] = useState('');
  const [aberta, setAberta] = useState<string>(hash.replace('#', '') || '');
  const termo = normalizarBusca(busca.trim());

  useEffect(() => {
    const id = hash.replace('#', '');
    if (!id) return;
    setAberta(id);
    const t = setTimeout(() => document.getElementById(`secao-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    return () => clearTimeout(t);
  }, [hash]);

  const perguntas = useMemo(
    () => comoFaco.filter((p) => !termo || normalizarBusca(`${p.pergunta} ${p.resposta}`).includes(termo)),
    [termo],
  );
  const secoes = useMemo(
    () => secoesManual.filter((s) => s.id !== 'primeiros-passos').map((s) => filtrarSecao(s, termo)).filter((s): s is SecaoManual => s !== null),
    [termo],
  );
  const vazio = termo && perguntas.length === 0 && secoes.length === 0;

  return (
    <MainLayout>
      <PageHeader title="Ajuda" subtitle="Manual do novo usuário" />
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar no manual..." className="pl-9" aria-label="Buscar no manual" />
      </div>

      {!termo && <div id="secao-primeiros-passos" className="mb-6 scroll-mt-4"><PrimeirosPassos /></div>}

      {vazio ? (
        <EmptyState icon={SearchX} title="Nada encontrado" description="Tente outra palavra, como agenda, sinal ou senha." />
      ) : (
        <>
          {perguntas.length > 0 && (
            <section className="mb-6">
              <h2 className="font-semibold mb-3">Como eu faço para...?</h2>
              <div className="grid gap-2 md:grid-cols-2">
                {perguntas.map((p) => (
                  <div key={p.pergunta} className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                    <p className="font-medium text-sm">{p.pergunta}</p>
                    <p className="text-sm text-muted-foreground mt-1">{p.resposta}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          <Accordion type="single" collapsible value={termo ? undefined : aberta} onValueChange={setAberta} className="space-y-2">
            {secoes.map((s) => (
              <AccordionItem key={s.id} value={s.id} id={`secao-${s.id}`} className="border rounded-lg px-4 scroll-mt-4">
                <AccordionTrigger className="hover:no-underline py-4 text-left">
                  <div>
                    <p className="font-semibold">{s.titulo}</p>
                    <p className="text-sm text-muted-foreground font-normal">{s.resumo}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  {s.blocos.map((b, i) => <Bloco key={i} b={b} />)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      )}
    </MainLayout>
  );
};

export default Ajuda;
