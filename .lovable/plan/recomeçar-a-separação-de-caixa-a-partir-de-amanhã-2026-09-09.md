# Recomeçar a separação de caixa a partir de amanhã

## O que entendi

- Zerar apenas os saldos do **Caixa Empresa** e do **Caixa Pessoal** (a separação nova).
- A contagem recomeça em **09/09/2026, a partir de 00:00**.
- Nada de dinheiro é apagado: movimentações, pagamentos, agendamentos, relatórios e o "Entrou no mês" continuam exatamente como estão.

## O que vou fazer

1. Mudar a data de início do controle de caixa para 09/09/2026 00:00.
2. Desfazer as divisões automáticas já feitas nos recebimentos até 08/09: os pedaços criados pelo sistema somem e cada recebimento volta a ser um lançamento único, com o valor e a origem que tinha antes. Isso não muda nenhum valor total.
3. Conferir que os dois cartões de caixa ficam em R$ 0,00 e que o total recebido no mês continua o mesmo de agora (R$ 2.731,83).

## Como fica daqui pra frente

Todo recebimento lançado a partir de 09/09 é separado automaticamente: R$ 40,00 vão para o Caixa Empresa e o restante para o Caixa Pessoal. Recebimentos anteriores ficam de fora dessa separação.

## Detalhes técnicos

- `user_settings.caixa_inicio_em` = `2026-09-09 00:00:00-03`.
- Reversão dos splits com `date < caixa_inicio_em`: apagar linhas com `is_caixa_reserva_split = true` e restaurar `scope`/`amount` a partir de `caixa_scope_original`/`caixa_amount_original`, limpando esses campos e o `caixa_reserva_valor_aplicado` dos agendamentos envolvidos.
- Nenhuma mudança de código de tela; `useCaixaSummary` já corta pelo `caixa_inicio_em` usando a data do lançamento.
- Validação final: saldo empresa = 0, saldo pessoal = 0, nenhum split remanescente antes de 09/09, total de entradas do mês inalterado.
