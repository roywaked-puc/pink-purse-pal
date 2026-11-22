import { useMemo, useState, type ReactNode } from 'react';
import { Check, Lock, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyDisplay } from '@/components/ds/MoneyDisplay';
import { useToast } from '@/hooks/use-toast';
import {
  useAlterarLimiteEmLote, useAtendimentosPorFaixa, useDesfazerInclusaoFaixa, useExcluirFaixaEmLote, useIncluirFaixaEmLote,
} from '@/hooks/useServices';
import {
  analisarAlteracao, analisarExclusao, analisarInclusao, formatarFaixas, formatarIntervalo, referenciaValor, sugerirValor,
  type FaixaDias, type ModoValor, type MudancaFaixa, type StatusAlteracao,
} from '@/lib/replicarFaixa';
import { cn } from '@/lib/utils';
import type { Service } from '@/types';

export interface ServicoComFaixas {
  service: Service;
  faixas: FaixaDias[];
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  origem: Service;
  mudanca: MudancaFaixa;
  /** Outros serviços principais com manutenção, congelados no momento em que o Drawer abriu. */
  outros: ServicoComFaixas[];
}

const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

type Tom = 'ok' | 'aviso' | 'neutro';
function Chip({ tom, children, icone }: { tom: Tom; children: ReactNode; icone?: ReactNode }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
      tom === 'ok' && 'bg-primary/10 text-primary',
      tom === 'aviso' && 'bg-warning/15 text-foreground',
      tom === 'neutro' && 'bg-muted text-muted-foreground')}>
      {icone}{children}
    </span>
  );
}

/** Card de um serviço: checkbox (quando pode marcar) + nome + chip + conteúdo. */
function CardServico({ nome, chip, marcavel, marcado, onMarcar, children }: {
  nome: string; chip: ReactNode; marcavel: boolean; marcado: boolean;
  onMarcar: (v: boolean) => void; children?: ReactNode;
}) {
  return (
    <div className={cn('rounded-lg border p-3 space-y-2', marcado ? 'border-primary bg-primary/5' : 'border-border')}>
      <label className={cn('flex min-h-11 items-center gap-3', marcavel && 'cursor-pointer')}>
        {marcavel && <Checkbox checked={marcado} onCheckedChange={v => onMarcar(v === true)} className="h-5 w-5" />}
        <span className="flex-1 min-w-0 font-medium text-sm break-words">{nome}</span>
        {chip}
      </label>
      {children}
    </div>
  );
}

