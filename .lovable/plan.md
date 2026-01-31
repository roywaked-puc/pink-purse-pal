

## Plano: Ajustar Filtro de Banco para Usar Nome

### Situação Atual

As transações armazenam o **ID** (UUID) da conta no campo `account`:
```text
Transação: account = "67236522-7922-4075-9cb4-de1cfe528ab6"
Conta: id = "67236522-7922-4075-9cb4-de1cfe528ab6", name = "Dinheiro"
```

O Select já usa o **nome** como valor (linha 488):
```typescript
<SelectItem key={acc.id} value={acc.name}>{acc.name}</SelectItem>
```

### Problema

A comparação atual (linha 94) compara diretamente:
```typescript
if (selectedAccount !== 'todos' && t.account !== selectedAccount) return false;
```

Isso falha porque `t.account` é um UUID e `selectedAccount` é um nome.

### Solução

Criar uma função helper para encontrar o ID da conta a partir do nome selecionado e usar esse ID na comparação.

---

### Arquivo a Modificar

**`src/pages/RelatorioMovimentacoes.tsx`**

#### Alteração 1: Adicionar função helper (após linha 68)

```typescript
// Helper function to get account ID from name
const getAccountIdByName = (accountName: string, accounts: { id: string; name: string }[]): string | null => {
  const account = accounts.find(a => a.name === accountName);
  return account?.id || null;
};
```

#### Alteração 2: Ajustar a lógica de filtragem (linha 94)

```typescript
// Antes
if (selectedAccount !== 'todos' && t.account !== selectedAccount) return false;

// Depois
if (selectedAccount !== 'todos') {
  const accountId = getAccountIdByName(selectedAccount, accounts);
  if (t.account !== accountId) return false;
}
```

---

### Resumo das Alterações

| Arquivo | Local | Alteração |
|---------|-------|-----------|
| `src/pages/RelatorioMovimentacoes.tsx` | Após linha 68 | Adicionar função `getAccountIdByName` |
| `src/pages/RelatorioMovimentacoes.tsx` | Linha 94 | Usar `getAccountIdByName` na comparação |

---

### Resultado Esperado

- O filtro de banco continuará exibindo nomes para o usuário
- A filtragem funcionará corretamente convertendo nome para ID internamente
- Nenhuma mudança visual para o cliente

