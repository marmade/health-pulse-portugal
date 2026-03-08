
CREATE TABLE public.guioes_semanais (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  semana date NOT NULL,
  tema text NOT NULL,
  perguntas jsonb NOT NULL DEFAULT '[]'::jsonb,
  estado text NOT NULL DEFAULT 'rascunho',
  gerado_por_ia boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.guioes_semanais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on guioes_semanais" ON public.guioes_semanais FOR SELECT USING (true);
CREATE POLICY "Allow public insert on guioes_semanais" ON public.guioes_semanais FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on guioes_semanais" ON public.guioes_semanais FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on guioes_semanais" ON public.guioes_semanais FOR DELETE USING (true);
