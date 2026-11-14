# BÍBLIA.md — Pink Purse Pal (App Marcinha Cílios)

> Documento **de produto e domínio**: o "o quê" e o "porquê".
> Para regras de execução/código do agente, veja `CLAUDE.md`.
> Última revisão: setembro/2026.

---

## 1. Identidade do produto

**Pink Purse Pal** é um ERP + Agenda + CRM para **profissionais autônomas da beleza**
(lash designer, sobrancelhas, nail designer, esteticista, cabeleireira, maquiadora).
Cobre o ciclo completo da cliente: cadastro → anamnese → fotos → agendamento →
atendimento → pagamento → financeiro → retorno/CRM → relatórios.

- **Não é "só uma agenda".** Toda decisão de produto deve preservar a visão de sistema completo.
- **Mobile-first.** Desktop é consequência, não prioridade (largura máxima 1152px).
- **Uso real, não protótipo.** Já roda em produção com dados reais.
- **Idioma do domínio: português.** Rotas, tipos, enums e status em pt-BR — decisão consciente.

**URLs**
- Produção (domínio próprio): https://app.marcinhacilios.com.br
- Publicado (Lovable): https://pink-purse-pal.lovable.app

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

**Layout e design em uso — conferência em 14/11/2026.** Rosa/branco é o tema padrão,
limpo e minimalista; a cor primária pode ser personalizada por conta em **Minha Marca**.
Esta seção descreve o que existe no código, não uma proposta de redesenho.

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

### 3.1 Telas, rotas e estrutura

| Tela / rota | Cabeçalho, seções e menus | Diálogos e painéis principais |
|---|---|---|
| Entrar / Criar Conta — `/auth` | Card centralizado, abas de entrada/cadastro, campos de credenciais e recuperação de senha; sem navegação inferior | Feedback de autenticação e validação de senha |
| Recuperar senha — `/recuperar-senha` | Formulário de recuperação e fluxo de nova senha; página pública | Feedback de envio/alteração |
| Meu Dia — `/` | Data atual, título e olho; Primeiros passos; busca por cliente; retornos, lembretes, Hoje, ações Movimentação/Agendamento, saldos, Próximos Agendamentos e Pendentes de Conclusão | Agendamento/criação/edição, recebimento, exclusão, conferência de caixa, Mais ações e fotos |
| Movimentações — `/movimentacoes` | Cabeçalho, ajuda, relatório e adicionar; resumo de caixa, seletor de mês local; filtros de escopo/categoria/busca; lista de lançamentos | Nova/editar movimentação e confirmação de exclusão |
| Agendamentos — `/agendamentos` | Cabeçalho, ajuda, alternância Lista/Semana/Mês e adicionar; busca; calendário mensal inicialmente, semanal ou listas Hoje/Próximos/Anteriores | Mesmo formulário para criar/editar, recebimento e exclusão; controles de status nos cards |
| CRM — `/crm` | Cabeçalho e ajuda; resumo, produção do mês, lembretes, cards acionáveis e lista de clientes | Listas por critério, cobrança WhatsApp e detalhes da produção |
| Ficha do cliente — `/cliente/:id` | Nome e voltar; abas Dados, CRM, Fotos e Anamnese; Dados inicialmente, cadastro, métricas e histórico | Enviar agenda; detalhes do atendimento somente leitura; ferramentas de fotos, comparação, anamnese e cobrança |
| Relatórios — `/relatorios` | Cabeçalho e abas Indicadores (inicial), Agenda, Financeiro e Movim.; quatro relatórios incorporados | Filtros e ações de exportação próprios de cada relatório |
| Relatório de Movimentações — `/relatorio-movimentacoes` | Cabeçalho e voltar a Movimentações; filtros, tabela, resumo por origem e banco | Exportação do resultado |
| Relatório de Agendamentos — `/relatorio-agendamentos` | Cabeçalho e voltar a Relatórios; filtros, quatro métricas, resumo por status e lista | Exportação do resultado |
| Indicadores — `/relatorio-indicadores` | Cabeçalho, ano e voltar a Relatórios; métricas, clientes atendidos por mês e faturamento mês a mês | Controles de período do relatório |
| Configurações — `/configuracoes` | Cabeçalho, ajuda, conta conectada, senha e sair; accordion único expansível | Cadastros, marca, contas/taxas/extratos, anamnese, configurações e confirmações |
| Ajuda — `/ajuda` | Cabeçalho, busca, manual em accordion, atalhos “Como eu faço para...?” e checklist | Conteúdo estático; tabelas adaptadas em cards no celular |
| Página não encontrada — `*` | Página pública para endereço sem correspondência | Não representa funcionalidade autenticada |

