import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lerRespostaAjuda, prepararMensagensAjuda, type MensagemAjuda } from '@/lib/chatAjuda';
import { sanitizeChatError } from '@/lib/sanitizeError';

export function useChatAjuda(aberto: boolean) {
  const [mensagens, setMensagens] = useState<MensagemAjuda[]>([]);
  const [respondendo, setRespondendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const historico = useRef<MensagemAjuda[]>([]);
  const requisicao = useRef<AbortController | null>(null);
  const trava = useRef(false);

  useEffect(() => {
    if (!aberto) {
      requisicao.current?.abort();
      historico.current = [];
      setMensagens([]);
      setErro(null);
      setRespondendo(false);
      trava.current = false;
    }
    return () => { requisicao.current?.abort(); };
  }, [aberto]);

  const enviar = useCallback(async (pergunta: string): Promise<boolean> => {
    const conteudo = pergunta.trim();
    if (!aberto || trava.current || !conteudo || conteudo.length > 1000) return false;
    trava.current = true;
    setRespondendo(true);
    setErro(null);
    const controller = new AbortController();
    requisicao.current = controller;
    const anteriores = historico.current;
    const conversa: MensagemAjuda[] = [...anteriores, { papel: 'usuario', conteudo }];
    historico.current = conversa;
    setMensagens([...conversa, { papel: 'assistente', conteudo: '' }]);
    let resposta = '';
    let concluido = false;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw sanitizeChatError(401);
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ajuda`, {
        method: 'POST', signal: controller.signal,
        headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagens: prepararMensagensAjuda(conversa) }),
      });
      if (!res.ok || !res.body) throw sanitizeChatError(res.status);
      await lerRespostaAjuda(res.body, (evento) => {
        if (controller.signal.aborted) return;
        if (evento.erro) throw sanitizeChatError(evento.erro);
        if (evento.texto) {
          resposta += evento.texto;
          setMensagens([...conversa, { papel: 'assistente', conteudo: resposta }]);
        }
      });
      if (!resposta.trim()) throw sanitizeChatError();
      historico.current = [...conversa, { papel: 'assistente', conteudo: resposta }];
      concluido = true;
    } catch (falha) {
      if (!controller.signal.aborted) {
        const segura = falha instanceof Error && falha.message === sanitizeChatError(401).message
          ? falha.message : falha instanceof Error && [400, 402, 429].some((s) => falha.message === sanitizeChatError(s).message)
            ? falha.message : sanitizeChatError().message;
        setErro(segura);
        historico.current = anteriores;
        setMensagens(resposta ? [...conversa, { papel: 'assistente', conteudo: resposta }] : conversa);
      }
    } finally {
      if (requisicao.current === controller) {
        trava.current = false;
        setRespondendo(false);
      }
    }
    return concluido;
  }, [aberto]);

  return { mensagens, respondendo, erro, enviar };
}