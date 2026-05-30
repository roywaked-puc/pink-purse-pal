Entendi o problema: ao editar um agendamento pelo formulário, selecionar “Atendido” e clicar em “Salvar”, o fluxo automático deveria continuar abrindo a pergunta de fotos e depois o reagendamento. Pelo código, existem alguns pontos frágeis que podem fazer parecer que “não faz nada”.

O que encontrei:

1. O formulário chama `updateAppointment(...)`, mas essa função não é aguardada.
   - Ou seja: o app tenta disparar o fluxo de fotos/reagendamento antes de ter certeza que o agendamento foi salvo no banco.
   - Se o salvamento falhar ou atrasar, a tela pode fechar/alterar estado de forma inconsistente.

2. O fluxo só dispara se o status anterior não era `atendido`.
   - Se o app já recebeu esse agendamento como `atendido` em memória, mesmo que visualmente pareça “confirmado”, o callback não dispara.
   - Isso pode acontecer por dados desatualizados ou por uma tentativa anterior parcialmente salva.

3. Ao clicar em “Salvar”, o callback chama `handleMarkAttended`, que pode abrir mais de um modal ao mesmo tempo.
   - Se existir saldo pendente, ele abre a tela de movimentação.
   - Ao mesmo tempo, tenta abrir o prompt de fotos.
   - Isso pode causar conflito entre diálogos e impedir a sequência esperada.

4. A tela de fotos só aparece automaticamente quando o agendamento tem `clientId`.
   - Se o cliente foi digitado como texto, mas não está vinculado corretamente ao cadastro, ele pula a pergunta de fotos e vai direto para o reagendamento.
   - No seu caso parece ter cliente, mas vale corrigir o fluxo para ficar mais previsível.

Plano de correção:

1. Tornar a atualização do agendamento aguardável
   - Ajustar o fluxo para usar `mutateAsync` ao salvar edição, garantindo que o banco conclua antes de abrir qualquer tela automática.

2. Detectar corretamente a mudança para “Atendido”
   - Guardar se o status mudou para `atendido` antes de salvar.
   - Depois do salvamento confirmado, disparar a sequência automática com o agendamento atualizado.

3. Organizar a sequência dos modais
   - Primeiro fechar o formulário.
   - Depois abrir a pergunta de fotos quando houver cliente vinculado.
   - Ao fechar fotos ou pular fotos, abrir o reagendamento.
   - Evitar abrir movimentação/fotos/reagendamento ao mesmo tempo.

4. Adicionar tratamento de erro visível
   - Se o salvamento falhar, mostrar mensagem amigável em vez de parecer que o botão não fez nada.

5. Manter o comportamento dos botões rápidos
   - O botão direto “Marcar como atendido” fora do formulário continuará funcionando, mas usando a mesma sequência mais segura.

Resultado esperado:

Ao editar um agendamento, selecionar “Atendido” e clicar em “Salvar”:

```text
Salvar agendamento
-> fechar formulário
-> abrir pergunta: Registrar fotos do atendimento?
-> se adicionar/fechar fotos
-> abrir Agendar Próxima Manutenção
```

Se houver saldo pendente, a cobrança não deve bloquear a sequência de fotos/reagendamento; ela precisa ser tratada sem impedir o fluxo principal.