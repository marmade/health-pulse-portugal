ALTER TABLE public.health_questions
  ADD COLUMN keyword_id uuid REFERENCES public.keywords(id) ON DELETE SET NULL;