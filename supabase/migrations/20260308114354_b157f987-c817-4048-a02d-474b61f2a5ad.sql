
CREATE TABLE public.historical_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  axis text NOT NULL,
  keyword text NOT NULL,
  search_index integer NOT NULL DEFAULT 0,
  change_percent decimal NOT NULL DEFAULT 0,
  is_emergent boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.historical_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on historical_snapshots" ON public.historical_snapshots
  FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on app_settings" ON public.app_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow service role write on app_settings" ON public.app_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role insert on historical_snapshots" ON public.historical_snapshots
  FOR INSERT TO service_role WITH CHECK (true);

INSERT INTO public.app_settings (key, value) VALUES ('last_refreshed', now()::text);
