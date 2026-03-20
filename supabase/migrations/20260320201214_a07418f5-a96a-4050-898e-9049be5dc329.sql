ALTER TABLE public.news_items
  ADD COLUMN keyword_id uuid REFERENCES public.keywords(id) ON DELETE SET NULL;