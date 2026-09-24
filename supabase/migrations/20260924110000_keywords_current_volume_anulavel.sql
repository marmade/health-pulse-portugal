-- keywords.current_volume: deixa de ser obrigatório e deixa de nascer a zero
-- =========================================================================
-- 24/09/2026, sessão 18. Pendente nº 7, decidido com a Marta.
--
-- PORQUÊ
--   A coluna estava `INT NOT NULL DEFAULT 0`. Isso quer dizer que todo o termo
--   novo nasce com o número zero — e zero, nesta coluna, lê-se "ninguém
--   procurou", não "ainda não foi medido". São coisas diferentes e o schema
--   não as distinguia. É o mesmo defeito que em Agosto pôs 43 de 82 termos a
--   zero quando o que tinha acontecido era a recolha ter falhado.
--
--   A migração 20260918180000 (lista de 100) insere ~40 termos novos sem dar
--   valor a esta coluna. Aplicada antes desta, faz nascer ~40 linhas a zero.
--   Por isso esta vai primeiro.
--
-- O QUE NÃO FAZ
--   Não toca nos valores que já lá estão, incluindo os 43 zeros de Agosto.
--   NADA SE APAGA: aqueles zeros são o registo de uma recolha que falhou e
--   ficam como prova. O que se decide separadamente é a nota que os explica.
--
-- REVERSÍVEL: `alter column current_volume set default 0` e `set not null`
-- (esta última só depois de não haver NULL na coluna).

alter table public.keywords
  alter column current_volume drop not null,
  alter column current_volume drop default;

comment on column public.keywords.current_volume is
  'Volume da série antiga do Google Trends, parada desde 27/07/2026. NULL = não '
  'medido; 0 = medido e sem procura. Até 24/09/2026 a coluna era NOT NULL '
  'DEFAULT 0 e as duas coisas confundiam-se. O dashboard lê trends_calibrados.';
