-- news_items: cópia antes de rotular de novo, e o rótulo antigo guardado
-- ======================================================================
-- 22/10/2026. Desenho e critério: docs/sessoes/2026-10-22.md §8.
-- As 327 notícias anteriores a 22/09/2026 foram rotuladas pela fetch-rss-feeds v1, que casava
-- por pedaço de palavra ("candida" em candidato, "POC" em época, "sop" em sopa). Vão ser
-- rotuladas de novo pela regra da v2 sobre o título. Antes disso:
--   · news_items_20261022 — cópia de TODAS as linhas como estão, mais copiado_em. Evidência:
--     não se escreve mais aqui;
--   · related_term_v1 — o rótulo de cada linha antes de rotular de novo ("nota original
--     guardada"); rotulado_de_novo_em — quando;
--   · related_term deixa de ser NOT NULL: uma notícia que a regra não rotula fica sem termo e
--     sai da Cobertura mediática, sem se apagar (decisão da Marta, 22/10, opção A).
-- Esta migração NÃO rotula: a escrita das 327 é um passo à parte, com o OK da Marta.
--
-- Idempotente (regra 2 do CLAUDE.md): tabela e colunas com IF NOT EXISTS; a política com
-- DROP ... IF EXISTS antes do CREATE; o INSERT só copia se a cópia estiver VAZIA. Corre numa
-- transacção: uma corrida interrompida não deixa a cópia a meio.

create table if not exists public.news_items_20261022 (
  id           uuid primary key,
  title        text not null,
  outlet       text not null,
  date         date not null,
  url          text not null,
  related_term text not null,
  source_type  text not null,
  keyword_id   uuid,              -- sem FK: a cópia é evidência, não segue a tabela keywords
  created_at   timestamptz not null,
  casou_por    text,
  categorias   text[],
  copiado_em   timestamptz not null default now()
);

-- Só leitura para o serviço: a cópia não vai ao site.
alter table public.news_items_20261022 enable row level security;
drop policy if exists "Allow service role read on news_items_20261022" on public.news_items_20261022;
create policy "Allow service role read on news_items_20261022" on public.news_items_20261022
  for select to service_role using (true);

insert into public.news_items_20261022
  (id, title, outlet, date, url, related_term, source_type, keyword_id, created_at, casou_por, categorias)
select id, title, outlet, date, url, related_term, source_type, keyword_id, created_at, casou_por, categorias
from public.news_items
where not exists (select 1 from public.news_items_20261022);

comment on table public.news_items_20261022 is
  'news_items tal como estava a 22/10/2026, antes de rotular de novo as notícias da v1 '
  '(docs/sessoes/2026-10-22.md §8). Não se escreve mais aqui.';

alter table public.news_items
  add column if not exists related_term_v1     text,
  add column if not exists rotulado_de_novo_em timestamptz;

alter table public.news_items alter column related_term drop not null;

comment on column public.news_items.related_term_v1 is
  'O rótulo da v1 (casamento por pedaço de palavra), guardado antes de rotular de novo a 22/10/2026. '
  'NULL nas notícias da v2 (desde 24/09/2026), que não foram rotuladas de novo.';
comment on column public.news_items.rotulado_de_novo_em is
  'Quando a notícia foi rotulada de novo pela regra da v2 sobre o título. NULL se nunca foi.';
comment on column public.news_items.related_term is
  'O termo da notícia. NULL quando a regra não casa nenhum termo no título: a notícia fica na base '
  'e sai da Cobertura mediática (decisão de 22/10/2026).';
