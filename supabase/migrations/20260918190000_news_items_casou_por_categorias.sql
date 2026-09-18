-- news_items: por que termo casou, e com que categorias do feed
-- =============================================================
-- 18/09/2026, sessão 16. Acompanha a reescrita de fetch-rss-feeds (casamento por palavra
-- inteira, siglas em maiúsculas, o termo mais longo ganha, filtro pela categoria do feed,
-- CDATA limpo). APLICAR ANTES de publicar a função: ela passa a escrever estas colunas.
--
-- Até aqui a rotulagem não era auditável: a tabela dizia `related_term` e não dizia POR
-- QUE PEDAÇO DE TEXTO tinha casado — e casava por pedaço: "candida" apanhava recandidatura
-- (63 das 79 "candidíase" eram política e futebol), "POC" apanhava época, "SOP" apanhava
-- Sophie. Com `casou_por` e `categorias` cada linha passa a explicar-se a si própria.
--
-- NÃO reescreve as 310 linhas existentes: ficam com NULL nas duas colunas até serem
-- rotuladas de novo (scripts/10_backfill_news_keyword_id.py, a adaptar), depois da lista
-- de 100. Reversível: colunas anuláveis.

alter table public.news_items
  add column if not exists casou_por  text,
  add column if not exists categorias text[];

comment on column public.news_items.casou_por is
  'O termo ou sinónimo que casou (palavra inteira; siglas em maiúsculas exactas). NULL nas linhas anteriores a 22/09/2026, rotuladas por `includes()`.';
comment on column public.news_items.categorias is
  'As <category> do item no feed de origem. O filtro de saúde aplica-se sobre elas quando existem.';
