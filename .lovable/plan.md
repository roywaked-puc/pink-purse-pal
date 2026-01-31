
## Plano: Tornar o Layout Responsivo para Desktop/Notebook

### Problema Identificado

O layout atual está limitado a `max-w-lg` (512px), otimizado apenas para mobile. Isso faz o conteúdo parecer muito pequeno em notebooks e desktops.

```text
Atual:
┌─────────────────────────────────────────────────────────────┐
│                         Notebook (1366px)                    │
│     ┌──────────────────┐                                    │
│     │   Conteúdo       │  ← Muito espaço vazio              │
│     │   (max 512px)    │                                    │
│     └──────────────────┘                                    │
└─────────────────────────────────────────────────────────────┘

Proposto:
┌─────────────────────────────────────────────────────────────┐
│                         Notebook (1366px)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Conteúdo expande até 1024px                   │ │
│  │          Cards em grid de 2 colunas                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

### Solução

Criar um layout adaptativo que:
1. Mantém a experiência mobile atual
2. Expande o conteúdo em telas maiores
3. Usa grids de múltiplas colunas quando há espaço

---

### Arquivos a Modificar

#### 1. MainLayout.tsx - Container Principal

Expandir a largura máxima para telas maiores.

```typescript
// Antes
<main className="pb-20 px-4 pt-6 max-w-lg mx-auto">

// Depois  
<main className="pb-20 px-4 pt-6 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
```

Breakpoints Tailwind:
- `max-w-lg` (512px) - Mobile
- `md:max-w-2xl` (672px) - Tablet
- `lg:max-w-4xl` (896px) - Notebook
- `xl:max-w-6xl` (1152px) - Desktop

---

#### 2. BottomNav.tsx - Navegação Inferior

Expandir a navegação para acompanhar o conteúdo.

```typescript
// Antes
<div className="flex items-center justify-around h-16 max-w-lg mx-auto">

// Depois
<div className="flex items-center justify-around h-16 max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
```

---

#### 3. Index.tsx - Dashboard

Usar grid de múltiplas colunas para os cards.

```typescript
// Cards de balanço - grid adaptativo
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

// Botões de ação
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">

// Lista de agendamentos em grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
```

---

#### 4. Movimentacoes.tsx - Lista de Transações

Usar grid para itens de transação em telas maiores.

```typescript
// Lista de transações
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
```

---

#### 5. Agendamentos.tsx - Calendário e Lista

Ajustar grid para cards de agendamento.

```typescript
// Cards de agendamento
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
```

---

#### 6. Configuracoes.tsx - Accordion

Usar grid para melhor distribuição visual.

```typescript
// Acordeões em grid
<Accordion type="single" collapsible className="grid grid-cols-1 md:grid-cols-2 gap-2">
```

---

### Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/components/layout/MainLayout.tsx` | Largura responsiva do container |
| `src/components/layout/BottomNav.tsx` | Largura responsiva da navegação |
| `src/pages/Index.tsx` | Grid de cards adaptativo |
| `src/pages/Movimentacoes.tsx` | Grid de transações |
| `src/pages/Agendamentos.tsx` | Grid de agendamentos |
| `src/pages/Configuracoes.tsx` | Grid de acordeões |

---

### Resultado Esperado

- **Mobile**: Mantém layout atual (1 coluna)
- **Tablet (768px+)**: Conteúdo mais largo, grids de 2 colunas
- **Notebook (1024px+)**: Área útil maior, melhor aproveitamento do espaço
- **Desktop (1280px+)**: Layout completo com todos os elementos visíveis

A experiência será mais confortável em notebooks sem perder a usabilidade mobile.
