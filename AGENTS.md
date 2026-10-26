# Architecture rules

- Resolve appointment service colors through `getCorServico`; this keeps the fixed maintenance color consistent across every view.
- Keep `AppointmentPreview` exclusive to the Home page; Home layout changes must not alter the Agenda or shared appointment chips.
- Keep attendance completion free of follow-up callbacks or photo prompt state; manual photo access remains independent of status changes.
- Generate future agenda WhatsApp messages in the pure `agendaWhatsapp` helpers and reuse the existing service-description and WhatsApp-link helpers; this keeps eligibility and formatting reusable without changing other flows.