/** Conteúdo estático da Central de Ajuda (Manual do Novo Usuário). */
export type BlocoManual =
  | { tipo: 'paragrafo'; texto: string; destaque?: string }
  | { tipo: 'lista'; ordenada?: boolean; itens: string[] }
  | { tipo: 'subtitulo'; texto: string }
  | { tipo: 'tabela'; colunas: string[]; linhas: string[][] };

export interface SecaoManual {
  id: string;
  titulo: string;
  resumo: string;
  blocos: BlocoManual[];
}

export interface PassoInicial {
  id: string;
  titulo: string;
  texto: string;
  destino: string;
}

export const primeirosPassos: PassoInicial[] = [
  { id: 'conta', titulo: 'Crie sua conta.', texto: 'Abra app.marcinhacilios.com.br, informe e-mail e senha. O app mostra se a senha está forte enquanto você digita.', destino: '/configuracoes' },
  { id: 'contas', titulo: 'Cadastre onde o dinheiro entra.', texto: 'Em Configurações → Contas e Bancos, crie uma conta para cada lugar: dinheiro, banco (Pix) e maquininha.', destino: '/configuracoes?abrir=accounts' },
  { id: 'taxas', titulo: 'Informe as taxas da maquininha.', texto: 'Dentro da conta da maquininha, cadastre cada tipo de cobrança (débito, crédito à vista, parcelado) com a sua taxa. O app passa a calcular quanto cai de verdade na sua conta.', destino: '/configuracoes?abrir=accounts' },
  { id: 'servicos', titulo: 'Cadastre seus serviços.', texto: 'Em Configurações → Serviços, informe nome, valor, duração e cor de cada um. Se o serviço tem manutenção, ligue a chave "Possui manutenção" e cadastre as faixas de dias com o valor de cada uma.', destino: '/configuracoes?abrir=services' },
  { id: 'clientes', titulo: 'Cadastre suas primeiras clientes.', texto: 'Comece só pelas que têm horário nesta semana: nome, telefone e aniversário. As outras você cadastra conforme forem marcando.', destino: '/configuracoes?abrir=clients' },
  { id: 'horario', titulo: 'Marque o primeiro horário.', texto: 'Na Agenda, escolha a cliente, o serviço, o dia e a hora.', destino: '/agendamentos' },
];

export const comoFaco: { pergunta: string; resposta: string }[] = [
  { pergunta: 'Marcar um horário', resposta: 'Agenda → adicionar → cliente, serviço, dia e hora → salvar' },
  { pergunta: 'Remarcar', resposta: 'Abra o horário → editar → escolha novo dia e hora' },
  { pergunta: 'Cancelar', resposta: 'Abra o horário → mude a situação para Cancelado' },
  { pergunta: 'Confirmar a presença', resposta: 'CRM → A confirmar → chame no WhatsApp → marque como Confirmado' },
  { pergunta: 'Encerrar o atendimento', resposta: 'Abra o horário → Atendido → pagamento (fotos, se quiser, pela ficha da cliente)' },
  { pergunta: 'Receber em duas formas', resposta: 'Registre dois pagamentos no mesmo atendimento, um em cada conta' },
  { pergunta: 'Registrar um sinal', resposta: 'Registre o valor recebido e marque o pagamento como Sinal' },
  { pergunta: 'Lançar uma despesa', resposta: 'Movimentações → adicionar → Saída → valor, categoria e conta' },
  { pergunta: 'Ver quanto uma cliente deve', resposta: 'Ficha da cliente → resumo financeiro → Saldo pendente' },
  { pergunta: 'Ver as fotos de uma cliente', resposta: 'Ficha da cliente → Fotos' },
  { pergunta: 'Aplicar a anamnese', resposta: 'Ficha da cliente → Anamnese → responder → assinar' },
  { pergunta: 'Mudar o preço de um serviço', resposta: 'Configurações → Serviços → editar' },
  { pergunta: 'Esconder os valores da tela', resposta: 'Início → ícone de olho' },
  { pergunta: 'Trocar a senha', resposta: 'Configurações → Alterar Senha' },
];

