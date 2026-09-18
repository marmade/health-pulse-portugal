-- As vistas do lote sem a semana parcial
-- =====================================
-- 18/09/2026, achado da regra dos alertas (confirmado pela revisão de código do mesmo dia):
-- trends_termo_52s tomava fim = max(data) do lote, que é a semana que o Google marca como
-- parcial (is_partial) — todos os pontos de 2026-09-13 nos dois lotes de 18/09. A mediana
-- das 52 semanas, o máximo e o pico_em incluíam a semana que a página diz que "não conta",
-- e num termo a subir a semana parcial podia sair como pico. Aqui os pontos parciais ficam
-- de fora de todas as vistas, via trends_pontos.is_partial.
-- POR APLICAR: terça 22/09, com as outras migrações (decisão da sessão 15/16).

create or replace view public.trends_calibrados_completos as
select c.*
from public.trends_calibrados c
join public.trends_pontos p on p.pedido_id = c.pedido_id and p.termo = c.termo and p.data = c.data
where not p.is_partial;

grant select on public.trends_calibrados_completos to anon, authenticated;

create or replace view public.trends_eixo_mensal as
select lote_id, eixo,
       date_trunc('month', data)::date as mes,
       avg(valor_eixo)::numeric(8,2)   as media,
       count(distinct termo)           as n_termos
from public.trends_calibrados_completos
group by lote_id, eixo, date_trunc('month', data);

create or replace view public.trends_termo_52s as
with fim as (
  select lote_id, max(data) as fim from public.trends_calibrados_completos group by lote_id
)
select c.lote_id, c.eixo, c.termo,
       percentile_cont(0.5) within group (order by c.valor_eixo)
         filter (where c.data > f.fim - interval '52 weeks')                       as mediana_52s,
       max(c.valor_eixo) filter (where c.data > f.fim - interval '52 weeks')        as maximo_52s,
       (array_agg(c.data order by c.valor_eixo desc)
          filter (where c.data > f.fim - interval '52 weeks'))[1]::date            as pico_em,
       percentile_cont(0.5) within group (order by c.valor_eixo)
         filter (where c.data <= f.fim - interval '52 weeks'
                   and c.data >  f.fim - interval '104 weeks')                     as mediana_52s_anteriores,
       count(*) filter (where c.data > f.fim - interval '52 weeks')                 as n_52s
from public.trends_calibrados_completos c
join fim f on f.lote_id = c.lote_id
group by c.lote_id, c.eixo, c.termo;

create or replace view public.trends_termo_anual as
select lote_id, eixo, termo,
       extract(year from data)::int     as ano,
       avg(valor_eixo)::numeric(8,2)    as media,
       count(*)                          as n,
       count(distinct date_trunc('month', data)) as meses
from public.trends_calibrados_completos
group by lote_id, eixo, termo, extract(year from data);

create or replace view public.trends_termo_mensal as
select lote_id, eixo, termo,
       date_trunc('month', data)::date as mes,
       avg(valor_eixo)::numeric(8,2)   as media,
       count(*)                          as n
from public.trends_calibrados_completos
group by lote_id, eixo, termo, date_trunc('month', data);