export function ReplicarFaixaDrawer({ open, onOpenChange, origem, mudanca, outros }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh]">
        <div className="relative mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col">
          <Button size="icon" variant="ghost" className="absolute right-2 top-1 z-10 h-11 w-11" aria-label="Fechar" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
          {mudanca.tipo === 'incluir' && <Incluir origem={origem} mudanca={mudanca} outros={outros} fechar={() => onOpenChange(false)} />}
          {mudanca.tipo === 'alterar' && <Alterar origem={origem} mudanca={mudanca} outros={outros} fechar={() => onOpenChange(false)} />}
          {mudanca.tipo === 'excluir' && <Excluir origem={origem} mudanca={mudanca} outros={outros} fechar={() => onOpenChange(false)} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface CorpoProps<T extends MudancaFaixa['tipo']> {
  origem: Service;
  mudanca: Extract<MudancaFaixa, { tipo: T }>;
  outros: ServicoComFaixas[];
  fechar: () => void;
}

const pai = (s: Service) => ({ id: s.id, description: s.description, color: s.color, techniqueName: s.techniqueName });

function Cabecalho({ selo, titulo, texto }: { selo: string; titulo: string; texto: string }) {
  return (
    <DrawerHeader className="pr-14 text-left">
      <p className="flex items-center gap-1 text-xs font-semibold text-primary"><Check className="h-3.5 w-3.5" />{selo}</p>
      <DrawerTitle>{titulo}</DrawerTitle>
      <DrawerDescription>{texto}</DrawerDescription>
    </DrawerHeader>
  );
}

function Corpo({ children }: { children: ReactNode }) {
  return <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-2">{children}</div>;
}

function Rodape({ children }: { children: ReactNode }) {
  return <DrawerFooter className="flex-row gap-2 border-t border-border">{children}</DrawerFooter>;
}

// ---------------------------------------------------------------------------
// (a) Incluir faixa
// ---------------------------------------------------------------------------

function Incluir({ origem, mudanca, outros, fechar }: CorpoProps<'incluir'>) {
  const { toast } = useToast();
  const incluir = useIncluirFaixaEmLote();
  const desfazer = useDesfazerInclusaoFaixa();
  const ref = referenciaValor(mudanca);
  const [modo, setModo] = useState<ModoValor>(ref ? 'mais_reais' : 'mesmo');
  const [marcados, setMarcados] = useState<Record<string, boolean>>({});
  const [valores, setValores] = useState<Record<string, string>>({});
  const [duracoes, setDuracoes] = useState<Record<string, string>>({});
  const [feito, setFeito] = useState<{ ids: string[]; linhas: { nome: string; de: number; ate: number; valor: number; duracao: number }[] } | null>(null);

  const itens = useMemo(() => outros.map(o => ({ ...o, analise: analisarInclusao(mudanca, o.faixas) })), [outros, mudanca]);
  const marcaveis = itens.filter(i => i.analise.status !== 'cobre');
  const isMarcado = (id: string, inicial: boolean) => marcados[id] ?? inicial;
  const valorDe = (i: (typeof itens)[number]) =>
    valores[i.service.id] ?? String(sugerirValor(modo, mudanca, i.analise.ultima));
  const duracaoDe = (id: string) => duracoes[id] ?? String(mudanca.nova.duration);
  const selecionados = marcaveis.filter(i => isMarcado(i.service.id, i.analise.marcadoInicial));
  const invalido = selecionados.some(i => !(parseFloat(valorDe(i)) > 0) || !(parseInt(duracaoDe(i.service.id), 10) > 0));

  const trocarModo = (m: ModoValor) => { setModo(m); setValores({}); };

  const aplicar = async () => {
    const lote = selecionados.map(i => ({
      service: i.service,
      faixa: { de: i.analise.novaDe, ate: i.analise.novaAte, amount: parseFloat(valorDe(i)), duration: parseInt(duracaoDe(i.service.id), 10) },
    }));
    try {
      const ids = await incluir.mutateAsync(lote.map(l => ({ pai: pai(l.service), faixa: l.faixa })));
      setFeito({ ids, linhas: lote.map(l => ({ nome: l.service.description, de: l.faixa.de, ate: l.faixa.ate, valor: l.faixa.amount, duracao: l.faixa.duration })) });
    } catch (e) {
      toast({ title: 'Nada foi aplicado', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const desfazerTudo = async () => {
    if (!feito) return;
    try {
      await desfazer.mutateAsync(feito.ids);
      toast({ title: 'Inclusão desfeita' });
      fechar();
    } catch (e) {
      toast({ title: 'Não foi possível desfazer', description: (e as Error).message, variant: 'destructive' });
    }
  };

  if (feito) {
    return (
      <>
        <DrawerHeader className="pr-14 text-left">
          <DrawerTitle className="flex items-center gap-2"><Check className="h-5 w-5 text-primary" />Faixa adicionada em {plural(feito.linhas.length, 'serviço', 'serviços')}</DrawerTitle>
        </DrawerHeader>
        <Corpo>
          {feito.linhas.map((l, idx) => (
            <div key={`${idx}-${l.nome}`}className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium break-words">{l.nome}</p>
              <p className="flex flex-wrap items-center gap-1 text-muted-foreground">
                {formatarIntervalo(l)} dias · <MoneyDisplay value={l.valor} size="sm" className="font-semibold" /> · {l.duracao} min
              </p>
            </div>
          ))}
        </Corpo>
        <Rodape>
          <Button variant="outline" className="h-11 flex-1" onClick={desfazerTudo} disabled={desfazer.isPending}>Desfazer</Button>
          <Button className="h-11 flex-1" onClick={fechar} disabled={desfazer.isPending}>Concluir</Button>
        </Rodape>
      </>
    );
  }

  const pilulas: { id: ModoValor; label: string }[] = ref ? [
    { id: 'mais_reais', label: `${ref.diferenca >= 0 ? '+' : '−'} ${formatBRL(Math.abs(ref.diferenca))} sobre a última` },
    { id: 'mais_pct', label: `${ref.percentual >= 0 ? '+' : '−'} ${Math.abs(ref.percentual)}% sobre a última` },
    { id: 'mesmo', label: `Mesmo valor (${formatBRL(mudanca.nova.amount)})` },
  ] : [];
  const explicacao = !ref || modo === 'mesmo'
    ? `Todos recebem ${formatBRL(mudanca.nova.amount)}.`
    : modo === 'mais_reais'
      ? `Cada serviço recebe o valor da própria última faixa ${ref.diferenca >= 0 ? 'mais' : 'menos'} ${formatBRL(Math.abs(ref.diferenca))}. Serviço sem faixas recebe ${formatBRL(mudanca.nova.amount)}.`
      : `Cada serviço recebe o valor da própria última faixa ${ref.percentual >= 0 ? 'mais' : 'menos'} ${Math.abs(ref.percentual)}%, arredondado para múltiplo de R$ 5. Serviço sem faixas recebe ${formatBRL(mudanca.nova.amount)}.`;

  return (
    <>
      <Cabecalho
        selo={`Faixa ${formatarIntervalo(mudanca.nova)} dias salva em ${origem.description}`}
        titulo="Aplicar nos outros serviços?"
        texto="Marque onde essa faixa também vale e confira o valor de cada um antes de aplicar."
      />
      <Corpo>
        {pilulas.length > 0 && (
          <div className="space-y-2 rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-semibold">Como sugerir o valor</p>
            <div className="flex flex-wrap gap-2">
              {pilulas.map(p => (
                <button key={p.id} type="button" onClick={() => trocarModo(p.id)}
                  className={cn('min-h-11 rounded-full border px-3 text-xs font-medium',
                    modo === p.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground')}>
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{explicacao}</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{selecionados.length} de {marcaveis.length} marcados</p>
        {itens.map(i => {
          const { status, novaDe, novaAte, ultima } = i.analise;
          const id = i.service.id;
          const marcado = status !== 'cobre' && isMarcado(id, i.analise.marcadoInicial);
          const chip = status === 'mesmas' ? <Chip tom="ok">Mesmas faixas</Chip>
            : status === 'diferentes' ? <Chip tom="aviso">Faixas diferentes</Chip>
              : <Chip tom="neutro">Já cobre {mudanca.nova.ate} dias</Chip>;
          const valor = valorDe(i);
          const duracao = duracaoDe(id);
          return (
            <CardServico key={id} nome={i.service.description} chip={chip} marcavel={status !== 'cobre'} marcado={marcado}
              onMarcar={v => setMarcados(p => ({ ...p, [id]: v }))}>
              <p className="text-xs text-muted-foreground">Hoje: {formatarFaixas(i.faixas)}</p>
              {status === 'diferentes' && (
                <p className="text-xs rounded-md bg-warning/10 p-2">
                  {i.faixas.length
                    ? `As faixas deste serviço terminam em ${ultima!.ate} dias. Se marcar, a nova faixa fica de ${novaDe} a ${novaAte} dias.`
                    : `Este serviço ainda não tem faixas. Se marcar, a nova faixa fica de 1 a ${novaAte} dias.`}
                </p>
              )}
              {status === 'cobre' && ultima && (
                <p className="text-xs text-muted-foreground">A faixa {formatarIntervalo(ultima)} já vai até {ultima.ate} dias. Nada a fazer aqui.</p>
              )}
              {marcado && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-primary">Nova {formatarIntervalo({ de: novaDe, ate: novaAte })} d</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor={`valor-${id}`} className="text-xs">Valor (R$)</Label>
                      <Input id={`valor-${id}`} className="h-11" type="number" inputMode="decimal" step="0.01" min="0" value={valor}
                        onChange={e => setValores(p => ({ ...p, [id]: e.target.value }))} />
                      {!(parseFloat(valor) > 0) && <p className="text-xs text-destructive">Informe um valor maior que zero</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`dur-${id}`} className="text-xs">Duração (min)</Label>
                      <Input id={`dur-${id}`} className="h-11" type="number" inputMode="numeric" min="15" step="15" value={duracao}
                        onChange={e => setDuracoes(p => ({ ...p, [id]: e.target.value }))} />
                      {!(parseInt(duracao, 10) > 0) && <p className="text-xs text-destructive">Informe a duração</p>}
                    </div>
                  </div>
                </div>
              )}
            </CardServico>
          );
        })}
      </Corpo>
      <Rodape>
        <Button variant="outline" className="h-11 flex-1" onClick={fechar} disabled={incluir.isPending}>Agora não</Button>
        <Button className="h-11 flex-1" onClick={aplicar} disabled={selecionados.length === 0 || invalido || incluir.isPending}>
          {selecionados.length === 0 ? 'Marque um serviço' : `Aplicar em ${plural(selecionados.length, 'serviço', 'serviços')}`}
        </Button>
      </Rodape>
    </>
  );
}

// ---------------------------------------------------------------------------
// (b) Alterar o "Até"
// ---------------------------------------------------------------------------

const STATUS_MARCAVEIS_ALTERACAO: StatusAlteracao[] = ['mesmas', 'tem', 'diferentes'];

function Alterar({ origem, mudanca, outros, fechar }: CorpoProps<'alterar'>) {
  const { toast } = useToast();
  const alterar = useAlterarLimiteEmLote();
  const [marcados, setMarcados] = useState<Record<string, boolean>>({});
  const itens = useMemo(() => outros.map(o => ({ ...o, analise: analisarAlteracao(mudanca, o.faixas) })), [outros, mudanca]);
  const marcaveis = itens.filter(i => STATUS_MARCAVEIS_ALTERACAO.includes(i.analise.status));
  const selecionados = marcaveis.filter(i => marcados[i.service.id] ?? i.analise.marcadoInicial);
  const antiga = { de: mudanca.de, ate: mudanca.fimAntigo };

  const aplicar = async () => {
    try {
      await alterar.mutateAsync(selecionados.map(i => ({ pai: pai(i.service), faixa: i.analise.faixa!, seguinte: i.analise.seguinte, fimNovo: mudanca.fimNovo })));
      toast({ title: `Limite alterado em ${plural(selecionados.length, 'serviço', 'serviços')}` });
      fechar();
    } catch (e) {
      toast({ title: 'Nada foi aplicado', description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <>
      <Cabecalho
        selo={`Limite alterado em ${origem.description}`}
        titulo="Mudar também nos outros serviços?"
        texto={`A faixa que terminava em ${mudanca.fimAntigo} dias passou a terminar em ${mudanca.fimNovo} dias. Valores e durações não mudam.`}
      />
      <Corpo>
        <p className="text-xs text-muted-foreground">{selecionados.length} de {marcaveis.length} marcados</p>
        {itens.map(i => {
          const { status, faixa, seguinte } = i.analise;
          const id = i.service.id;
          const marcavel = STATUS_MARCAVEIS_ALTERACAO.includes(status);
          const marcado = marcavel && (marcados[id] ?? i.analise.marcadoInicial);
          const chip = status === 'mesmas' ? <Chip tom="ok">Mesmas faixas</Chip>
            : status === 'tem' ? <Chip tom="ok">Tem {formatarIntervalo(antiga)}</Chip>
            : status === 'diferentes' ? <Chip tom="aviso">Faixas diferentes</Chip>
            : status === 'ja_esta' ? <Chip tom="neutro">Já está assim</Chip>
              : status === 'conflito' ? <Chip tom="aviso">Conflito</Chip>
                : <Chip tom="neutro">Não tem a faixa {formatarIntervalo(antiga)}</Chip>;
          return (
            <CardServico key={id} nome={i.service.description} chip={chip} marcavel={marcavel} marcado={marcado}
              onMarcar={v => setMarcados(p => ({ ...p, [id]: v }))}>
              {status === 'diferentes' && (
                <p className="text-xs rounded-md bg-warning/10 p-2">
                  Aqui a faixa é {formatarIntervalo(faixa!)}, com início diferente. Se marcar, ela fica {formatarIntervalo({ de: faixa!.de, ate: mudanca.fimNovo })} dias.
                </p>
              )}
              {marcavel && (
                <div className="space-y-0.5 text-xs">
                  <p><s className="text-muted-foreground">{formatarIntervalo(faixa!)}</s> → <span className="font-semibold">{formatarIntervalo({ de: faixa!.de, ate: mudanca.fimNovo })} dias</span></p>
                  {seguinte && (
                    <p><s className="text-muted-foreground">{formatarIntervalo(seguinte)}</s> → {formatarIntervalo({ de: mudanca.fimNovo + 1, ate: seguinte.ate })} dias <span className="text-muted-foreground">(ajuste automático)</span></p>
                  )}
                </div>
              )}
              {status === 'ja_esta' && <p className="text-xs text-muted-foreground">Já tem faixa terminando em {mudanca.fimNovo} dias. Hoje: {formatarFaixas(i.faixas)}</p>}
              {status === 'nao_tem' && <p className="text-xs text-muted-foreground">Hoje: {formatarFaixas(i.faixas)}</p>}
              {status === 'conflito' && (
                <p className="text-xs text-muted-foreground">
                  Hoje: {formatarFaixas(i.faixas)}. Para a faixa {formatarIntervalo(faixa!)} ir até {mudanca.fimNovo} dias: {i.analise.motivo}.
                </p>
              )}
            </CardServico>
          );
        })}
        <p className="text-xs rounded-md bg-muted p-2">Os chips de dias dos atendimentos já feitos passam a comparar com o novo limite.</p>
      </Corpo>
      <Rodape>
        <Button variant="outline" className="h-11 flex-1" onClick={fechar} disabled={alterar.isPending}>Só neste</Button>
        <Button className="h-11 flex-1" onClick={aplicar} disabled={selecionados.length === 0 || alterar.isPending}>
          {selecionados.length === 0 ? 'Marque um serviço' : `Aplicar em ${plural(selecionados.length, 'serviço', 'serviços')}`}
        </Button>
      </Rodape>
    </>
  );
}

// ---------------------------------------------------------------------------
// (c) Excluir faixa
// ---------------------------------------------------------------------------

function Excluir({ origem, mudanca, outros, fechar }: CorpoProps<'excluir'>) {
  const { toast } = useToast();
  const excluir = useExcluirFaixaEmLote();
  const [marcados, setMarcados] = useState<Record<string, boolean>>({});
  const { de, ate } = mudanca.removida;
  const idsCandidatos = useMemo(
    () => outros.flatMap(o => o.faixas.filter(f => f.de === de && f.ate === ate && f.id).map(f => f.id!)),
    [outros, de, ate],
  );
  const contagem = useAtendimentosPorFaixa(idsCandidatos);
  const carregando = idsCandidatos.length > 0 && !contagem.data;
  const itens = useMemo(
    () => outros.map(o => ({ ...o, analise: analisarExclusao(mudanca, o.faixas, contagem.data ?? {}) })),
    [outros, mudanca, contagem.data],
  );
  const marcaveis = carregando ? [] : itens.filter(i => i.analise.status === 'livre');
  const selecionados = marcaveis.filter(i => marcados[i.service.id] ?? i.analise.marcadoInicial);
  const intervalo = formatarIntervalo(mudanca.removida);

  const aplicar = async () => {
    try {
      await excluir.mutateAsync(selecionados.map(i => ({ pai: pai(i.service), faixa: i.analise.faixa!, seguinte: i.analise.seguinte })));
      toast({ title: `Faixa excluída de ${plural(selecionados.length, 'serviço', 'serviços')}` });
      fechar();
    } catch (e) {
      toast({ title: 'Nada foi excluído', description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <>
      <Cabecalho
        selo={`Faixa ${intervalo} dias excluída de ${origem.description}`}
        titulo="Excluir também dos outros serviços?"
        texto="Nos serviços marcados, a faixa seguinte passa a começar onde a excluída começava."
      />
      <Corpo>
        {contagem.isError ? (
          <p className="text-sm text-destructive">Não foi possível verificar os atendimentos. Feche e tente de novo.</p>
        ) : carregando ? (
          <p className="text-sm text-muted-foreground">Verificando atendimentos…</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{selecionados.length} de {marcaveis.length} marcados</p>
            {itens.map(i => {
              const { status, seguinte, atendimentos } = i.analise;
              const id = i.service.id;
              const marcavel = status === 'livre';
              const marcado = marcavel && (marcados[id] ?? i.analise.marcadoInicial);
              const chip = status === 'livre' ? <Chip tom="ok">Sem atendimentos</Chip>
                : status === 'em_uso' ? <Chip tom="neutro" icone={<Lock className="h-3 w-3" />}>Em uso</Chip>
                  : <Chip tom="neutro">Não tem</Chip>;
              return (
                <CardServico key={id} nome={i.service.description} chip={chip} marcavel={marcavel} marcado={marcado}
                  onMarcar={v => setMarcados(p => ({ ...p, [id]: v }))}>
                  {status === 'livre' && (
                    <p className="text-xs">
                      <span className="font-semibold">{intervalo} sai</span>
                      {seguinte && <> · {formatarIntervalo(seguinte)} passa a ser {formatarIntervalo({ de, ate: seguinte.ate })}</>}
                    </p>
                  )}
                  {status === 'em_uso' && (
                    <p className="text-xs text-muted-foreground">A faixa {intervalo} foi usada em {plural(atendimentos, 'atendimento', 'atendimentos')}. Fica mantida.</p>
                  )}
                  {status === 'nao_tem' && <p className="text-xs text-muted-foreground">Hoje: {formatarFaixas(i.faixas)}</p>}
                </CardServico>
              );
            })}
          </>
        )}
        <p className="text-xs rounded-md bg-muted p-2">
          Faixa que já tem atendimento nunca é apagada por aqui: o histórico da cliente continua apontando para ela.
        </p>
      </Corpo>
      <Rodape>
        <Button variant="outline" className="h-11 flex-1" onClick={fechar} disabled={excluir.isPending}>Só neste</Button>
        <Button variant="destructive" className="h-11 flex-1" onClick={aplicar} disabled={selecionados.length === 0 || excluir.isPending || carregando}>
          {selecionados.length === 0 ? 'Marque um serviço' : `Excluir de ${plural(selecionados.length, 'serviço', 'serviços')}`}
        </Button>
      </Rodape>
    </>
  );
}
