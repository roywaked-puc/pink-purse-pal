

## Incluir Cliente na Busca de Movimentações

### Alteração

Adicionar o campo `clientName` ao filtro de busca existente na página de Movimentações, e atualizar o placeholder do campo de busca para refletir a nova opção.

### Detalhes Técnicos

**Arquivo: `src/pages/Movimentacoes.tsx`**

1. No filtro de busca (linha 49-53), adicionar `t.clientName?.toLowerCase().includes(query)` como mais uma condição OR
2. Atualizar o placeholder do input de busca de "Buscar por banco, categoria ou descrição..." para "Buscar por banco, categoria, descrição ou cliente..."

Apenas duas linhas precisam ser alteradas. Nenhuma mudança de banco de dados necessária.

