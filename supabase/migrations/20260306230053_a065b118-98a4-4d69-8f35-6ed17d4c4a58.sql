CREATE TABLE public.trends_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX idx_trends_cache_key ON public.trends_cache (cache_key);
CREATE INDEX idx_trends_cache_expires ON public.trends_cache (expires_at);

ALTER TABLE public.trends_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on trends_cache"
ON public.trends_cache FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Allow service role full access on trends_cache"
ON public.trends_cache FOR ALL TO service_role
USING (true) WITH CHECK (true);