- **Configurações:** ordem dos grupos: Minha Marca, Clientes, Serviços, Categorias,
  Contas e Bancos, Google Calendar, Retenção de Clientes, CRM, Modelos de Anamnese,
  Separação de Caixa e Exportar Dados. Um grupo aberto por vez; grade de uma coluna no
  celular e duas em `md`. No card da conta, “Conectado como” fica acima do e-mail truncável;
  trocar senha e sair ficam na linha de ações.
- **CRM:** resumo em três colunas no celular/seis em `md`; cards de ação em duas/três.
- **Relatórios:** abas em duas colunas no celular/quatro em `md`, com rótulos ocultos abaixo
  de `sm`. Tabelas/listas e filtros variam por relatório, com rolagem quando necessária.
- **Ficha:** métricas em duas/quatro colunas; detalhes de atendimento em Sheet à direita,
  ocupando a largura toda no celular e limitado a 448px a partir de `sm`.
  Fotos/anamnese permanecem dentro das abas.

### 3.2 Navegação entre telas

- Barra fixa inferior: **Início → Movim. → Agenda → CRM → Relat. → Config**.
  Agenda tem botão circular destacado. A indicação ativa usa o caminho exato; ficha e rotas
  avulsas de relatórios não destacam automaticamente o item do módulo de origem.
- Sem sessão, rotas de negócio redirecionam para `/auth`; `/auth`, `/recuperar-senha` e
  página não encontrada são públicas. Recuperação é acessada pela tela de entrada.
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

**Funções em uso — conferência em 14/11/2026.** Salvo indicação contrária, as funções abaixo
são para a **usuária autenticada, dona da conta**, com dados próprios isolados por `user_id`/RLS.
Não há equipe, administrador de empresa ou permissões diferenciadas no app. As dependências
citadas são do código e das funções existentes; este inventário não atesta a execução de cada
integração externa. Divergências não foram corrigidas nesta atualização documental.

### 4.1 Autenticação
- **Entrada/cadastro:** e-mail/senha em `/auth`, via Lovable Cloud Auth; acesso público, sem
  cadastro anônimo. Indicador de força e validação de senha durante cadastro/troca.
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
- **Dependências:** appointments, clients, services, transactions, accounts no AppContext,
  configurações de caixa/CRM, helpers de cores/dias e preferências locais.

### 4.3 Agenda (`/agendamentos`)
- **Visões:** Mês (inicial), Semana e Lista, busca por cliente e criação/edição pelo mesmo
  AppointmentForm; cliente, serviço, data/hora, duração, valor, observações e status.
- **Status:** confirmação `pendente | confirmado | atendido | cancelado | retorno_previsto`;
  pagamento `pago | nao_pago | sinal`. Pago/sinal dependem do valor acumulado recebido, enquanto
  o lançamento também pode indicar o tipo de recebimento. Cancelamento não apaga pagamentos.
- **Cadastro contínuo:** cliente pesquisável, criação durante o agendamento com espera pelo
  UUID real, preenchimento do serviço e validação de conflito por início + duração.
  Submit bloqueado durante salvamento para evitar duplicação.
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
- **Permuta:** flag editável, sugerida pela preferência da cliente; não é receita em dinheiro.
  Receber usa a mesma ação normal, com seleção de contas de permuta (ver 4.4 e 4.5).
- **Finalização:** Agenda possui mudança simples de status e ação “Concluir e receber”, que
  pode abrir recebimento quando existe saldo. **Removida:** antiga etapa “Próxima manutenção” /
  `ScheduleReturnDialog`; não foi localizada como fluxo ativo.
  **A confirmar:** a regra anterior de encerrar Atendido sem fotos não está uniforme no código:
  `AppointmentPreview` ainda chama `onAtendido`/abre fotos, e a Home fornece esse callback.
  Não registrar a remoção global desse prompt como concluída.
