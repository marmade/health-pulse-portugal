
CREATE TABLE public.briefings_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  week_end date NOT NULL,
  week_label text NOT NULL,
  top_emerging jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_debunking jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_news jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.briefings_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on briefings_archive" ON public.briefings_archive FOR SELECT USING (true);
CREATE POLICY "Allow public insert on briefings_archive" ON public.briefings_archive FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on briefings_archive" ON public.briefings_archive FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on briefings_archive" ON public.briefings_archive FOR DELETE USING (true);

CREATE UNIQUE INDEX briefings_archive_week_start_idx ON public.briefings_archive (week_start);
