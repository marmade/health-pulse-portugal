ALTER TABLE public.revisao_pares
  ADD COLUMN IF NOT EXISTS nome_a text DEFAULT '',
  ADD COLUMN IF NOT EXISTS especialidade_a text DEFAULT '',
  ADD COLUMN IF NOT EXISTS telefone_a text DEFAULT '',
  ADD COLUMN IF NOT EXISTS email_a text DEFAULT '',
  ADD COLUMN IF NOT EXISTS link_a text DEFAULT '',
  ADD COLUMN IF NOT EXISTS nome_b text DEFAULT '',
  ADD COLUMN IF NOT EXISTS especialidade_b text DEFAULT '',
  ADD COLUMN IF NOT EXISTS telefone_b text DEFAULT '',
  ADD COLUMN IF NOT EXISTS email_b text DEFAULT '',
  ADD COLUMN IF NOT EXISTS link_b text DEFAULT '',
  ADD COLUMN IF NOT EXISTS sumario text DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();