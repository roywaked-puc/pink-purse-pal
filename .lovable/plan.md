

## Plano: Corrigir Filtro de Conta no Relatório Financeiro

### Problema Identificado

No relatório financeiro, o filtro de conta não funciona porque:

1. **O que é salvo no select:** O nome da conta (ex: "PAG BANK")
2. **O que está nas transações:** O ID da conta (ex: "1fb70597-664d-4ebf-a212-f83e223b4b20")

Quando o usuário seleciona uma conta, a comparação falha porque está comparando nome com ID.

### Dados de Exemplo

```text
Transação armazenada:
  account: "1fb70597-664d-4ebf-a212-f83e223b4b20"

Conta PAG BANK:
  id: "1fb70597-664d-4ebf-a212-f83e223b4b20"
  name: "PAG BANK"

Filtro selecionado: "PAG BANK"
Comparação: "1fb70597-664d-4ebf-a212-f83e223b4b20" === "PAG BANK" → false
```

### Solução

Alterar o valor do SelectItem para usar o **ID** da conta ao invés do nome.

---

### Arquivo a Modificar

**`src/pages/Relatorios.tsx`**

#### Alteração 1: Mudar valor do SelectItem (linha 414)

```typescript
// Antes
<SelectItem key={account.id} value={account.name}>
  {account.name}
</SelectItem>

// Depois
<SelectItem key={account.id} value={account.id}>
  {account.name}
</SelectItem>
```

#### Alteração 2: Corrigir exibição no PDF (linha 147)

```typescript
// Antes
const accountText = `Conta: ${selectedAccount === 'todos' ? 'Todas' : selectedAccount}`;

// Depois
const accountText = `Conta: ${selectedAccount === 'todos' ? 'Todas' : getAccountName(selectedAccount)}`;
```

---

### Nota sobre Relatório de Agendamentos

O relatório de agendamentos não possui filtro por conta/banco. Se o usuário deseja adicionar esse filtro, seria uma nova funcionalidade a ser implementada separadamente.

---

### Resumo das Alterações

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/pages/Relatorios.tsx` | 414 | Mudar `value={account.name}` para `value={account.id}` |
| `src/pages/Relatorios.tsx` | 147 | Usar `getAccountName(selectedAccount)` para exibir nome no PDF |

---

### Resultado Esperado

- Filtro de conta funcionará corretamente
- Transações serão filtradas pelo ID da conta
- PDF continuará exibindo o nome legível da conta

