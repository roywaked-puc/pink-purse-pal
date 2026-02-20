
## Ocultar/Mostrar Cards de Saldo Financeiro

### Problema
Na tela inicial, os cards com "Saldo da Empresa", "Saldo Pessoal" e "Gastos do Mês" ficam expostos quando a atendente usa o sistema na frente da cliente. Isso expõe informações financeiras confidenciais em momentos inoportunos.

### Solução

Adicionar um botão de olho (ícone `Eye` / `EyeOff`) próximo ao título da seção de saldos. Ao clicar, os cards somem e são substituídos por uma barra discreta indicando que os saldos estão ocultos. A preferência é salva no `localStorage` para persistir entre sessões.

### Comportamento

- Estado padrão: cards visíveis (comportamento atual)
- Ao clicar no olho: cards desaparecem, substituídos por faixa com texto "Saldos ocultos" e ícone de olho para reexibir
- A preferência é lembrada (localStorage) — se a atendente ocultou, fica oculto mesmo após recarregar
- Transição suave com animação CSS

### Alterações

#### `src/pages/Index.tsx`
- Importar `Eye`, `EyeOff` do `lucide-react`
- Adicionar estado `const [balancesVisible, setBalancesVisible] = useState(() => localStorage.getItem('balancesVisible') !== 'false')`
- Ao alternar, salvar em `localStorage`
- No `PageHeader`, adicionar botão de olho via prop `action`
- Envolver os cards em bloco condicional: se visível → mostra os cards; se oculto → mostra barra discreta "Saldos ocultos — clique para exibir"

#### `src/components/dashboard/BalanceCard.tsx`
- Nenhuma alteração necessária

### Resultado Visual

```text
┌─────────────────────────────────────┐
│ Olá! 👋                        [👁] │  ← botão de olho no canto
│ Seu resumo financeiro               │
├─────────────────────────────────────┤
│  [Saldo da Empresa]  [R$ 1.200,00]  │  ← visível (padrão)
│  [Saldo Pessoal]     [R$   800,00]  │
│  [Gastos do Mês]     [R$   300,00]  │
└─────────────────────────────────────┘

Após clicar no olho:

┌─────────────────────────────────────┐
│ Olá! 👋                        [👁] │
│ Seu resumo financeiro               │
├─────────────────────────────────────┤
│  👁 Saldos ocultos — toque para exibir │
└─────────────────────────────────────┘
```

### Seção Técnica

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Index.tsx` | Estado `balancesVisible` + toggle com localStorage + UI condicional + botão no PageHeader |

Apenas um arquivo precisa ser modificado. Nenhuma alteração de banco de dados é necessária.
