
## Plano: Expandir Busca na Tela de Movimentações

### Objetivo

Expandir o campo de busca para pesquisar em múltiplos campos: banco, categoria e descrição, facilitando a localização de movimentações.

---

### Situação Atual

O campo de busca atualmente só pesquisa na descrição:

```typescript
.filter(t => searchQuery === '' || 
  (t.description?.toLowerCase().includes(searchQuery.toLowerCase())))
```

---

### Campos para Busca

| Campo | Origem | Exemplo |
|-------|--------|---------|
| Descrição | `t.description` (texto direto) | "Pagamento cliente X" |
| Categoria | `t.category` (texto direto) | "Serviços" |
| Banco/Conta | `t.account` (ID) → precisa converter para nome | "PAG BANK" |

---

### Solução

1. Importar `accounts` do AppContext
2. Criar função helper para obter nome da conta a partir do ID
3. Expandir a lógica de filtragem para buscar nos 3 campos

---

### Arquivo a Modificar

**`src/pages/Movimentacoes.tsx`**

#### Alteração 1: Importar accounts do AppContext (linha 24)

```typescript
// Antes
const { transactions, categories, deleteTransaction } = useApp();

// Depois
const { transactions, categories, accounts, deleteTransaction } = useApp();
```

#### Alteração 2: Criar função helper para nome da conta (após linha 33)

```typescript
// Helper para obter nome da conta a partir do ID
const getAccountName = (accountId: string): string => {
  const account = accounts.find(a => a.id === accountId);
  return account?.name || '';
};
```

#### Alteração 3: Expandir lógica de busca (linhas 39-40)

```typescript
// Antes
.filter(t => searchQuery === '' || 
  (t.description?.toLowerCase().includes(searchQuery.toLowerCase())))

// Depois
.filter(t => {
  if (searchQuery === '') return true;
  const query = searchQuery.toLowerCase();
  const accountName = getAccountName(t.account);
  return (
    t.description?.toLowerCase().includes(query) ||
    t.category?.toLowerCase().includes(query) ||
    accountName.toLowerCase().includes(query)
  );
})
```

#### Alteração 4: Atualizar placeholder do input (linha 101)

```typescript
// Antes
placeholder="Buscar na descrição..."

// Depois
placeholder="Buscar por banco, categoria ou descrição..."
```

#### Alteração 5: Adicionar accounts na dependência do useMemo (linha 42)

```typescript
// Antes
}, [transactions, filterScope, filterCategory, searchQuery]);

// Depois
}, [transactions, filterScope, filterCategory, searchQuery, accounts]);
```

---

### Resumo das Alterações

| Local | Alteração |
|-------|-----------|
| Linha 24 | Adicionar `accounts` na desestruturação |
| Após linha 33 | Criar função `getAccountName` |
| Linhas 39-40 | Expandir filtro para 3 campos |
| Linha 42 | Adicionar `accounts` nas dependências |
| Linha 101 | Atualizar placeholder |

---

### Resultado Esperado

- Usuário pode digitar nome de banco (ex: "PAG BANK") e encontrar movimentações
- Usuário pode digitar categoria (ex: "Serviços") e encontrar movimentações
- Busca por descrição continua funcionando
- Placeholder indica os campos de busca disponíveis
