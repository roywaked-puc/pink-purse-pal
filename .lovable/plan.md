

## Plano: Adicionar Tooltips de Ajuda nos Campos de Credenciais

### Objetivo

Adicionar icones de ajuda (?) ao lado dos labels "Client ID" e "Client Secret" com tooltips explicando onde obter cada informacao.

---

### Alteracao no Componente

**Arquivo:** `src/components/settings/GoogleCalendarSettings.tsx`

#### Mudancas:

1. Importar componente `Tooltip` do shadcn/ui
2. Importar icone `HelpCircle` do lucide-react
3. Adicionar tooltip ao lado do label "Client ID"
4. Adicionar tooltip ao lado do label "Client Secret"

---

### Visual Final

```text
Client ID [?]  <-- tooltip: "Encontrado em Google Cloud Console > APIs e Servicos > Credenciais > OAuth 2.0 Client IDs"
[____________________________]

Client Secret [?]  <-- tooltip: "Mostrado ao criar a credencial OAuth 2.0. Se perdeu, crie uma nova credencial."
[________________________] [eye]
```

---

### Codigo do Tooltip

```tsx
<div className="flex items-center gap-2">
  <Label htmlFor="clientId">Client ID</Label>
  <Tooltip>
    <TooltipTrigger asChild>
      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <p>Encontrado em Google Cloud Console → APIs e Servicos → Credenciais → OAuth 2.0 Client IDs</p>
    </TooltipContent>
  </Tooltip>
</div>
```

---

### Imports Adicionais

```tsx
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
```

---

### Arquivo a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/settings/GoogleCalendarSettings.tsx` | Adicionar tooltips de ajuda nos campos Client ID e Client Secret |

