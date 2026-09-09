# Corrigir os saldos dos caixas (sem duplicação de valores)

## O que a investigação mostrou

Não há duplicação. Nos 34 atendimentos divididos, o lançamento original foi **reduzido** e não mantido inteiro (ex.: R$ 200 viraram R$ 40 no caixa da empresa + R$ 160 no pessoal). A soma bate em todos, sem uma única inconsistência. Apagar os lançamentos originais, como sugerido, apagaria dinheiro real.

A conta que parecia impossível vem de dois recortes diferentes:

- **Saldos dos caixas**: contam pela data em que o lançamento foi criado no sistema.
- **Entrou no mês**: conta pela data do atendimento.

O ajuste retroativo dividiu também atendimentos de janeiro a agosto. Esses R$ 1.683,86 entraram nos saldos (criados em 05/09) mas não aparecem em "Entrou no mês" de setembro. Descontando: R$ 4.282,68 − R$ 1.683,86 = R$ 2.598,82, abaixo dos R$ 2.731,83 do mês. A matemática fecha.

## O que será feito

### 1. Saldos passam a valer a partir de 01/09/2026, pela data do atendimento
- Ajustar a data de início do controle de caixa para 01/09/2026.
- Os saldos deixam de usar a data de criação do lançamento e passam a usar a data do atendimento/movimentação.

### 2. Desfazer as divisões anteriores a 01/09
- Todo atendimento com data anterior a 01/09/2026 volta a ter o lançamento original inteiro, no escopo em que estava antes.
- As partes criadas pela divisão automática nesses atendimentos são removidas (são registros gerados pelo sistema, não pagamentos reais — nenhum histórico de pagamento se perde).
- Atendimentos de 01/09 em diante continuam divididos normalmente.

### 3. Corrigir a origem, não só os dados
Hoje a divisão automática é aplicada a qualquer atendimento pago, sem olhar a data de início do controle. Por isso, qualquer edição futura num atendimento antigo o dividiria de novo. A regra passa a ignorar atendimentos anteriores à data de início do caixa.

### 4. Verificação final
Conferir que Saldo Empresa + Saldo Pessoal (desde 01/09) fica menor ou igual a "Entrou no mês" — teste de sanidade a repetir sempre que mexer nessa área.

## Detalhes técnicos

- `public.caixa_reserva_apply(p_appointment_id)`: ler `caixa_inicio_em` junto de `caixa_reserva_ativo`/`caixa_reserva_valor`; se `v_app.date < caixa_inicio_em`, executar apenas o bloco de reversão (delete dos `is_caixa_reserva_split`, restauração de `caixa_scope_original`/`caixa_amount_original`), limpar `caixa_reserva_valor_aplicado` e retornar. Migração nova, sem tocar nas anteriores.
- `user_settings.caixa_inicio_em` → `2026-09-01 00:00:00-03` (run_sql, dado).
- Reversão em massa (run_sql): para cada `appointment_id` com transação `is_caixa_reserva_split = true` cujo agendamento tenha `date < 2026-09-01`, chamar a lógica de reversão — na prática basta um `UPDATE public.appointments SET caixa_reserva_valor_aplicado = caixa_reserva_valor_aplicado` nesses ids para o gatilho `trg_caixa_reserva_appointment` reaplicar a função já corrigida, que agora só reverte.
- `src/hooks/useCaixaSummary.ts`: o corte passa de `t.createdAt ?? t.date` para `t.date`. Comentários do arquivo atualizados.
- Nenhuma alteração em telas, relatórios ou no fluxo de lançamento.
