import { z } from 'npm:zod@3.25.76';

export const pedidoChat = z.object({
  mensagens: z.array(z.object({
    papel: z.enum(['usuario', 'assistente']),
    conteudo: z.string().trim().min(1).max(1000),
  }).strict()).min(1).max(10),
}).strict();