
CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  titulo text NOT NULL,
  fonte text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT '',
  notas text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on bookmarks" ON public.bookmarks FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on bookmarks" ON public.bookmarks FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on bookmarks" ON public.bookmarks FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on bookmarks" ON public.bookmarks FOR DELETE TO public USING (true);
