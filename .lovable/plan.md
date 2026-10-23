# Enviar agenda futura pelo WhatsApp

## Resultado
Adicionar **Enviar agenda** acima do histórico na ficha da cliente, somente quando houver próximos agendamentos elegíveis. O botão abre um painel inferior no celular com mensagem editável, opção **Mostrar valores**, **Abrir WhatsApp** e **Copiar mensagem**.

## Regras
- Incluir todos os horários a partir de agora, com status `pendente`, `confirmado` ou `retorno_previsto`, em ordem crescente. Excluir cancelados e atendidos.
- Usar o primeiro nome da cliente e datas/horários em `America/Sao_Paulo`, no padrão `qua, 11/11 · 09:00`.
- Reutilizar a descrição estruturada dos atendimentos, incluindo faixa e número da manutenção quando houver. Serviços vinculados usam o catálogo atual; texto legado só quando não houver `service_id`. Sem serviço, exibir apenas data e horário.
- Valores desligados inicialmente, lembrando a última escolha em localStorage com tratamento de falhas. Permutas nunca mostram valor; não somar valores nem limitar a quantidade de horários.
- Confirmar antes de substituir uma mensagem já editada ao mudar **Mostrar valores**. Cancelar mantém o texto e a opção anteriores.
- Telefone ausente ou inválido: desabilitar WhatsApp e mostrar “Cadastre o telefone da cliente para enviar”; copiar continua disponível com toast “Mensagem copiada”.

## Arquivos previstos
**Criar**
- `src/lib/agendaWhatsapp.ts`: funções puras de elegibilidade e geração da mensagem, com validação de telefone específica deste fluxo.
- `src/components/clients/EnviarAgendaSheet.tsx`: painel, prévia editável, opção de valores, confirmação e ações.
- `src/lib/agendaWhatsapp.test.ts`: testes das regras de seleção, ordenação, valores, permuta, serviços e telefone.

**Alterar pontualmente**
- `src/pages/ClienteFicha.tsx`: conectar o botão e o painel aos dados já disponíveis no AppContext, sem mudar o histórico.
- `BIBLIA.md`: documentar o novo recurso na ficha da cliente.
- `AGENTS.md`: registrar a reutilização da geração pura de mensagens.

## Detalhes técnicos
Reutilizar `FormSheet`, os controles existentes, `getAppointmentDescription` e `whatsappLink` de `src/lib/whatsapp.ts`, sem mudar os demais usos dessas funções. Usar `Intl` para o fuso horário, sem instalar dependências. Nenhuma tabela, coluna, migração, função de servidor ou nova rota.

## Validação
Executar testes das regras e conferir o fluxo no navegador: edição, confirmação de sobrescrita, cópia, endereço WhatsApp com texto editado, opções de valores e comportamento sem telefone. Verificar a aparência em aproximadamente 380px, sem rolagem horizontal. Abrir WhatsApp não envia a mensagem automaticamente.