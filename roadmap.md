# Conta corrente de permuta — execução por etapas
- [x] Etapa 1: migração 0009 aplicada com critério legado único, preferência independente, views, acerto atômico e congelamento; saldos vazios, corte nulo e 81 referências legadas conferidas, bruto/líquido iguais.
- [ ] Etapa 2 autorizada: confirmar pasta de migrações; testar proteções com ROLLBACK; criar revisão com sugestões por frequência/nome e ativação atômica, mantendo confirmação desabilitada até Etapas 3–4; não ativar dados reais.
- [ ] Etapa 3: aguardar autorização; helper financeiro exclui somente conta permuta, relatórios distinguem dinheiro/permuta, acertos ficam somente leitura e cliente com saldo não zero não pode ser excluída.
- [ ] Etapas 4–5: aguardar autorização; telas de conta corrente e WhatsApp seguindo a convenção de sinal aprovada.

# Assinaturas Belafy — aprovado, sem plano gratuito
- [x] Inspecionar schema real, cadastro, inserções de agenda e documentação Stripe/Pix.
- [x] Aprovação recebida: sem plano gratuito/contagem mensal; só criação bloqueada após expiração. RPCs auth.uid() e eventos internos service_role.
- [x] Confirmar que app, Google Calendar e funções de caixa não alteram created_at/user_id dos agendamentos.
- [ ] Conectar Stripe com chave restrita de teste pelo formulário seguro.
- [ ] Após aprovação: conectar conta Stripe de teste, implementar proteção de limite, checkout/webhook/portal e interface; validar regras e fluxo completo.

# Páginas públicas legais
- [x] Guardar termos e privacidade em conteúdo estático e adicionar rotas públicas, sem navegação inferior.
- [x] Adicionar links no cadastro e em Configurações; completar análise de visitas conforme configurações verificadas.
- [x] Conferir páginas e links no navegador em 360px/1280px, incluindo Configurações autenticada; sem transbordamento ou erros, tabelas viram cards no celular, lint e build OK.

# Marca Belafy (plataforma)
- [x] Tokens belafy-* fixos + cores no Tailwind; componentes LogoBelafy e SeloBelafy.
- [x] /auth e /recuperar-senha com fundo ameixa, logo escuro, card branco 24px e botões ameixa (lógica intacta).
- [x] Boas-vindas: logo, "Passo X de 3", barra de progresso, título do passo 1 e botões ameixa (lógica intacta).
- [x] Selo "feito com belafy" só no fim de Meu Dia e Configurações; logo no topo da Ajuda.
- [x] index.html: título/meta/og/theme-color Belafy, favicon.svg + apple-touch-icon; sem manifest PWA (não existia).
- [x] Varredura "Pink Purse Pal": trocado só nos manuais visíveis (src/content/manual.ts e espelho chat-ajuda); docs internos preservados.
- [x] Validar no navegador: /auth e /recuperar-senha (360px/1280px), boas-vindas com usuária de teste (passos 1 e 2, pular funcionando), selo em Meu Dia/Configurações, logo na Ajuda, título da aba "Belafy". Typecheck e build passaram.

# Enviar agenda futura
- [x] Verificar conclusão das boas-vindas de Roy: persistência, Pular, X, erro de gravação e confirmação no banco, sem migração. A conclusão já existia; adicionado retorno explícito da gravação e trava contra duplicidade. Três caminhos validados na conta real; falha simulada mantém painel aberto; 5 testes passam.
- [x] Implementar lembretes de confirmação: colunas, mensagem, hooks, Home/CRM e configurações.
- [x] Validar 12 regras novas (34 testes no total), fluxo autenticado Home/CRM, registro real de envio em dados temporários e ausência de efeito financeiro/status. Conferir editor e larguras 360/390/1280.
- [x] Implementar geração da mensagem e painel na ficha.
- [x] Executar 12 testes das regras e conferir o painel isolado no navegador a 380px e desktop.
- [x] Atualizar documentação do recurso.
- [x] Conferir o fluxo completo na ficha real com sessão autenticada.

# Layout do Meu Dia
- [x] Ajustar cabeçalho, ações rápidas e saldos ocultos somente na Home.
- [x] Reorganizar cards e Mais ações preservando os fluxos existentes.
- [x] Conferir a Home autenticada em 360px e 390px: sem transbordamento, Mais ações, formulário completo e revelação de saldos.

# Finalizar atendimento sem convite de fotos
- [x] Remover disparos automáticos em todos os caminhos sem alterar acesso manual.
- [x] Verificar Home, Agenda (Lista/Mês/Semana) e câmera da Home/ficha no navegador autenticado com registros temporários, removidos ao final.
- [x] Identificar acesso manual na Home (Mais ações) e na ficha (Fotos); atualizar regra de produto.
# Cobrança de saldo pendente via WhatsApp
- [x] Helper puro cobranca.ts (regras do saldo pendente + mensagem) com 7 testes.
- [x] CobrancaSheet reutilizável: checkboxes, prévia editável, envio wa.me.
- [x] Botão "Cobrar no WhatsApp" na aba CRM da ficha (saldo > 0 e telefone).
- [x] Card "Com saldo pendente" no /crm abrindo lista de clientes → sheet de cobrança.
- [x] Validar no navegador autenticado (ficha + /crm) em 360px; corrigido overflow do ScrollArea no CrmListSheet.

# Chat de ajuda com IA
- [x] Corrigir somente fotos, serviços, VIP e suporte do manual estático. Botão manual encontrado na Home (Mais ações → Adicionar fotos), não na Agenda; nenhuma outra tela alterada.
- [x] Adicionar chat-ajuda autenticado com manual espelhado, streaming, 10 mensagens e 1.000 caracteres por mensagem, sem acesso a dados.
- [x] Adicionar Drawer na Ajuda com histórico em memória, sugestões e tratamento seguro de erros.
- [x] Testar limites, autenticação, respostas reais e fechamento em celular/desktop; documentar arquitetura. Seis testes locais, rejeição real de 11 mensagens/1.001 caracteres, JWT inválido 401, recusas de dados/saúde e avisos simulados 429/402 com pergunta preservada.
