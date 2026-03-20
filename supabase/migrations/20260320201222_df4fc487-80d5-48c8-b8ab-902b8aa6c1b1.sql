ALTER TABLE public.youtube_trends
  ADD COLUMN keyword_id uuid REFERENCES public.keywords(id) ON DELETE SET NULL;