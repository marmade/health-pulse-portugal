-- Tipo novo nos alertas: "tendencia"
-- ==================================
-- 29/10/2026. Decisão da Marta (docs/sessoes/2026-10-29-cowork.md §16 e §17): um alerta
-- que fica "em curso" mais de 26 semanas deixa de ser alerta e passa a "tendência de
-- subida desde [data]", sem bandeira, e o termo volta a ser avaliado contra o valor normal
-- das 8 semanas anteriores (o patamar novo). Simulação em
-- docs/evidencia/2026-10-29-creatina/simulacao.md (caso da creatina, em curso desde 2022).
--
-- Só alarga o check: não altera nenhuma linha, e o código anterior continua a gravar os
-- quatro tipos de antes. Aplicada pelo Cowork ANTES do código novo, para a recolha de
-- domingo 1/11 nunca falhar no check (simulação §4.5).
-- REVERSÍVEL enquanto não houver linhas 'tendencia': repor o check com os quatro tipos.

alter table public.trends_alertas drop constraint if exists trends_alertas_tipo_check;
alter table public.trends_alertas add constraint trends_alertas_tipo_check
  check (tipo = any (array['subida'::text, 'aparecimento'::text, 'sazonal'::text, 'a_observar'::text, 'tendencia'::text]));
