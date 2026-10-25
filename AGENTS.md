# Architecture rules

- Resolve appointment service colors through `getCorServico`; this keeps the fixed maintenance color consistent across every view.
- Keep `AppointmentPreview` exclusive to the Home page; Home layout changes must not alter the Agenda or shared appointment chips.
- Generate future agenda WhatsApp messages in the pure `agendaWhatsapp` helpers and reuse the existing service-description and WhatsApp-link helpers; this keeps eligibility and formatting reusable without changing other flows.