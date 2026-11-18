# BÍBLIA.md — Belafy (App Marcinha Cílios)

> Documento **de produto e domínio**: o "o quê" e o "porquê".
> Para regras de execução/código do agente, veja `CLAUDE.md`.
> Última revisão: 18/novembro/2026 (conferência contra o repositório até o commit `5ee02cb`).

---

## 1. Identidade do produto

**Belafy** é um ERP + Agenda + CRM para **profissionais autônomas da beleza**
(lash designer, sobrancelhas, nail designer, esteticista, cabeleireira, maquiadora).
Cobre o ciclo completo da cliente: cadastro → anamnese → fotos → agendamento →
atendimento → pagamento → financeiro → retorno/CRM → relatórios.

- **Não é "só uma agenda".** Toda decisão de produto deve preservar a visão de sistema completo.
- **Mobile-first.** Desktop é consequência, não prioridade (largura máxima 1152px).
- **Uso real, não protótipo.** Já roda em produção com dados reais.
- **Idioma do domínio: português.** Rotas, tipos, enums e status em pt-BR — decisão consciente.
- **Nome da plataforma: Belafy** (antes "Pink Purse Pal"). Nome central em `src/lib/constantes.ts`
  (`NOME_APP`); o nome do negócio configurado em Minha Marca tem prioridade onde já existe.
  URLs/infra técnicas (`pink-purse-pal.lovable.app`, nome do repositório) foram preservadas.
- **Produto pago (SaaS):** teste gratuito de 40 dias e plano **Pro** via Stripe (ver 4.14).
  Não existe plano gratuito permanente.

**URLs**

- Produção (domínio próprio, primário): https://app.belafy.com.br — endereço exibido em textos e docs.
- Publicado (Lovable): https://pink-purse-pal.lovable.app
- `app.marcinhacilios.com.br` **não resolve mais** e foi removido da lista de origens de pagamento.
- Todo endereço que efetivamente serve o app precisa constar na lista de origens permitidas em
  `supabase/functions/_shared/assinaturas.ts`, senão o checkout falha a partir dele.

## 2. Usuário e prioridades de UX

Usuário único por conta (autenticado). Não há papéis/permissões nem multiusuário por empresa.
Cada `user_id` é dono dos seus dados, isolados via RLS.

Ordem de prioridade em qualquer decisão de UX:
**rapidez de operação > poucos cliques > fluxo contínuo > mobile-first > dados confiáveis.**

- Preferir Drawer / Bottom Sheet / Modal a páginas inteiras.
- Exceção: **agendamento e reagendamento sempre usam o formulário completo de agenda**,
  nunca um popup simplificado — a usuária precisa ver calendário, horários e serviços juntos.
- Sempre confirmar antes de excluir.
- Linguagem simples e ações claras (Adicionar, Editar, Excluir).

## 3. Identidade visual

**Layout e design em uso — conferência em 18/11/2026.** Rosa/branco é o tema padrão,
limpo e minimalista; a cor primária pode ser personalizada por conta em **Minha Marca**.
Esta seção descreve o que existe no código, não uma proposta de redesenho.

