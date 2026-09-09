-- TESTE 3 — DISTÂNCIA ENTRE O VOCABULÁRIO DO ESTADO E O DAS PESSOAS
-- =================================================================
-- Sem rede. Só SQL, na instância ijpxjpbjudaddfatibfl.
--
-- A: as 83 keywords          — como o Estado nomeia os assuntos (SNS 24, DGS)
-- B: as 4626 health_questions — formulações reais, recolhidas do próprio Google
--
-- Mede quantas de A aparecem em B: literalmente, ou só pela raiz (a palavra mais
-- longa do termo). A diferença entre as duas colunas é o objecto do teste — um
-- termo com 0 literais e muitas por raiz é um conceito que as pessoas procuram
-- com outras palavras.
--
-- Os acentos são dobrados com translate() para o `unaccent` não ser preciso.

-- ── 1. AGREGADO ──────────────────────────────────────────────────────────────
with k as (
  select term, axis, is_active, current_volume,
         lower(translate(term,'áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ',
                              'aaaaeeeiiiooooouuucAAAAEEEIIIOOOOOUUUC')) as t_norm
  from public.keywords
), q as (
  select lower(translate(question,'áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ',
                                  'aaaaeeeiiiooooouuucAAAAEEEIIIOOOOOUUUC')) as q_norm
  from public.health_questions
), m as (
  select k.*,
    (select count(*) from q where q.q_norm like '%'||k.t_norm||'%') as literal,
    (select count(*) from q where q.q_norm like '%'||
       (select w from regexp_split_to_table(k.t_norm,'\s+') w order by length(w) desc limit 1)||'%') as raiz
  from k
)
select count(*) as keywords, count(*) filter (where is_active) as activas,
       count(*) filter (where literal > 0) as com_literal,
       count(*) filter (where literal = 0 and raiz > 0) as so_por_raiz,
       count(*) filter (where literal = 0 and raiz = 0) as sem_nenhum
from m;

-- ── 2. DETALHE, ordenado pela distância (0 literais e muitas por raiz no topo) ─
-- Repetir os CTE acima e correr:
--   select term, axis, current_volume, literal, raiz, (raiz - literal) as distancia
--   from m order by (raiz - literal) desc, literal asc;

-- ── 3. CRUZAMENTO com o eixo, para a previsão da hipótese ────────────────────
--   select axis, count(*) as kws,
--          count(*) filter (where literal = 0) as sem_correspondencia_literal
--   from m where is_active group by axis order by 3 desc;
