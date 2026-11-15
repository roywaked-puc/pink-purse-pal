import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const perguntasProntas = [
  'Como registro um pagamento?',
  'O que é permuta?',
  'Como cadastro as manutenções de um serviço?',
];

/** Card de destaque que abre o chat da assistente, com perguntas prontas. */
export function CardChatAssistente({ aoAbrir }: { aoAbrir: (pergunta?: string) => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => aoAbrir()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoAbrir(); } }}
      className="mb-4 cursor-pointer rounded-xl border border-border bg-primary p-4 text-primary-foreground shadow-sm"
      aria-label="Abrir chat da assistente"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20">
          <MessageCircle className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">Tire suas dúvidas com a assistente</p>
          <p className="text-sm text-primary-foreground/90">Pergunte como fazer qualquer coisa no app</p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 md:flex-row">
        {perguntasProntas.map((texto) => (
          <button
            key={texto}
            type="button"
            onClick={(e) => { e.stopPropagation(); aoAbrir(texto); }}
            className="min-h-11 flex-1 rounded-full border border-primary-foreground/40 bg-primary-foreground/10 px-4 py-2 text-left text-sm md:text-center"
          >
            {texto}
          </button>
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        className="mt-3 min-h-11 w-full bg-background text-primary hover:bg-background/90"
        onClick={(e) => { e.stopPropagation(); aoAbrir(); }}
      >
        Fazer uma pergunta
      </Button>
    </div>
  );
}
