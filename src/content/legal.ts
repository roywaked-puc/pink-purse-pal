export type BlocoLegal =
  | { tipo: 'paragrafo'; texto: string }
  | { tipo: 'lista'; itens: string[] }
  | { tipo: 'tabela'; colunas: string[]; linhas: string[][] };

export interface DocumentoLegal {
  titulo: string;
  data: string;
  introducao: BlocoLegal[];
  secoes: { titulo: string; blocos: BlocoLegal[] }[];
}

export const termos: DocumentoLegal = {
  "titulo": "Termos de Uso — Belafy",
  "data": "15 de nov. de 2026 · @ROY",
  "introducao": [
    {
      "tipo": "paragrafo",
      "texto": "Ao criar uma conta no Belafy, você concorda com estes Termos de Uso e com a Política de Privacidade. Se não concordar, não use o serviço."
    }
  ],
  "secoes": [
    {
      "titulo": "1. Quem somos",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "O Belafy é operado por ROY ELI WAKED, 026.509.189-69, com sede em CURITIBA/PR (\"Belafy\", \"nós\"). Contato: belafy@hotmail.com ou (41) 98818-1158."
        },
        {
          "tipo": "paragrafo",
          "texto": "Nestes Termos, \"você\" ou \"usuária\" é a profissional que cria a conta. \"Clientes\" são as pessoas atendidas por você e cadastradas por você no aplicativo."
        }
      ]
    },
    {
      "titulo": "2. O serviço",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "O Belafy é um aplicativo web de gestão para profissionais autônomas da beleza, disponível em https://app.belafy.com.br. Ele reúne:"
        },
        {
          "tipo": "lista",
          "itens": [
            "agenda de atendimentos;",
            "controle financeiro, com caixa da empresa e caixa pessoal separados;",
            "cadastro e acompanhamento de clientes (CRM), com mensagens preparadas para envio manual pelo WhatsApp;",
            "ficha da cliente, com histórico, fotos e anamnese com assinatura;",
            "relatórios e exportação de dados;",
            "integração opcional com o Google Calendar."
          ]
        },
        {
          "tipo": "paragrafo",
          "texto": "O Belafy é uma ferramenta de organização. Ele não presta serviços de beleza, não intermedeia pagamentos entre você e suas clientes e não envia mensagens em seu nome."
        }
      ]
    },
    {
      "titulo": "3. Quem pode usar",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "Você precisa ter 18 anos ou mais e capacidade legal para contratar. A conta é individual: um cadastro por profissional."
        }
      ]
    },
    {
      "titulo": "4. Sua conta",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "Você é responsável por manter sua senha em sigilo e por tudo o que for feito na sua conta. Informe dados verdadeiros no cadastro e avise-nos imediatamente em caso de acesso não autorizado."
        }
      ]
    },
    {
      "titulo": "5. Planos e preços",
      "blocos": [
        {
          "tipo": "tabela",
          "colunas": [
            "Plano",
            "Preço",
            "O que inclui"
          ],
          "linhas": [
            [
              "Teste",
              "Gratuito por 40 dias a partir do cadastro, sem cartão",
              "Todos os recursos, agendamentos ilimitados"
            ],
            [
              "Gratuito",
              "R$ 0",
              "Todos os recursos, com até 10 agendamentos novos por mês"
            ],
            [
              "Pro mensal",
              "R$ 39,90 por mês",
              "Todos os recursos, agendamentos ilimitados"
            ],
            [
              "Pro anual",
              "R$ 359,00 por ano, à vista",
              "Todos os recursos, agendamentos ilimitados"
            ]
          ]
        },
        {
          "tipo": "paragrafo",
          "texto": "Ao fim do teste, a conta passa automaticamente para o plano Gratuito, sem cobrança. O limite do plano Gratuito impede apenas a criação de novos agendamentos: você continua vendo, editando e exportando tudo o que já cadastrou."
        }
      ]
    },
    {
      "titulo": "6. Pagamento e renovação",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "Os pagamentos são processados pela Stripe. O Belafy não armazena os dados do seu cartão."
        },
        {
          "tipo": "paragrafo",
          "texto": "A assinatura Pro é renovada automaticamente ao fim de cada período (mês ou ano), no mesmo meio de pagamento, até que você cancele. Se uma cobrança falhar, novas tentativas serão feitas; se nenhuma for concluída, a conta volta ao plano Gratuito."
        },
        {
          "tipo": "paragrafo",
          "texto": "Podemos alterar os preços com aviso de pelo menos 30 dias, por e-mail ou no aplicativo. O novo preço vale a partir da renovação seguinte ao aviso."
        }
      ]
    },
    {
      "titulo": "7. Cancelamento e reembolso",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "Você pode cancelar a qualquer momento em Configurações → Meu Plano. O acesso Pro continua até o fim do período já pago e depois a conta volta ao plano Gratuito."
        },
        {
          "tipo": "paragrafo",
          "texto": "Se você pedir o cancelamento em até 7 dias após a primeira contratação de um plano pago, devolvemos o valor integral (direito de arrependimento, art. 49 do Código de Defesa do Consumidor). Após esse prazo, não há reembolso proporcional do período em curso, inclusive no plano anual."
        },
        {
          "tipo": "paragrafo",
          "texto": "Cancelamento, falha de pagamento ou fim do teste não apagam seus dados. Se você excluir a conta em até 7 dias após a primeira contratação de um plano pago, o valor é devolvido automaticamente."
        }
      ]
    },
    {
      "titulo": "8. Seus dados e os dados das suas clientes",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "Tudo o que você cadastra no Belafy continua sendo seu. Você pode exportar clientes, serviços, agendamentos, movimentações, categorias e contas em Configurações → Exportar Dados."
        },
        {
          "tipo": "paragrafo",
          "texto": "Em relação aos dados das suas clientes, você é a controladora e o Belafy é o operador, nos termos da LGPD. Isso significa que cabe a você:"
        },
        {
          "tipo": "lista",
          "itens": [
            "informar suas clientes de que os dados delas são registrados em um aplicativo de gestão;",
            "obter o consentimento da cliente antes de registrar fotos e respostas de anamnese, que incluem dados de saúde;",
            "atender os pedidos das suas clientes sobre os dados delas (acesso, correção, exclusão);",
            "cadastrar apenas os dados necessários ao atendimento."
          ]
        },
        {
          "tipo": "paragrafo",
          "texto": "O Belafy trata esses dados somente para prestar o serviço a você, conforme a Política de Privacidade."
        },
        {
          "tipo": "paragrafo",
          "texto": "Uma ficha de anamnese assinada não pode ser editada. Para atualizar as informações, crie uma nova ficha."
        }
      ]
    },
    {
      "titulo": "9. Uso aceitável",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "Você concorda em não:"
        },
        {
          "tipo": "lista",
          "itens": [
            "usar o Belafy para atividade ilegal ou para enviar mensagens não solicitadas em massa;",
            "cadastrar dados de terceiros sem ter base legal para isso;",
            "tentar acessar contas ou dados de outras usuárias;",
            "copiar, revender ou fazer engenharia reversa do aplicativo;",
            "sobrecarregar ou tentar burlar os limites técnicos e os limites do seu plano."
          ]
        }
      ]
    },
    {
      "titulo": "10. Serviços de terceiros",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "Alguns recursos dependem de serviços de terceiros, que têm termos próprios: Stripe (pagamento da assinatura), Google Calendar (sincronização opcional da agenda) e WhatsApp (envio manual de mensagens, feito por você). O Belafy não responde por indisponibilidade ou mudanças nesses serviços."
        }
      ]
    },
    {
      "titulo": "11. Disponibilidade e suporte",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "Trabalhamos para manter o Belafy disponível, mas o serviço pode ficar fora do ar para manutenção ou por falhas fora do nosso controle. Não garantimos funcionamento ininterrupto."
        },
        {
          "tipo": "paragrafo",
          "texto": "O suporte é feito por belafy@hotmail.com e pelo telefone (41) 98818-1158."
        },
        {
          "tipo": "paragrafo",
          "texto": "Recomendamos exportar seus dados periodicamente em Configurações → Exportar Dados."
        }
      ]
    },
    {
      "titulo": "12. Limitação de responsabilidade",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "O Belafy é uma ferramenta de apoio. As decisões sobre atendimentos, preços, finanças e obrigações fiscais são suas. Os relatórios e saldos refletem o que você registrou e não substituem contabilidade nem orientação profissional."
        },
        {
          "tipo": "paragrafo",
          "texto": "Na medida permitida pela lei, o Belafy não responde por lucros cessantes, perda de clientes ou danos indiretos decorrentes do uso ou da indisponibilidade do serviço. Nossa responsabilidade total fica limitada ao valor pago por você nos 12 meses anteriores ao fato. Essa limitação não afasta direitos que a legislação de defesa do consumidor garante a você."
        }
      ]
    },
    {
      "titulo": "13. Propriedade intelectual",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "O aplicativo, a marca Belafy, o código e o conteúdo de ajuda pertencem ao Belafy. Estes Termos dão a você uma licença pessoal, não exclusiva e intransferível de uso enquanto a conta estiver ativa."
        },
        {
          "tipo": "paragrafo",
          "texto": "O nome e o logo do seu negócio, quando configurados, continuam sendo seus."
        }
      ]
    },
    {
      "titulo": "14. Encerramento",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "Você pode excluir sua conta a qualquer momento em Configurações → Excluir minha conta (ou pedir por belafy@hotmail.com). A assinatura é cancelada na hora e você tem 30 dias para desistir, entrando de novo e reativando a conta. Depois desse prazo, todos os dados da conta, inclusive fotos e fichas de anamnese assinadas, são apagados de vez, salvo o que a lei nos obriga a guardar. Exporte seus dados antes."
        },
        {
          "tipo": "paragrafo",
          "texto": "Podemos suspender ou encerrar contas que violem estes Termos, com aviso prévio sempre que possível."
        }
      ]
    },
    {
      "titulo": "15. Alterações destes Termos",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "Podemos atualizar estes Termos. Mudanças relevantes serão avisadas por e-mail ou no aplicativo com pelo menos 15 dias de antecedência. Continuar usando o Belafy após a data de vigência significa que você aceita a nova versão."
        }
      ]
    },
    {
      "titulo": "16. Lei aplicável e foro",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "Estes Termos são regidos pelas leis do Brasil. Fica eleito o foro de CURITIBA/PR, sem prejuízo do direito da consumidora de optar pelo foro do próprio domicílio."
        }
      ]
    },
    {
      "titulo": "17. Contato",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "Belafy · belafy@hotmail.com · (41) 98818-1158 · https://app.belafy.com.br"
        },
        {
          "tipo": "paragrafo",
          "texto": "Última atualização: 15 de novembro de 2026."
        }
      ]
    }
  ]
};

