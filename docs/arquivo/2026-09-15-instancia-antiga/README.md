# Arquivo da instância antiga `cyjwhmuakmiytypewwfw` — 15/09/2026

Segunda exportação, feita na sessão 14, **antes** de decidir o destino da instância. Não
substitui a de `2026-09-09-instancia-antiga/` — essa é o registo do que se sabia nessa data,
e a diferença entre as duas é o achado desta sessão.

## Porque houve uma segunda

A 09/09/2026 a instância era descrita como congelada e foi exportada nesse pressuposto. A
15/09/2026 descobriu-se que **escreve todos os dias desde 09/03/2026** — dois `pg_cron`
internos, um activo, invisíveis no repositório. Ver
`docs/evidencia/2026-09-15-cron-instancia-antiga/`.

O arquivo de 09/09 não podia conter a prova de que a instância não estava parada. Este
contém: `news_items` passou de **1994** para **2128** linhas nesse intervalo.

## Método

`[sessão 14][bd]` Leitura REST a `cyjwhmuakmiytypewwfw.supabase.co/rest/v1`, com a chave
`anon` dessa instância (`scripts/switch_supabase.sh:48`, recuperada do histórico do git),
`Accept: text/csv`. As três tabelas grandes foram paginadas em blocos de 1000 com
`order=id.asc`.

**Verificação:** o número de registos de cada CSV foi contado com um leitor de CSV a sério
(não por linhas de ficheiro, que os campos multi-linha falseiam) e **bate exactamente** com
o `count=exact` devolvido pela API para cada tabela.

## O que está aqui

14 ficheiros, **17 976 registos**, 3,7 MB.

| ficheiro | registos |
|---|---|
| `historical_snapshots.csv` | 12072 |
| `health_questions.csv` | 3362 |
| `news_items.csv` | **2128** (eram 1994 a 09/09) |
| `bookmarks.csv` | 180 |
| `keywords.csv` | 83 |
| `guioes.csv` | 46 |
| `debunking.csv` | 35 |
| `youtube_trends.csv` | 30 |
| `plataforma_popups.csv` | 15 |
| `sobre_conteudo.csv` | 11 |
| `guioes_semanais.csv` | 5 |
| `briefings_archive.csv` | 4 |
| `textos.csv` | 4 |
| `app_settings.csv` | 1 |

## O que NÃO está aqui, e porquê

- **`revisao_pares` (4 linhas) e `contactos_projecto` (4 linhas) — não exportadas.**
  Mantém-se a decisão de 09/09/2026: são dados pessoais, as mesmas pessoas estão na
  instância nova já protegidas, e um ficheiro exportado seria só mais uma cópia em texto
  simples. **Esta decisão não foi reaberta nesta sessão.**
- **`trends_cache` e `trend_data` — 0 linhas.** Vazias nos dois lados; nada a exportar.
- **`eixos_archive` — não existe nesta instância.** HTTP 404, `PGRST205`. Existe na
  instância nova. É o que explica 18 tabelas aqui contra 19 lá. *Não foi investigado* porque
  é que a sessão 4 a lista entre as "2 preservadas" na migração de 12/04/2026.

## Alcance desta cópia — verificado, não assumido

A extracção foi feita com a chave `anon`. A pergunta óbvia é se o RLS escondeu linhas ou
colunas. **Foi verificada, e não escondeu.**

`[sessão 14][bd]` No SQL editor do Lovable Cloud — acesso administrativo, sem RLS pelo meio —
foi corrida uma contagem de linhas e de colunas para cada tabela de `public`
(`information_schema.columns` + `query_to_xml` sobre `count(*)`). Resultado em
`_verificacao-contagens-administrativas.csv`, sha256
`6621df7edf63ba97a52d48b577cf9c48f59507f4b927c03e149f1a416a597439`.

**Nas 14 tabelas extraídas, as colunas e as linhas coincidem exactamente** com o que a chave
pública devolveu e com o que está nos CSV desta pasta. Zero divergências. A extracção está
completa para estas tabelas.

A instância tem **18 tabelas** em `public`. As outras quatro: `contactos_projecto` (4
colunas, 4 linhas) e `revisao_pares` (21 colunas, 4 linhas), não extraídas por decisão; e
`trend_data` e `trends_cache`, ambas com 0 linhas.

**O que continua por fora:** esta verificação cobre linhas e colunas de `public`. Não cobre
outros schemas, funções, triggers, políticas nem os próprios `pg_cron` — esses estão
documentados à parte, em `docs/evidencia/2026-09-15-cron-instancia-antiga/`.

## Qualidade dos dados

Continua a valer o que o README de 09/09 apurou sobre `historical_snapshots`: *seed*
retrodatado nas 200 linhas de 10/2025 a 02/2026, valores acima de 100 num índice 0–100 em
Março, e **a série congelada de 14/04 a 27/07** — 105 dias com o valor repetido nas 82
keywords. **Isto é um seguro contra um passo irreversível, não uma série aproveitável.**

O que mudou de estatuto foi `news_items`: 92,8% das suas linhas (1975 de 2128) foram
escritas **depois** da migração de 12/04/2026. Não é arquivo morto — é o produto de uma
recolha que continuou a correr sozinha.
