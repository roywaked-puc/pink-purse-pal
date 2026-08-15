# Corrigir fluxo "Agendar Agora" do retorno

## Problema

Ao concluir um atendimento e clicar em **"Agendar Agora"** no diálogo de próxima manutenção, o formulário de novo agendamento (pré-preenchido) não abre. A tela apenas volta ao dashboard.

## Causa raiz

O `AppointmentForm` está renderizado **dentro** do `ScheduleReturnDialog`. Quando o usuário clica em "Agendar Agora":

1. `ScheduleReturnDialog` chama `onOpenChange(false)`
2. Em `Index.tsx`, isso zera `returnSource` → o `ScheduleReturnDialog` é desmontado
3. Junto com ele, o `AppointmentForm` interno também é desmontado
4. O `setTimeout(() => setFormOpen(true), 100)` dispara em um componente que já não existe → nada acontece

## Solução

Elevar o `AppointmentForm` do `ScheduleReturnDialog` para a página `Index.tsx`, onde ele permanece montado independentemente do diálogo de retorno.

### Alterações

**`src/components/appointments/ScheduleReturnDialog.tsx`**
- Adicionar prop `onAgendarAgora?: (prefill: AppointmentPrefill) => void`
- Remover renderização interna do `AppointmentForm` e o estado local `formOpen` / `prefill`
- Em `handleAgendarAgora`: montar o objeto `prefill` (mesma lógica atual de data, cliente, serviço sugerido) e chamar `onAgendarAgora(prefill)` em vez de abrir form local. Depois fechar o próprio diálogo.

**`src/pages/Index.tsx`**
- Criar novo estado `returnPrefill: AppointmentPrefill | null`
- Passar `onAgendarAgora={(p) => { setReturnSource(null); setReturnPrefill(p); setEditingAppointment(null); setShowAppointmentForm(true); }}` para o `ScheduleReturnDialog`
- Passar `prefill={returnPrefill}` para o `<AppointmentForm>` já existente
- Limpar `returnPrefill` quando o form fecha (no `onOpenChange`)

### Verificação

1. Dashboard `/` → concluir atendimento → diálogo "Próxima Manutenção" abre
2. Clicar em "Agendar Agora" → formulário completo de novo agendamento abre com cliente, serviço sugerido, data e duração pré-preenchidos
3. Clicar em "Depois" → diálogo fecha sem abrir form, cliente vai para "Retornos Pendentes" no CRM
4. Fluxo de fotos (ícone câmera) segue funcionando independentemente
