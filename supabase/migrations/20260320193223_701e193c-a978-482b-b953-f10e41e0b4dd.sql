CREATE TABLE public.contactos_projecto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('comunidade_cientifica', 'agentes_trabalho')),
  nome text NOT NULL DEFAULT '',
  especialidade text DEFAULT '',
  email text DEFAULT '',
  telefone text DEFAULT '',
  link text DEFAULT '',
  bio text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contactos_projecto ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- REVOGADO A 09/09/2026 — ver 20260909160000_contactos_projecto_rls_restrict.sql
--
-- As quatro políticas abaixo davam leitura, inserção, alteração e remoção
-- anónimas a uma tabela com nome, e-mail, telefone e bio de pessoas reais.
-- Ficam comentadas, e não apagadas, para que o histórico continue legível:
-- reaplicar este ficheiro tal como estava reabria a exposição.
--
-- CREATE POLICY "Allow public read on contactos_projecto"
--   ON public.contactos_projecto FOR SELECT
--   USING (true);
--
-- CREATE POLICY "Allow public insert on contactos_projecto"
--   ON public.contactos_projecto FOR INSERT
--   WITH CHECK (true);
--
-- CREATE POLICY "Allow public update on contactos_projecto"
--   ON public.contactos_projecto FOR UPDATE
--   USING (true) WITH CHECK (true);
--
-- CREATE POLICY "Allow public delete on contactos_projecto"
--   ON public.contactos_projecto FOR DELETE
--   USING (true);
-- ----------------------------------------------------------------------------
