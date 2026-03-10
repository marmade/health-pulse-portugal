
CREATE TABLE public.sobre_conteudo (
  id text PRIMARY KEY,
  titulo text NOT NULL DEFAULT '',
  conteudo text NOT NULL DEFAULT ''
);

ALTER TABLE public.sobre_conteudo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on sobre_conteudo"
ON public.sobre_conteudo
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow service role write on sobre_conteudo"
ON public.sobre_conteudo
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
