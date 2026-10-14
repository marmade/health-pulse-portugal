-- trends_alertas_regra_20260918: cópia dos alertas gravados antes da correcção dos empates
-- =======================================================================================
-- 14/10/2026, sessão 30. Desenho: docs/sessoes/2026-10-11.md §4.1 (c).
-- trends_alertas tem chave (lote_id, eixo, termo, semana) e não guarda duas versões da mesma
-- linha. Antes de recalcular qualquer lote com a correcção dos empates (--gravar), TODAS as
-- linhas actuais ficam aqui, como foram gravadas: as mesmas colunas e valores, calculado_em
-- incluído, mais copiado_em. Leitura pública, como a original.
--
-- Idempotente (regra 2 do CLAUDE.md): a tabela e o índice com IF NOT EXISTS; a política com
-- DROP ... IF EXISTS antes do CREATE; o INSERT só copia se a cópia estiver VAZIA, logo uma
-- segunda corrida não duplica nem mistura. A migração corre numa transacção: uma corrida
-- interrompida não deixa a cópia a meio.

create table if not exists public.trends_alertas_regra_20260918 (
  lote_id        uuid not null references public.trends_lotes(id),   -- sem cascade: decisão da Marta, 14/10
                                                                     -- (a cópia é evidência; não desaparece com o lote)
  eixo           text not null,
  termo          text not null,
  semana         date not null,
  tipo           text not null check (tipo in ('subida', 'aparecimento', 'sazonal', 'a_observar')),
  valor          numeric(8,3) not null,
  referencia     numeric(8,3) not null,
  razao          numeric(8,3) not null,
  z              numeric(8,3),
  ruido          numeric(8,3),
  fator_sazonal  numeric(8,3),
  max_anterior   numeric(8,3),
  semana_n       smallint not null default 1,
  inicio         date not null,
  calculado_em   timestamptz not null,
  copiado_em     timestamptz not null default now(),
  primary key (lote_id, eixo, termo, semana)
);

create index if not exists trends_alertas_regra_20260918_semana_idx
  on public.trends_alertas_regra_20260918 (lote_id, semana);

alter table public.trends_alertas_regra_20260918 enable row level security;
drop policy if exists "Allow public read on trends_alertas_regra_20260918" on public.trends_alertas_regra_20260918;
create policy "Allow public read on trends_alertas_regra_20260918" on public.trends_alertas_regra_20260918
  for select to public using (true);

insert into public.trends_alertas_regra_20260918
  (lote_id, eixo, termo, semana, tipo, valor, referencia, razao, z, ruido, fator_sazonal,
   max_anterior, semana_n, inicio, calculado_em)
select lote_id, eixo, termo, semana, tipo, valor, referencia, razao, z, ruido, fator_sazonal,
       max_anterior, semana_n, inicio, calculado_em
from public.trends_alertas
where not exists (select 1 from public.trends_alertas_regra_20260918);

comment on table public.trends_alertas_regra_20260918 is
  'Os alertas gravados pela regra de 18/09/2026 com os empates decididos em vírgula flutuante, '
  'copiados a 14/10/2026 antes do recálculo com a correcção dos empates (docs/sessoes/2026-10-11.md §4.1 c). '
  'Não se escreve mais aqui.';
