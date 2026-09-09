# Detalhe do atendimento ao clicar no histórico da ficha da cliente

## O que muda para você
Na ficha da cliente (aba Dados → Histórico de atendimentos), cada card passa a ser clicável. Ao tocar, abre um painel deslizante (padrão do app) com todas as informações daquele atendimento, sem sair da ficha.

## Conteúdo do painel de detalhes
- **Data e horário** completos + duração do serviço (ex: 60 min).
- **Serviço com contexto**: além do nome, mostra o tipo já legível no próprio nome (ex: "Volume Egípcio Preto — 1ª manutenção de 20 dias") e, quando for um retorno gerado, a etiqueta "🔄 Retorno".
- **Status do atendimento** (Pendente / Confirmado / Atendido / Cancelado) e **situação de pagamento** (Pago / Não pago / Sinal), com valor total, quanto já foi recebido e o que falta, se houver.
- **Observações do atendimento** (campo que hoje não aparece em lugar nenhum na ficha) em destaque, quando existir.
- **Divisão de caixa**: quando o caixa empresa/pessoal estiver ativo e o atendimento tiver pagamento, mostra quanto foi para cada caixa (mesma lógica já usada no card da agenda).
- **Pagamentos recebidos**: lista dos lançamentos vinculados àquele atendimento (data, descrição, valor), lendo o que já existe em Movimentações — útil quando um atendimento foi pago em duas vezes ou em contas diferentes.
- **Fotos do atendimento**: se houver fotos vinculadas a esse atendimento, atalho para abrir o visualizador de fotos já existente.

## Decisões de UX (pensando no dia a dia)
- **Painel deslizante, não página nova**: a profissional confere o detalhe e volta ao histórico com um toque — fluxo contínuo, padrão mobile-first do app.
- **Só leitura**: nada de editar por aqui nesta etapa, para não criar dois caminhos de edição. (Se quiser, depois adicionamos um botão "Editar" que leva ao fluxo da agenda.)
- **Card com affordance**: seta/chevron e realce ao tocar, para ficar claro que é clicável.
- Mantém intocado o que já funciona: ordenação, selos de status, cálculo "X dias desde o anterior".

## Detalhes técnicos
- Editar apenas `src/pages/ClienteFicha.tsx`: transformar os cards do histórico em botões e adicionar um `Sheet` (mesmo padrão do `FormSheet`, bottom no mobile / direita no desktop).
- Dados já disponíveis via `useApp()` (appointments, transactions) — nenhuma query nova, nenhuma mudança no banco.
- Reutilizar lógica de pagamento e caixa do `AppointmentPreview` (status por paidAmount, split empresa/pessoal com `useUserSettings`).
- Fotos: filtrar `client_photos` pelo `appointmentId` via hook existente (`useClientPhotos`), abrindo o diálogo de fotos já existente.
- Textos em português; sem alteração de banco, sem deploy.
