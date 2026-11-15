import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PlanoEscolhido = 'teste' | 'mensal' | 'anual';

const planos: { id: PlanoEscolhido; nome: string; preco: string; detalhe: string; selo?: string }[] = [
  { id: 'teste', nome: '40 dias grátis', preco: 'R$ 0', detalhe: 'Sem cartão de crédito. Assine só se gostar.', selo: 'Sem cartão' },
  { id: 'mensal', nome: 'Pro Mensal', preco: 'R$ 39,90/mês', detalhe: 'Cancele quando quiser.' },
  { id: 'anual', nome: 'Pro Anual', preco: 'R$ 359,00/ano', detalhe: 'Equivale a R$ 29,92/mês.', selo: 'Economize 25%' },
];

const beneficios = ['Agenda e agendamentos ilimitados', 'Ficha de clientes, anamnese e fotos', 'Caixa, recebimentos e relatórios', 'Lembretes e cobranças pelo WhatsApp'];

export function VitrinePlanos({ valor, onChange, disabled }: { valor: PlanoEscolhido; onChange: (p: PlanoEscolhido) => void; disabled?: boolean }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">Escolha como quer começar</p>
      <div role="radiogroup" aria-label="Planos" className="grid gap-2">
        {planos.map((p) => {
          const ativo = valor === p.id;
          return (
            <button key={p.id} type="button" role="radio" aria-checked={ativo} disabled={disabled} onClick={() => onChange(p.id)}
              className={cn('flex items-center gap-3 rounded-xl border p-3 min-h-11 text-left transition-colors',
                ativo ? 'border-belafy-ameixa ring-1 ring-belafy-ameixa' : 'border-border hover:bg-muted/50')}>
              <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                ativo ? 'border-belafy-ameixa bg-belafy-ameixa text-white' : 'border-muted-foreground/40')}>
                {ativo && <Check className="h-3 w-3" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-foreground">{p.nome}</span>
                  {p.selo && <span className="rounded-full bg-belafy-rosa px-2 py-0.5 text-[11px] font-medium text-belafy-ameixa">{p.selo}</span>}
                </span>
                <span className="block text-xs text-muted-foreground">{p.detalhe}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-belafy-ameixa">{p.preco}</span>
            </button>
          );
        })}
      </div>
      <ul className="grid gap-1 rounded-xl bg-muted/50 p-3">
        <li className="text-xs font-medium text-foreground">Todos os planos incluem:</li>
        {beneficios.map((b) => (
          <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5 text-belafy-ameixa shrink-0" />{b}</li>
        ))}
      </ul>
    </div>
  );
}
