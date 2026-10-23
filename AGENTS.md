# Architecture rules

- Resolve appointment service colors through `getCorServico`; this keeps the fixed maintenance color consistent across every view.
- Generate future agenda WhatsApp messages in the pure `agendaWhatsapp` helpers and reuse the existing service-description and WhatsApp-link helpers; this keeps eligibility and formatting reusable without changing other flows.