-- Google Trends: uma casa para a série, com a régua registada
-- ============================================================
-- 18/09/2026, sessão 16. Crítico nº 6, decisão de schema de 07/09/2026, aplicada.
-- Método em docs/metodo/2026-09-18-reguas-e-ancoras.md.
--
-- O QUE ESTAVA ERRADO
--
-- `historical_snapshots` guarda valores do Google Trends de pedidos diferentes
-- na mesma coluna, como se fossem uma série. Não são: o Trends normaliza cada
-- pedido ao seu próprio máximo (100), logo dois pedidos são duas réguas. Somar
-- réguas deu 3462 linhas com 38% presas em 1, 16 acima de 100 e 240
-- retrodatadas — e uma série parada desde 10/08/2026.
--
-- O QUE ESTA MIGRAÇÃO FAZ — três tabelas, e a régua fica sempre à vista
--
--   trends_lotes    uma corrida (uma segunda-feira, ou uma descarga manual).
--                   O dashboard lê SEMPRE de um lote só — nunca cola lotes.
--   trends_pedidos  um pedido ao Google = UMA RÉGUA. Guarda os termos pedidos,
--                   a âncora, a janela, a granularidade, o estado da recolha
--                   (recolhido / sem_dados / falhou) e, quando manual, o ficheiro.
--   trends_pontos   os valores, um por (pedido, termo, data). NULL quando o
--                   Google não respondeu — nunca 0 a fingir ausência.
--
-- Os valores calibrados para a régua do eixo (pela âncora) NÃO vivem aqui: são
-- derivados, e o script grava-os em trends_calibrados no mesmo lote, com o
-- factor usado, para se poder refazer a conta.
--
-- SUBSTITUIÇÃO, NUNCA ACUMULAÇÃO: um lote novo não altera os anteriores; o
-- dashboard muda de lote. Os anteriores ficam para o método e para o apêndice.
--
-- ESCRITA: só service_role (como tudo desde 09/09/2026). LEITURA: pública, como
-- as outras tabelas do lado A.
--
-- NÃO TOCA em historical_snapshots nem em keywords. Reversível: são tabelas
-- novas; dropá-las não afecta nada que exista.

create table if not exists public.trends_lotes (
  id            uuid primary key default gen_random_uuid(),
  iniciado_em   timestamptz not null default now(),
  terminado_em  timestamptz,
  fonte         text not null check (fonte in ('pytrends', 'manual', 'api_oficial')),
  origem        text,                          -- 'launchd', 'manual <máquina>', 'github_actions'...
  estado        text not null default 'a_correr'
                check (estado in ('a_correr', 'completo', 'incompleto', 'falhou')),
  n_pedidos     integer,
  n_falhados    integer,
  notas         text
);

create table if not exists public.trends_pedidos (
  id                uuid primary key default gen_random_uuid(),
  lote_id           uuid not null references public.trends_lotes(id) on delete cascade,
  fetched_at        timestamptz not null default now(),
  eixo              text,                      -- saude-mental | alimentacao | menopausa | emergentes | (null = entre eixos)
  passo             smallint not null default 1 check (passo in (1, 2, 3)),  -- 1 âncora principal, 2 secundária, 3 entre eixos
  amostra           smallint not null default 1,  -- n.º da repetição do mesmo pedido (amostragem do Trends)
  termos            text[] not null,           -- os termos pedidos, pela ordem
  ancora            text,                      -- o termo que liga esta régua às outras
  geo               text not null default 'PT',
  categoria         integer,                   -- 45 = Saúde
  timeframe         text not null,             -- ex. 'today 5-y', 'today 12-m'
  window_start      date,
  window_end        date,
  granularidade     text check (granularidade in ('horaria', 'diaria', 'semanal', 'mensal')),
  collection_status text not null check (collection_status in ('recolhido', 'sem_dados', 'falhou')),
  erro              text,
  ficheiro          text,                      -- descarga manual: caminho no repositório
  sha256            text,
  unique (lote_id, eixo, passo, amostra, termos)
);

create table if not exists public.trends_pontos (
  pedido_id   uuid not null references public.trends_pedidos(id) on delete cascade,
  termo       text not null,
  data        timestamptz not null,
  valor       smallint,                        -- 0–100 na régua DESTE pedido; NULL = sem valor
  is_partial  boolean not null default false,  -- o Google marca o último ponto como parcial
  primary key (pedido_id, termo, data)
);

create table if not exists public.trends_calibrados (
  lote_id      uuid not null references public.trends_lotes(id) on delete cascade,
  eixo         text not null,
  termo        text not null,
  data         timestamptz not null,
  valor_eixo   numeric(8,3),                   -- na régua da âncora do eixo
  factor       numeric(10,6) not null,         -- valor_eixo = valor * factor
  pedido_id    uuid not null references public.trends_pedidos(id) on delete cascade,
  primary key (lote_id, eixo, termo, data)
);

create index if not exists trends_pedidos_lote_idx   on public.trends_pedidos (lote_id);
create index if not exists trends_pontos_termo_idx   on public.trends_pontos (termo, data);
create index if not exists trends_calibrados_eixo_idx on public.trends_calibrados (lote_id, eixo, termo);

alter table public.trends_lotes      enable row level security;
alter table public.trends_pedidos    enable row level security;
alter table public.trends_pontos     enable row level security;
alter table public.trends_calibrados enable row level security;

-- leitura pública; escrita só com service_role, que ignora o RLS (padrão de 09/09/2026)
drop policy if exists "Allow public read on trends_lotes"      on public.trends_lotes;
drop policy if exists "Allow public read on trends_pedidos"    on public.trends_pedidos;
drop policy if exists "Allow public read on trends_pontos"     on public.trends_pontos;
drop policy if exists "Allow public read on trends_calibrados" on public.trends_calibrados;
create policy "Allow public read on trends_lotes"      on public.trends_lotes      for select to public using (true);
create policy "Allow public read on trends_pedidos"    on public.trends_pedidos    for select to public using (true);
create policy "Allow public read on trends_pontos"     on public.trends_pontos     for select to public using (true);
create policy "Allow public read on trends_calibrados" on public.trends_calibrados for select to public using (true);

comment on table public.trends_pedidos is
  'Um pedido ao Google Trends = uma régua (índice 0–100 normalizado ao máximo deste pedido). '
  'Valores de pedidos diferentes NÃO se comparam; a âncora é o termo comum que permite converter.';
comment on column public.trends_pontos.valor is
  '0–100 na régua do pedido. NULL quando o Google não devolveu valor — nunca 0 a fingir ausência.';
comment on column public.trends_calibrados.factor is
  'valor_eixo = valor * factor. O factor vem da âncora: mediana(âncora no pedido de referência) / mediana(âncora neste pedido).';
