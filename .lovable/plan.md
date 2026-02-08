

## Correção: Mostrar todos os agendamentos na visualização de lista

### Problema

Na view de **Lista** da página `/agendamentos`, os agendamentos passados ("Anteriores") estão limitados a apenas **5 itens** devido a um `.slice(0, 5)` na linha 404 do arquivo `src/pages/Agendamentos.tsx`.

Não há filtro por status -- todos os status (pendente, confirmado, atendido, cancelado) já são exibidos corretamente. O único problema é a limitação de quantidade nos agendamentos passados.

### Alteração

**Arquivo:** `src/pages/Agendamentos.tsx` (linha 404)

Remover o `.slice(0, 5)` para exibir todos os agendamentos passados:

```text
Antes:  {pastAppointments.slice(0, 5).map((a, i) => renderAppointment(a, i))}
Depois: {pastAppointments.map((a, i) => renderAppointment(a, i))}
```

### Seção Técnica

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/pages/Agendamentos.tsx` | 404 | Remover `.slice(0, 5)` do mapeamento de `pastAppointments` |

Isso garante que ao clicar na aba Lista, todos os agendamentos aparecem, independente do status ou da data.