- **Exclusão:** interface restringe agendamento com valores pagos; a proteção universal por
  existência de transações vinculadas, em todos os caminhos, está **a confirmar**.
- **Dependências:** AppContext, hooks de clientes/serviços/agendamentos, configurações de
  retorno, helpers puros e sincronização Google quando conectada.

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

**Controle de Permutas**
- Contas `type = 'permuta'` aparecem em grupo separado de contas reais e têm extrato próprio.
- Mesmo Receber/TransactionForm: aviso de permuta, Caixa oculto, contas restritas a permuta,
  conta padrão da cliente pré-selecionada e editável; permite criar conta durante a escolha.
- Saldos gerais da Home/Movimentações excluem tanto contas permuta quanto lançamentos ligados
  a agendamento permuta, inclusive dados legados. Agendamentos permuta continuam na Agenda.
- **A confirmar:** a exigência anterior “sem gravar em transactions” não corresponde ao caminho
  inspecionado: TransactionForm chama `addTransaction`, e `useAddTransaction` insere em
  `transactions` também nesse modo. Não foi identificado armazenamento separado para esse
  extrato. Registrar essa divergência não altera a regra de exclusão dos cards nem o banco.

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
- **Preferência de permuta:** checkbox “Cliente costuma pagar em permuta” exige Banco padrão
  para permuta, relacionado por `conta_permuta_padrao_id`, nunca pelo nome. Escolha só de contas
  permuta e criação na seleção. Novos agendamentos sugerem permuta e recebimento sugere essa conta.
- **Ficha:** Dados, CRM, Fotos e Anamnese; cadastro, métricas e histórico. Cards do histórico
  abrem detalhes somente leitura, com serviço, data/duração, status, valor/pago/saldo,
  observações, divisão de caixa quando aplicável, pagamentos/contas e fotos associadas.
- **Linha do tempo:** agendamentos/atendimentos pela data marcada; pagamentos pelo registro
  real de criação, agrupados em janela de ±2 minutos. Histórico concluído compara atendimentos
  realizados; agendas futuras usam o anterior não cancelado. Ambos usam o helper central de dias.
- **CRM da ficha:** total gasto, total pago, saldo de atendimentos realizados pendentes e de
  agendas abertas; acesso à cobrança quando elegível. As métricas gerais da ficha não são
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
  anamnese, helpers de dias/WhatsApp e preferências locais; envio/cobrança não usa API do WhatsApp.

### 4.6 CRM (`/crm`)
- **Cards acionáveis:** Confirmar Agenda, Retornos Pendentes, Clientes Inativas, Clientes VIP,
  Aniversariantes, Na 5ª manutenção e Com saldo pendente; listas filtradas em CrmListSheet.
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
- **Indicadores:** ano, comparação/evolução, clientes atendidos por mês e faturamento mensal;
  faturamento do indicador usa entradas empresa e filtros próprios, não soma geral do caixa.
- **Financeiro:** extrato, filtros de período/conta/escopo, resumo por categoria/conta e totais
  separados por empresa/pessoal; BI de Gastos com mês/escopo e barras. PDF em paisagem.
- **Movimentações:** tabela detalhada de 10 colunas, vínculo de cliente/agendamento, Saldo Anterior,
  filtros e resumos por origem/banco. Acesso pela aba ou rota própria.
- **Agendamentos:** período, filtros, status, métricas e lista com descrição/chips estruturados;
  permutas continuam como agendamentos. PDF/CSV usam descrição textual, não chips gráficos.
- **Exportações:** controles CSV/PDF conforme o relatório; PDFs Financeiro, Movimentações e
  Agendamentos incorporam marca. Não foi identificado exportador universal para todo gráfico.
- **Permuta:** cards gerais excluem por conta/vínculo, mas relatórios têm filtros próprios e
  podem mostrar extrato da conta permuta selecionada. Exclusão idêntica em toda métrica de cada
  relatório está **a confirmar**; não afirmar que todos reutilizam o filtro da Home.
- **Dependências:** transactions, appointments, accounts, categories, clients, services,
  filtros locais, Recharts, jsPDF/autotable e utilitários de marca. Todo dado novo deve ser
  pensado para eventualmente alimentar relatórios, sem documentar recurso futuro como presente.

