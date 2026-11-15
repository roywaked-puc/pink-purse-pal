# Assinaturas do Belafy via sua conta Stripe

## Inspeção concluída
- O banco real ainda não possui `assinaturas` nem funções de plano/limite. Há **duas contas existentes**; ambas receberão isenção Pro, sem cobrança.
- `appointments.created_at` existe, é `timestamptz`, obrigatório e tem default `now()`. Há `user_id`, `confirmation_status`, `parent_appointment_id` e as políticas próprias de leitura/criação/edição/exclusão.
- `handle_new_user()` aplica o modelo inicial e mantém categorias/contas básicas como fallback. O trigger de cadastro já chama essa função; sua lógica será preservada.
- Não encontrei inserção automática de retornos: o CRM calcula sugestões e o formulário cria os registros explicitamente. Após expiração, toda nova criação exige assinatura; não haverá contagem mensal.
- Não encontrei integração Stripe no código; a chave de teste e os preços ainda não foram verificados na sua conta. O produto de produção informado é `prod_VdQ8jMBJ1hmfLt`.

## 1. Conectar Stripe e preparar preços
- Depois da aprovação, abrir Connect Stripe para sua chave restrita de teste. Lovable também oferece pagamentos Stripe integrados sem chave própria; esta proposta respeita sua solicitação de usar sua própria conta.
- Validar permissões e criar, idempotentemente, o produto de teste Belafy Pro e preços BRL: **R$ 39,90/mês** e **R$ 359,00/ano**, cobrado de uma vez a cada ano.
- Usar configuração segura para IDs mensal/anual, sem aceitar IDs ou valores enviados pelo navegador. Separar teste/live e validar moeda, intervalo e valor dos preços.
- Manter a responsabilidade tributária da sua conta Stripe existente; não ativar novo serviço tributário pago sem autorização.

## 2. Banco e autorização de criação
- Nova migração incremental cria `public.assinaturas`, uma linha por `user_id` UUID, com os campos solicitados: plano, periodicidade, status, teste_ate, stripe_customer_id, stripe_subscription_id, periodo_atual_fim, cancelar_no_fim_do_periodo, isento e timestamps.
- `periodicidade` e identificadores Stripe podem ser nulos enquanto não houver assinatura. Identificadores Stripe únicos quando preenchidos.
- Usuária autenticada recebe somente SELECT da própria linha. Escritas ficam para service_role/funções internas autorizadas; nunca para o cliente. GRANTs e RLS na mesma migração.
- Preservar o corpo atual de `handle_new_user()` e acrescentar criação idempotente da assinatura: `teste_ate = NEW.created_at + 40 dias`, `plano='sem_plano'`, `isento=false`. Plano aceita somente `pro` e `sem_plano`.
- Backfill das duas contas atuais com `isento=true`, sem modificar seus dados de negócio.
- Criar `plano_efetivo()` usando exclusivamente `auth.uid()`, sem parâmetro de usuário: retorna `isento`, `teste`, `pro` ou `expirado`. Expiração não exige tarefa agendada nem apagamento.
- Criar trigger BEFORE INSERT em appointments: bloquear quando o plano efetivo for `expirado`, sem contagem mensal, índice de contagem ou serialização por limite. Falta de sessão nunca concede acesso.
- Conferência concluída: app, Edge Function Google Calendar e funções/triggers de caixa não alteram `appointments.created_at` nem `user_id`. Preservar esses campos após inserção, sem reescrever histórico ou restringir os demais campos de edição.
- RPC autenticada de resumo usa somente `auth.uid()`, sem user_id vindo do cliente, com estado e prazo; não retorna contagem mensal.
- Erro identificável `P0010` / `ASSINATURA_NECESSARIA`, preservado pelo hook para abrir o paywall.
- O bloqueio não se aplica a UPDATE: editar, reagendar, concluir e receber continuam funcionando. Nenhuma mudança em financeiro, caixa, permuta, anamnese ou Google Calendar.

