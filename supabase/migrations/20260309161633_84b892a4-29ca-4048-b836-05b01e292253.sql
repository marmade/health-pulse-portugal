
CREATE TABLE public.plataforma_popups (
  id text PRIMARY KEY,
  eyebrow text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  text text NOT NULL DEFAULT ''
);

ALTER TABLE public.plataforma_popups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on plataforma_popups"
ON public.plataforma_popups
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow service role write on plataforma_popups"
ON public.plataforma_popups
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