### 4.9 Configurações
- **Conta:** e-mail conectado, troca de senha e sair; ajuda e grupos expansíveis.
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
  logo como armazenamento de informação sensível. Restrição MIME no bucket, além da validação
  do formulário/políticas de nome, não foi atestada nesta atualização.
- **Aplicação:** cabeçalho do negócio, tema primário, anamnese e PDFs dos relatórios indicados;
  cor lembrada localmente antes do primeiro desenho, limpa ao sair. Não personaliza automaticamente
  Pix/assinatura da cobrança nem todos os textos fixos do WhatsApp.
- **Dependências:** user_settings (`nome_negocio`, `logo_path`, `cor_primaria`), bucket público
  logos/políticas por pasta própria, useMarca e utilitários de tema/PDF; usuária dona da conta.

### 4.11 Boas-vindas e modelos iniciais
- **Boas-vindas:** Sheet de três passos no MainLayout após carregar dados quando não existe
  configuração ou `onboarding_concluido_em` é nulo: Sua marca → Seus preços (principais/faixas)
  → Tudo pronto (caixa e opção de primeiro agendamento).
- **Pular/fechar:** pular os primeiros passos avança; último Pular/concluir/X registra conclusão.
  Painel só fecha/navega depois de readback seguro confirmar timestamp persistido; erro mantém
  aberto com aviso. Não é o mesmo progresso local do checklist Primeiros passos.
- **Primeiro agendamento:** ao concluir, pode navegar para Agenda; abertura automática do
  formulário por esse botão não é inferida somente pela navegação.
- **Modelo inicial:** função `handle_new_user` tenta aplicar modelo ativo por segmento em nova
  conta, com cadastro básico como fallback de erro; não sobrescreve contas com serviços/categorias.
  Copia catálogo/faixas, categorias, contas, configurações permitidas e templates/perguntas,
  religando IDs; não copia clientes, agenda, movimentações, fotos, respostas ou credenciais Google.
- **Modelo lash ativo:** consulta de 14/11/2026 confirma 52 serviços, 36 categorias e 1 template
  com 32 perguntas. É uma fotografia armazenada, não contagem permanente garantida.
- **Acesso/dependências:** boas-vindas para a dona autenticada; geração/aplicação de modelos é
  interna do backend, sem tela administrativa ou execução direta pelo app. Depende de
  modelos_iniciais, funções de cadastro, catálogo, categorias, contas, anamnese e user_settings.

### 4.12 Central de Ajuda (`/ajuda`)
- **Manual:** conteúdo estático em `src/content/manual.ts`, busca sem distinguir acento/maiúscula,
  seções expansíveis, atalhos e tabelas adaptadas ao celular; não consulta documentos externos
  nem usa atendimento por IA. Acesso à usuária autenticada por tela/atalhos contextuais.
- **Primeiros passos:** checklist com links às áreas correspondentes; progresso e preferência
  de ocultar na Home em localStorage por usuário. Não salva no banco nem conclui boas-vindas.
- **Dependências:** conteúdo estático, navegação e armazenamento local; nenhum serviço de envio.
- **A confirmar:** manual ainda descreve arquivamento de serviços, diferente dos DELETEs atuais;
  também confunde quantidade de clientes VIP com número mínimo de visitas. Contato de suporte
  permanece placeholder — não documentar como canal operacional confirmado.

### 4.13 Registro desta atualização

Somente as seções **3. Identidade visual** (layout) e **4. Módulos** (funções) foram revisadas.
Demais títulos/textos, inclusive modelo de dados, integrações, guardrails e referências históricas,
ficaram intactos por limite de escopo; informações antigas nessas seções não são nova verificação.

- **Adicionado:** inventário de todas as rotas/telas e navegação; componentes/design responsivo;
  Minha Marca; boas-vindas/readback; modelos iniciais; Ajuda/checklist; detalhes financeiros;
  preferência/conta padrão de permuta; ferramentas de fotos; critérios VIP/5ª manutenção.
- **Alterado:** Home para Meu Dia; caixa e catálogo de “em implementação” para fluxo existente;
  campos estruturais de serviços; chips/dias e descrição dinâmica; recebimento bruto/líquido;
  WhatsApp/lembretes/cobrança; ficha/anamnese; relatórios e limites das integrações.
