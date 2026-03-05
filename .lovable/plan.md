

## Corrigir Campo Cliente Opcional no Formulário de Movimentação

### Problema
O componente `ClientAutocomplete` tem `required` fixo no `<Input>` (linha 67), tornando o campo sempre obrigatório — mesmo quando usado como campo opcional na movimentação avulsa.

### Solução

**Arquivo: `src/components/appointments/ClientAutocomplete.tsx`**
- Adicionar prop `required?: boolean` (default `false`) na interface
- Passar essa prop ao `<Input>` interno

**Arquivo: `src/components/transactions/TransactionForm.tsx`**
- No uso do `ClientAutocomplete` para o campo de cliente avulso (quando `!linkToAppointment`), **não** passar `required` (ficará `false`)
- No uso para vincular a agendamento, passar `required={true}` para manter obrigatório

