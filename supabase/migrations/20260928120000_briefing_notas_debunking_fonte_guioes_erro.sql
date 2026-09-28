-- Três colunas para o arquivo e os guiões deixarem de calar o que falta
-- =====================================================================
-- 28/09/2026, sessão 20. Decidido com a Marta a partir do diagnóstico do
-- briefing semanal (docs/sessoes/2026-09-28.md § 3).
--
-- 1. briefings_archive.notas
--    Uma secção vazia passa a levar a razão escrita, em vez de desaparecer do
--    ecrã sem explicação. Chaves: emergentes, perguntas, desmentidos, noticias.
--    É o mesmo princípio de eixos_archive.nota_medicao (20260924120000).
--
-- 2. debunking.fonte_estado
--    Os 36 desmentidos são da Marta, de fact-checks de jornalismo; o que lhes
--    falta é o link. Nascem todos 'sem fonte verificada' e deixam de entrar no
--    arquivo até terem link. NÃO é uma marca de conteúdo semeado. Nenhuma linha
--    muda de conteúdo: a coluna é nova e o valor vem do DEFAULT.
--
-- 3. guioes_semanais.erro
--    Até hoje uma geração falhada gravava uma lista vazia com estado 'gerado' e
--    gerado_por_ia = true — 36 linhas assim desde 03/08. A partir da versão 2 da
--    generate-guioes-weekly o estado passa a ser 'por rever' (há perguntas,
--    ainda não revistas pela Marta) ou 'falhou' (não há), e o erro fica aqui.
--    Esta migração não toca nas 36 linhas. A função nova regenera um guião
--    'falhou' ou vazio da semana corrente na mesma linha, e escreve em `erro`
--    o que lá estava — as 4 de 28/09 serão as primeiras.
--
-- 4. guioes_semanais.fontes_resposta
--    As fontes que o Perplexity devolve são da resposta inteira, não de cada
--    pergunta. Até 28/09/2026 a i-ésima fonte era posta na i-ésima pergunta.
--    Passam a ficar aqui, ao nível do guião; as perguntas da IA ficam com
--    referencia_url vazio.
--
-- NADA SE APAGA. REVERSÍVEL: drop column nas quatro.

alter table public.briefings_archive
  add column notas jsonb not null default '{}'::jsonb;

comment on column public.briefings_archive.notas is
  'Razão de cada secção vazia (emergentes, perguntas, desmentidos, noticias). '
  'Desde 28/09/2026; os arquivos anteriores ficam com {}.';

alter table public.debunking
  add column fonte_estado text not null default 'sem fonte verificada'
  check (fonte_estado in ('sem fonte verificada', 'verificada'));

comment on column public.debunking.fonte_estado is
  '''verificada'' só quando url aponta para o fact-check publicado e a página '
  'foi conferida. Desde 28/09/2026 o arquivo semanal não usa esta tabela.';

alter table public.guioes_semanais
  add column erro text;

comment on column public.guioes_semanais.erro is
  'O que falhou na geração automática (banco ou IA). NULL = nada falhou. '
  'Desde 28/09/2026; as linhas vazias de 03/08 a 28/09 ficam sem erro gravado.';

alter table public.guioes_semanais
  add column fontes_resposta jsonb not null default '[]'::jsonb;

comment on column public.guioes_semanais.fontes_resposta is
  'Fontes da resposta do Perplexity para o guião inteiro. NÃO correspondem a '
  'uma pergunta em particular. Desde 28/09/2026.';