- **Marca da plataforma Belafy (fixa, independente de Minha Marca):** tokens `--belafy-ameixa`
  (#4A1F3F), `--belafy-rosa` (#FF9EBB), `--belafy-nevoa` (#FBF3F6) e `--belafy-tinta` (#1F1219)
  em `src/index.css`, expostos no Tailwind como `belafy-*`. Componentes `LogoBelafy`
  (variantes clara/escura) e `SeloBelafy` (“feito com belafy”).
  - `/auth` e `/recuperar-senha`: fundo ameixa, logo escuro, card branco com raio de 24px e
    botões ameixa.
  - Boas-vindas: logo, “Passo X de 3” e barra de progresso ameixa.
  - Selo apenas no fim de Meu Dia e de Configurações; logo no topo da Ajuda.
  - `index.html`: título/meta/og/theme-color Belafy, `favicon.svg` + `apple-touch-icon.png`
    (o `favicon.ico` antigo foi removido); não há manifest PWA.
  - A cor de Minha Marca continua mudando o tema do app; os tokens `belafy-*` não mudam.

- **Tokens:** cores de fundo, texto, cards, bordas, foco, sombras e estados ficam em
  `src/index.css`, associados ao Tailwind. Sucesso é verde, aviso é laranja e erro é vermelho.
  Existem tokens `.dark`, mas um seletor de modo escuro para a usuária não foi identificado.
- **Fonte:** Outfit, pesos 300–700; títulos normalmente semibold, cabeçalhos principais de
  24px e textos secundários de 14px. A folha global aplica espaçamento apertado aos títulos.
- **Espaçamentos:** escala do Tailwind; conteúdo principal com 16px nas laterais, 24px acima
  e 80px abaixo para não ficar sob a navegação; seções usam normalmente intervalos de 16–24px.
  Raio-base de borda de 16px, com variações menores e arredondamentos próprios em diálogos.
- **Cores dos serviços:** catálogo com as 11 cores do Google Calendar; nos cards que usam
  cor de serviço, fundo a 20% e borda esquerda sólida de 4px. **Manutenção é sempre Uva**,
  resolvida por `getCorServico` a partir de `service_id`, ignorando a cor cadastrada da faixa;
  colocação e avulso mantêm a cor do serviço. Google usa `colorId = 3` para manutenção.
  **Removida:** escolha efetiva de outra cor para manutenção; o serviço principal continua
  podendo ter sua própria cor.
- **Chips dos atendimentos:** técnica/serviço, tipo e intervalo com quebra de linha conforme
  o componente compartilhado. Tipo: manutenção numerada quando informada, “Manutenção” sem
  número, “Colocação”, ou sem chip de tipo para avulso. Sem anterior: “Primeira visita”.
  Intervalo neutro em colocação/avulso; manutenção fica verde dentro da faixa, vermelho claro
  com alerta fora dela, e neutra se não houver faixa. O fundo do card mantém a cor do serviço.
- **Timeline da ficha:** diferencia agendamentos, atendimentos e pagamentos; não confundir
  suas cores de evento com a cor do serviço nos cards.
- **Componentes reutilizados:** shadcn/ui (Button, Input, Select, Tabs, Accordion, Dialog,
  Sheet, Drawer, AlertDialog, Tooltip, ScrollArea e Toast), além de EmptyState, MoneyDisplay,
  StatusBadge, SectionHeader, FormSheet, AppointmentChips, MaintenanceBadge e CaixaSaldoResumo.
  Ícones são Lucide; gráficos são Recharts. Nem todo formulário usa FormSheet.
- **Celular e desktop:** a mesma navegação inferior permanece nos dois. Conteúdo centralizado
  com limites de 512px na base, 672px em `md`, 896px em `lg` e 1152px em `xl`; não há troca
  automática por menu lateral. Listas de cards geralmente passam de uma para duas colunas em
  `md`; CRM, relatórios e configurações têm grades próprias descritas abaixo.
- **Formulários:** AppointmentForm e TransactionForm são diálogos centralizados, com largura
  máxima de 95% no celular/448px a partir de `sm`, altura máxima de 90vh e rolagem interna.
  Não são rotas ou páginas completas. FormSheet abre à direita por padrão; abertura inferior
  depende da configuração do componente, não de uma conversão universal automática.
- **Ações na Home:** áreas de toque de 44px nos ícones principais; “Mais ações” em Drawer.
  Nome/logo do negócio aparecem acima do conteúdo quando configurados; logo circular de 32px,
  nome truncável. A cor da marca altera o tema do app, não a regra fixa Uva das manutenções.
- **Selo de pagamento:** `StatusBadge` ganhou o estado **Permuta** (violeta), usado para
  agendamentos em permuta depois do corte da conta corrente (ver 4.4).

### 3.1 Telas, rotas e estrutura

| Tela / rota                                              | Cabeçalho, seções e menus                                                                                                                                                                                                                                       | Diálogos e painéis principais                                                                                                                                                                               |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrar / Criar Conta — `/auth`                           | Marca Belafy (fundo ameixa), card centralizado, abas de entrada/cadastro, credenciais e recuperação de senha; no cadastro, **vitrine de planos** (40 dias grátis / Pro Mensal / Pro Anual) e links para Termos e Privacidade; sem navegação inferior            | Feedback de autenticação, validação de senha e abertura do checkout quando um plano pago é escolhido                                                                                                        |
| Recuperar senha — `/recuperar-senha`                     | Marca Belafy; formulário de recuperação e fluxo de nova senha; página pública                                                                                                                                                                                   | Feedback de envio/alteração                                                                                                                                                                                 |
| Termos de Uso — `/termos` · Privacidade — `/privacidade` | Páginas públicas renderizadas por `DocumentoLegal` a partir de `src/content/legal.ts`; fora de ProtectedRoute/MainLayout, sem navegação inferior; tabelas viram cards no celular                                                                                | —                                                                                                                                                                                                           |
| Meu Dia — `/`                                            | Data atual, título e olho; **aviso de assinatura** (quando aplicável); Primeiros passos; busca por cliente; retornos, lembretes, Hoje, ações Movimentação/Agendamento, saldos, Próximos Agendamentos, Pendentes de Conclusão e selo Belafy no fim               | Agendamento/criação/edição, recebimento, exclusão, conferência de caixa, Mais ações, fotos e paywall                                                                                                        |
| Movimentações — `/movimentacoes`                         | Cabeçalho, ajuda, relatório (só ícone no celular) e adicionar; com permuta ativa, “+” vira menu (movimentação ou “Fui atendida”) e aparece o botão **Permutas**; resumo de caixa, seletor de mês local; filtros de escopo/categoria/busca; lista de lançamentos | Nova/editar movimentação, confirmação de exclusão, lista de permutas e lançamento de permuta                                                                                                                |
| Agendamentos — `/agendamentos`                           | Cabeçalho, ajuda, alternância Lista/Semana/Mês e adicionar; busca; calendário mensal inicialmente, semanal ou listas Hoje/Próximos/Anteriores                                                                                                                   | Mesmo formulário para criar/editar, recebimento e exclusão; controles de status nos cards                                                                                                                   |
| CRM — `/crm`                                             | Cabeçalho e ajuda; resumo, produção do mês, lembretes, cards acionáveis e lista de clientes                                                                                                                                                                     | Listas por critério, cobrança WhatsApp e detalhes da produção                                                                                                                                               |
| Ficha do cliente — `/cliente/:id`                        | Nome e voltar; abas Dados, CRM, Fotos e Anamnese; Dados inicialmente, cadastro, **card Permuta** (com conta corrente ativa), métricas e histórico                                                                                                               | Enviar agenda; detalhes do atendimento somente leitura (`AppointmentDetailSheet`, componente compartilhado); lançamentos/acertos/WhatsApp de permuta; ferramentas de fotos, comparação, anamnese e cobrança |
| Relatórios — `/relatorios`                               | Cabeçalho e abas Indicadores (inicial), Agenda, Financeiro e Movim. em **pílulas roláveis na horizontal**, rótulos sempre visíveis, aba ativa centralizada; quatro relatórios incorporados                                                                      | Filtros e ações de exportação próprios de cada relatório                                                                                                                                                    |
| Relatório de Movimentações — `/relatorio-movimentacoes`  | Cabeçalho e voltar a Movimentações; filtros, tabela, resumo por origem e banco                                                                                                                                                                                  | Exportação do resultado                                                                                                                                                                                     |
| Relatório de Agendamentos — `/relatorio-agendamentos`    | Cabeçalho e voltar a Relatórios; filtros, quatro métricas, resumo por status e lista                                                                                                                                                                            | Exportação do resultado                                                                                                                                                                                     |
| Indicadores — `/relatorio-indicadores`                   | Cabeçalho, ano e voltar a Relatórios; métricas, atendimentos por mês e faturamento mês a mês; chave “comparar com ano anterior”                                                                                                                                 | Controles de período e tooltips por mês                                                                                                                                                                     |
| Configurações — `/configuracoes`                         | Cabeçalho, ajuda, conta conectada, senha e sair; accordion único expansível; links para Termos/Privacidade; selo Belafy no fim                                                                                                                                  | Plano/assinatura, cadastros, marca, contas/taxas/extratos, revisão de permuta, anamnese, configurações e confirmações                                                                                       |
| Ajuda — `/ajuda`                                         | Logo Belafy, cabeçalho, busca, **card do chat com a assistente**, manual em accordion, atalhos “Como eu faço para...?” e checklist                                                                                                                              | Drawer do chat com IA; conteúdo estático; tabelas adaptadas em cards no celular                                                                                                                             |
| Página não encontrada — `*`                              | Página pública para endereço sem correspondência                                                                                                                                                                                                                | Não representa funcionalidade autenticada                                                                                                                                                                   |

- **Configurações:** ordem dos grupos: **Meu Plano**, Minha Marca, Clientes, Serviços, Categorias,
  Contas e Bancos, Google Calendar, Retenção de Clientes, CRM, Modelos de Anamnese,
  Separação de Caixa e Exportar Dados. Um grupo aberto por vez; grade de uma coluna no
  celular e duas em `md`. No card da conta, “Conectado como” fica acima do e-mail truncável;
  trocar senha e sair ficam na linha de ações.
- **CRM:** resumo em três colunas no celular/seis em `md`; cards de ação em duas/três.
- **Relatórios:** abas em linha única rolável (pílulas de 44px de altura mínima, sem barra de
  rolagem visível), ocupando a largura em `md`; rótulos sempre visíveis. **Removido:** grade
  2/4 colunas com rótulos ocultos abaixo de `sm`. Tabelas/listas e filtros variam por relatório.
- **Ficha:** métricas em duas/quatro colunas; detalhes de atendimento em Sheet à direita,
  ocupando a largura toda no celular e limitado a 448px a partir de `sm`.
  Fotos/anamnese permanecem dentro das abas.

### 3.2 Navegação entre telas

- Barra fixa inferior: **Início → Movim. → Agenda → CRM → Relat. → Config**.
  Agenda tem botão circular destacado. A indicação ativa usa o caminho exato; ficha e rotas
  avulsas de relatórios não destacam automaticamente o item do módulo de origem.
- Sem sessão, rotas de negócio redirecionam para `/auth`; `/auth`, `/recuperar-senha`,
  `/termos`, `/privacidade` e página não encontrada são públicas. Recuperação é acessada pela
  tela de entrada; Termos/Privacidade pelo cadastro, pelo paywall e por Configurações.
- `/configuracoes?abrir=meu-plano` abre Meu Plano; `?checkout=sucesso|cancelado` é o retorno
  do Stripe para essa tela.
- Cards/listas de clientes abrem `/cliente/:id`; voltar da ficha retorna à navegação anterior.
  “Ver agenda” na Home abre Agenda. Criar/editar pela Home abre o formulário na própria Home.
- Relatórios abre quatro abas; Movimentações também oferece o relatório em rota própria.
  Não existe rota registrada `/relatorio-financeiro`: Financeiro é uma aba de `/relatorios`.
- Ajuda é acessível por Configurações e atalhos contextuais na Home, Agenda, Movimentações
  e CRM; links podem apontar para uma seção do manual. Não é um sétimo item da barra inferior.
- `/configuracoes?abrir=<grupo>` pode abrir um accordion específico.
  **A confirmar:** links do CRM com `?edit=`/`?clientId=` levam à Agenda, mas a página
  inspecionada não consome esses parâmetros para abrir/preencher o formulário automaticamente.
- Fechar conferência de caixa encerra apenas o painel, mantendo a Home; não há nova rota.

## 4. Módulos

**Funções em uso — conferência em 18/11/2026.** Salvo indicação contrária, as funções abaixo
são para a **usuária autenticada, dona da conta**, com dados próprios isolados por `user_id`/RLS.
Não há equipe, administrador de empresa ou permissões diferenciadas no app. As dependências
citadas são do código e das funções existentes; este inventário não atesta a execução de cada
integração externa. Divergências não foram corrigidas nesta atualização documental.

### 4.1 Autenticação

- **Entrada/cadastro:** e-mail/senha em `/auth`, via Lovable Cloud Auth; acesso público, sem
  cadastro anônimo. Indicador de força e validação de senha durante cadastro/troca.
- **Escolha de plano no cadastro:** vitrine com “40 dias grátis” (padrão, sem cartão), “Pro
  Mensal” e “Pro Anual”. Teste: cria a conta e vai para a Home. Plano pago: cria a conta e abre
  o checkout Stripe; se o checkout não abrir, a conta segue no teste de 40 dias e a usuária é
  orientada a assinar em Configurações → Meu Plano. Aceite de Termos/Privacidade por link.
- **Recuperação:** `/recuperar-senha`, solicita recuperação e permite atualizar senha no fluxo
  de recuperação. Troca de senha da usuária conectada em Configurações.
- **Sessão:** ProtectedRoute protege as telas de negócio; sair fica em Configurações e limpa
  a cor local da conta. ErrorBoundary oferece mensagem de falha e recarga em caso de erro.
- **Dependências:** AuthContext, Lovable Cloud Auth e estado de sessão; políticas hospedadas
  de confirmação de e-mail não são inferidas apenas pelo formulário.

### 4.2 Dashboard (`/`)

- **Meu Dia:** organiza horários de hoje, futuros e passados pendentes de conclusão; busca
  por nome da cliente, cartões com data/hora, serviço estruturado, status e pagamentos.
- **Ações rápidas:** Movimentação e Agendamento; nos cards, WhatsApp, avanço de status,
  Receber e Mais ações (editar, reagendar, adicionar fotos, Google Calendar e exclusão elegível).
- **Saldos:** Caixa Empresa, Caixa Pessoal, Entrou no mês e Gastos do Mês; olho para ocultar,
  preferência local. Gastos do Mês representa **saídas pessoais**, não todas as despesas.
- **Conferência:** cada um dos quatro cards abre Drawer somente leitura com os lançamentos
  elegíveis, total e “Ver mais” em lotes de 20; sem edição/exclusão dentro do painel. Filtros
  específicos por escopo/período e exclusão de permutas; descrição, cliente, metadados e valor.
- **Relacionamento:** retornos a confirmar, lembretes compartilhados com CRM e Primeiros passos.
- **Assinatura:** `AvisoAssinatura` no topo — avisos quando faltam ≤ 10 dias de teste, “Seu
  teste terminou” no dia 0 e, após expirar, aviso fixo “Assine para criar novos agendamentos”
  com botão Assinar. Isentas e Pro não recebem aviso. Nada da Home é bloqueado.
- **Pendentes/pagos:** decididos por `saldoAReceberEmDinheiro` (permuta após o corte nunca
  aparece como “a receber”).
- **Dependências:** appointments, clients, services, transactions, accounts e assinatura no
  AppContext, configurações de caixa/CRM/permuta, helpers de cores/dias e preferências locais.

### 4.3 Agenda (`/agendamentos`)

- **Visões:** Mês (inicial), Semana e Lista, busca por cliente e criação/edição pelo mesmo
  AppointmentForm; cliente, serviço, data/hora, duração, valor, observações e status.
- **Status:** confirmação `pendente | confirmado | atendido | cancelado | retorno_previsto`;
  pagamento `pago | nao_pago | sinal`. Pago/sinal dependem do valor acumulado recebido, enquanto
  o lançamento também pode indicar o tipo de recebimento. Cancelamento não apaga pagamentos.
- **Cadastro contínuo:** cliente pesquisável, criação durante o agendamento com espera pelo
  UUID real, preenchimento do serviço e validação de conflito por início + duração.
  Submit bloqueado durante salvamento para evitar duplicação.
- **Assinatura na criação:** ao criar (não ao editar), o formulário reconsulta o plano; se
  `expirado`, abre o **paywall mantendo o formulário preenchido**. A proteção definitiva é o
  trigger do banco (erro `P0010` / `ASSINATURA_NECESSARIA`). Editar, reagendar, concluir e
  receber continuam liberados após a expiração.
- **Situação de pagamento exibida:** sempre por `situacaoPagamento` em `src/lib/permuta.ts`
  (`pago | sinal | nao_pago | permuta`). **Removidas** as cópias locais de `getPaymentStatus`
  em Agenda/Semana/Home.
- **Catálogo:** Técnica → Tipo (Colocação/Manutenção) → Faixa quando manutenção; seleção por
  campos estruturados, não pelo nome. Outro/serviço avulso é pesquisável, com seleção de
  catálogo preenchendo valor/duração editáveis; texto livre mantém `service_id = null`.
  Edição pré-seleciona pelo ID e usa o mesmo fluxo de criação.
- **Faixa sugerida:** intervalo de calendário até o agendamento anterior da mesma cliente,
  com filtro de técnica no picker; não exige que o anterior já esteja atendido. Exclui o
  próprio e cancelados. Helper compartilhado: `src/lib/diasDesdeUltimoAtendimento.ts`.
- **Número de manutenção:** opcional, manual, de 1 a 5; não calculado automaticamente.
  Alerta de repetição é não bloqueante, inclusive na edição. Exibido em cards, histórico,
  retornos, CRM e descrição/exportação quando cabível.
- **Descrição e dias:** serviço atual por `service_id`, com fallback legado quando não há
  vínculo; chips usam o anterior da mesma cliente antes da data-alvo, inclusive futuro ainda
  não atendido, dias de calendário em America/Sao_Paulo. “Desde o anterior” quando não atendido,
  “desde o último” quando atendido; sem anterior, primeira visita. Manutenção compara com a faixa.
  **Removida:** exibição baseada exclusivamente no texto congelado `appointments.service`.
- **Retornos:** vínculo `parentAppointmentId`, lista de previstos/confirmáveis e formulário
  normal de agendamento; não confundir com o antigo passo automático pós-atendimento.
- **Permuta:** flag editável, sugerida pela preferência da cliente (`preferePermuta`: antes do
  corte, pela conta permuta padrão; depois, por `paga_permuta`); não é receita em dinheiro.
  Com a conta corrente ativa, agendamento em permuta **exige cliente cadastrada**; o card mostra
  “R$ X em permuta” em vez do valor a receber, e a mensagem de WhatsApp omite o valor.
  Fluxo legado (sem corte) e conta corrente: ver 4.4.
- **Finalização:** Agenda possui mudança simples de status e ação “Concluir e receber”, que
  pode abrir recebimento quando existe saldo em dinheiro. Permuta após o corte: concluir só
  marca Atendido e mostra aviso “R$ X creditado na permuta de Fulana”, com atalho “Recebeu algo
  em dinheiro?” para abrir o recebimento. **Removida:** antiga etapa “Próxima manutenção” /
  `ScheduleReturnDialog`.
- **Sem convite de fotos ao concluir — implementado:** marcar Atendido não abre fotos em nenhum
  caminho (Home, Agenda Lista/Mês/Semana). Acesso manual: Home → Mais ações → Adicionar fotos e
  aba Fotos da ficha. Resolve o item “a confirmar” da revisão anterior.
- **Exclusão:** interface restringe agendamento com valores pagos; a proteção universal por
  existência de transações vinculadas, em todos os caminhos, está **a confirmar**.
- **Proteções de banco:** `created_at` e `user_id` do agendamento não podem ser alterados
  depois da inserção (trigger `preservar_origem_agendamento`).
- **Dependências:** AppContext, hooks de clientes/serviços/agendamentos, assinatura, configurações
  de retorno/permuta, helpers puros e sincronização Google quando conectada.

### 4.4 Financeiro (`/movimentacoes`)

- **Lançamentos:** entrada/saída, escopo empresa/pessoal, categoria, conta, data, valor e
  descrição; origem agenda por `appointment_id` ou manual. Cliente de referência opcional
  no lançamento avulso. Busca em descrição, categoria, conta e cliente; filtros na lista.
- **Recebimento:** atendimento permite vários pagamentos em contas diferentes. Formulário
  valida conta, categoria, valor positivo, cliente/agendamento quando vinculado e impede
  valor bruto acima do saldo restante. Receber pode ser iniciado na Home/Agenda.
- **Bruto/líquido:** maquininha e tipos de cobrança por conta (`account_fee_types`) têm taxa;
  `amount` guarda líquido e `grossAmount` guarda bruto quando há desconto. O saldo pago do
  atendimento é atualizado pelo bruto informado; saldo em conta/caixa usa o lançamento líquido.
- **Categorias:** entrada/saída e empresa/pessoal; seleção fixa tipo/escopo no formulário.
  Categorias de ajuste permitem registrar ajustes pelos fluxos existentes.
- **Contas e taxas:** dinheiro, banco, maquininha e permuta; contas/tipos editáveis em
  Configurações → Contas e Bancos, com atalhos para tipos Pix/Débito/Crédito e extrato por conta.
- **Edição/exclusão:** movimentação vinculada ao atendimento não é editável pela interface;
  exclusão exige confirmação. Criar lançamento e atualizar valor pago são chamadas separadas;
  atomicidade/reconciliação de erros entre elas e estorno bruto/líquido estão **a confirmar**.

- **Acertos de permuta em Movimentações:** aparecem com selo “Acerto de permuta” e são
  **somente leitura** (sem editar/excluir na interface, no diálogo do atendimento nem pelo hook;
  trigger `proteger_transacao_acerto_permuta` congela valor, tipo, data, conta, escopo e vínculo,
  permitindo só trocar categoria compatível).

**Controle de Permutas — dois regimes, separados pelo corte**

O regime é decidido por `user_settings.permuta_corte_em`: **NULL = fluxo legado**; preenchido =
**conta corrente de permuta por cliente** a partir dessa data. O código das etapas 1–5 está
pronto e a ativação é por conta, só por confirmação explícita da usuária.
**A confirmar:** se as contas reais já foram ativadas (em 17/11 o botão Ativar estava
habilitado, mas não havia sido clicado).

_Fluxo legado (sem corte)_

- Contas `type = 'permuta'` em grupo separado e com extrato próprio; Receber/TransactionForm em
  modo permuta (aviso, Caixa oculto, só contas permuta, conta padrão da cliente pré-selecionada).
  Esses recebimentos **são gravados em `transactions`** numa conta permuta — resolve o
  “a confirmar” anterior: não existe armazenamento separado no legado.
- Preferência da cliente = ter `conta_permuta_padrao_id`.

_Conta corrente de permuta (após o corte)_

- **Saldo por cliente**, positivo = a cliente te deve serviços; negativo = você deve a ela.
  Fonte: view `permuta_extrato`, que une (a) atendimentos em permuta com status Atendido, data
  ≥ corte e cliente cadastrada, valendo `amount − recebimentos em dinheiro` (crédito positivo),
  e (b) lançamentos de `permuta_lancamentos`. Saldos em `permuta_saldos`.
- **Tipos de lançamento:** `fui_atendida` (você usou serviço dela; negativo), `ajuste` (±),
  `saldo_inicial` (migrado na ativação), `acerto_recebido` (ela pagou em dinheiro; negativo) e
  `acerto_pago` (você pagou; positivo). Só `fui_atendida` e `ajuste` são editáveis/excluíveis,
  com confirmação; saldo inicial e acertos são imutáveis (trigger `proteger_lancamento_permuta`).
- **Acertar em dinheiro:** RPC `registrar_acerto_permuta` cria, de forma atômica, a movimentação
  real (entrada ou saída, empresa/pessoal, conta dinheiro/banco — não aceita permuta nem
  maquininha; categoria compatível) e o lançamento de acerto vinculado por `transaction_id`.
  É o único caso em que permuta toca o caixa, porque é dinheiro de verdade.
- **Recebimentos em dinheiro** num agendamento em permuta continuam dinheiro real (entram no
  caixa) e reduzem o crédito da permuta. Após o corte, recebimento não oferece contas permuta.
- **Pagamento exibido:** agendamento em permuta com data ≥ corte aparece como **Permuta**, sem
  cobrança e sem pendência (`situacaoPagamento` / `saldoAReceberEmDinheiro`); os campos
  `payment_status`/`paid_amount` salvos não são alterados.
- **Telas:** card **Permuta** na ficha (saldo, “Fui atendida”, “Acertar em dinheiro”, “Enviar
  no WhatsApp”, “Ajuste” no menu, extrato com saldo corrente; atendimentos abrem o detalhe);
  **Permutas** (lista geral em Movimentações e Configurações → Contas e Bancos, grupos “Te
  devem / Você deve / Quitadas”, chave “Mostrar quitadas”); aviso ao concluir atendimento.
- **WhatsApp do extrato:** períodos “Desde o último acerto” (padrão), “Últimos 90 dias” e
  “Tudo”; texto editável (troca de período pede confirmação se editado), copiar e `wa.me`;
  telefone inválido só impede abrir o WhatsApp. Gerado por `permutaExtrato`.
- **Cliente:** checkbox “paga em permuta” vira a preferência independente `paga_permuta`; a
  conta permuta padrão some do cadastro. **Não é possível excluir cliente com saldo de permuta
  diferente de zero** (hook + trigger `proteger_exclusao_cliente_permuta`, erro `P0011`).
- **Contas:** depois do corte não é possível criar nova conta do tipo permuta; as antigas ficam
  em “Permutas (legado)”, recolhidas, preservadas.

_Ativação (Configurações → Contas e Bancos → “Revisar contas antigas”)_

- `RevisaoPermutaDrawer` + RPC `revisar_conta_corrente_permuta`: lista cada conta permuta antiga
  com saldo bruto/líquido e cliente sugerida (por frequência nos atendimentos e depois por nome),
  além de atendimentos em permuta já realizados que nunca tiveram lançamento, que podem ser
  incluídos no saldo. Toda conta com saldo precisa de uma cliente.
- RPC `ativar_conta_corrente_permuta`: trava os registros, recalcula a revisão, rejeita se os
  saldos mudaram, grava os `saldo_inicial` e o corte numa única transação; só pode rodar uma vez.
  **Nada antigo é apagado**: as transações legadas ficam como estão.

_Exclusão dos totais em dinheiro_

- A identificação de transação de permuta é única: `isTransacaoPermuta` (conta permuta por
  `account_id`, com texto legado só quando não há `account_id`), espelhada no banco pela view
  `permuta_transacoes_legadas`. Usada em Home/caixa, Drawer de conferência, Relatório de
  Movimentações e Financeiro.
- **Alterado:** os saldos **não excluem mais** todo lançamento ligado a agendamento permuta
  (helper `isPermutaRelated` removido) — dinheiro realmente recebido nesses atendimentos conta.
- Pendências em dinheiro (CRM, ficha, cobrança, Home) ignoram agendamentos em permuta
  (`saldoPendenteDinheiro`).

**Separação de caixa (empresa/pessoal) por atendimento — implementada**

- Configurações → Separação de Caixa permite ativar e definir reserva fixa; primeira ativação
  pela tela de configurações registra `caixa_inicio_em` mediante confirmação. Padrão desligado.
- Função `caixa_reserva_apply` e triggers de agendamento/movimentação distribuem entradas
  elegíveis cumulativamente por atendimento: primeiro empresa até completar a reserva,
  restante pessoal. Excluem permuta, cancelados e atendimento sem valor pago positivo.
- Reserva aplicada fica registrada no atendimento; recomposição restaura campos originais e
  remove divisões derivadas anteriores antes de refazer a divisão. Categoria e conta são
  preservadas. Pode criar uma movimentação derivada para a parcela pessoal: **não cria um novo
  recebimento a partir de `paid_amount`**, apenas reparte o valor do lançamento real.
- Home e Movimentações reutilizam CaixaSaldoResumo. Empresa/pessoal são acumulados dos
  lançamentos carregados por escopo; quando ativo, usam corte inferior pela **data do lançamento**,
  não `created_at`. Não seguem o seletor de mês; não há limite superior “até hoje” no helper.
- Entrou no mês soma entradas empresa + pessoal no mês de referência: corrente na Home;
  seletor local em Movimentações, independente dos filtros da lista. O helper atual também
  aplica o corte de início do caixa a essa soma quando a separação está ativa.
- Privacidade: valores ocultáveis, preferências locais independentes entre Home e Movimentações.
  Conferência clicável está conectada à Home, não ao resumo de Movimentações.
- **A confirmar:** o Drawer Entrou no mês usa apenas o mês, sem o corte `caixa_inicio_em`,
  diferente do card no mês da ativação; podem divergir. Desligar a automação não desfaz
  globalmente divisões antigas, e ativação pelas boas-vindas não envia explicitamente o início.
- **Dependências:** transactions, appointments, accounts, categories, account_fee_types,
  user_settings e funções/triggers de caixa; relatórios tratam seus próprios filtros.

### 4.5 Clientes e Ficha (`/cliente/:id`)

- **Cadastro:** Configurações → Clientes e fluxo de agendamento; nome, telefone normalizado
  para checar duplicidade, aniversário, recorrência e observações privadas. Busca e edição.
- **Preferência de permuta:** checkbox “Cliente costuma pagar em permuta”. No fluxo legado exige
  Banco padrão para permuta (`conta_permuta_padrao_id`, nunca pelo nome), e o recebimento sugere
  essa conta. Com a conta corrente ativa, grava só `paga_permuta` e não pede conta. Em ambos,
  novos agendamentos sugerem permuta. Exclusão bloqueada se houver saldo de permuta (ver 4.4).
- **Ficha:** Dados, CRM, Fotos e Anamnese; cadastro, métricas e histórico. Cards do histórico
  abrem detalhes somente leitura, com serviço, data/duração, status, valor/pago/saldo,
  observações, divisão de caixa quando aplicável, pagamentos/contas e fotos associadas.
- **Linha do tempo:** agendamentos/atendimentos pela data marcada; pagamentos pelo registro
  real de criação, agrupados em janela de ±2 minutos. Histórico concluído compara atendimentos
  realizados; agendas futuras usam o anterior não cancelado. Ambos usam o helper central de dias.
- **Card Permuta:** aparece na aba Dados quando a conta corrente está ativa e a cliente paga em
  permuta ou tem lançamentos (detalhes em 4.4).
- **CRM da ficha:** total gasto, total pago, saldo de atendimentos realizados pendentes e de
  agendas abertas, **sem contar agendamentos em permuta**; acesso à cobrança quando elegível. As métricas gerais da ficha não são
  sinônimo do filtro financeiro dos cards de caixa.
- **Enviar agenda:** acima do histórico quando há horários >= agora em pendente, confirmado
  ou retorno_previsto. Lista cronológica em São Paulo, todos os elegíveis; texto editável,
  copiar e WhatsApp manual. Valores inicialmente ocultos, escolha local lembrada, nunca valor
  de permuta/total somado; confirmar regeneração se texto editado. Telefone inválido impede
  WhatsApp, não cópia. Mensagem atual fala em “horários de fim de ano”; colocação/avulso e
  manutenção com dias têm formatação própria, com bloco fixo de 48h/R$ 50. Não deriva esse bloco
  automaticamente das configurações do lembrete de confirmação.
- **Cobrar no WhatsApp:** ficha CRM com saldo positivo e telefone, e card Com saldo pendente
  no CRM; sheet reutilizado com seleção inicialmente completa, mensagem editável e link manual.
  `cobranca.ts` inclui só atendidos, não permuta/cancelado/quitado; saldo = amount − paidAmount
  com piso zero, ordem cronológica, descrição estruturada. Pix/assinatura fixos no código,
  não personalizados por Minha Marca. Nenhum envio/cobrança gera gravação ou muda status.
- **Fotos:** câmera/upload manual múltiplo, data/observação e vínculo opcional a atendimento;
  miniaturas, edição de observação, comparação Antes/Depois e apresentação de fotos. Compressão
  JPEG no navegador; arquivos privados em `client-photos`, leitura por URLs assinadas renováveis.
  Há ação explícita de excluir foto, não arquivamento universal. Acesso na aba Fotos e Mais ações
  da Home; disponibilidade idêntica em todas as visões da Agenda não foi confirmada.
- **Dependências:** clients, appointments, transactions, services, client_photos, storage privado,
  anamnese, permuta_extrato/permuta_lancamentos, helpers de dias/WhatsApp e preferências locais;
  envio/cobrança não usa API do WhatsApp.

### 4.6 CRM (`/crm`)

- **Cards acionáveis:** Confirmar Agenda, Retornos Pendentes, Clientes Inativas, Clientes VIP,
  Aniversariantes, Na 5ª manutenção e Com saldo pendente (este ignora agendamentos em permuta);
  listas filtradas em CrmListSheet.
  Resumo geral e lista de clientes permitem acessar fichas.
- **Retorno/inatividade:** considera último atendimento, próximos horários e limite configurado;
  CRM mantém critérios próprios de atendimentos realizados, não substituídos pela regra de
  encadeamento de agendas futuras. Na 5ª manutenção destaca quem não tem colocação futura.
- **VIP:** ordena por pontuação normalizada, 60% valor pago + 40% quantidade de atendimentos,
  e limita à quantidade de clientes VIP configurada. Não é “mínimo de visitas para ser VIP”.
- **Produção do Mês:** realizado, previsto, projeção/meta com barra e listas; permuta separada
  da produção a receber e fora da meta. Não confundir previsão de agenda com dinheiro em caixa.
- **Configuração:** dias de inatividade, dias para confirmação, quantidade de VIPs e meta mensal;
  contato rápido por `wa.me`, cobrança pelo mesmo sheet da ficha.
- **Lembretes na Home/CRM:** próximos `crm_confirm_days` dias (padrão 3), pendentes/confirmados/
  retornos previstos; lista comum, enviados recolhidos na Home. Abrir WhatsApp registra apenas
  `confirmation_sent_at`, não entrega confirmada nem alteração de status/financeiro. Reenvio
  permitido; sem telefone, ação indisponível. Template e política em Configurações → CRM:
  mínimo de aviso padrão 48h, taxa padrão R$ 50 apenas no texto, prazo vencido avisa sem bloquear;
  horas ≥ 1/taxa ≥ 0, primeiro nome e datas/saudação em São Paulo.
- **Dependências:** clients, appointments, transactions, services, user_settings, useCrm,
  helpers e hook de registro do lembrete; sem automação de envio.

### 4.7 Anamnese digital

- **Modelos:** Configurações → Modelos de Anamnese; templates/versionamento, seções e perguntas
  texto curto/longo, sim/não, múltipla escolha, seleção única, data, número e checkbox;
  opções e obrigatoriedade. Alterar versão bloqueada cria versão nova do questionário.
- **Ficha:** aba Anamnese cria resposta vinculada à versão atual do template, preenche respostas,
  coleta assinatura em canvas, visualiza, imprime e exporta PDF; resposta começa pendente,
  pode ficar preenchida/assinada e ser arquivada. Resposta assinada não se edita na interface;
  isso é distinto de versionar o modelo de perguntas.
- **Marca:** nome/logo em visualização, impressão e PDF quando configurados.
- **Dependências:** anamnese_templates, anamnese_template_versions, anamnese_questions,
  anamnese_responses, anamnese_answers, cliente e marca; imutabilidade universal no banco
  não é atestada apenas pela ausência de botão de edição.

### 4.8 Relatórios (`/relatorios`)

- **Indicadores — alterado:** calculados **a partir dos atendimentos** com status Atendido
  (`src/lib/indicadoresMensais.ts`, mês no fuso de São Paulo), **não mais pelas entradas em
  `transactions`**. Faturamento = valor dos atendimentos não-permuta, com “a receber” ao lado;
  **permuta separada** (valor e quantidade), fora do faturamento, com legenda explicando.
  Clientes únicas por `client_id` (ou nome normalizado). Comparação com o ano anterior é
  **opcional** (chave), só quando há atendimentos no ano anterior. Tooltips por mês; valor do
  card sem quebra no celular.
- **Financeiro:** extrato, filtros de período/conta/escopo, resumo por categoria/conta e totais
  separados por empresa/pessoal; BI de Gastos com mês/escopo e barras. PDF em paisagem.
- **Movimentações:** tabela detalhada de 10 colunas, vínculo de cliente/agendamento, Saldo Anterior,
  filtros e resumos por origem/banco. Acesso pela aba ou rota própria.
- **Agendamentos:** período, filtros, status, métricas e lista com descrição/chips estruturados;
  permutas continuam como agendamentos, mas seus valores vão para um total **Permuta** separado,
  fora de total/recebido/pendente. Filtro de pagamento inclui “Permuta” (por
  `situacaoPagamento`). PDF/CSV usam descrição textual, não chips gráficos.
- **Movimentações/Financeiro:** excluem transações de permuta por `isTransacaoPermuta`
  (Financeiro só quando “todas as contas”); acertos aparecem marcados; cliente do lançamento
  avulso passa a aparecer no relatório.
- **Exportações:** controles CSV/PDF conforme o relatório; PDFs Financeiro, Movimentações e
  Agendamentos incorporam marca. Não foi identificado exportador universal para todo gráfico.
- **Permuta:** Home, Movimentações e Financeiro agora usam o mesmo `isTransacaoPermuta`;
  Indicadores e Agendamentos separam permuta pelo atendimento. Financeiro ainda pode mostrar o
  extrato de uma conta permuta legada quando ela é selecionada.
- **Dependências:** transactions, appointments, accounts, categories, clients, services,
  filtros locais, Recharts, jsPDF/autotable e utilitários de marca. Todo dado novo deve ser
  pensado para eventualmente alimentar relatórios, sem documentar recurso futuro como presente.

### 4.9 Configurações

- **Conta:** e-mail conectado, troca de senha e sair; ajuda e grupos expansíveis.
- **Meu Plano:** primeiro grupo (detalhes em 4.14).
- **Contas e Bancos:** além de contas/taxas/extratos, revisão e ativação da conta corrente de
  permuta, lista Permutas e contas permuta antigas em “Permutas (legado)” (ver 4.4).
- **Cadastros:** clientes, serviços, categorias, contas/tipos de cobrança e modelos de anamnese;
  formulários de adicionar/editar, busca quando disponível, confirmação de exclusão e extratos.
- **Retenção:** intervalos sugeridos, antecedência de lembrete e cores dos retornos; CRM e caixa
  em grupos próprios. Não há passo obrigatório de próxima manutenção ao encerrar atendimento.
- **Google Calendar:** credenciais por usuária, estado de conexão, autorização e ações de
  sincronização app → calendário principal. Datas em America/Sao_Paulo, vínculo/idempotência por
  `google_event_id`/metadado appointmentId; manutenção com colorId 3. Número vem do agendamento
  quando manutenção numerada; não criar “1ª” automaticamente. Não há sincronização bidirecional.
  App salva localmente e depois tenta sincronizar, sem transação atômica entre os dois sistemas.
  Cliente recebe só configurações seguras; disponibilidade do segredo por RPC booleana
  autenticada, sem ler tokens/client secret. Corpo remoto tem formatador próprio.
- **Exportar Dados:** CSV separados de clientes, serviços, agendamentos, movimentações,
  categorias e contas, a partir dos dados carregados; não é restauração/backup completo do banco.
- **Dependências:** hooks das entidades, user_settings, funções Google Calendar e exportadores;
  detalhes de marca estão em 4.10.

**Cadastro de serviços — implementado**

- Principal: nome, valor, duração (padrão 60min), observações, cor e “Possui manutenção”.
  Sem manutenção é avulso; com manutenção representa colocação e exibe faixas expansíveis.
- Campos de referência: `possui_manutencao`, `servico_pai_id`, `manutencao_ate_dias`;
  hook deriva técnica/tipo e limites. Campos antigos `technique_name`, `tier_type`,
  `dias_min`/`dias_max` continuam compatíveis, não são a única fonte estrutural.
- Manutenções pertencem ao principal por ID e têm valor/duração próprios. Fim da faixa é
  informado; início calculado (primeira em 1, próximas após o fim anterior), ajustado ao editar.
  Não há controle de cor efetivo da faixa; Uva fixa. Avulsos ficam separados do agrupamento.
- Depois da última faixa, orientação do catálogo é nova colocação; bloqueio automático universal
  de manutenção fora de faixa está **a confirmar** — chips avisam, não impedem atendimento.
- **A confirmar / divergência:** a Bíblia antiga descrevia arquivamento de serviço/faixa usados.
  Caminhos atuais chamam DELETE, inclusive remoção de faixas/desativação da manutenção;
  restrições podem impedir exclusão, mas isso não é arquivamento. Marcar o arquivamento como
  implementado seria incorreto. Preservar texto legado do atendimento não garante manter o
  vínculo a um serviço que foi excluído.

### 4.10 Minha Marca

- **Tela:** Configurações → Minha Marca (`?abrir=minha-marca`), edição de nome do negócio,
  logo, oito cores prontas ou personalizada, prévia e restauração do rosa padrão.
- **Logo:** PNG/JPEG/WebP, limite de 2 MB validado no upload, recorte quadrado, arquivo fixo
  `{userId}/logo.<ext>`, limpeza da extensão anterior, remover logo e URL pública com quebra
  de cache. Logo público é diferente das fotos privadas das clientes; o app não deve tratar
  logo como armazenamento de informação sensível. Políticas de upload e atualização do bucket
  `logos` amarradas à pasta da dona e aos nomes fixos `logo.png|jpg|jpeg|webp` (migrações
  0006–0007). Restrição MIME no próprio bucket não foi atestada.
- **Aplicação:** cabeçalho do negócio, tema primário, anamnese e PDFs dos relatórios indicados;
  cor lembrada localmente antes do primeiro desenho, limpa ao sair. Não personaliza automaticamente
  Pix/assinatura da cobrança nem todos os textos fixos do WhatsApp.
- **Dependências:** user_settings (`nome_negocio`, `logo_path`, `cor_primaria`), bucket público
  logos/políticas por pasta própria, useMarca e utilitários de tema/PDF; usuária dona da conta.

### 4.11 Boas-vindas e modelos iniciais

- **Boas-vindas:** Sheet de três passos no MainLayout após carregar dados quando não existe
  configuração ou `onboarding_concluido_em` é nulo: Sua marca (“Bem-vinda à Belafy”) → Seus
  preços (principais/faixas) → Tudo pronto (caixa e opção de primeiro agendamento). Com logo
  Belafy, “Passo X de 3” e barra de progresso.
- **Pular/fechar:** pular os primeiros passos avança; último Pular/concluir/X registra conclusão.
  Painel só fecha/navega depois de readback seguro confirmar timestamp persistido; erro mantém
  aberto com aviso. Não é o mesmo progresso local do checklist Primeiros passos.
- **Primeiro agendamento:** ao concluir, pode navegar para Agenda; abertura automática do
  formulário por esse botão não é inferida somente pela navegação.
- **Modelo inicial:** função `handle_new_user` tenta aplicar modelo ativo por segmento em nova
  conta, com cadastro básico como fallback de erro; não sobrescreve contas com serviços/categorias.
  Agora também cria a linha de `assinaturas` com teste de 40 dias (ver 4.14).
  Copia catálogo/faixas, categorias, contas, configurações permitidas e templates/perguntas,
  religando IDs; não copia clientes, agenda, movimentações, fotos, respostas ou credenciais Google.
- **Modelo lash ativo:** consulta de 14/11/2026 confirma 52 serviços, 36 categorias e 1 template
  com 32 perguntas. É uma fotografia armazenada, não contagem permanente garantida.
- **Acesso/dependências:** boas-vindas para a dona autenticada; geração/aplicação de modelos é
  interna do backend, sem tela administrativa ou execução direta pelo app. Depende de
  modelos_iniciais, funções de cadastro, catálogo, categorias, contas, anamnese e user_settings.

### 4.12 Central de Ajuda (`/ajuda`)

- **Manual:** conteúdo estático em `src/content/manual.ts`, busca sem distinguir acento/maiúscula,
  seções expansíveis, atalhos e tabelas adaptadas ao celular. Acesso à usuária autenticada por
  tela/atalhos contextuais. Textos com o nome Belafy.
- **Correções do manual — feitas:** serviços e faixas são **excluídos, não arquivados**; VIP é a
  lista ordenada por valor pago e quantidade, com quantidade de clientes configurável; Atendido
  não abre fotos (acesso manual pela Home/ficha); placeholder de contato de suporte removido.
- **Chat com a assistente (IA):** card de destaque na Ajuda abre Drawer de chat com sugestões e
  streaming. Edge Function autenticada `chat-ajuda` (Lovable AI Gateway) responde **só com base
  numa cópia em texto do manual** (`supabase/functions/chat-ajuda/manual.ts`, mantida em
  sincronia com `src/content/manual.ts`); **sem acesso a dados da conta**, sem ferramentas.
  Limites: últimas 10 mensagens, até 1.000 caracteres cada; histórico só em memória, apagado ao
  fechar. Recusa perguntas sobre dados e saúde; trata 401/402/429 sem perder a pergunta.
- **Primeiros passos — alterado:** o status de cada item é **derivado dos dados reais**
  (conta criada; ao menos uma conta que não seja permuta; taxa em maquininha, ou sem
  maquininha; serviços; clientes; algum agendamento), num único hook `usePrimeirosPassos`.
  “Ocultar na Home” grava `user_settings.primeiros_passos_oculto_em` (vale em todos os
  aparelhos e domínios); o valor antigo do localStorage é migrado e apagado. **Removido:**
  progresso marcado à mão em localStorage. Continua independente das boas-vindas.
- **Dependências:** conteúdo estático, navegação, user_settings, dados do AppContext e
  `chat-ajuda`; nenhum serviço de envio.

### 4.13 Páginas legais (`/termos`, `/privacidade`)

- **Conteúdo:** Termos de Uso e Política de Privacidade da Belafy, estáticos em
  `src/content/legal.ts`, renderizados por `DocumentoLegal`. Cobrem quem somos, serviço, quem
  pode usar, conta, planos e preços, pagamento/renovação, cancelamento/reembolso, dados da
  usuária e das clientes dela, uso aceitável e serviços de terceiros.
- **Acesso:** públicas, sem sessão e sem navegação de negócio (fora de ProtectedRoute/MainLayout).
  Links no cadastro, no paywall e em Configurações.
- **Regra:** mudança de preço, prazo de teste ou tratamento de dados exige atualizar o texto legal
  junto com o código.

### 4.14 Assinaturas Belafy (Stripe)

- **Planos:** teste de **40 dias** a partir da criação da conta, sem cartão; **Pro Mensal
  R$ 39,90** e **Pro Anual R$ 359,00** (cobrado à vista; “economize 25%”). Sem plano gratuito,
  sem contagem mensal de agendamentos. As contas que já existiam antes da cobrança são
  **isentas** (Pro sem cobrança).
- **Estado efetivo:** `plano_efetivo()` — `isento`, `teste`, `pro` ou `expirado` — calculado só
  por `auth.uid()`, sem parâmetro de usuário e sem tarefa agendada. `pro` vale com status
  `active`/`past_due`, ou `canceled` até o fim do período pago. `resumo_assinatura()` devolve
  estado, prazos, periodicidade, cancelamento agendado e se já há cliente Stripe.
- **O que é bloqueado:** **apenas criar agendamento** quando expirado (trigger BEFORE INSERT
  `validar_assinatura_agendamento`, erro `P0010` / `ASSINATURA_NECESSARIA`, que o app traduz
  para o paywall). Edição, reagendamento, conclusão, recebimento, CRM, fotos, anamnese,
  relatórios e exportação continuam funcionando. Nenhum bloqueio global de leitura/navegação.
- **Telas:** Meu Plano (Configurações) mostra “Pro isento”, dias restantes de teste, “Pro ativo
  até [data]” ou “Teste encerrado”; botões Assinar Pro e Gerenciar assinatura (portal Stripe,
  quando já há cliente). Paywall em Drawer com mensal/anual, preços e links legais. Avisos na
  Home (ver 4.2). Retorno do checkout: aguarda confirmação do servidor por até 90s (consulta a
  cada 3s) e só então mostra “Seu Pro está ativo”; cancelamento do checkout não altera o plano.
- **Pagamento:** Edge Functions `criar-checkout-assinatura` (Checkout hospedado, BRL, pt-BR,
  reaproveita o cliente Stripe e bloqueia assinatura duplicada), `gerenciar-assinatura` (portal)
  e `stripe-webhook`. Preços vêm de variáveis seguras (`STRIPE_PRICE_MENSAL_ID`/`ANUAL_ID`) e são
  validados no servidor (ativo, BRL, valor, intervalo, ambiente teste/live); o navegador nunca
  envia preço. URLs de retorno só para origens permitidas; o app só redireciona para
  `checkout.stripe.com`/`billing.stripe.com`.
- **Webhook:** assinatura verificada no corpo bruto; eventos `checkout.session.completed`,
  `customer.subscription.updated|deleted`, `invoice.paid` e `invoice.payment_failed`. **Só
  `invoice.paid` com valor pago concede Pro**; checkout concluído sozinho não concede. Aplicação
  atômica por `aplicar_evento_stripe` com deduplicação em `eventos_stripe`; eventos de
  assinaturas antigas não sobrescrevem a atual; o fim do período pago nunca retrocede.
- **Separação do financeiro:** mensalidade da Belafy **não vira movimentação** em
  `transactions`; nenhum dado de cartão é armazenado.
- **A confirmar:** conexão da chave Stripe de produção, cadastro do webhook live e
  disponibilidade de **Pix Automático** na conta Stripe (no plano de 15/11 esses passos ainda
  estavam pendentes; o commit “Concluiu integração Stripe” é do mesmo dia).

### 4.15 Registro das atualizações

**18/11/2026 — conferência do repositório após a revisão de 14/11** (commits até `5ee02cb`).
Revisadas seções 1, 3, 4, 5, 6, 7 e 10.

- **Adicionado:** marca Belafy da plataforma (tokens, logo, selo, favicon); assinaturas Stripe
  com teste de 40 dias, Meu Plano, paywall, avisos e bloqueio só da criação de agendamento;
  vitrine de planos no cadastro; páginas públicas de Termos e Privacidade; chat de ajuda com IA;
  conta corrente de permuta por cliente (lançamentos, acertos, revisão/ativação, WhatsApp,
  lista Permutas); proteção de exclusão de cliente com saldo de permuta; proteção de origem do
  agendamento; status Permuta no selo de pagamento.
- **Alterado:** nome do app para Belafy e domínio primário `app.belafy.com.br`; Indicadores
  calculados pelos atendimentos, com permuta separada e comparação opcional; Primeiros passos
  derivado dos dados e “ocultar” salvo na conta; abas de Relatórios roláveis; Relatório de
  Agendamentos com total de permuta; exclusão de permuta dos totais unificada em
  `isTransacaoPermuta`; pendências em dinheiro ignoram permuta; manual corrigido.
- **Removido:** `isPermutaRelated` (exclusão de todo lançamento ligado a agendamento permuta);
  cópias locais de `getPaymentStatus`; progresso de Primeiros passos em localStorage; domínio
  `app.marcinhacilios.com.br` das origens de pagamento; placeholder de suporte no manual.
- **Resolvido (antes “a confirmar”):** convite de fotos ao concluir (removido em todos os
  caminhos); manual sobre arquivamento/VIP/suporte (corrigido); permuta legada grava em
  `transactions` (confirmado e documentado).
- **Continua a confirmar:** reconciliação de pagamento/estorno; diferença de corte
  caixa/card/Drawer; abertura por links do CRM com `?edit=`/`?clientId=`; arquivamento de
  serviços (hoje é exclusão); se a conta corrente de permuta já foi ativada nas contas reais;
  Stripe em produção/Pix.

**14/11/2026 — revisão das seções 3 e 4.** Inventário de rotas/telas e navegação,
componentes/design responsivo, Minha Marca, boas-vindas/readback, modelos iniciais,
Ajuda/checklist, detalhes financeiros, permuta legada, fotos, critérios VIP/5ª manutenção;
Home → Meu Dia; caixa e catálogo como fluxo existente; chips/dias e descrição dinâmica;
recebimento bruto/líquido; WhatsApp/lembretes/cobrança. Removidos: descrição só congelada do
serviço, cor própria de manutenção e passo Próxima manutenção / `ScheduleReturnDialog`.

## 5. Guardrails de negócio (nunca violar)

1. **Nunca somar `empresa` e `pessoal`** no mesmo saldo/relatório sem pedido explícito.
2. **Nunca apagar histórico**: movimentações, pagamentos, fotos e anamneses não são excluídos
   silenciosamente; usar status quando aplicável. Confirmar sempre antes de excluir.
   Na migração de permuta, transações legadas são preservadas, nunca convertidas ou apagadas.
3. **Anamnese assinada é imutável** — versionar.
4. **Permuta não entra em receita nem em meta.** Só dinheiro real recebido (recebimento em
   dinheiro num atendimento em permuta ou acerto de permuta) entra no caixa.
5. **Sinal ≠ pagamento** — são estados distintos, não percentual.
6. Não excluir agendamento que já possui pagamentos vinculados.
7. **CRM e Financeiro são módulos conceitualmente separados** — não misturar regras.
8. Toda tabela nova precisa de RLS por `auth.uid()` **e** GRANTs antes de ir a produção.
9. **Caixa empresa/pessoal** (a partir de ago/2026): `scope` não representa mais só
   "de quem é esse dinheiro" de forma manual — passa também a ser alimentado por uma automação
   de divisão de recebimentos de atendimento. Ver detalhe em 4.4.
10. **Saldo inicial e acertos de permuta são imutáveis**, e cliente com saldo de permuta
    diferente de zero não pode ser excluída. Ativar a conta corrente só por confirmação
    explícita da usuária.
11. **Assinatura nunca bloqueia acesso aos dados**: expiração só impede criar agendamento.
    Plano, isenção e IDs Stripe nunca são escritos pelo cliente; acesso Pro só por evento
    Stripe assinado (`invoice.paid`). Mensalidade não entra em `transactions`.
12. **Chat de ajuda não acessa dados da conta** — responde só pelo manual.

## 6. Modelo de dados

| Tabela                | Papel                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `clients`             | Clientes (telefone único, aniversário, recorrência, observações privadas, `conta_permuta_padrao_id` legado, `paga_permuta`)                                                                                  |
| `services`            | Catálogo (valor, duração padrão 60min, cor) + estrutura: `possui_manutencao`, `servico_pai_id`, `manutencao_ate_dias`; campos antigos `technique_name`, `tier_type`, `dias_min`/`dias_max` ainda compatíveis |
| `categories`          | Categorias por `type` + `scope`                                                                                                                                                                              |
| `accounts`            | Contas/formas de recebimento (`dinheiro`, `banco`, `maquininha`, `permuta` legado)                                                                                                                           |
| `account_fee_types`   | Tipos de cobrança por conta, com taxa própria                                                                                                                                                                |
| `appointments`        | Agendamentos (status, permuta, `parent_appointment_id`, `google_event_id`); `created_at`/`user_id` protegidos                                                                                                |
| `transactions`        | Movimentações (`appointment_id`, `account_fee_type_id`, `payment_type`)                                                                                                                                      |
| `user_settings`       | Google Calendar, retenção, CRM, meta, marca, caixa, onboarding, `permuta_corte_em`, `primeiros_passos_oculto_em`                                                                                             |
| `client_photos`       | Fotos antes/depois (bucket `client-photos`)                                                                                                                                                                  |
| `anamnese_*`          | Templates versionados, perguntas, respostas e answers                                                                                                                                                        |
| `permuta_lancamentos` | Lançamentos da conta corrente de permuta (`fui_atendida`, `ajuste`, `saldo_inicial`, `acerto_recebido`, `acerto_pago`)                                                                                       |
| `assinaturas`         | Uma linha por usuária: plano, periodicidade, status, `teste_ate`, IDs Stripe, fim do período, isenção. Usuária só lê a própria                                                                               |
| `eventos_stripe`      | Eventos Stripe processados (idempotência/auditoria); sem acesso para usuárias                                                                                                                                |

**Views:** `permuta_transacoes_legadas`, `permuta_extrato`, `permuta_saldos` (todas
`security_invoker`). **RPCs principais:** `plano_efetivo`, `resumo_assinatura`,
`aplicar_evento_stripe` (só service_role), `registrar_acerto_permuta`,
`revisar_conta_corrente_permuta`, `ativar_conta_corrente_permuta`.

Fonte da verdade do schema: `supabase/migrations/` (histórico até 28/09/2026) **e, desde então,
`drizzle/migrations/`** (0000–0012, com `drizzle/schema.ts`). Novas migrações seguem a
numeração do Drizzle. `SCHEMA_ATUAL.sql` é a fotografia consolidada.
`src/integrations/supabase/types.ts` é **gerado** — nunca editar à mão.

## 7. Integrações

- **Lovable Cloud** (Postgres + Auth + Storage + Edge Functions, API compatível com Supabase).
  Não existe projeto Supabase avulso administrado à parte.
- **Google Calendar**: sync **unidirecional** (app → Google) via Edge Function `google-calendar`,
  com idempotência por `google_event_id`. Client id/secret por usuário em `user_settings`;
  **o secret nunca é lido no cliente** (apenas um booleano "configurado").
- **WhatsApp**: link `wa.me` gerado em `src/lib/whatsapp.ts` — não é API oficial.
- **Stripe** (conta própria): assinaturas Pro via `criar-checkout-assinatura`,
  `gerenciar-assinatura` e `stripe-webhook` (helpers em `_shared/assinaturas.ts`). Secrets:
  `STRIPE_SECRET_KEY` (chave restrita), `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MENSAL_ID`,
  `STRIPE_PRICE_ANUAL_ID`, `STRIPE_AMBIENTE`. Detalhes em 4.14.
- **Lovable AI Gateway**: Edge Function `chat-ajuda` para o chat da Ajuda, só com o manual.

## 8. Escala atual (ago/2026, referência)

`transactions` ~700 · `appointments` ~330 · `services` ~104 · `clients` ~71 · 2 usuários.
Volume ainda não exige paginação agressiva, mas evite carregar tudo sem filtro de data.
(Números não reconferidos em 18/11; as 2 contas existentes são as isentas de assinatura.)

## 9. Roadmap — **não implementar sem pedido explícito**

- Módulo dedicado de "Gestão Financeira" (fluxo de caixa, projeções, lucro).
- Multiusuário / equipe e expansão para outros segmentos.
- Sync bidirecional com Google Calendar.

## 10. Lacunas a decidir

- [x] Monetização: **decidido SaaS** — teste de 40 dias + Pro mensal/anual via Stripe (4.14).
- [ ] Backup/retenção além do `ExportData`.
- [ ] LGPD formal (há fotos e anamneses = dados sensíveis). Termos e Política de Privacidade
      já publicados (4.13); falta avaliação jurídica formal.

---

**Manutenção deste documento:** toda decisão de produto ou regra de negócio nova tomada em
conversa deve ser refletida aqui, na seção correspondente — não apenas no código.
