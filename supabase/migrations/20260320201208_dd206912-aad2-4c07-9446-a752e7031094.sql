ALTER TABLE public.debunking
  ADD COLUMN keyword_id uuid REFERENCES public.keywords(id) ON DELETE SET NULL,
  ADD COLUMN eixo text,
  ADD COLUMN explicacao text,
  ADD COLUMN data_publicacao date;