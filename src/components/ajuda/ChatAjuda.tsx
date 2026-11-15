import { useEffect, useRef, useState, type FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Send, X, MessageCircle } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChatAjuda } from '@/hooks/useChatAjuda';

const sugestoes = ['Como registro um pagamento?', 'O que é permuta?', 'Como funciona a separação de caixa?', 'Como cadastro as manutenções de um serviço?'];

export function ChatAjuda({ aberto, aoAbrir, perguntaInicial }: { aberto: boolean; aoAbrir: (aberto: boolean) => void; perguntaInicial?: string }) {
  const { mensagens, respondendo, erro, enviar } = useChatAjuda(aberto);
  const [pergunta, setPergunta] = useState('');
  const lista = useRef<HTMLDivElement>(null);
  const inicialEnviada = useRef(false);
  useEffect(() => { if (!aberto) { setPergunta(''); inicialEnviada.current = false; } }, [aberto]);
  useEffect(() => {
    if (!aberto || !perguntaInicial?.trim() || inicialEnviada.current) return;
    inicialEnviada.current = true;
    void enviar(perguntaInicial);
  }, [aberto, perguntaInicial, enviar]);
  useEffect(() => { lista.current?.scrollTo({ top: lista.current.scrollHeight }); }, [mensagens, respondendo, erro]);

  const perguntar = async (texto: string) => {
    setPergunta(texto);
    const sucesso = await enviar(texto);
    if (sucesso) setPergunta('');
  };
  const submit = (e: FormEvent) => { e.preventDefault(); void perguntar(pergunta); };

  return (
    <Drawer open={aberto} onOpenChange={aoAbrir}>
      <DrawerContent className="h-[85dvh] max-h-[92dvh] sm:max-w-2xl sm:mx-auto flex flex-col">
        <DrawerHeader className="flex items-start justify-between gap-3 border-b border-border text-left shrink-0">
          <div>
            <DrawerTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" />Assistente de ajuda</DrawerTitle>
            <DrawerDescription>Dúvidas sobre o app</DrawerDescription>
          </div>
          <DrawerClose asChild><Button size="icon" variant="ghost" className="h-11 w-11 shrink-0" aria-label="Fechar chat"><X className="h-5 w-5" /></Button></DrawerClose>
        </DrawerHeader>
        <div ref={lista} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4" aria-label="Conversa" aria-busy={respondendo}>
          {mensagens.length === 0 && <div className="grid gap-2 sm:grid-cols-2">{sugestoes.map((texto) => (
            <Button key={texto} variant="outline" className="h-auto min-h-12 whitespace-normal text-left justify-start py-3" onClick={() => void perguntar(texto)} disabled={respondendo}>{texto}</Button>
          ))}</div>}
          {mensagens.map((m, i) => <div key={i} className={m.papel === 'usuario' ? 'ml-6 rounded-lg bg-primary/10 px-3 py-2' : 'mr-3 min-w-0'}>
            <p className="text-xs font-semibold text-muted-foreground mb-1">{m.papel === 'usuario' ? 'Você' : 'Assistente'}</p>
            {m.conteudo ? <div className="text-sm leading-relaxed break-words [overflow-wrap:anywhere] space-y-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:whitespace-pre-wrap [&_a]:text-primary">
              <ReactMarkdown components={{ a: ({ children }) => <span>{children}</span>, img: () => null }}>{m.conteudo}</ReactMarkdown>
            </div> : respondendo && <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label="Preparando resposta" />}
          </div>)}
          {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        </div>
        <form onSubmit={submit} className="border-t border-border p-4 shrink-0 space-y-2">
          <div className="flex items-end gap-2">
            <Textarea value={pergunta} onChange={(e) => setPergunta(e.target.value)} maxLength={1000} disabled={respondendo} rows={2} className="resize-none min-w-0" placeholder="Escreva sua dúvida..." aria-label="Sua pergunta" />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={respondendo || !pergunta.trim()} aria-label="Enviar pergunta" title="Enviar pergunta">
              {respondendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-right">{pergunta.length}/1.000</p>
        </form>
      </DrawerContent>
    </Drawer>
  );
}