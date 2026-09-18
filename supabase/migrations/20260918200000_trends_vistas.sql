-- Vistas de resumo sobre trends_calibrados, para o dashboard ler do lote
-- ======================================================================
-- 18/09/2026, sessão 16. O dashboard passa a ler de UM lote (trends_lotes) em vez do
-- googleTrends.json estático. Um lote de 5 anos tem ~22 000 linhas calibradas; puxá-las
-- para o browser a cada visita seria absurdo. Estas vistas entregam o que a página inicial
-- afirma — e só isso —, calculado no servidor, sempre a partir de um lote só.
--
-- Leitura pública, como as tabelas por baixo. São vistas simples (sem escrita); podem ser
-- refeitas com CREATE OR REPLACE sem perder nada.

-- média mensal do eixo: a média dos termos calibrados na régua da âncora, por mês
create or replace view public.trends_eixo_mensal as
select lote_id, eixo,
       date_trunc('month', data)::date as mes,
       avg(valor_eixo)::numeric(8,2)   as media,
       count(distinct termo)           as n_termos
from public.trends_calibrados
group by lote_id, eixo, date_trunc('month', data);

-- por termo: mediana e máximo nas últimas 52 semanas do lote, e a mediana nas 52 anteriores
create or replace view public.trends_termo_52s as
with fim as (
  select lote_id, max(data) as fim from public.trends_calibrados group by lote_id
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
from public.trends_calibrados c
join fim f on f.lote_id = c.lote_id
group by c.lote_id, c.eixo, c.termo;

-- por termo e ano civil: a média — para "o que mais sobe" entre anos completos
create or replace view public.trends_termo_anual as
select lote_id, eixo, termo,
       extract(year from data)::int     as ano,
       avg(valor_eixo)::numeric(8,2)    as media,
       count(*)                          as n,
       count(distinct date_trunc('month', data)) as meses
from public.trends_calibrados
group by lote_id, eixo, termo, extract(year from data);

grant select on public.trends_eixo_mensal, public.trends_termo_52s, public.trends_termo_anual to anon, authenticated;

-- por termo e mês: para o gráfico da página inicial ser a média dos 5 termos do top —
-- a média de TODOS os termos do eixo é arrastada pelos que estão a zero (11 dos 17 da
-- menopausa na lista antiga), e o que a página afirma é o top 5
create or replace view public.trends_termo_mensal as
select lote_id, eixo, termo,
       date_trunc('month', data)::date as mes,
       avg(valor_eixo)::numeric(8,2)   as media,
       count(*)                          as n
from public.trends_calibrados
group by lote_id, eixo, termo, date_trunc('month', data);

grant select on public.trends_termo_mensal to anon, authenticated;
