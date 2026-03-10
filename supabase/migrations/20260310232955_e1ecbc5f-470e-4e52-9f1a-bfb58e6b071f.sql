CREATE TABLE public.youtube_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL DEFAULT '',
  canal text NOT NULL DEFAULT '',
  views integer NOT NULL DEFAULT 0,
  url text NOT NULL DEFAULT '',
  eixo text NOT NULL DEFAULT '',
  data_publicacao date NOT NULL DEFAULT CURRENT_DATE,
  thumbnail_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.youtube_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on youtube_trends"
ON public.youtube_trends FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert on youtube_trends"
ON public.youtube_trends FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public update on youtube_trends"
ON public.youtube_trends FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete on youtube_trends"
ON public.youtube_trends FOR DELETE
TO public
USING (true);