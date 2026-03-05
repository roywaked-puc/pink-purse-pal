

## Remover Limites de Exibição de Agendamentos na Tela Principal

### Problema
A tela principal limita artificialmente a quantidade de agendamentos exibidos:
- "Próximos Agendamentos": mostra no máximo **5** (`.slice(0, 5)`)
- "Pendentes de Conclusão": mostra no máximo **10** (`.slice(0, 10)`)

Isso faz com que agendamentos pendentes de ação fiquem invisíveis.

### Solução

Remover os `.slice()` de ambas as listas para exibir **todos** os agendamentos que ainda precisam de ação.

### Alteração

**Arquivo: `src/pages/Index.tsx`**
- Linha ~60: remover `.slice(0, 5)` da lista `upcomingAppointments`
- Linha ~72: remover `.slice(0, 10)` da lista `pendingCompletionAppointments`

Apenas duas linhas precisam ser alteradas.

