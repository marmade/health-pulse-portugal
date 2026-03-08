
CREATE TABLE public.textos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem integer NOT NULL DEFAULT 0,
  categoria text NOT NULL DEFAULT '',
  titulo text NOT NULL DEFAULT '',
  lead text NOT NULL DEFAULT '',
  corpo text NOT NULL DEFAULT '',
  referencias jsonb NOT NULL DEFAULT '[]'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.textos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on textos" ON public.textos
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on textos" ON public.textos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on textos" ON public.textos
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on textos" ON public.textos
  FOR DELETE USING (true);
