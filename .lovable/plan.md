# Plano: descrição dinâmica de atendimentos

## Objetivo
Exibir uma descrição consistente dos atendimentos a partir do serviço estruturado atual e do número de manutenção salvo, sem alterar o campo legado `appointments.service`.

## Implementação
- Criar uma função única que monte a descrição: técnica, tipo, faixa de dias e manutenção escolhida.
- Usar fallback para o texto legado apenas em atendimentos sem vínculo válido com o catálogo, preservando históricos antigos.
- Aplicar a função nos cards da agenda mensal, semanal e lista, no dashboard, nos retornos a confirmar e no histórico/detalhe da ficha da cliente.
- Manter valor, horários, ações, filtros e regras de negócio inalterados.

## Validação
- Conferir manutenção editada com nova faixa e número.
- Conferir colocação sem menção a manutenção.
- Comparar a mesma descrição entre agenda, dashboard e ficha da cliente.
- Validar TypeScript, build e visual mobile.
