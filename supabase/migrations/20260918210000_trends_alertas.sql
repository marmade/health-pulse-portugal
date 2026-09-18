-- trends_alertas: a regra dos alertas (fase 3), calculada por lote
-- ================================================================
-- 18/09/2026, sessão 16. Regra e decisões: docs/metodo/2026-09-18-alertas-regra.md.
-- Cálculo: scripts/trends_alertas.py — corre no fim de cada lote do script 5, ou sozinho
-- sobre um lote existente. O dashboard lê UMA linha por alerta, na última semana completa
-- do lote; a história inteira fica cá para a tese ("em curso" calcula-se a andar para trás
-- na série do lote, sem estado fora dele).
--
-- Uma linha por (lote, eixo, termo, semana). `tipo`:
--   subida        z ≥ 3 e ×1,5 contra a mediana das 8 semanas anteriores, não sazonal
--   aparecimento  termo sem procura regular que surge acima do piscar (≥ 20 na régua do
--                 pedido) e ≥ 2× o máximo das 52 semanas anteriores
--   sazonal       cumpre a subida mas a época do ano explica-a (anos anteriores do lote)
--   a_observar    z ≥ 2 sem chegar a alerta — sem bandeira, só no ecrã
-- `semana_n` = n.ª semana do mesmo acontecimento (1 = começou agora); `inicio` = a 1.ª.

create table if not exists public.trends_alertas (
  lote_id        uuid not null references public.trends_lotes(id) on delete cascade,
  eixo           text not null,
  termo          text not null,
  semana         date not null,                   -- a semana completa avaliada (início, domingo)
  tipo           text not null check (tipo in ('subida', 'aparecimento', 'sazonal', 'a_observar')),
  valor          numeric(8,3) not null,           -- na régua do eixo (valor_eixo)
  referencia     numeric(8,3) not null,           -- mediana das 8 semanas anteriores; congelada durante um acontecimento
  razao          numeric(8,3) not null,           -- valor / referencia ("n vezes acima do valor normal")
  z              numeric(8,3),                    -- (valor − referencia) / ruído; NULL no aparecimento
  ruido          numeric(8,3),
  fator_sazonal  numeric(8,3),                    -- o que esta época costuma fazer nos anos anteriores; NULL se não há
  max_anterior   numeric(8,3),                    -- aparecimento: o máximo das 52 semanas anteriores
  semana_n       smallint not null default 1,
  inicio         date not null,
  calculado_em   timestamptz not null default now(),
  primary key (lote_id, eixo, termo, semana)
);

create index if not exists trends_alertas_semana_idx on public.trends_alertas (lote_id, semana);

alter table public.trends_alertas enable row level security;
drop policy if exists "Allow public read on trends_alertas" on public.trends_alertas;
create policy "Allow public read on trends_alertas" on public.trends_alertas for select to public using (true);

comment on table public.trends_alertas is
  'Alertas da fase 3, por lote e semana. Regra: docs/metodo/2026-09-18-alertas-regra.md. '
  'Parâmetros fixados a 18/09/2026; mudam-se com registo e data, nunca à vista de uma semana.';
comment on column public.trends_alertas.referencia is
  'A mediana das 8 semanas completas anteriores — "o valor normal". Durante um acontecimento que dura, fica congelada na de antes do 1.º disparo.';
