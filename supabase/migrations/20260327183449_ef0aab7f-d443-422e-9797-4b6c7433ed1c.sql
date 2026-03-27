
ALTER TABLE public.health_questions
  ADD COLUMN source text NOT NULL DEFAULT 'pytrends',
  ADD COLUMN last_seen_at timestamp with time zone DEFAULT now();

ALTER TABLE public.health_questions
  ADD CONSTRAINT health_questions_question_axis_source_key UNIQUE (question, axis, source);
