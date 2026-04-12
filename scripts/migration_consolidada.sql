-- ============================================================================
-- HEALTH PULSE PORTUGAL -- Consolidated Schema Migration
-- ============================================================================
-- Generated: 2026-04-12
-- Source: 38 incremental migrations consolidated into a single idempotent script
-- Purpose: Run on a fresh Supabase instance to recreate the full schema
-- NOTE: DDL only -- no data inserts
-- ============================================================================


-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================
-- pg_cron: scheduled jobs (cache cleanup, data refresh)
-- pg_net: HTTP requests from within PostgreSQL (edge function triggers)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


-- ============================================================================
-- SECTION 2: TABLES
-- ============================================================================
-- Ordered by foreign-key dependencies:
--   1. Independent tables (no FK references)
--   2. Tables that reference other tables
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 2.1  trends_cache -- Google Trends API response cache (24h TTL)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trends_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);


-- ----------------------------------------------------------------------------
-- 2.2  keywords -- Master keyword catalogue, one row per tracked term
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  synonyms TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  axis TEXT NOT NULL,
  source TEXT NOT NULL,
  current_volume INT NOT NULL DEFAULT 0,
  previous_volume INT NOT NULL DEFAULT 0,
  change_percent DECIMAL NOT NULL DEFAULT 0,
  trend TEXT NOT NULL DEFAULT 'stable',
  last_peak TEXT,
  is_emergent BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ----------------------------------------------------------------------------
-- 2.3  trend_data -- Time-series search-index data per keyword
--      FK -> keywords(id) ON DELETE CASCADE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trend_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  search_index INT NOT NULL DEFAULT 0,
  year_label INT NOT NULL,
  region TEXT NOT NULL DEFAULT 'PT',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ----------------------------------------------------------------------------
-- 2.4  debunking -- Fact-check / myth-busting entries
--      FK -> keywords(id) ON DELETE SET NULL  (added in later migration)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.debunking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  title TEXT NOT NULL,
  classification TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL,
  keyword_id UUID REFERENCES public.keywords(id) ON DELETE SET NULL,
  eixo TEXT,
  explicacao TEXT,
  data_publicacao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ----------------------------------------------------------------------------