export const privacidade: DocumentoLegal = {
  "titulo": "Política de Privacidade — Belafy",
  "data": "15 de nov. de 2026 · @ROY",
  "introducao": [
    {
      "tipo": "paragrafo",
      "texto": "Esta política explica quais dados pessoais o Belafy trata, para quê, com quem compartilha e como você exerce seus direitos, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, \"LGPD\")."
    }
  ],
  "secoes": [
    {
      "titulo": "1. Quem somos",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "O Belafy é operado por ROY ELI WAKED, 026.509.189-69, com sede em CURITIBA/PR. O aplicativo fica em https://app.belafy.com.br."
        },
        {
          "tipo": "paragrafo",
          "texto": "Contato para assuntos de privacidade (encarregado): ROY ELI WAKED, belafy@hotmail.com."
        }
      ]
    },
    {
      "titulo": "2. Nossos dois papéis",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "O Belafy trata dois grupos de dados, com responsabilidades diferentes."
        },
        {
          "tipo": "tabela",
          "colunas": [
            "Dados",
            "De quem são",
            "Papel do Belafy",
            "Quem decide sobre eles"
          ],
          "linhas": [
            [
              "Dados da conta e da assinatura",
              "Da profissional que usa o aplicativo",
              "Controlador",
              "O Belafy"
            ],
            [
              "Dados cadastrados no aplicativo (clientes, agenda, financeiro, fotos, anamnese)",
              "Das clientes da profissional e da própria profissional",
              "Operador",
              "A profissional, que é a controladora"
            ]
          ]
        },
        {
          "tipo": "paragrafo",
          "texto": "Se você é cliente de uma profissional que usa o Belafy, seus dados foram cadastrados por ela. Pedidos de acesso, correção ou exclusão devem ser feitos primeiro a ela. Se precisar, escreva para belafy@hotmail.com e encaminharemos o pedido."
        }
      ]
    },
    {
      "titulo": "3. Dados que tratamos",
      "blocos": [
        {
          "tipo": "tabela",
          "colunas": [
            "Dados",
            "Exemplos",
            "Para quê",
            "Base legal (LGPD)"
          ],
          "linhas": [
            [
              "Conta da profissional",
              "E-mail, senha (armazenada de forma cifrada), nome do negócio, logo, cor da marca",
              "Criar e manter a conta, autenticar o acesso",
              "Execução de contrato (art. 7º, V)"
            ],
            [
              "Assinatura",
              "Plano, situação da assinatura, identificadores da Stripe",
              "Cobrar e liberar os recursos do plano",
              "Execução de contrato (art. 7º, V)"
            ],
            [
              "Clientes da profissional",
              "Nome, telefone, aniversário, observações, histórico de atendimentos e de pagamentos",
              "Agenda, ficha, CRM e relatórios da profissional",
              "Definida pela profissional, que é a controladora"
            ],
            [
              "Fotos de clientes",
              "Fotos de antes e depois, com data e observação",
              "Registro do atendimento na ficha",
              "Definida pela profissional; exige autorização da cliente"
            ],
            [
              "Anamnese",
              "Respostas sobre saúde, alergias e procedimentos, e a assinatura da cliente",
              "Segurança do atendimento e registro do consentimento",
              "Dado sensível: consentimento específico da cliente, obtido pela profissional (art. 11, I)"
            ],
            [
              "Financeiro da profissional",
              "Entradas, saídas, contas, categorias",
              "Controle de caixa e relatórios",
              "Execução de contrato (art. 7º, V)"
            ],
            [
              "Google Calendar (opcional)",
              "Credenciais e tokens de acesso fornecidos pela profissional",
              "Enviar os agendamentos para a agenda do Google",
              "Execução de contrato, a pedido da profissional"
            ],
            [
              "Dados técnicos",
              "Registros de acesso, endereço IP, data e hora",
              "Segurança, prevenção a fraude e obrigação legal de guarda",
              "Obrigação legal (Marco Civil da Internet) e legítimo interesse"
            ]
          ]
        },
        {
          "tipo": "paragrafo",
          "texto": "Não vendemos dados pessoais e não usamos os dados cadastrados no aplicativo para publicidade."
        },
        {
          "tipo": "paragrafo",
          "texto": "O Belafy não recebe nem armazena os dados do cartão: eles são informados diretamente à Stripe."
        },
        {
          "tipo": "paragrafo",
          "texto": "As mensagens de WhatsApp são preparadas no aplicativo e enviadas pela própria profissional, no WhatsApp dela. O Belafy não envia mensagens às clientes."
        }
      ]
    },
    {
      "titulo": "4. Com quem compartilhamos",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "Compartilhamos dados apenas com os fornecedores necessários para o aplicativo funcionar e quando a lei exige."
        },
        {
          "tipo": "tabela",
          "colunas": [
            "Fornecedor",
            "Para quê",
            "Dados envolvidos"
          ],
          "linhas": [
            [
              "Lovable (Lovable Cloud)",
              "Hospedagem do aplicativo, banco de dados, autenticação e armazenamento de arquivos",
              "Todos os dados do aplicativo"
            ],
            [
              "Stripe",
              "Processamento da assinatura",
              "E-mail, dados de pagamento e de cobrança da profissional"
            ],
            [
              "Google (Google Calendar)",
              "Sincronização da agenda, somente se a profissional conectar",
              "Data, horário, nome da cliente e serviço de cada agendamento"
            ],
            [
              "Lovable (assistente de ajuda com IA)",
              "Responder perguntas sobre o uso do aplicativo",
              "As últimas dez mensagens da conversa, limitadas a 1.000 caracteres por mensagem; a assistente não consulta dados da conta"
            ],
            [
              "Google Fonts",
              "Carregar a fonte usada no aplicativo",
              "Dados técnicos da conexão com o provedor, como endereço IP e navegador"
            ]
          ]
        },
        {
          "tipo": "paragrafo",
          "texto": "Também podemos compartilhar dados com autoridades, mediante ordem judicial ou obrigação legal."
        },
        {
          "tipo": "paragrafo",
          "texto": "Ao abrir uma mensagem preparada no WhatsApp, o texto e o telefone de destino são passados ao WhatsApp. A conversa com a assistente de ajuda fica somente na memória da página e é limpa ao fechar o chat. Não envie dados pessoais ou informações sensíveis no chat."
        }
      ]
    },
    {
      "titulo": "5. Transferência internacional",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "Esses fornecedores podem armazenar ou processar dados em servidores fora do Brasil. Nesses casos, a transferência segue as hipóteses previstas nos arts. 33 a 36 da LGPD, com as garantias contratuais oferecidas por cada fornecedor."
        }
      ]
    },
    {
      "titulo": "6. Como protegemos os dados",
      "blocos": [
        {
          "tipo": "lista",
          "itens": [
            "Cada conta só acessa os próprios dados: o banco aplica regras de isolamento por usuária em todas as tabelas.",
            "A conexão com o aplicativo é cifrada (HTTPS).",
            "As fotos de clientes ficam em armazenamento privado e são exibidas por links temporários.",
            "Uma ficha de anamnese assinada não pode ser alterada.",
            "As credenciais do Google Calendar não são lidas pelo navegador."
          ]
        },
        {
          "tipo": "paragrafo",
          "texto": "O logo do negócio, quando enviado, fica em endereço público, porque aparece em documentos e relatórios."
        },
        {
          "tipo": "paragrafo",
          "texto": "Nenhum sistema é totalmente seguro. Se ocorrer um incidente que possa causar risco ou dano relevante, avisaremos as profissionais afetadas e a Autoridade Nacional de Proteção de Dados (ANPD), conforme a LGPD."
        }
      ]
    },
    {
      "titulo": "7. Por quanto tempo guardamos",
      "blocos": [
        {
          "tipo": "tabela",
          "colunas": [
            "Dados",
            "Prazo"
          ],
          "linhas": [
            [
              "Dados da conta e do aplicativo",
              "Enquanto a conta existir"
            ],
            [
              "Após o pedido de exclusão da conta",
              "30 dias para desistir; depois, exclusão definitiva"
            ],
            [
              "Registros de acesso",
              "6 meses, como exige o Marco Civil da Internet"
            ],
            [
              "Registros de cobrança",
              "Pelo prazo exigido pela legislação fiscal"
            ]
          ]
        },
        {
          "tipo": "paragrafo",
          "texto": "A profissional pode excluir clientes, fotos e fichas de anamnese não assinadas diretamente no aplicativo. Fichas assinadas podem ser arquivadas; para excluí-las, escreva para belafy@hotmail.com."
        }
      ]
    },
    {
      "titulo": "8. Seus direitos",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "A LGPD garante ao titular dos dados o direito de:"
        },
        {
          "tipo": "lista",
          "itens": [
            "confirmar se tratamos seus dados e acessá-los;",
            "corrigir dados incompletos ou desatualizados;",
            "pedir a exclusão ou a anonimização de dados desnecessários;",
            "receber os dados em formato que permita levá-los a outro serviço (a profissional pode exportar em Configurações → Exportar Dados);",
            "saber com quem os dados foram compartilhados;",
            "revogar o consentimento, quando o tratamento se basear nele;",
            "reclamar à ANPD."
          ]
        },
        {
          "tipo": "paragrafo",
          "texto": "Para exercer esses direitos, escreva para belafy@hotmail.com. Respondemos em até 15 dias. Se você é cliente de uma profissional, fale primeiro com ela."
        }
      ]
    },
    {
      "titulo": "9. Cookies e armazenamento local",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "O Belafy usa o armazenamento local do navegador para manter você conectada e lembrar preferências, como a cor da marca, a ocultação de valores, a exibição de valores nas mensagens de agenda e o progresso e a ocultação do checklist Primeiros passos. Não usamos cookies de publicidade."
        },
        {
          "tipo": "paragrafo",
          "texto": "A página de pagamento é da Stripe, que usa os próprios cookies para segurança e prevenção a fraude."
        },
        {
          "tipo": "paragrafo",
          "texto": "A análise de visitas da Lovable não usa cookies, não guarda nada no dispositivo de quem visita, não mantém endereços IP e não identifica visitantes."
        },
        {
          "tipo": "paragrafo",
          "texto": "Lovable collects this data for us. [Lovable's privacy policy](https://lovable.dev/privacy) explains how it handles it."
        },
        {
          "tipo": "paragrafo",
          "texto": "São registrados as páginas visitadas, de onde as visitas vieram, país, navegador, sistema operacional e tipo de dispositivo, tempo de permanência, velocidade de carregamento, erros e cliques em botões e links. Como o site não tem um aviso que transmita uma escolha de análise de uso, esses registros são feitos para todas as visitas, sem cookies e sem identificar ninguém."
        },
        {
          "tipo": "paragrafo",
          "texto": "Os dados detalhados são mantidos por 90 dias e os resumos diários por um ano. A análise de visitas é separada dos registros técnicos de segurança descritos nesta política."
        }
      ]
    },
    {
      "titulo": "10. Menores de idade",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "O Belafy é destinado a profissionais com 18 anos ou mais. Se uma profissional atender menores, cabe a ela obter o consentimento do responsável legal antes de cadastrar os dados."
        }
      ]
    },
    {
      "titulo": "11. Alterações desta política",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "Podemos atualizar esta política. Mudanças relevantes serão avisadas por e-mail ou no aplicativo antes de entrarem em vigor."
        }
      ]
    },
    {
      "titulo": "12. Contato",
      "blocos": [
        {
          "tipo": "paragrafo",
          "texto": "Belafy · belafy@hotmail.com · (41) 98818-1158 · https://app.belafy.com.br"
        },
        {
          "tipo": "paragrafo",
          "texto": "Última atualização: 15 de novembro de 2026."
        }
      ]
    }
  ]
};
