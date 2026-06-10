DROP POLICY IF EXISTS "Users can manage their own anamnese answers" ON public.anamnese_answers;

CREATE POLICY "Users can view their own anamnese answers"
ON public.anamnese_answers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert anamnese answers for own responses"
ON public.anamnese_answers
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.anamnese_responses r WHERE r.id = response_id AND r.user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.anamnese_questions q WHERE q.id = question_id AND q.user_id = auth.uid())
);

CREATE POLICY "Users can update anamnese answers for own responses"
ON public.anamnese_answers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.anamnese_responses r WHERE r.id = response_id AND r.user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.anamnese_questions q WHERE q.id = question_id AND q.user_id = auth.uid())
);

CREATE POLICY "Users can delete their own anamnese answers"
ON public.anamnese_answers
FOR DELETE
USING (auth.uid() = user_id);