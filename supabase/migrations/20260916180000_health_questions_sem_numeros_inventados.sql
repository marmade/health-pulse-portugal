-- health_questions: deixar de guardar números inventados
-- =====================================================
-- 16/09/2026, sessão 15.
--
-- O QUE ESTAVA ERRADO
--
-- `relative_volume` nunca foi um volume. É a posição na lista devolvida pelo
-- Google, convertida em número:
--
--     scripts/6_fetch_health_questions.py:206   max(10, 100 - rank_idx * 8)
--     scripts/7_fetch_autocomplete_questions.py:142  max(10, 100 - pos * 5)
--
-- Nenhuma das duas fontes publica quantidade de pesquisas. O número parecia
-- procura e era lugar na fila — e o dashboard desenhava-o numa barra, em todas
-- as linhas, ao lado de cada pergunta.
--
-- `growth_percent` a 0 em todas as 3634 linhas de autocomplete tinha o mesmo
-- defeito ao contrário: o script 7 não mede crescimento nenhum, e escrevia um
-- valor como se medisse.
--
-- O QUE ESTA MIGRAÇÃO FAZ
--
-- 1. Deixa `relative_volume` e `growth_percent` aceitarem NULL, para quem não
--    mede poder dizê-lo em vez de inventar um número.
-- 2. Acrescenta `posicao`: a posição REAL dentro do molde que a produziu, a
--    começar em 1. É informação verdadeira — só não é volume. Sem ela, tirar o
--    número inventado deixaria a lista sem ordem nenhuma e devolvia-a ao
--    alfabeto, que foi o defeito corrigido no painel neste mesmo dia.
-- 3. Acrescenta `seed`: o molde que produziu a sugestão ("o que é {keyword}").
--    O script sabe-o no momento da recolha e deitava-o fora, e depois o
--    frontend adivinhava o tipo de dúvida por expressão regular sobre o texto.
--    Passa a ser facto registado em vez de palpite.
--
-- NÃO APAGA NADA. As 4647 linhas ficam como estão; as colunas novas ficam a
-- NULL até a próxima recolha as preencher, e o frontend tem de aguentar as duas
-- formas enquanto coexistirem.
--
-- REVERSÍVEL: as colunas são anuláveis e o DROP NOT NULL não destrói valores.

alter table public.health_questions
  alter column relative_volume drop not null,
  alter column growth_percent  drop not null;

alter table public.health_questions
  add column if not exists posicao smallint,
  add column if not exists seed    text;

comment on column public.health_questions.relative_volume is
  'OBSOLETA. Nunca foi um volume: era a posição na lista convertida em número. '
  'Mantida para as linhas anteriores a 16/09/2026; recolhas novas escrevem NULL. '
  'Usar `posicao`.';

comment on column public.health_questions.posicao is
  'Posição da sugestão dentro do seu molde, a começar em 1. É ordem, não volume '
  '— nem o Trends nem o Autocomplete publicam quantidade de pesquisas.';

comment on column public.health_questions.seed is
  'O molde que produziu a sugestão, ex. "o que é {keyword}". Permite saber o '
  'tipo de dúvida sem o adivinhar pelo texto.';

comment on column public.health_questions.growth_percent is
  'Só o pytrends mede crescimento. NULL quando a fonte não o mede. O valor 9999 '
  'é tecto (min(growth, 9999) no script 6), lê-se "subiu pelo menos isso".';
