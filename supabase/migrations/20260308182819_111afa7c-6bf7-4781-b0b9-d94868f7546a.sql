
CREATE TABLE public.guioes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL DEFAULT '',
  semana date NOT NULL,
  tema text NOT NULL,
  perguntas jsonb NOT NULL DEFAULT '[]'::jsonb,
  estado text NOT NULL DEFAULT 'rascunho',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.guioes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on guioes" ON public.guioes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on guioes" ON public.guioes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on guioes" ON public.guioes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on guioes" ON public.guioes FOR DELETE USING (true);
