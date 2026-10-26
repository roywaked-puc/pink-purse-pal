ALTER TABLE public.user_settings
  ADD COLUMN confirm_message_template TEXT,
  ADD COLUMN cancellation_notice_hours INTEGER NOT NULL DEFAULT 48,
  ADD COLUMN cancellation_fee NUMERIC NOT NULL DEFAULT 50;

ALTER TABLE public.appointments
  ADD COLUMN confirmation_sent_at TIMESTAMPTZ;

GRANT SELECT (confirm_message_template, cancellation_notice_hours, cancellation_fee),
  INSERT (confirm_message_template, cancellation_notice_hours, cancellation_fee),
  UPDATE (confirm_message_template, cancellation_notice_hours, cancellation_fee)
  ON public.user_settings TO authenticated;

GRANT SELECT (confirmation_sent_at), UPDATE (confirmation_sent_at)
  ON public.appointments TO authenticated;