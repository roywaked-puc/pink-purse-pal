## Problema

No `AppointmentForm.tsx` o botão **Salvar** não bloqueia novos cliques enquanto a requisição está em andamento. Quando a rede fica lenta (criar cliente + criar serviço + criar agendamento podem ser 3 chamadas sequenciais ao Supabase), a usuária clica várias vezes e cada clique dispara `handleSubmit` novamente, gerando agendas duplicadas.

Causas concretas observadas no código:
1. `<Button type="submit">` sem `disabled` nem indicador de loading.
2. `handleSubmit` não tem guarda de reentrância — não existe flag tipo `isSubmitting`.
3. Como o formulário usa `mutateAsync` (não o `isPending` da mutation principal), o React Query também não bloqueia naturalmente.
4. A verificação de conflito de horário usa apenas a lista em cache (`appointments`); entre o 1º e o 2º clique o cache ainda não foi invalidado, então o duplicado passa pela validação.

## Solução

Pequena mudança apenas no `AppointmentForm.tsx` (frontend/apresentação, sem mexer em lógica de negócio nem em hooks):

1. Adicionar estado local `isSubmitting` (`useState(false)`).
2. No início de `handleSubmit`:
   - `if (isSubmitting) return;` (guarda de reentrância contra duplo-clique mesmo em ações rápidas).
   - `setIsSubmitting(true)` logo após validações síncronas.
3. Envolver a lógica de submit num `try/finally` para garantir `setIsSubmitting(false)` ao final (sucesso, erro ou conflito).
4. No botão **Salvar**:
   - `disabled={isSubmitting}`
   - Texto dinâmico: `Salvando...` quando `isSubmitting`, senão `Salvar`.
   - Ícone opcional de loader (`Loader2` do lucide-react com `animate-spin`).
5. Também desabilitar o botão **Cancelar** e o **Excluir** enquanto `isSubmitting` para evitar fechar o dialog no meio da gravação.
6. Bloquear o fechamento do Dialog por clique fora / ESC enquanto `isSubmitting` (passando `onOpenChange` que ignora quando `isSubmitting`).

## Resultado esperado

- O 2º clique não dispara nova chamada — fica visualmente claro que está salvando.
- Sem duplicações mesmo em conexões lentas.
- Sem mudanças em hooks, banco ou regras de negócio.

## Observação

Se desejar uma proteção adicional no banco (defesa em profundidade), poderíamos depois adicionar um índice único parcial em `appointments(user_id, date, client_id)` via migration — mas isso fica fora deste escopo por envolver dados/migração.
