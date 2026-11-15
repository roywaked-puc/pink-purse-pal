# Architecture rules
- Keep subscription entitlement in authenticated no-argument RPCs and enforce expiry only on appointment INSERT; signed Stripe invoice.paid events grant paid access atomically with internal event deduplication, never through client writes or business transactions.
- Keep public legal documents in `src/content/legal.ts` and render them outside ProtectedRoute/MainLayout; public reading must not require a session or show business navigation.
- Confirm user-settings writes with an explicit safe-column readback; onboarding closes only after a persisted completion timestamp, so write errors cannot masquerade as success.
- Derive confirmation reminders from appointments already in AppContext using pure helpers; one shared Home/CRM component records only the sent timestamp, keeping status and finance independent.
- Read Google credential availability through an authenticated boolean RPC; safe settings column grants must never expose access tokens, refresh tokens or client secrets.

- Resolve appointment service colors through `getCorServico`; this keeps the fixed maintenance color consistent across every view.
- Keep `AppointmentPreview` exclusive to the Home page; Home layout changes must not alter the Agenda or shared appointment chips.
- Keep attendance completion free of follow-up callbacks or photo prompt state; manual photo access remains independent of status changes.
- Generate future agenda WhatsApp messages in the pure `agendaWhatsapp` helpers and reuse the existing service-description and WhatsApp-link helpers; this keeps eligibility and formatting reusable without changing other flows.- Compute 'days since last attendance' only via `src/lib/diasDesdeUltimoAtendimento.ts`; Home/Agenda chips and the client file must never diverge.

- Keep Help Center content static in `src/content/manual.ts`; the `/ajuda` page and first-steps checklist render from it, and checklist progress lives only in per-user localStorage.
- Keep Help AI inference in the authenticated `chat-ajuda` Edge Function with a synchronized text-only manual and no data queries/tools; send only the last ten messages capped at 1,000 characters and clear in-memory chat on close to preserve its privacy boundary.
