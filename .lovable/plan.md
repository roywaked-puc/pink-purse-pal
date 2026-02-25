

## Adicionar Campo "Cliente" Opcional na Movimentação

### Problema
Quando a movimentação não é vinculada a um agendamento, não há como registrar qual cliente está associada a ela. O campo "Cliente" seria útil como referência opcional.

### Alterações Necessárias

#### 1. Banco de Dados
Adicionar coluna `client_name` (texto, nullable) na tabela `transactions` para armazenar o nome do cliente como referência.

```sql
ALTER TABLE public.transactions ADD COLUMN client_name text;
```

#### 2. Tipo `Transaction` (`src/types/index.ts`)
Adicionar campo opcional `clientName?: string` na interface Transaction.

#### 3. Hook `useTransactions.ts`
- No mapeamento de leitura: mapear `client_name` para `clientName`
- No insert/update: enviar `client_name` ao banco

#### 4. Formulário `TransactionForm.tsx`
- Adicionar estado `referenceClientName` para o campo de cliente avulso
- Quando `linkToAppointment` estiver **desmarcado** e for uma nova transação (ou edição), mostrar o campo `ClientAutocomplete` com label "Cliente (opcional)" -- sem asterisco vermelho
- Ao salvar, incluir `clientName` nos dados da transação
- Ao carregar transação para edição, popular o campo com o valor salvo

#### 5. Exibição `TransactionItem.tsx`
- Se a transação tiver `clientName` (e não estiver vinculada a agendamento), exibir o nome do cliente abaixo da categoria/conta

### Seção Técnica

| Arquivo | Alteração |
|---------|-----------|
| Migration SQL | `ALTER TABLE public.transactions ADD COLUMN client_name text;` |
| `src/types/index.ts` | Adicionar `clientName?: string` na interface `Transaction` |
| `src/hooks/useTransactions.ts` | Mapear `client_name` no select e no insert/update |
| `src/components/transactions/TransactionForm.tsx` | Campo `ClientAutocomplete` visível quando não vinculado a agenda, estado + lógica de reset/load |
| `src/components/transactions/TransactionItem.tsx` | Exibir nome do cliente quando presente |