-- 2.5  news_items -- Curated health news articles
--      FK -> keywords(id) ON DELETE SET NULL  (added in later migration)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.news_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  outlet TEXT NOT NULL,
  date DATE NOT NULL,
  url TEXT NOT NULL,
  related_term TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'media',
  keyword_id UUID REFERENCES public.keywords(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ----------------------------------------------------------------------------
-- 2.6  historical_snapshots -- Weekly snapshots of keyword metrics
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.historical_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  axis TEXT NOT NULL,
  keyword TEXT NOT NULL,
  search_index INTEGER NOT NULL DEFAULT 0,
  change_percent DECIMAL NOT NULL DEFAULT 0,
  is_emergent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ----------------------------------------------------------------------------
-- 2.7  app_settings -- Key-value application configuration store
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ----------------------------------------------------------------------------
-- 2.8  textos -- Editorial / educational text content blocks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.textos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem INTEGER NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT '',
  titulo TEXT NOT NULL DEFAULT '',
  lead TEXT NOT NULL DEFAULT '',
  corpo TEXT NOT NULL DEFAULT '',
  referencias JSONB NOT NULL DEFAULT '[]'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ----------------------------------------------------------------------------
-- 2.9  briefings_archive -- Weekly briefing snapshots (cross-axis)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.briefings_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  week_label TEXT NOT NULL,
  top_emerging JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_debunking JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_news JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ----------------------------------------------------------------------------
-- 2.10 guioes -- Script / interview guide rows (flat structure)
--      Original had titulo/semana/perguntas/estado columns which were dropped
--      and replaced with flat pergunta/resposta/referencia rows
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guioes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tema TEXT NOT NULL,
  subtema TEXT NOT NULL DEFAULT '',
  pergunta TEXT NOT NULL DEFAULT '',
  resposta TEXT NOT NULL DEFAULT '',
  referencia_cientifica TEXT NOT NULL DEFAULT '',
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ----------------------------------------------------------------------------
-- 2.11 guioes_semanais -- Weekly auto-generated interview scripts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guioes_semanais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  semana DATE NOT NULL,
  tema TEXT NOT NULL,
  perguntas JSONB NOT NULL DEFAULT '[]'::jsonb,
  estado TEXT NOT NULL DEFAULT 'rascunho',
  gerado_por_ia BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ----------------------------------------------------------------------------
-- 2.12 plataforma_popups -- Platform description popup content
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plataforma_popups (
  id TEXT PRIMARY KEY,
  eyebrow TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT ''
);


-- ----------------------------------------------------------------------------
-- 2.13 sobre_conteudo -- "About" page content blocks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sobre_conteudo (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL DEFAULT '',
  conteudo TEXT NOT NULL DEFAULT ''
);


-- ----------------------------------------------------------------------------
-- 2.14 youtube_trends -- Trending YouTube health videos
--      FK -> keywords(id) ON DELETE SET NULL  (added in later migration)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.youtube_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL DEFAULT '',
  canal TEXT NOT NULL DEFAULT '',
  views INTEGER NOT NULL DEFAULT 0,
  url TEXT NOT NULL DEFAULT '',
  eixo TEXT NOT NULL DEFAULT '',
  data_publicacao DATE NOT NULL DEFAULT CURRENT_DATE,
  thumbnail_url TEXT,
  channel_id TEXT,
  keyword_id UUID REFERENCES public.keywords(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ----------------------------------------------------------------------------
-- 2.15 bookmarks -- Curated reference links and resources
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  titulo TEXT NOT NULL,
  fonte TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL DEFAULT '',
  notas TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  eixo TEXT DEFAULT NULL,
  subcategoria TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ----------------------------------------------------------------------------
-- 2.16 health_questions -- Trending health questions from search engines
--      FK -> keywords(id) ON DELETE SET NULL  (added in later migration)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.health_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  growth_percent INTEGER NOT NULL DEFAULT 0,
  relative_volume INTEGER NOT NULL DEFAULT 0,
  axis TEXT NOT NULL,
  axis_label TEXT NOT NULL,
  cluster TEXT NOT NULL,
  is_question BOOLEAN NOT NULL DEFAULT true,
  keyword_id UUID REFERENCES public.keywords(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'pytrends',
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT health_questions_question_axis_source_key UNIQUE (question, axis, source)
);


-- ----------------------------------------------------------------------------
-- 2.17 eixos_archive -- Weekly archive snapshots per thematic axis
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.eixos_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  axis TEXT NOT NULL,
  axis_label TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  week_label TEXT NOT NULL,
  top_keywords JSONB DEFAULT '[]'::jsonb,
  top_questions JSONB DEFAULT '[]'::jsonb,
  top_debunking JSONB DEFAULT '[]'::jsonb,
  top_news JSONB DEFAULT '[]'::jsonb,
  top_youtube JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(axis, week_start)
);


-- ----------------------------------------------------------------------------
-- 2.18 revisao_pares -- Peer-review contacts per thematic axis
--      Consolidates original create + multiple ALTERs into final schema
--      Columns from both the original (eixo, nome, titulo, afiliacao, nota)
--      and later additions (nome_a/b, especialidade_a/b, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.revisao_pares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eixo TEXT NOT NULL,
  axis TEXT UNIQUE,
  axis_label TEXT,
  nome TEXT,
  titulo TEXT,
  afiliacao TEXT,
  nota TEXT,
  -- Perfil A
  nome_a TEXT DEFAULT '',
  especialidade_a TEXT DEFAULT '',
  telefone_a TEXT DEFAULT '',
  email_a TEXT DEFAULT '',
  link_a TEXT DEFAULT '',
  bio_a TEXT DEFAULT '',
  -- Perfil B
  nome_b TEXT DEFAULT '',
  especialidade_b TEXT DEFAULT '',
  telefone_b TEXT DEFAULT '',
  email_b TEXT DEFAULT '',
  link_b TEXT DEFAULT '',
  bio_b TEXT DEFAULT '',
  -- Sumario do eixo
  sumario TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ----------------------------------------------------------------------------
-- 2.19 contactos_projecto -- Project contact directory
--      tipo restricted to: 'comunidade_cientifica' | 'agentes_trabalho'
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contactos_projecto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('comunidade_cientifica', 'agentes_trabalho')),
  nome TEXT NOT NULL DEFAULT '',
  especialidade TEXT DEFAULT '',
  email TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  link TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- SECTION 3: INDEXES
-- ============================================================================
-- Naming convention: idx_<table>_<column(s)>
-- ============================================================================

-- trends_cache
CREATE INDEX IF NOT EXISTS idx_trends_cache_key ON public.trends_cache (cache_key);
CREATE INDEX IF NOT EXISTS idx_trends_cache_expires ON public.trends_cache (expires_at);

-- keywords
CREATE INDEX IF NOT EXISTS idx_keywords_axis ON public.keywords (axis);
CREATE INDEX IF NOT EXISTS idx_keywords_term ON public.keywords (term);

-- trend_data
CREATE INDEX IF NOT EXISTS idx_trend_data_keyword ON public.trend_data (keyword_id);
CREATE INDEX IF NOT EXISTS idx_trend_data_region ON public.trend_data (region);

-- debunking
CREATE INDEX IF NOT EXISTS idx_debunking_term ON public.debunking (term);

-- news_items
CREATE INDEX IF NOT EXISTS idx_news_items_related_term ON public.news_items (related_term);
CREATE INDEX IF NOT EXISTS idx_news_items_date ON public.news_items (date DESC);

-- briefings_archive (unique index on week_start)
CREATE UNIQUE INDEX IF NOT EXISTS briefings_archive_week_start_idx ON public.briefings_archive (week_start);


-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY -- Enable RLS on all tables
-- ============================================================================

ALTER TABLE public.trends_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debunking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.textos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefings_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guioes_semanais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plataforma_popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sobre_conteudo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eixos_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisao_pares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contactos_projecto ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- SECTION 5: RLS POLICIES
-- ============================================================================
-- Grouped by table. Most tables allow public read + public write (admin app).
-- Some restrict writes to service_role only.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 5.1  trends_cache -- Public read, service_role full access
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on trends_cache"
  ON public.trends_cache FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow service role full access on trends_cache"
  ON public.trends_cache FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ----------------------------------------------------------------------------
-- 5.2  keywords -- Public read + public write (admin CMS)
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on keywords"
  ON public.keywords FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on keywords"
  ON public.keywords FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on keywords"
  ON public.keywords FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on keywords"
  ON public.keywords FOR DELETE
  USING (true);


-- ----------------------------------------------------------------------------
-- 5.3  trend_data -- Public read only
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on trend_data"
  ON public.trend_data FOR SELECT
  USING (true);


-- ----------------------------------------------------------------------------
-- 5.4  debunking -- Public read + public write (admin CMS)
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on debunking"
  ON public.debunking FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on debunking"
  ON public.debunking FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on debunking"
  ON public.debunking FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on debunking"
  ON public.debunking FOR DELETE
  USING (true);


-- ----------------------------------------------------------------------------
-- 5.5  news_items -- Public read + service_role insert + public update/delete
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on news_items"
  ON public.news_items FOR SELECT
  USING (true);

CREATE POLICY "Allow service role insert on news_items"
  ON public.news_items FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow public update on news_items"
  ON public.news_items FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on news_items"
  ON public.news_items FOR DELETE
  USING (true);


-- ----------------------------------------------------------------------------
-- 5.6  historical_snapshots -- Public read + service_role insert
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on historical_snapshots"
  ON public.historical_snapshots FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow service role insert on historical_snapshots"
  ON public.historical_snapshots FOR INSERT TO service_role
  WITH CHECK (true);


-- ----------------------------------------------------------------------------
-- 5.7  app_settings -- Public read + service_role full write
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on app_settings"
  ON public.app_settings FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow service role write on app_settings"
  ON public.app_settings FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ----------------------------------------------------------------------------
-- 5.8  textos -- Public full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on textos"
  ON public.textos FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on textos"
  ON public.textos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on textos"
  ON public.textos FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on textos"
  ON public.textos FOR DELETE
  USING (true);


-- ----------------------------------------------------------------------------
-- 5.9  briefings_archive -- Public full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on briefings_archive"
  ON public.briefings_archive FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on briefings_archive"
  ON public.briefings_archive FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on briefings_archive"
  ON public.briefings_archive FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on briefings_archive"
  ON public.briefings_archive FOR DELETE
  USING (true);


-- ----------------------------------------------------------------------------
-- 5.10 guioes -- Public full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on guioes"
  ON public.guioes FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on guioes"
  ON public.guioes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on guioes"
  ON public.guioes FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on guioes"
  ON public.guioes FOR DELETE
  USING (true);


-- ----------------------------------------------------------------------------
-- 5.11 guioes_semanais -- Public full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on guioes_semanais"
  ON public.guioes_semanais FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on guioes_semanais"
  ON public.guioes_semanais FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on guioes_semanais"
  ON public.guioes_semanais FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on guioes_semanais"
  ON public.guioes_semanais FOR DELETE
  USING (true);


-- ----------------------------------------------------------------------------
-- 5.12 plataforma_popups -- Public read + service_role write
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on plataforma_popups"
  ON public.plataforma_popups FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow service role write on plataforma_popups"
  ON public.plataforma_popups FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ----------------------------------------------------------------------------
-- 5.13 sobre_conteudo -- Public read + service_role write + public CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on sobre_conteudo"
  ON public.sobre_conteudo FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow service role write on sobre_conteudo"
  ON public.sobre_conteudo FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow public insert on sobre_conteudo"
  ON public.sobre_conteudo FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on sobre_conteudo"
  ON public.sobre_conteudo FOR UPDATE TO public
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on sobre_conteudo"
  ON public.sobre_conteudo FOR DELETE TO public
  USING (true);


-- ----------------------------------------------------------------------------
-- 5.14 youtube_trends -- Public full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on youtube_trends"
  ON public.youtube_trends FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert on youtube_trends"
  ON public.youtube_trends FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on youtube_trends"
  ON public.youtube_trends FOR UPDATE TO public
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on youtube_trends"
  ON public.youtube_trends FOR DELETE TO public
  USING (true);


-- ----------------------------------------------------------------------------
-- 5.15 bookmarks -- Public full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on bookmarks"
  ON public.bookmarks FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow public insert on bookmarks"
  ON public.bookmarks FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on bookmarks"
  ON public.bookmarks FOR UPDATE TO public
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on bookmarks"
  ON public.bookmarks FOR DELETE TO public
  USING (true);


-- ----------------------------------------------------------------------------
-- 5.16 health_questions -- Public full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on health_questions"
  ON public.health_questions FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow public insert on health_questions"
  ON public.health_questions FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on health_questions"
  ON public.health_questions FOR UPDATE TO public
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on health_questions"
  ON public.health_questions FOR DELETE TO public
  USING (true);


-- ----------------------------------------------------------------------------
-- 5.17 eixos_archive -- Public read + public insert
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read access"
  ON public.eixos_archive FOR SELECT
  USING (true);

CREATE POLICY "Public insert access"
  ON public.eixos_archive FOR INSERT
  WITH CHECK (true);


-- ----------------------------------------------------------------------------
-- 5.18 revisao_pares -- Public read + insert + update
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read"
  ON public.revisao_pares FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on revisao_pares"
  ON public.revisao_pares FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on revisao_pares"
  ON public.revisao_pares FOR UPDATE
  USING (true) WITH CHECK (true);


-- ----------------------------------------------------------------------------
-- 5.19 contactos_projecto -- Public full CRUD
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow public read on contactos_projecto"
  ON public.contactos_projecto FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on contactos_projecto"
  ON public.contactos_projecto FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on contactos_projecto"
  ON public.contactos_projecto FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on contactos_projecto"
  ON public.contactos_projecto FOR DELETE
  USING (true);


-- ============================================================================
-- END OF CONSOLIDATED MIGRATION
-- ============================================================================
