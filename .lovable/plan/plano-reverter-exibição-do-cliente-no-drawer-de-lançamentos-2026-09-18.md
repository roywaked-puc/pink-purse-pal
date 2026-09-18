# Plano — Reverter exibição do cliente no drawer de lançamentos

## O que faremos
Desfazer a alteração recente em `src/components/dashboard/CaixaDetalheDrawer.tsx`, voltando ao formato anterior de exibição dos itens da lista:
- Primeira linha: descrição (ou categoria, se não houver descrição).
- Segunda linha: data, depois cliente (se houver descrição), depois categoria e conta.

## Por quê
A mudança anterior foi aplicada no componente errado da tela, e a usuária precisa do layout anterior de volta.

## Escopo
Apenas `src/components/dashboard/CaixaDetalheDrawer.tsx`. Nenhum outro arquivo é alterado.

## Validação
Após o ajuste, rodar `npx tsgo --noEmit` e `npm run build` para garantir que não quebrou nada.
