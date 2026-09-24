-- eixos_archive.nota_medicao: a razão de uma semana ficar sem top 5
-- =================================================================
-- 24/09/2026, sessão 18. Regra do top 5 decidida pela Marta:
-- docs/metodo/2026-09-24-top5-do-arquivo-regra.md
--
-- PORQUÊ
--   A regra diz que uma semana sem medição fica vazia "com a razão
--   registada". Sem esta coluna, uma semana vazia e uma semana em que ninguém
--   procurou nada seriam indistinguíveis no arquivo — que é exactamente o
--   defeito que a regra existe para corrigir, um nível acima.
--
--   Fica preenchida quando não há lote, quando o lote não cobre a semana,
--   quando a semana do lote está incompleta (`is_partial`), ou quando nenhum
--   termo activo do eixo tem medição nessa semana. Fica NULL quando o top 5
--   saiu completo.
--
-- O QUE NÃO FAZ
--   Não toca nas 32 linhas já arquivadas: ficam com a coluna a NULL. A nota
--   que explica o top_keywords das semanas de 03/08 a 20/09 é uma decisão
--   separada, por tomar.

alter table public.eixos_archive
  add column if not exists nota_medicao text;

comment on column public.eixos_archive.nota_medicao is
  'Razão de top_keywords vir vazio nesta semana (sem lote, lote não cobre a '
  'semana, semana parcial, ou nenhum termo activo medido). NULL = top 5 '
  'completo. Introduzida a 24/09/2026 com a regra do top 5.';
