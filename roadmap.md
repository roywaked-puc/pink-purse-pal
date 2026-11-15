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