export const secoesManual: SecaoManual[] = [
  {
    id: 'comece',
    titulo: 'Comece por aqui',
    resumo: 'Os três hábitos para usar o app no dia a dia.',
    blocos: [
      { tipo: 'paragrafo', texto: 'O Pink Purse Pal é o seu caderno de agenda, a sua ficha de clientes e o seu controle de dinheiro, tudo no celular. Você anota uma vez e o app organiza o resto.' },
      { tipo: 'paragrafo', texto: 'Você não precisa aprender tudo de uma vez. Para trabalhar no dia a dia, bastam três coisas:' },
      { tipo: 'lista', ordenada: true, itens: ['Marcar o horário da cliente na Agenda.', 'Concluir o atendimento quando ele terminar.', 'Registrar o pagamento que você recebeu.'] },
      { tipo: 'paragrafo', texto: 'Com esses três hábitos, o app já mostra sozinho quanto você ganhou, quem está sumida, quem faz aniversário e quem precisa confirmar horário.' },
      { tipo: 'paragrafo', destaque: 'Como ler este manual:', texto: 'faça a seção "Primeiros 10 minutos" uma única vez. Depois, use a seção "Como eu faço para...?" sempre que tiver uma dúvida. O restante é consulta.' },
    ],
  },
  {
    id: 'primeiros-passos',
    titulo: 'Primeiros 10 minutos',
    resumo: 'Faça estes passos uma vez, na ordem, e o app fica pronto para o seu primeiro atendimento.',
    blocos: [
      { tipo: 'paragrafo', texto: 'Faça estes passos uma vez, na ordem, e o app fica pronto para o seu primeiro atendimento. Marque cada item conforme terminar.' },
      { tipo: 'lista', itens: primeirosPassos.map((p) => `${p.titulo} ${p.texto}`) },
      { tipo: 'paragrafo', texto: 'Depois, quando tiver um tempo livre:' },
      { tipo: 'lista', itens: [
        'Defina sua meta do mês e as regras de acompanhamento em Configurações → CRM.',
        'Monte sua ficha de anamnese em Configurações → Modelos de Anamnese, com as perguntas que você já faz às clientes.',
        'Conecte o Google Calendar, se quiser ver seus horários também na agenda do Google.',
      ] },
      { tipo: 'paragrafo', destaque: 'Dica:', texto: 'a cor do serviço é a cor que aparece na agenda. Use cores diferentes para serviços diferentes e você entende o seu dia só de olhar.' },
    ],
  },
  {
    id: 'conhecendo',
    titulo: 'Conhecendo o app',
    resumo: 'As seis áreas do app e a pergunta que cada uma responde.',
    blocos: [
      { tipo: 'paragrafo', texto: 'O app tem seis áreas, e cada uma responde a uma pergunta do seu dia.' },
      { tipo: 'tabela', colunas: ['Área', 'Pergunta que ela responde', 'O que você encontra'], linhas: [
        ['Início', 'Como está o meu dia?', 'Saldo, próximos atendimentos e retornos a confirmar'],
        ['Agenda', 'Quem eu atendo e quando?', 'Seus horários por mês, por semana ou em lista'],
        ['Movimentações', 'Quanto entrou e quanto saiu?', 'Recebimentos e despesas, da empresa e pessoais'],
        ['CRM', 'Quem eu preciso chamar?', 'Clientes a confirmar, sumidas, VIPs, aniversariantes e meta do mês'],
        ['Relatórios', 'Como foi o meu mês?', 'Resumos de dinheiro, atendimentos e indicadores, com exportação em PDF'],
        ['Configurações', 'Onde eu ajusto o app?', 'Contas, categorias, clientes, serviços, anamnese, CRM e senha'],
      ] },
      { tipo: 'paragrafo', destaque: 'Esconder valores:', texto: 'na tela inicial, toque no ícone de olho para ocultar o saldo. Útil quando a cliente está ao seu lado. O app lembra a sua escolha.' },
      { tipo: 'paragrafo', destaque: 'Cores na ficha da cliente:', texto: 'azul claro é horário marcado para o futuro, azul escuro é atendimento já feito e verde é pagamento.' },
    ],
  },
  {
    id: 'agenda',
    titulo: 'Agenda',
    resumo: 'Marcar, remarcar e concluir horários.',
    blocos: [
      { tipo: 'paragrafo', texto: 'A Agenda guarda todos os seus horários e avisa quando dois atendimentos batem no mesmo horário. Você pode olhar por Mês, por Semana ou em Lista.' },
      { tipo: 'subtitulo', texto: 'Marcar um horário' },
      { tipo: 'lista', ordenada: true, itens: ['Abra a Agenda e toque em adicionar.', 'Escolha a cliente.', 'Escolha o serviço. O valor e a duração já vêm preenchidos.', 'Escolha o dia e a hora.', 'Salve. O botão mostra "Salvando..." por um instante: toque uma vez só.'] },
      { tipo: 'paragrafo', texto: 'Se o serviço tem manutenção, o app pergunta em sequência: qual técnica, se é colocação ou manutenção, há quantos dias foi a última e qual manutenção é (1ª, 2ª...). Com isso ele encontra o valor certo.' },
      { tipo: 'subtitulo', texto: 'O que significa cada situação do horário' },
      { tipo: 'tabela', colunas: ['Situação', 'Significa'], linhas: [
        ['Pendente', 'Está marcado, mas a cliente ainda não confirmou'],
        ['Confirmado', 'A cliente confirmou que vem'],
        ['Atendido', 'O atendimento já aconteceu'],
        ['Cancelado', 'Não vai acontecer; fica guardado no histórico'],
        ['Retorno previsto', 'Uma volta esperada da cliente, ainda sem confirmação'],
      ] },
      { tipo: 'subtitulo', texto: 'Terminar um atendimento' },
      { tipo: 'lista', ordenada: true, itens: ['Abra o horário e marque como Atendido.', 'Se quiser, tire ou anexe as fotos do resultado pela ficha da cliente, na aba Fotos.', 'Registre o pagamento (veja a seção Dinheiro).'] },
      { tipo: 'paragrafo', destaque: 'Remarcar:', texto: 'abra o horário, edite e escolha o novo dia e hora. O app abre a agenda completa para você ver os horários livres.' },
      { tipo: 'paragrafo', destaque: 'Permuta:', texto: 'se o atendimento foi uma troca de serviços, sem dinheiro, marque a opção Permuta. O app não cobra nada e não conta esse atendimento no seu faturamento nem na sua meta.' },
    ],
  },
  {
    id: 'clientes',
    titulo: 'Clientes',
    resumo: 'Ficha da cliente, fotos e anamnese.',
    blocos: [
      { tipo: 'paragrafo', texto: 'Cada cliente tem uma ficha que junta tudo sobre ela: dados, atendimentos, pagamentos, fotos e anamnese.' },
      { tipo: 'paragrafo', destaque: 'Cadastrar:', texto: 'informe nome, telefone e aniversário. O telefone não pode se repetir: se o app recusar, essa cliente já está cadastrada.' },
      { tipo: 'subtitulo', texto: 'O que a ficha mostra' },
      { tipo: 'lista', itens: [
        'Linha do tempo: tudo o que aconteceu com a cliente, em ordem, com atendimentos e pagamentos juntos.',
        'Intervalo entre visitas: quantos dias se passaram desde o atendimento anterior. Ajuda a saber se a manutenção está em dia.',
        'Fotos: antes e depois de cada atendimento, com comparação lado a lado.',
        'Resumo financeiro: quanto ela já gastou, quanto já pagou, quanto está devendo e quanto valem os horários que ainda estão marcados.',
      ] },
      { tipo: 'subtitulo', texto: 'Ficha de anamnese' },
      { tipo: 'paragrafo', texto: 'A anamnese é o questionário de saúde e cuidados que a cliente responde antes do procedimento. No app, ela responde na tela, assina com o dedo e você pode imprimir ou salvar em PDF.' },
      { tipo: 'paragrafo', texto: 'Depois de assinada, a ficha não pode mais ser alterada. Isso protege você: ela vale como registro do que a cliente declarou naquele dia. Se você mudar as perguntas do seu modelo, as fichas antigas continuam como foram assinadas e as novas clientes respondem o modelo novo.' },
      { tipo: 'paragrafo', destaque: 'Falar com a cliente:', texto: 'o app abre o WhatsApp já na conversa com ela. Você não precisa salvar o número na agenda do celular.' },
    ],
  },
  {
    id: 'dinheiro',
    titulo: 'Dinheiro',
    resumo: 'Recebimentos, despesas, Empresa e Pessoal.',
    blocos: [
      { tipo: 'paragrafo', texto: 'Todo dinheiro que entra ou sai vira uma movimentação, e cada movimentação responde a quatro perguntas simples.' },
      { tipo: 'tabela', colunas: ['Pergunta', 'Opções'], linhas: [
        ['Entrou ou saiu?', 'Entrada ou Saída'],
        ['É do trabalho ou da vida pessoal?', 'Empresa ou Pessoal'],
        ['É sobre o quê?', 'A categoria (ex.: Serviços, Material, Aluguel)'],
        ['Por onde passou?', 'A conta (dinheiro, banco ou maquininha)'],
      ] },
      { tipo: 'subtitulo', texto: 'Receber de uma cliente' },
      { tipo: 'lista', ordenada: true, itens: ['Abra o atendimento e registre o pagamento.', 'Informe o valor e escolha a conta.', 'Se for maquininha, escolha o tipo (débito, crédito à vista, parcelado). O app desconta a taxa e mostra o valor que você recebe de fato.'] },
      { tipo: 'paragrafo', destaque: 'A cliente pagou parte no Pix e parte no cartão?', texto: 'Registre dois pagamentos no mesmo atendimento, um em cada conta.' },
      { tipo: 'paragrafo', destaque: 'Sinal não é pagamento.', texto: 'Sinal é o valor adiantado para garantir o horário. O atendimento só fica como Pago quando o valor todo foi recebido.' },
      { tipo: 'paragrafo', destaque: 'Lançar uma despesa:', texto: 'em Movimentações, adicione uma Saída com valor, categoria e conta. Marque Empresa para gastos do trabalho (material, aluguel) e Pessoal para os seus (mercado, lazer).' },
      { tipo: 'paragrafo', destaque: 'Empresa e Pessoal nunca se misturam.', texto: 'O app mantém dois saldos separados de propósito. Assim você sabe quanto o seu trabalho rende de verdade, sem confundir com os gastos de casa.' },
      { tipo: 'subtitulo', texto: 'Divisão automática: quanto fica na empresa e quanto vai para você' },
      { tipo: 'paragrafo', texto: 'Você pode pedir ao app para separar sozinho cada recebimento: uma parte fixa fica no caixa da empresa, para pagar as contas do trabalho, e o restante vai para o seu caixa pessoal, livre para você usar.' },
      { tipo: 'paragrafo', texto: 'Para ligar, vá em Configurações → Separação de Caixa, ative a divisão de caixa e informe o valor que cada atendimento deve reservar para a empresa. Ela vem desligada: enquanto estiver assim, nada é dividido.' },
      { tipo: 'paragrafo', destaque: 'Como escolher o valor:', texto: 'some as contas do trabalho no mês (aluguel, material, internet) e divida pelo número de atendimentos que você costuma fazer. Exemplo: R$ 2.000 de contas e 50 atendimentos dão R$ 40 por atendimento.' },
      { tipo: 'paragrafo', texto: 'Veja como fica com a reserva em R$ 40:' },
      { tipo: 'tabela', colunas: ['Situação', 'Vai para a empresa', 'Vai para o pessoal'], linhas: [
        ['Cliente pagou R$ 150', 'R$ 40', 'R$ 110'],
        ['Cliente pagou R$ 30 (menos que a reserva)', 'R$ 30', 'R$ 0'],
        ['Sinal de R$ 30, depois mais R$ 120', 'R$ 30 do sinal + R$ 10 do restante', 'R$ 110'],
        ['Permuta', 'Nada', 'Nada'],
      ] },
      { tipo: 'paragrafo', texto: 'Quatro coisas que vale saber:' },
      { tipo: 'lista', itens: [
        'A conta é por atendimento, não por pagamento. Sinal e pagamento final somam juntos: a empresa recebe primeiro, até completar a reserva.',
        'Mudar o valor só vale daqui para frente. Atendimentos que já receberam algum pagamento continuam com o valor antigo.',
        'Excluiu um pagamento, a divisão se desfaz. Os dois caixas voltam ao que eram.',
        'A categoria não muda. As duas partes continuam, por exemplo, em "Serviços". Só o lado (Empresa ou Pessoal) é diferente.',
      ] },
      { tipo: 'paragrafo', texto: 'Os dois saldos aparecem na tela inicial e em Movimentações, ocultos até você tocar para mostrar.' },
      { tipo: 'paragrafo', destaque: 'Corrigir um pagamento errado:', texto: 'pagamentos ligados a um atendimento não podem ser editados. Exclua o pagamento errado e registre de novo com os dados certos.' },
    ],
  },
  {
    id: 'crm',
    titulo: 'Quem chamar hoje e como vai o mês',
    resumo: 'Cartões do CRM e Relatórios.',
    blocos: [
      { tipo: 'paragrafo', texto: 'O CRM é a tela que diz com quem você precisa falar. Toque em qualquer cartão para ver a lista de clientes e chamar pelo WhatsApp.' },
      { tipo: 'tabela', colunas: ['Cartão', 'Para que serve'], linhas: [
        ['A confirmar', 'Clientes com horário chegando que ainda não confirmaram'],
        ['Retornos previstos', 'Clientes que já deveriam estar voltando'],
        ['Inativas', 'Clientes que não aparecem há muito tempo'],
        ['VIPs', 'Suas clientes mais frequentes'],
        ['Aniversariantes', 'Quem faz aniversário, para você mandar um carinho'],
        ['Produção do Mês', 'Quanto você já fez, quanto ainda está marcado e o quanto falta para a meta'],
      ] },
      { tipo: 'paragrafo', texto: 'Você decide as regras em Configurações → CRM: depois de quantos dias uma cliente vira inativa, com quantos dias de antecedência confirmar, quantas visitas fazem uma VIP e qual é a sua meta mensal.' },
      { tipo: 'paragrafo', texto: 'Em Relatórios você vê o resumo do mês (dinheiro, atendimentos e indicadores) e pode exportar em PDF ou planilha, por exemplo para enviar ao contador.' },
    ],
  },
  {
    id: 'bloqueios',
    titulo: 'O que o app não deixa fazer, e por quê',
    resumo: 'Ações bloqueadas de propósito para proteger o seu histórico.',
    blocos: [
      { tipo: 'paragrafo', texto: 'O app bloqueia algumas ações de propósito, para proteger o seu histórico. Quando ele recusar algo, quase sempre é um destes casos.' },
      { tipo: 'tabela', colunas: ['O app não deixa...', 'Por quê', 'O que fazer'], linhas: [
        ['Marcar dois atendimentos no mesmo horário', 'Evita que duas clientes cheguem juntas', 'Escolha outro horário ou ajuste a duração'],
        ['Cadastrar duas clientes com o mesmo telefone', 'Evita ficha duplicada', 'Procure a cliente que já existe'],
        ['Editar um pagamento de atendimento', 'Mantém o financeiro fiel ao que aconteceu', 'Exclua e registre de novo'],
        ['Excluir um horário que já tem pagamento', 'O dinheiro ficaria sem origem', 'Exclua o pagamento antes, ou apenas cancele o horário'],
        ['Alterar uma anamnese assinada', 'Ela é o registro do que a cliente declarou', 'Aplique uma ficha nova'],
        ['Excluir um serviço já usado', 'Os atendimentos antigos perderiam a descrição', 'O serviço é arquivado: some da agenda, fica no histórico'],
      ] },
      { tipo: 'paragrafo', texto: 'O app sempre pede confirmação antes de excluir qualquer coisa. Leia a mensagem antes de confirmar.' },
    ],
  },
  {
    id: 'dicionario',
    titulo: 'Dicionário simples',
    resumo: 'As palavras do app em português claro.',
    blocos: [
      { tipo: 'tabela', colunas: ['Palavra', 'Em português claro'], linhas: [
        ['Anamnese', 'Questionário de saúde que a cliente responde e assina antes do procedimento'],
        ['Categoria', 'A "etiqueta" do dinheiro: do que se trata aquela entrada ou saída'],
        ['Conta', 'Onde o dinheiro está: dinheiro em mãos, banco ou maquininha'],
        ['CRM', 'Acompanhamento das clientes: quem confirmar, quem chamar de volta'],
        ['Empresa / Pessoal', 'Dinheiro do trabalho / dinheiro da sua vida particular'],
        ['Entrada / Saída', 'Dinheiro que você recebeu / dinheiro que você gastou'],
        ['Faixa de manutenção', 'Período em dias em que a manutenção tem determinado valor'],
        ['Inativa', 'Cliente que não volta há mais dias do que você definiu'],
        ['Movimentação', 'Qualquer registro de dinheiro entrando ou saindo'],
        ['Permuta', 'Atendimento trocado por outro serviço ou produto, sem dinheiro'],
        ['Retorno previsto', 'Volta esperada da cliente, ainda não confirmada'],
        ['Sinal', 'Valor adiantado pela cliente para garantir o horário'],
        ['Taxa da maquininha', 'Parte que a operadora do cartão desconta de cada venda'],
        ['Valor líquido', 'O que sobra para você depois de descontada a taxa'],
        ['VIP', 'Cliente que já veio o número de vezes que você definiu'],
      ] },
    ],
  },
  {
    id: 'problemas',
    titulo: 'Deu problema?',
    resumo: 'Soluções para as dúvidas mais comuns.',
    blocos: [
      { tipo: 'paragrafo', destaque: 'Esqueci minha senha.', texto: 'Na tela de entrada, toque em "Esqueci minha senha" e siga as instruções enviadas ao seu e-mail.' },
      { tipo: 'paragrafo', destaque: 'O saldo sumiu da tela inicial.', texto: 'Os valores estão ocultos. Toque no ícone de olho para mostrar.' },
      { tipo: 'paragrafo', destaque: 'O saldo não bate com o que eu tenho.', texto: 'Confira três coisas: se algum atendimento ficou sem pagamento registrado, se alguma despesa não foi lançada e se a movimentação foi marcada no lado certo (Empresa ou Pessoal).' },
      { tipo: 'paragrafo', destaque: 'O valor da maquininha veio menor.', texto: 'É a taxa do cartão. O app mostra o valor cobrado da cliente e o valor que você recebe.' },
      { tipo: 'paragrafo', destaque: 'Não consigo salvar o horário.', texto: 'Provavelmente há outro atendimento no mesmo período. Veja a agenda do dia e ajuste a hora ou a duração.' },
      { tipo: 'paragrafo', destaque: 'Mudei um horário no Google Calendar e o app não mudou.', texto: 'O app envia os horários para o Google, mas não recebe mudanças de lá. Altere sempre pelo app.' },
      { tipo: 'paragrafo', destaque: 'Tenho medo de perder meus dados.', texto: 'Seus dados ficam guardados na sua conta, não no celular. Trocar de aparelho não apaga nada. Em Configurações → Exportar Dados você também pode exportar uma cópia.' },
      { tipo: 'paragrafo', destaque: 'Preciso de ajuda.', texto: '[Contato do suporte: definir canal e horário de atendimento]' },
    ],
  },
];

/** Normaliza texto para busca: sem acentos e minúsculo. */
export function normalizarBusca(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
