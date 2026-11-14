export interface MensagemAjuda {
  papel: 'usuario' | 'assistente';
  conteudo: string;
}

/** O limite explícito do chat prevalece sobre o envio do histórico completo. */
export function prepararMensagensAjuda(mensagens: MensagemAjuda[]): MensagemAjuda[] {
  return mensagens.filter((m) => m.conteudo.trim()).slice(-10).map((m) => ({
    papel: m.papel, conteudo: m.conteudo.slice(0, 1000),
  }));
}

export interface EventoAjuda { texto?: string; erro?: number; fim?: boolean }

export async function lerRespostaAjuda(
  corpo: ReadableStream<Uint8Array>,
  receber: (evento: EventoAjuda) => void,
): Promise<void> {
  const leitor = corpo.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let terminou = false;
  try {
    while (true) {
      const { value, done } = await leitor.read();
      buffer += decoder.decode(value, { stream: !done });
      let fim = buffer.indexOf('\n\n');
      while (fim >= 0) {
        const frame = buffer.slice(0, fim);
        buffer = buffer.slice(fim + 2);
        for (const linha of frame.split('\n')) {
          if (!linha.startsWith('data: ')) continue;
          const evento: EventoAjuda = JSON.parse(linha.slice(6));
          receber(evento);
          if (evento.fim) terminou = true;
        }
        fim = buffer.indexOf('\n\n');
      }
      if (done) break;
    }
    if (!terminou) throw new Error('Resposta interrompida');
  } finally {
    leitor.releaseLock();
  }
}