- **Marcado como removido:** descrição exclusivamente congelada de serviço, cor personalizada
  efetiva de manutenção e antigo passo automático Próxima manutenção / ScheduleReturnDialog.
- **A confirmar, não marcado como remoção concluída:** prompt global de fotos após Atendido,
  arquivamento de serviços, permuta sem transactions, reconciliação de pagamento/estorno,
  diferenças de corte caixa/card/Drawer, abertura por links do CRM e informações de suporte/manual.

## 5. Guardrails de negócio (nunca violar)

1. **Nunca somar `empresa` e `pessoal`** no mesmo saldo/relatório sem pedido explícito.
2. **Nunca apagar histórico**: movimentações, pagamentos, fotos e anamneses não são excluídos
   silenciosamente; usar status quando aplicável. Confirmar sempre antes de excluir.
3. **Anamnese assinada é imutável** — versionar.
4. **Permuta não entra em receita nem em meta.**
5. **Sinal ≠ pagamento** — são estados distintos, não percentual.
6. Não excluir agendamento que já possui pagamentos vinculados.
7. **CRM e Financeiro são módulos conceitualmente separados** — não misturar regras.
8. Toda tabela nova precisa de RLS por `auth.uid()` **e** GRANTs antes de ir a produção.
9. **Caixa empresa/pessoal** (a partir de ago/2026): `scope` não representa mais só
   "de quem é esse dinheiro" de forma manual — passa também a ser alimentado por uma automação
   de divisão de recebimentos de atendimento. Ver detalhe em 4.4.

## 6. Modelo de dados

| Tabela | Papel |
|---|---|
| `clients` | Clientes (telefone único, aniversário, recorrência, observações privadas) |
| `services` | Catálogo (valor, duração padrão 60min, cor) + estrutura por técnica: `technique_name`, `tier_type` (avulso/colocação/manutenção), `dias_min`/`dias_max` da faixa |
| `categories` | Categorias por `type` + `scope` |
| `accounts` | Contas/formas de recebimento |
| `account_fee_types` | Tipos de cobrança por conta, com taxa própria |
| `appointments` | Agendamentos (status, permuta, `parent_appointment_id`, `google_event_id`) |
| `transactions` | Movimentações (`appointment_id`, `account_fee_type_id`, `payment_type`) |
| `user_settings` | Google Calendar, retenção, CRM, meta mensal |
| `client_photos` | Fotos antes/depois (bucket `client-photos`) |
| `anamnese_*` | Templates versionados, perguntas, respostas e answers |

Fonte da verdade do schema: `supabase/migrations/` (cronológico, ~24 migrações).
`src/integrations/supabase/types.ts` é **gerado** — nunca editar à mão.

## 7. Integrações

- **Lovable Cloud** (Postgres + Auth + Storage + Edge Functions, API compatível com Supabase).
  Não existe projeto Supabase avulso administrado à parte.
- **Google Calendar**: sync **unidirecional** (app → Google) via Edge Function `google-calendar`,
  com idempotência por `google_event_id`. Client id/secret por usuário em `user_settings`;
  **o secret nunca é lido no cliente** (apenas um booleano "configurado").
- **WhatsApp**: link `wa.me` gerado em `src/lib/whatsapp.ts` — não é API oficial.

## 8. Escala atual (ago/2026, referência)

`transactions` ~700 · `appointments` ~330 · `services` ~104 · `clients` ~71 · 2 usuários.
Volume ainda não exige paginação agressiva, mas evite carregar tudo sem filtro de data.

## 9. Roadmap — **não implementar sem pedido explícito**

- Módulo dedicado de "Gestão Financeira" (fluxo de caixa, projeções, lucro).
- Multiusuário / equipe e expansão para outros segmentos.
- Sync bidirecional com Google Calendar.

## 10. Lacunas a decidir

- [ ] Monetização (SaaS multi-tenant) vs uso próprio.
- [ ] Backup/retenção além do `ExportData`.
- [ ] LGPD formal (há fotos e anamneses = dados sensíveis).

---

**Manutenção deste documento:** toda decisão de produto ou regra de negócio nova tomada em
conversa deve ser refletida aqui, na seção correspondente — não apenas no código.
