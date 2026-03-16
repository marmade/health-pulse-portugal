CREATE TABLE public.health_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  growth_percent INTEGER NOT NULL DEFAULT 0,
  relative_volume INTEGER NOT NULL DEFAULT 0,
  axis TEXT NOT NULL,
  axis_label TEXT NOT NULL,
  cluster TEXT NOT NULL,
  is_question BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.health_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on health_questions"
  ON public.health_questions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on health_questions"
  ON public.health_questions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on health_questions"
  ON public.health_questions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on health_questions"
  ON public.health_questions FOR DELETE
  TO public
  USING (true);