## 3. Checkout, portal e webhook
- Edge Functions `criar-checkout-assinatura`, `gerenciar-assinatura` e `stripe-webhook`; helpers comuns em `_shared`.
- Checkout/portal validam sessão no servidor, corpo da requisição e URLs de retorno. Checkout hospedado em `subscription`, BRL e locale `pt-BR`; associa user_id em client_reference_id e metadata do customer/assinatura.
- Reutilizar customer por usuária e bloquear novas assinaturas duplicadas. Usar chaves de idempotência ao criar customer/checkout quando apropriado.
- Checkout respeita meios habilitados e elegíveis no painel: cartões, Apple Pay, Google Pay e Link conforme dispositivo/conta. Não prometer que todos aparecerão em todos os aparelhos.
- **Pix:** a documentação atual já oferece **Pix Automático para assinaturas via Checkout**, diferente do Pix avulso. Verificar elegibilidade da sua conta, versão de API e mandato mensal/anual antes de disponibilizar; testar os dois intervalos. Se não estiver disponível, informar e manter os meios compatíveis, sem simular Pix recorrente. Referências: [assinaturas com Pix](https://docs.stripe.com/billing/subscriptions/pix) e [mudança de API](https://docs.stripe.com/changelog/dahlia/2026-04-22/pix-recurring-payments-support).
- Webhook verifica assinatura sobre o corpo bruto. Tratar `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` e `invoice.payment_failed`.
- Checkout concluído sozinho não concede Pro. `invoice.paid` confirma concessão e período pago; fatura inválida, assinatura incompleta ou boleto pendente não concedem acesso. Retentativas de renovação preservam um Pro previamente pago até encerramento da assinatura; não conceder Pro por uma primeira cobrança que falhou.
- Cancelamento ao fim do período mantém Pro até o vencimento. Eventos atrasados ou de assinaturas antigas não sobrescrevem a assinatura atual.
- Criar tabela interna `eventos_stripe`, com RLS habilitado, sem políticas para usuárias e GRANTs somente para service_role, para idempotência e auditoria mínima (ID, tipo, modo e processamento). Aplicação da atualização e registro de evento processado serão atômicos; falha permite retry, duplicado não reaplica.
- Em eventos fora de ordem, consultar o estado atual no Stripe e preservar o último período efetivamente pago. Não armazenar dados completos de cartão nem inserir mensalidade em transactions.
- Se Pix Automático exigir tratamento de mandato revogado, incluir `mandate.updated` e orientação para novo pagamento; informar a lista final de eventos.

## 4. Interface
- `useAssinatura` no padrão existente, via AppContext, sem consultas diretas nas páginas; atualizar tipos de domínio e deixar tipos gerados para a ferramenta.
- Configurações ganha **Meu Plano**, acessível por `/configuracoes?abrir=meu-plano`, mostrando isento, dias restantes de teste, Pro ativo até [data] ou teste encerrado, com botão correspondente.
- Drawer reutilizável de paywall: benefícios, mensal/anual, preços exatos e links para `/termos` e `/privacidade`, sem nova página.
- Ao tentar criar sem plano, abrir paywall mantendo o formulário preenchido; a proteção definitiva continua no banco.
- Home: avisos do teste nos marcos de 10, 3 e 0 dias; após expiração, aviso fixo e discreto “Assine para criar novos agendamentos” com botão Assinar. Sem vagas restantes ou contagem mensal. Isentas não recebem avisos de expiração.
- Retorno do checkout à tela existente: estado “confirmando pagamento”, atualização por consulta temporária e ao retornar ao app; sucesso somente depois do plano confirmado pelo servidor. Cancelamento de checkout preserva o plano anterior.
- Respeitar Minha Marca, tokens semânticos, áreas de toque de 44px e Drawer/FormSheet existentes. Nenhum bloqueio global de navegação ou leitura.

## 5. Secrets, permissões e produção
- Chave restrita fornecida apenas por Connect Stripe, nunca no código/chat.
- Verificar acesso a Prices, Invoices, Subscriptions, Billing Portal Sessions/configurations além de Customers, Products e Checkout Sessions. A permissão Billing informada pode já cobrir parte disso; solicitar só o que realmente faltar após teste.
- Implantar o endpoint antes de solicitar `STRIPE_WEBHOOK_SECRET`, para cadastrar URL e eventos no painel em uma visita. A URL exata será entregue após implantação, sem expor credenciais.
- Configurar IDs seguros, por exemplo `STRIPE_PRICE_MENSAL_ID` e `STRIPE_PRICE_ANUAL_ID`. Signing secret de teste é diferente do live.
- Entregar roteiro de produção: conferir produto/preços live já existentes, trocar chave pelo formulário seguro, atualizar IDs de preço, cadastrar webhook live e respectivo signing secret, confirmar Customer Portal e testar o fluxo real. Nenhum pagamento real será realizado sem autorização.

## 6. Validação antes de concluir
- Testes concretos: 40 dias exatos; vencimento; estados isento/teste/pro/expirado; R$ 39,90 e R$ 359,00; criação bloqueada com P0010/ASSINATURA_NECESSARIA somente quando expirada; campos protegidos.
- Confirmar edição/reagendamento/conclusão/recebimento, CRM, fotos, anamnese e exportação após expiração; usuária não altera plano, isenção ou Stripe IDs. RPCs não aceitam outro user_id; eventos_stripe inacessível a usuárias.
- Testar webhook inválido, duplicado, fora de ordem, pagamento pendente, primeira falha, renovação em tentativa, recuperação, cancelamento e término do período.
- Testar checkout de teste mensal/anual, portal e leitura do plano no app sem novo login, em celular e desktop. Pix depende da habilitação real na sua conta.
- Utilizar conta temporária não isenta com autorização quando necessária; não alterar dados das duas contas reais para simular limites ou pagamentos.
- Atualizar documentação das regras e arquitetura após implementação; entregar arquivos/migrações alterados, URL do webhook, eventos, secrets e pendências verificadas.

**Aprovado com ajustes:** iniciar pelo Connect Stripe para chave restrita de teste; continuar a implementação após a conexão segura.