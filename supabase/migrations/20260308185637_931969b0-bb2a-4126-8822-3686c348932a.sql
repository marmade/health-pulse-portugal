
-- Drop old columns and restructure guioes to flat rows
ALTER TABLE public.guioes 
  DROP COLUMN IF EXISTS titulo,
  DROP COLUMN IF EXISTS semana,
  DROP COLUMN IF EXISTS perguntas,
  DROP COLUMN IF EXISTS estado;

-- Add new flat columns
ALTER TABLE public.guioes 
  ADD COLUMN IF NOT EXISTS pergunta text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS resposta text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS referencia_cientifica text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ordem integer NOT NULL DEFAULT 0;
