

## Plano: Atualizar Paleta de Cores para Sincronizar com Google Calendar

### Situacao Atual

O sistema usa 8 cores personalizadas:

| Cor | Hex |
|-----|-----|
| Vermelho | #EF4444 |
| Rosa | #EC4899 |
| Roxo | #8B5CF6 |
| Azul | #3B82F6 |
| Ciano | #06B6D4 |
| Verde | #10B981 |
| Amarelo | #F59E0B |
| Laranja | #F97316 |

### Nova Paleta (Cores do Google Calendar)

Substituiremos pelas 11 cores oficiais do Google Calendar:

| Nome | Hex | colorId |
|------|-----|---------|
| Tomate | #D50000 | 11 |
| Flamingo | #E67C73 | 4 |
| Tangerina | #F4511E | 6 |
| Banana | #F6BF26 | 5 |
| Salvia | #33B679 | 2 |
| Manjericao | #0B8043 | 10 |
| Pavao | #039BE5 | 7 |
| Mirtilo | #3F51B5 | 9 |
| Lavanda | #7986CB | 1 |
| Uva | #8E24AA | 3 |
| Grafite | #616161 | 8 |

---

### Alteracoes Necessarias

#### 1. ServiceList.tsx - Atualizar SERVICE_COLORS

```typescript
const SERVICE_COLORS = [
  { name: 'Tomate', value: '#D50000' },
  { name: 'Flamingo', value: '#E67C73' },
  { name: 'Tangerina', value: '#F4511E' },
  { name: 'Banana', value: '#F6BF26' },
  { name: 'Salvia', value: '#33B679' },
  { name: 'Manjericao', value: '#0B8043' },
  { name: 'Pavao', value: '#039BE5' },
  { name: 'Mirtilo', value: '#3F51B5' },
  { name: 'Lavanda', value: '#7986CB' },
  { name: 'Uva', value: '#8E24AA' },
  { name: 'Grafite', value: '#616161' },
];
```

#### 2. Edge Function - Mapeamento direto

Como as cores serao identicas, o mapeamento fica simples:

```typescript
const hexToColorId: Record<string, string> = {
  '#D50000': '11', // Tomate
  '#E67C73': '4',  // Flamingo
  '#F4511E': '6',  // Tangerina
  '#F6BF26': '5',  // Banana
  '#33B679': '2',  // Salvia
  '#0B8043': '10', // Manjericao
  '#039BE5': '7',  // Pavao
  '#3F51B5': '9',  // Mirtilo
  '#7986CB': '1',  // Lavanda
  '#8E24AA': '3',  // Uva
  '#616161': '8',  // Grafite
};

function getColorId(hex?: string): string | undefined {
  if (!hex) return undefined;
  return hexToColorId[hex.toUpperCase()] || hexToColorId[hex];
}
```

---

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/settings/ServiceList.tsx` | Atualizar array SERVICE_COLORS com as 11 cores do Google |
| `src/hooks/useAppointments.ts` | Buscar cor do servico e incluir na sincronizacao |
| `supabase/functions/google-calendar/index.ts` | Adicionar mapeamento hex -> colorId e incluir no evento |

---

### Compatibilidade com Cores Existentes

Servicos que ja tem cores antigas (como #EF4444) continuarao funcionando localmente. Ao sincronizar com o Google:
- Se a cor existir no mapeamento: usa o colorId correspondente
- Se nao existir: evento fica sem cor (usa padrao do Google)

Os usuarios podem editar os servicos para escolher as novas cores quando quiserem.

---

### Resultado Esperado

- Paleta de cores no cadastro de servicos tera as mesmas cores do Google Calendar
- Sincronizacao de cores sera exata (sem aproximacao)
- Eventos aparecerao com a mesma cor tanto no app quanto no Google Calendar

