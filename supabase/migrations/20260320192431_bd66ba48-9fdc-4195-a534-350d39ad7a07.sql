ALTER TABLE public.revisao_pares
  ADD COLUMN IF NOT EXISTS bio_a text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio_b text DEFAULT '';