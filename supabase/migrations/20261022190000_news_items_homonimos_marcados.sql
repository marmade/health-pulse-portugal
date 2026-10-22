-- news_items: as notícias marcadas como homónimo no quadro certo/errado
-- =====================================================================
-- 22/10/2026. Quadro em docs/evidencia/2026-10-22-homonimos/quadro.md; registo em
-- docs/sessoes/2026-10-22.md §8.6. A Marta marcou como erradas 3 das 10 notícias que casaram por
-- palavras com homónimos (a "depressão" meteorológica e dois "derrame" de petróleo). Antes de lhes
-- tirar o termo:
--   · news_items_quadro_20261022 — cópia dessas 3 linhas como estão agora (depois da
--     reclassificação), mais copiado_em. Evidência: não se escreve mais aqui;
--   · homonimo_marcado_em — quando a notícia foi marcada como homónimo. Explica porque é que uma
--     notícia com casou_por ficou sem termo: a palavra casou, mas não é sobre o termo.
-- Esta migração NÃO tira o termo: isso é a escrita a seguir.
--
-- Idempotente (regra 2 do CLAUDE.md): tabela e coluna com IF NOT EXISTS; a política com
-- DROP ... IF EXISTS antes do CREATE; o INSERT só copia se a cópia estiver VAZIA.

create table if not exists public.news_items_quadro_20261022 (
  id                  uuid primary key,
  title               text not null,
  outlet              text not null,
  date                date not null,
  url                 text not null,
  related_term        text,
  source_type         text not null,
  keyword_id          uuid,
  created_at          timestamptz not null,
  casou_por           text,
  categorias          text[],
  related_term_v1     text,
  rotulado_de_novo_em timestamptz,
  copiado_em          timestamptz not null default now()
);

alter table public.news_items_quadro_20261022 enable row level security;
drop policy if exists "Allow service role read on news_items_quadro_20261022" on public.news_items_quadro_20261022;
create policy "Allow service role read on news_items_quadro_20261022" on public.news_items_quadro_20261022
  for select to service_role using (true);

insert into public.news_items_quadro_20261022
  (id, title, outlet, date, url, related_term, source_type, keyword_id, created_at, casou_por,
   categorias, related_term_v1, rotulado_de_novo_em)
select id, title, outlet, date, url, related_term, source_type, keyword_id, created_at, casou_por,
       categorias, related_term_v1, rotulado_de_novo_em
from public.news_items
where id in ('417e208f-40c9-4cbb-870a-e9935a15cd84', 'faee2e87-8b03-40dc-b1a9-316b0e1cf897',
             'efab560e-4a67-47ab-b477-86fdf6c9b613')
  and not exists (select 1 from public.news_items_quadro_20261022);

comment on table public.news_items_quadro_20261022 is
  'As 3 notícias marcadas como homónimo no quadro de 22/10/2026, tal como estavam antes de perderem '
  'o termo (docs/sessoes/2026-10-22.md §8.6). Não se escreve mais aqui.';

alter table public.news_items add column if not exists homonimo_marcado_em timestamptz;

comment on column public.news_items.homonimo_marcado_em is
  'Quando a notícia foi marcada como homónimo (a palavra de casou_por casou, mas a notícia não é '
  'sobre o termo) e perdeu o termo. NULL nas outras. Quadro de 22/10/2026.';
