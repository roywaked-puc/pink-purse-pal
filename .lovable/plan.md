
## Plano: Ajustar PDF do Relatorio Financeiro

### Problemas Identificados

1. **Orientacao**: O PDF atual esta em retrato (portrait), precisa ser paisagem (landscape)
2. **Descricao**: O campo descricao tem largura de apenas 40 unidades, limitando o texto
3. **Nomes das Contas**: O resumo por conta esta exibindo o ID (UUID) da conta ao inves do nome

### Alteracoes Necessarias

#### Arquivo: `src/pages/Relatorios.tsx`

**1. Mudar para Paisagem**
```typescript
// Antes (linha 130)
const doc = new jsPDF();

// Depois
const doc = new jsPDF('landscape');
```

**2. Criar Funcao Auxiliar para Nome da Conta**
```typescript
// Adicionar funcao helper (similar ao RelatorioMovimentacoes.tsx)
const getAccountName = (accountId: string): string => {
  const account = accounts.find(a => a.id === accountId || a.name === accountId);
  return account?.name || accountId;
};
```

**3. Ajustar Larguras das Colunas para Paisagem**

Em modo paisagem, a pagina tem ~277 unidades de largura disponivel. Redistribuir:

```typescript
// Tabela de Extrato - larguras ajustadas para paisagem
columnStyles: {
  0: { cellWidth: 25 },      // Data
  1: { cellWidth: 15 },      // Tipo (Emp/Pes)
  2: { cellWidth: 80 },      // Descricao (aumentado de 40 para 80)
  3: { cellWidth: 35 },      // Categoria
  4: { cellWidth: 30, halign: 'right' },  // Entrada
  5: { cellWidth: 30, halign: 'right' },  // Saida
  6: { cellWidth: 30, halign: 'right' },  // Saldo
},
```

**4. Corrigir Resumo por Conta**

Atualizar a geracao dos dados do resumo para usar o nome da conta:

```typescript
// Linha ~234 - accountData
const accountData = Object.entries(accountSummary).map(([account, values]) => {
  const balance = values.entradas - values.saidas;
  return [
    getAccountName(account),  // Usar funcao helper ao inves de 'account'
    formatCurrency(values.entradas),
    formatCurrency(values.saidas),
    (balance >= 0 ? '+' : '') + formatCurrency(balance),
  ];
});
```

---

### Resumo das Modificacoes

| Local | Alteracao |
|-------|-----------|
| Linha 130 | Mudar `new jsPDF()` para `new jsPDF('landscape')` |
| Apos imports/funcoes | Adicionar funcao `getAccountName` |
| Linhas 167-175 | Ajustar columnStyles com larguras maiores para paisagem |
| Linha 234-241 | Usar `getAccountName(account)` no resumo por conta |

---

### Resultado Esperado

- PDF em formato paisagem com mais espaco horizontal
- Campo descricao com o dobro do espaco (80 unidades vs 40)
- Nomes das contas exibidos corretamente (ex: "Nubank", "Dinheiro") ao inves de UUIDs
