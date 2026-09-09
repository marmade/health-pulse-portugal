# CONTEXT.md — Reportagem Viva / Diz que Disse
> Fonte de verdade do estado actual do projecto. Actualizado a cada sessão.
> Última actualização: 2026-09-09 (sessão 11)
> Incidente em curso desde Maio/2026 — ver `AUDIT.md` para o diagnóstico completo.
> **Escrita anónima fechada a 09/09/2026** em todas as tabelas, depois de o pipeline passar
> a escrever com `service_role`. Nenhum dado foi apagado. **O `/admin` deixou de escrever —
> decisão datada, ver "Estado do Admin".** Continua aberta a leitura pública de
> `revisao_pares`, que expõe 4 e-mails e 3 telefones: decisão adiada, não resolvida.

---

## Verificações

> Cada linha diz o que foi verificado, quando e como. Afirmação sem método é suposição.
> Antes de agir sobre qualquer destas linhas, confirma a data: verificação com mais de um mês não é estado actual.

> **Onde foi verificado.** `[nesta sessão]` = Claude Code, com comando reproduzível, na data
> da própria linha (07/09 na sessão 10, 09/09 na sessão 11) ·
> `[claude.ai, transcrito]` = verificado noutra janela e passado para aqui sem re-execução ·
> `[declarado]` = afirmado pela Marta, sem teste · `[sessão anterior]` = verificado antes da
> sessão que o regista, data na coluna · `[por testar]` = nunca verificado

| Afirmação | Data | Método | Resultado |
|---|---|---|---|
| Workflow semanal corre sozinho, sem intervenção manual | 07/09/2026 | `[claude.ai, transcrito]` Escritas observadas em `ijpxjpbjudaddfatibfl` entre 12:25 e 12:28 UTC | Confirmado. `news_items` 278, `health_questions` 4604, `youtube_trends` 22, `guioes_semanais` 25, `eixos_archive` 24 |
| Passos 1 e 3 (Google Trends) não escrevem nada | 14/08/2026 | `[sessão anterior]` Bloco comentado em `youtube-trends.yml`, com motivo e condição de religação no próprio ficheiro | Comentados desde 14/08/2026. **É esta a razão pela qual `historical_snapshots` está parada** — não é falha de recolha, é desactivação deliberada |
| Passo 2B (autocomplete) desligado | 09/09/2026 | `[nesta sessão]` Bloco comentado em `youtube-trends.yml`, com motivo e condição de religação no próprio ficheiro | Comentado a 09/09/2026, antecipado de sexta-feira. Motivo: testar o pipeline obriga a correr o workflow, e o passo 2B acrescentaria mais linhas com `relative_volume` fabricado às 3634 existentes. Passos activos no workflow: 11, contra 12 antes |
| `contactos_projecto` fechada ao acesso anónimo | 09/09/2026 | `[nesta sessão]` Migração `20260909160000` aplicada; depois, pedidos REST com a chave anon (papel `anon` confirmado por descodificação do JWT) | 0 políticas, RLS activo, **4 linhas preservadas**. Com a anon: SELECT `HTTP 200 []`, INSERT `HTTP 401` (42501), UPDATE e DELETE `HTTP 204` com 0 linhas afectadas. Os 204 não são sucesso: a impressão md5 do conjunto manteve-se em `a0cb6e2c…` e o telefone visado pelo UPDATE está inalterado |
| `historical_snapshots` não tem nenhuma janela defensável | 07/09/2026 | `[claude.ai, transcrito]` SQL: agrupamento por minuto de escrita e procura de valores fora de 0–100 | 3462 linhas. 240 são *seed* retrodatado, inserido num único minuto a 08/03/2026 com datas de 01/10/2025 a 01/03/2026. 3018 (09/03–12/04) têm valores acima de 100 num índice normalizado 0–100, e 43% presas no valor 1 |
| Google Autocomplete não segmenta por país | 07/09/2026 | `[nesta sessão]` `md5` e `diff` sobre as 4 respostas guardadas (pedidos manuais feitos pela Marta) | Respostas **byte a byte idênticas** entre `gl=pt` e `gl=br` (`fa5766d4…`, `ea7a0f17…`). O parâmetro `gl` não altera o resultado. Evidência em `docs/evidencia/2026-09-07-autocomplete-gl/` |
| `keywords` é curadoria manual, não recolha automática | 07/09/2026 | `[claude.ai, transcrito]` Consulta SQL: procura de linhas com assinatura de inserção automática (`previous_volume = 0` E `trend = 'up'`) | **Zero linhas** com essa assinatura. 83 linhas, 82 activas. Distribuição: 33 saúde mental, 18 alimentação, 16 emergentes, 16 menopausa. 43 com `current_volume = 0`, média 11,1, **zero emergentes com valor** |
| `.env` versionado num repositório público | 07/09/2026 | `[nesta sessão]` `git ls-files`, `git log -p --all -- .env`, API pública do GitHub | Repositório **público** (HTTP 200). Só variáveis `VITE_*` — `PROJECT_ID`, `PUBLISHABLE_KEY`, `URL`. **Sem `service_role` em todo o histórico**: não há chaves a rodar nem histórico a reescrever |
| Datas dos commits ao `.env` | 07/09/2026 | `[nesta sessão]` `git log --format="%h %ad %s" --date=short -- .env` | 5 commits: 06/03, 12/04 (×3, um deles a migração), **21/05/2026**. Os 4 "Changes" são do bot do Lovable. Confirma que o Lovable reescreveu o `.env` **depois** da migração de 12/04 |
| Chave `anon` da instância nova em código versionado | 07/09/2026 | `[nesta sessão]` Leitura de `scripts/6_…py:26` e `scripts/7_…py:29` | A chave `anon` de `ijpxjpbjudaddfatibfl` estava **hardcoded** nos dois scripts, além do `.env`. **`git rm --cached .env` não a remove do repositório** — o que fecha o risco é o RLS, não o ficheiro. *Estado a 09/09/2026: os 7 scripts passaram a ler do ambiente; os números de linha desta coluna são anteriores a essa alteração* |
| `.env` aponta para a instância errada | 13/08/2026 | `[sessão anterior]` Leitura do ficheiro | Aponta para `cyjwhmuakmiytypewwfw` (antiga, congelada a 30/04). A oficial é `ijpxjpbjudaddfatibfl` |
| Valores fabricados no script 7 (autocomplete) | 07/09/2026 | `[nesta sessão]` Leitura de `scripts/7_fetch_autocomplete_questions.py` | **Confirmado.** `relative_volume = max(10, 100 - pos*5)` (l.142) — a posição na lista gravada como se fosse volume; `growth_percent` fixo a `0` (l.146); `is_question` fixo a `True` (l.151), mesmo para termos que não são perguntas. **Acrescento:** `pos` acumula ao longo dos 10 seeds, logo a partir da 19ª sugestão o valor é sempre `10`. O pedido usa `gl=pt` (l.112), parâmetro sem efeito |
| Valores fabricados no script 6 (pytrends) | 07/09/2026 | `[nesta sessão]` Leitura de `scripts/6_fetch_health_questions.py` | **Confirmado.** `relative_volume = max(10, 100 - rank*8)` (l.208); `"breakout"` convertido em `growth = 5000` (l.199-200); `expandir_mural()` (l.288-338) insere keywords com `previous_volume: 0`, `trend: "up"` e `current_volume` igual ao volume fabricado. **Que nunca tenha inserido nada é a consulta SQL da linha das `keywords`, não esta leitura** |
| Script 6 é a única fonte de perguntas com base territorial | 07/09/2026 | `[nesta sessão]` Leitura de `scripts/6_…py:175` | Confirmado: `build_payload(..., geo="PT", timeframe="today 3-m")`. O `growth_percent` vem do valor real das *rising queries* do Google — **excepto** quando é `"breakout"`, caso em que é fabricado |
| `6_fetch_health_questions.py` falha em silêncio | 07/09/2026 | `[nesta sessão]` Leitura de `scripts/6_…py:225-227` | **Confirmado.** Qualquer excepção (incluindo HTTP 429) é apanhada, impressa no log, e a função devolve lista vazia. Não escreve `NULL` nem marca estado: a keyword desaparece da recolha dessa semana sem rasto na base de dados |
| `refresh-trends` copia `current_volume` sem validar | 14/08/2026 | `[sessão anterior]` Leitura de `supabase/functions/refresh-trends/index.ts` | Confirmado; insert único e atómico, resposta 200 conta linhas preparadas, não gravadas |
| Escrita anónima via REST bloqueada por RLS | 13/08/2026 | `[sessão anterior]` POST com chave anon a duas tabelas | HTTP 401, Postgres 42501. **Só duas tabelas testadas — e `contactos_projecto` não era nenhuma delas** |
| RLS das restantes tabelas | 09/09/2026 | `[nesta sessão]` `pg_policies` cruzado com leitura REST tabela a tabela usando a chave anon | 19 tabelas, **todas com RLS activo — o que não protege nada por si só**. `contactos_projecto` devolve 0 linhas; todas as outras devolvem conteúdo à anon |
| `revisao_pares` expõe dados pessoais | 09/09/2026 | `[nesta sessão]` `pg_policies` + leitura REST com a chave anon | Políticas `public` `true` em SELECT, INSERT e UPDATE. **4 linhas, 4 com nome, 4 com e-mail, 3 com telefone** (dois perfis por linha). Lidas e reescritas por quem tenha a chave. O `hideContact` de `RevisaoPares.tsx` esconde no ecrã, não impede o envio |
| Escrita anónima em 13 tabelas, 9 com DELETE | 09/09/2026 | `[nesta sessão]` `pg_policies`: políticas de INSERT/UPDATE/DELETE/ALL com `qual`/`with_check` a `true` e role não-`service_role` | `bookmarks` (ALL); `briefings_archive`, `debunking`, `guioes`, `guioes_semanais`, `health_questions`, `keywords`, `sobre_conteudo`, `textos`, `youtube_trends` (INSERT/UPDATE/**DELETE**); `news_items` (UPDATE/**DELETE**); `eixos_archive` (INSERT); `revisao_pares` (INSERT/UPDATE). Um DELETE anónimo apaga as 4604 linhas de `health_questions` |
| Escrita anónima fechada em todas as tabelas | 09/09/2026 | `[nesta sessão]` Migração `20260909190000` (31 políticas removidas em 12 tabelas); depois, bateria de pedidos REST com a chave anon | **0 políticas de escrita a `public`** e 0 tabelas sem RLS. Com a anon: INSERT `HTTP 401`/42501 em 11 tabelas testadas; UPDATE e DELETE `HTTP 204` com 0 linhas, incluindo um DELETE **sem filtro** em `youtube_trends` e `debunking`. **Impressão md5 das contagens das 19 tabelas idêntica antes e depois (`b04740f7…`)**, texto da linha visada intacto, 0 alterações, 0 inserções de teste. Leitura verificada tabela a tabela: as 16 que o site lê continuam a devolver conteúdo |
| Os 7 scripts do pipeline escrevem com a chave anon | 09/09/2026 | `[nesta sessão]` Leitura das linhas indicadas e descodificação de cada JWT | Chave hardcoded em `4_…py:25`, `5_…py:22`, `6_…py:26`, `7_…py:29`, `8_…py:14`, `9_…py:24`, `10_…py:17` — **a mesma chave `anon` nos sete** (md5 `cd6632b6`), de `ijpxjpbjudaddfatibfl`. Também em texto simples no `env:` do workflow (l.10). Escrevem: `9_…py:92` e `4_…py:254` fazem DELETE. **Fechar as escritas a anon antes de migrar estes scripts desliga os passos 2, 2B, 4B e 5** |
| Edge Functions não dependem da chave anon | 09/09/2026 | `[nesta sessão]` `grep` por `SERVICE_ROLE`/`ANON` nas 7 funções | As 5 que tocam no Supabase usam `service_role`: `archive-weekly`, `fetch-rss-feeds`, `generate-guioes-weekly`, `google-trends`, `refresh-trends`. Fechar as escritas a anon não as afecta |
| Escrita via Edge Function | — | `[por testar]` | Em aberto. `verify_jwt = false` confirmado na instância nova; desconhecido na antiga |
| Edge Functions deployadas na instância nova | 14/08/2026 | `[sessão anterior]` MCP Supabase `list_edge_functions` | 5 activas: `refresh-trends`, `archive-weekly`, `generate-guioes-weekly`, `google-trends`, `fetch-rss-feeds` |
| Edge Functions em falta | 14/08/2026 | `[sessão anterior]` MCP + POST a `generate-diz-que-disse` | `generate-diz-que-disse` e `generate-guiao-questions` (HTTP 404) |
| Código das funções em produção | 14/08/2026 | `[sessão anterior]` MCP: todas em versão 1, deploy 28/07/2026 17:20–17:27 | Nunca redeployadas. Alterações no repositório desde 28/07 NÃO estão em produção |
| `VITE_PERPLEXITY_API_KEY` existe como secret na instância nova | 14/08/2026 | `[declarado]` Painel Supabase, verificado pela Marta | Existe, criada 12/04/2026. Sem função deployada que a leia |

---

## Projecto

**Reportagem Viva** — dashboard de monitorização de narrativas de saúde em Portugal (lado A)
**Diz que Disse** — editorial de comunicação de ciências da saúde (lado B)

- Lovable preview: https://preview--health-pulse-pt.lovable.app/
- Admin: https://preview--health-pulse-pt.lovable.app/admin
  (credencial removida do documento a 07/09/2026. Esteve em claro num
  repositório público e **permanece no histórico do Git** — retirá-la do
  ficheiro não a remove do repositório. Decisão de 07/09/2026: não
  alterar a palavra-passe, porque o painel aponta para a instância antiga
  e sai com o corte do Lovable. Até lá, o acesso é público de facto.)
- Repositório: https://github.com/marmade/health-pulse-portugal
- Lovable project ID: 69209c37-6f9e-4a84-bea9-8e56d0eace5a

---

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind + shadcn/ui (Lovable)
- **Backend:** Supabase — **duas instâncias, estado transitório** (ver `AUDIT.md` secções 4 e 5):
  - **Oficial (decisão de 29/07/2026):** `ijpxjpbjudaddfatibfl.supabase.co` (Marta) — **viva**.
    O workflow correu a 03/08 e 10/08; RSS, `health_questions`, `youtube_trends` e
    `guioes_semanais` foram actualizados a 10/08. O único passo partido é o do Google Trends
  - **Em uso de facto:** `cyjwhmuakmiytypewwfw.supabase.co` (Lovable) — é para aqui que o
    site publicado aponta. **A migração da sessão 4 foi apagada:** o `.env` aponta para a
    instância antiga e não contém credenciais da nova (verificado 13/08/2026)
  - Enquanto o Lovable Cloud estiver ligado ao projecto, editar no editor visual pode
    alterar o `.env` sem aviso
- **Design:** Space Grotesk, azul `#0000FF`, magenta `#FF00FF`, fundo branco, sem sombras nem gradientes
- **Automatização:** GitHub Actions (workflow semanal), Python scripts em `scripts/`
- **Claude Code:** instalado localmente; comando `claude`, a partir de `~/Documents/health-pulse-portugal`

---

## Eixos Temáticos

| Código | Nome |
|---|---|
| `saude-mental` | Saúde Mental |
| `alimentacao` | Alimentação |
| `menopausa` | Menopausa |
| `emergentes` | Emergentes |

---

## Modelo de Dados — Lado A (Reportagem Viva)

**`keywords` é o elemento central** — todas as tabelas de monitorização ligam a ela via `keyword_id` (FK, nullable).

### Tabelas — Lado A
`keywords`, `health_questions`, `news_items`, `debunking`, `youtube_trends`, `historical_snapshots`, `app_settings`, `trends_cache`, `briefings_archive`, `eixos_archive`, `guioes_semanais`

### Tabelas — Lado B
`revisao_pares`, `contactos_projecto`, `bookmarks`, `guioes`, `textos`, `sobre_conteudo`

### health_questions — schema
```
id, question, growth_percent, relative_volume, axis, axis_label,
cluster, is_question, keyword_id, updated_at,
source (TEXT DEFAULT 'pytrends'),
last_seen_at (TIMESTAMPTZ DEFAULT now())
```
**Constraint única:** `(question, axis, source)`

---

## Fontes de Dados

| Tipo | Total | Detalhes |
|---|---|---|
| RSS feeds | 44 | Media geral, media saúde, institucional, nutrição, sociedades científicas, ONG, farmacêutica, divulgação, fact-check |
| YouTube canais | 56 | Media, institucional, sociedades, hospitais, academia, ONG, fact-check, internacional, autarquias |
| Bookmarks referência | 76 | Todas as sociedades médicas AJOMED + institucionais + ONG |
| Fontes peer-reviewed | 5 | MSD Manuals, Acta Médica Portuguesa, RPMGF, SciELO PT, Cochrane |

### Estatuto das fontes — decisão de 07/09/2026

**Google Autocomplete mudou de estatuto.** Deixa de responder *"o que perguntam os
portugueses"* e passa a responder *"como se formula a dúvida em português"*. A razão é
factual e está verificada: `gl=pt` e `gl=br` devolvem respostas byte a byte idênticas — a
fonte não segmenta por país.

**Delimitação do objecto.** O protótipo recolhe **dúvidas formuladas em português, a partir
de Portugal**. O critério é territorial, não linguístico.

**O Google Trends fica** por ser a única das três fontes que segmenta por país de facto
(`geo=PT`). É essa a função que desempenha no desenho, independentemente da decisão sobre
como passar a recolhê-lo.

| Fonte | Responde a | Segmenta por país |
|---|---|---|
| Google Trends (script 5) | dinâmica temporal do interesse | **Sim** — `geo=PT` |
| pytrends *related queries* (script 6) | o que está a crescer | **Sim** — `geo=PT` |
| Google Autocomplete (script 7) | como se formula a dúvida | **Não** — verificado 07/09/2026 |

---

## Automatização — GitHub Actions

**Workflow:** `youtube-trends.yml` — "Actualização Semanal — Reportagem Viva"
**Schedule:** Segundas-feiras 06:00 UTC (07:00 Lisboa) | Também disparo manual

> **Estado:** o workflow foi desactivado automaticamente pelo GitHub por inactividade do
> repositório e reactivado a 28/07/2026. Corre desde então (03/08, 10/08).
>
> **Passo 1 (Google Trends) partido — verificado a 13/08/2026.** Quando a recolha falha
> (HTTP 429, ver `AUDIT.md` secção 2), o script **escreve `0`** em vez de manter o valor
> anterior ou marcar erro. Estado a 10/08: **43 de 82 keywords a zero**, e só **12 mudaram**
> face a 03/08. Consequências: nenhum sinal emergente dispara, e o dashboard apresenta uma
> **falha de recolha como ausência de interesse** — quando o estado real é desconhecido.
>
> **Correcção decidida (13/08/2026):** escrever `NULL` em vez de `0` quando a recolha falha,
> e acrescentar uma coluna `collection_status` que distinga explicitamente "recolhido",
> "falhou" e "sem dados". Sem isto, nenhuma série de trends é defensável na tese.

### Passos — numeração real do ficheiro (verificado 14/08/2026)

**Activos:**
0. Ping Supabase — wake up da instância se pausada (sessão 5)
2. Perguntas de saúde (`scripts/6_fetch_health_questions.py`) → `health_questions` (source=pytrends)
2B. Perguntas autocomplete (`scripts/7_fetch_autocomplete_questions.py`) → `health_questions` (source=autocomplete)
4. RSS feeds (Edge Function `fetch-rss-feeds`) → `news_items` (com `keyword_id` — sessão 5)
4B. Limpeza notícias antigas por eixo (`scripts/9_cleanup_old_news.py`) — sessão 5
5. YouTube (`scripts/4_fetch_youtube_trends.py`) → `youtube_trends`
6. Guiões semanais (Edge Function `generate-guioes-weekly`) → `guioes_semanais`
7. Arquivo semanal (Edge Function `archive-weekly`) → `eixos_archive` + `briefings_archive`

**Comentados a 14/08/2026** — não removidos; o bloco de comentário no próprio ficheiro
explica o motivo e a condição para religar:
1. Google Trends PT (`scripts/5_fetch_google_trends.py`) → `keywords`
3. Refresh trends (Edge Function `refresh-trends`) → `historical_snapshots`

### Edge Functions
| Nome | Função |
|---|---|
| `refresh-trends` | Cria snapshots históricos (sem alterar volumes) |
| `fetch-rss-feeds` | Recolhe notícias de 44 RSS feeds (com keyword_id desde sessão 5) |
| `archive-weekly` | Arquiva 4 eixos + briefing |
| `generate-guioes-weekly` | Gera guiões dos 4 eixos (5 banco + 5 IA) |
| `generate-guiao-questions` | Gera perguntas IA via Perplexity Sonar |
| `generate-diz-que-disse` | Gera conteúdo Diz que Disse para briefing |

---

## Dashboard — Dados 100% Reais (com ressalva desde Maio/2026)

> **Ressalva.** O princípio de zero mock data mantém-se no código, mas **nenhuma das duas
> instâncias tem hoje uma série de trends utilizável**:
>
> - **Nova (`ijpxjpbjudaddfatibfl`) — sem janela defensável.** Verificado a 07/09/2026: das
>   3462 linhas de `historical_snapshots`, 240 são seed retrodatado e 3018 contêm valores
>   impossíveis (acima de 100 num índice normalizado 0–100) ou presas no valor 1. Nenhuma
>   fatia é apresentável numa tese. Série parada desde 10/08/2026.
> - **Antiga (`cyjwhmuakmiytypewwfw`) — congelada, e a qualidade NÃO ESTÁ VERIFICADA.**
>   Versões anteriores deste documento afirmavam "dados de trends reais até 30/04/2026".
>   Essa afirmação nunca foi testada com os critérios de 07/09, e o período 09/03–12/04 é
>   exactamente o mesmo que está contaminado na instância nova. Tratar como **não
>   verificada** até correr lá o teste dos valores impossíveis. Ver `AUDIT.md` secção 4.
> - É a instância antiga que o **site publicado** lê. Quem abrir o URL hoje vê valores de
>   Abril apresentados como actuais — quatro meses de atraso.
>
> `news_items` não é afectada em nenhuma das duas — mantém-se real e contínua.

- **Zero mock data** — eliminados Math.random, kwPeriodMult, mock fallbacks
- **Gráficos**: `historical_snapshots` via `buildTrend.ts`, média simples (corrigida sessão 3 — era sum(v²)/sum(v))
- **Volumes por período**: recalculados via snapshots (7d/30d/12m); fallback consistente quando dados insuficientes (corrigido sessão 3)
- **Alertas**: thresholds 30% (7d), 50% (30d), 40% (12m) + emergentes com variação > 0 (corrigido sessão 3 — antes incluía emergentes com variação negativa)
- **Ranking urgência**: "Prioridade de comunicação esta semana" no overview e briefing

---

## Estado do Admin

| Tab | Estado |
|---|---|
| KEYWORDS | ✅ 83 keywords (migradas do Lovable) |
| DEBUNKING | ✅ 36 registos (dados da Marta, transformados para schema Lovable) |
| NOTÍCIAS | ✅ 158 (migradas do Lovable) |
| TEXTOS | ✅ 4 (migrados do Lovable) |
| GUIÕES | ✅ 100 (dados da Marta, transformados) + 1 semanal |
| PLATAFORMA | ✅ 15 popups |
| SOBRE | ✅ 11 blocos |
| BOOKMARKS | ✅ 182 (179 Lovable + 3 Marta merged) |
| BENCHMARK | ✅ Verificado — personas + pseudociência + MSD links |
| REVISÃO PARES | ✅ 4 (migrados do Lovable) |

### Decisão de 09/09/2026 — o `/admin` deixou de escrever

Os números acima descrevem o que está na base de dados, **não** o que o `/admin` consegue
fazer. Desde 09/09/2026 não consegue escrever nada.

`Admin.tsx` e `Guioes.tsx:447-449` escrevem com a chave `anon`. Ao fechar a escrita anónima
(migração `20260909190000`), os dois passam a receber `401`/42501. Foi decisão tomada com o
custo à vista, não efeito colateral.

Porquê aceitar o custo: a password do Admin é comparada no cliente (`Admin.tsx:463`) e vai no
bundle publicado. Nunca foi protecção — era um aviso. Enquanto as políticas estivessem
ligadas ao role `public`, qualquer pessoa com a chave `anon`, que está num repositório
público, tinha exactamente os mesmos poderes que o `/admin`. O `Guioes.tsx` era pior: gravava
guiões sem sequer pedir password.

Até haver autenticação Supabase a sério, a gestão de conteúdos passa para o painel Supabase,
que usa `service_role` e ignora o RLS. É trabalho manual assumido, com data.

**Atenção para quem retomar isto:** autenticar no frontend não resolve por si. Enquanto as
políticas forem para o role `public`, uma sessão autenticada não muda nada — as políticas
novas têm de ser para `authenticated`. Ver Pendentes Críticos nº 2.

---

## Prioridades — decisão de 2026-08-13

**Prioridade à Reportagem Viva (lado A). Lado B em pausa deliberada.** O lado B não recebe
conteúdo novo há meses — `guioes` desde 09/03/2026, `debunking` desde 25/03/2026 — e essa
pausa passa a ser explícita, não acidental: enquanto a série de trends não for defensável,
o esforço vai todo para o lado A. Reavaliar quando os pendentes críticos estiverem fechados.

## Pendentes

### Críticos — por esta ordem (09/09/2026)

A ordem é deliberada: cada item depende do anterior, ou é mais urgente do que ele.

0. [x] **`contactos_projecto` — fechada a 09/09/2026.** As 4 linhas **não** foram apagadas: é
   a agenda de trabalho do projecto e os dados fazem falta. O que se removeu foi o acesso
   anónimo. Migração `20260909160000`, políticas do `20260320193223` comentadas e secção 5.19
   da consolidada reescrita, para que reaplicar qualquer um deles não reabra a exposição.
   Provado com a chave anon, não com `service_role`. Commit `a3fe51f`

1. [x] **Escritas anónimas — fechadas a 09/09/2026.** A sequência de 6 pontos foi cumprida
   pela ordem, sem trocar: secret criado, os 7 scripts a lerem do ambiente sem valor por
   defeito, secret passado aos passos, workflow #37 corrido à mão e confirmado a escrever com
   `service_role`, e só então as 31 políticas removidas em 12 tabelas (migração
   `20260909190000`). `revisao_pares` fechado à escrita à parte (`20260909180000`).
   Nenhum dado apagado: impressão md5 das contagens das 19 tabelas igual antes e depois.
   Commits `a3fe51f`, `1ea9481`, `5e43a0e`.

2. [ ] **Autenticação Supabase a sério — e só depois repor escrita no `/admin`.**
   Consequência assumida do ponto anterior: o `/admin` não escreve desde 09/09/2026, e a
   gestão de conteúdos passou para o painel Supabase. Isto é um pendente, não um esquecimento.

   O que NÃO resolve: pôr um ecrã de login no frontend. Enquanto as políticas forem para o
   role `public`, uma sessão autenticada tem exactamente os mesmos poderes que um anónimo.
   A password actual (`Admin.tsx:463`) é comparada no cliente e vai no bundle.

   O que resolve, por esta ordem:
   1. Supabase Auth com utilizador real para a Marta
   2. `Admin.tsx` e `Guioes.tsx` a usarem essa sessão, não a chave `anon`
   3. políticas novas de INSERT/UPDATE/DELETE **para o role `authenticated`**, nunca `public`,
      tabela a tabela e só nas que o admin precisa de escrever
   4. `Guioes.tsx:447-449` grava sem pedir password nenhuma — ou passa a exigir sessão, ou
      deixa de gravar
   5. testar com a chave anon que continua a não escrever, como a 09/09/2026

   Enquanto isto não existir, **não repor políticas de escrita para `public`**. É desfazer
   tudo o que se fez a 09/09/2026.

3. [ ] **Retirar o `.env` do tracking e corrigir as credenciais.**
   `git rm --cached .env` seguido de escrever as credenciais da instância nova
   (`ijpxjpbjudaddfatibfl`) no ficheiro local. A regra do `.gitignore` está em vigor desde
   07/09/2026, mas o ficheiro continua versionado.
   **Isto NÃO remove a chave `anon` do repositório público.** Saiu dos 7 scripts a 09/09/2026
   (passam a ler do ambiente), mas continua no `env:` do workflow (l.10) e em todo o
   histórico do git. O que fecha o risco de acesso é o RLS (Críticos nº 0 e 1, fechados a 09/09/2026), não este item —
   e a chave `anon` é, por desenho, pública: o erro nunca foi ela estar à vista, foi as
   políticas deixarem-na escrever. O objectivo deste item é a correcção da instância errada,
   não a segurança.
4. [ ] **Cortar o Lovable e publicar via GitHub.** Enquanto a ligação Lovable Cloud↔Supabase
   estiver activa, o editor visual reescreve o `.env` e desfaz o item 2. Verificado no
   histórico a 07/09/2026: o commit mais recente sobre o `.env` é `5246597`, de
   **21/05/2026**, do bot — posterior à migração de 12/04/2026. Decisão de 07/09/2026:
   abandonar o Lovable
5. [ ] **Reescrever `5_fetch_google_trends.py` — decisão de schema fechada a 07/09/2026,
   a aplicar ANTES de alguém implementar.**

   O índice do Google Trends é normalizado ao **máximo da janela pedida**. Duas descargas
   com janelas diferentes produzem séries em **escalas diferentes**, mesmo para a mesma
   keyword. Consequência: fazer *append* incremental cria em silêncio uma série com duas
   escalas misturadas — a mesma classe de falha que já custou as 3462 linhas de
   `historical_snapshots`.

   Regras, não sugestões:
   - a tabela guarda `fetched_at`, `window_start`, `window_end` e identificador do pedido
   - o dashboard lê **sempre de uma descarga só**
   - **SUBSTITUIÇÃO, NUNCA ACUMULAÇÃO**
   - séries longas em vez de pontos isolados; `geo=PT`; grupos com keyword-âncora
   - `NULL` + `collection_status` nas falhas, nunca `0`

   Calibração entre grupos de 5 keywords: West, R. (2020), *Calibration of Google Trends
   Time Series*, CIKM '20, pp. 2257-2260. DOI 10.1145/3340531.3412075

   Religar os passos 1 e 3 antes disto só acrescenta lixo à série.
6. [ ] **`7_fetch_autocomplete_questions.py`:** exportar primeiro as 3634 linhas de
   autocomplete que já estão na base de dados. **Só depois** tocar no script — mexer antes
   perde-as

### Suspensos — dependem de verificação prévia

- [ ] **Exportar `historical_snapshots` da instância antiga** — suspenso até correr nessa
  instância o teste dos valores impossíveis (valores acima de 100 e valores presos em 1). Se
  der o mesmo resultado da instância nova, este item e o seguinte são cancelados
- [ ] **Importar esses dados para a instância nova** — depende inteiramente do anterior
- [ ] **Decidir o destino do Google Trends no projecto** — em aberto a 07/09/2026. Opções em
  cima da mesa: sair e passar a limitação documentada; recolher de IP residencial; API paga;
  manter `pytrends`. Sem esta decisão, os passos 1 e 3 ficam comentados

### Restantes

- [x] ~~**Aviso operacional — segunda-feira 06:00 UTC**, passo 2B a acumular linhas
      fabricadas~~ (resolvido a 09/09/2026: o passo 2B foi comentado, com motivo e condição
      de religação no próprio `youtube-trends.yml`. Passos activos: 11)
- [ ] **`set_updated_at` com `search_path` mutável.** Achado a 09/09/2026 pelo linter de
      segurança do Supabase (`function_search_path_mutable`, nível WARN). É anterior a esta
      sessão e não tem relação com o RLS. Fica registado para não se perder: a função devia
      declarar `set search_path = ''` e qualificar os nomes.
      https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
- [ ] **Nota sobre o linter:** o aviso `rls_enabled_no_policy` em `contactos_projecto` é
      **deliberado**, não é para corrigir. RLS activo com zero políticas é exactamente o
      estado pretendido: nega tudo a `anon`, e o `service_role` continua a passar
- [ ] **Sessões 6 e 7 sem ficheiro em `docs/sessoes/`.** A numeração vai em 9 (14/08) mas só
      existem 6 ficheiros anteriores a 07/09/2026. Registar as duas em falta, ou assumir a
      lacuna explicitamente — contar ficheiros para inferir o número da sessão dá resultado
      errado
- [ ] **Painel admin com palavra-passe pública.** Exposta em claro no CONTEXT.md, em
      repositório público. Decisão de 07/09/2026: não alterar, porque o painel sai com o
      Lovable. Se o corte do Lovable for adiado ou o painel for reaproveitado na instância
      nova, esta decisão tem de ser revista.
      Exposta desde **08/03/2026** (`git log -S`: commit `ddfedee`, do bot do Lovable) —
      seis meses. Continua em `src/pages/Admin.tsx`, portanto é servida no bundle do
      frontend: retirá-la do CONTEXT.md não a esconde de quem abrir o site
- [ ] **Migração para `ijpxjpbjudaddfatibfl`** — iniciada na sessão 4, apagada; retomada em
      13/08/2026 pela sequência dos Críticos
- [ ] Recriar os cron jobs em `ijpxjpbjudaddfatibfl` como ficheiro de migração, não no dashboard
- [ ] **Deploy das 2 edge functions em falta na instância nova:** `generate-diz-que-disse` e
      `generate-guiao-questions`, ambas HTTP 404 a 14/08/2026. As outras cinco estão activas
      desde 28/07/2026 — incluindo `generate-guioes-weekly` e `archive-weekly`, que versões
      anteriores deste documento davam erradamente como em falta.

      **Duas condições obrigatórias antes de as deployar:**
      1. **Verificação de chamador por segredo partilhado** — o workflow envia um header, a
         função compara-o com uma variável de ambiente e devolve 401 se não bater. Nunca
         `service_role` key no workflow.
      2. **Renomear `VITE_PERPLEXITY_API_KEY` para `PERPLEXITY_API_KEY`** — painel e código
         ao mesmo tempo. O prefixo `VITE_` faz o Vite injectar a variável no bundle do
         frontend: basta alguém pô-la no `.env`, que é o gesto natural dado o nome, para a
         chave paga passar a ser servida ao browser.
- [ ] Actualizar /sobre bloco "fontes-de-dados": 16→44 feeds RSS, 36→56 canais YouTube,
      acrescentar Google Autocomplete como fonte — **com a ressalva de que o autocomplete
      não segmenta por país** (verificado 07/09/2026). As sugestões não são específicas de
      Portugal, e isso tem de constar da metodologia, não ser omitido
- [ ] Análise aos gráficos: verificar cálculo de `change_percent` em `5_fetch_google_trends.py` — confirmar coerência com /sobre, avaliar defensabilidade metodológica
- [ ] Saúdes.pt como fonte de curadoria manual de keywords e debunking (origem comercial Medis — a documentar)
- [ ] TED Talks / referências audiovisuais (Lado B — decisão adiada)
- [ ] Sazonalidade (precisa de 2+ anos de dados)

### Concluídos

- [x] ~~Verificar RLS de `contactos_projecto`~~ (07/09/2026 — resultado: **sem protecção
      efectiva**; foi o Crítico nº 1 dessa sessão e ficou fechado a 09/09/2026, Crítico nº 0)
- [x] ~~Acrescentar `.env` ao `.gitignore`~~ (sessão 10, 07/09/2026 — regra em
      `.gitignore:16`, confirmada com `git check-ignore --no-index`. O ficheiro **continua
      versionado**; retirar do tracking é o Crítico nº 3 desde a renumeração de 09/09/2026)
- [x] ~~`eixos_archive` vazia~~ (07/09/2026 — 24 linhas, escritas pelo passo 7 do workflow)
- [x] ~~Revogar o PAT do GitHub exposto~~ (revogado a 13/08/2026 — distinto do token da sessão 4)
- [x] ~~Correr workflow manualmente para popular snapshots e guiões~~ (disparado 2026-03-27)
- [x] ~~Migração colunas eixo/subcategoria nos bookmarks~~ (pedido ao Lovable 2026-03-27)
- [x] ~~Token GitHub revogado~~ (token da sessão 4, Abril/2026 — distinto do que foi revogado a 13/08/2026)
- [x] ~~Preencher keyword_id nos registos do debunking~~ (35/35 linkados — sessão 3)
- [x] ~~Aplicar migração idx_news_items_date~~ (incluída na migração consolidada — sessão 4)
- [x] ~~Ping Supabase no workflow~~ (passo 0, wake up antes dos outros passos — sessão 5)
- [x] ~~Limpeza semanal de notícias por eixo~~ (`scripts/9_cleanup_old_news.py`, passo 4B — sessão 5)
- [x] ~~Debunking ordenado por data_publicacao DESC~~ (3 queries corrigidas — sessão 5)
- [x] ~~keyword_id no RSS fetch~~ (`fetch-rss-feeds/index.ts` agora insere keyword_id — sessão 5)
- [x] ~~Backfill keyword_id em news_items~~ (158/158 resolvidos, `scripts/10_backfill_news_keyword_id.py` — sessão 5)
- [x] ~~Sinónimos curtos adicionados~~ (menopausa, gripe aviária, microplásticos, TDAH — sessão 5)
- [x] ~~Channel ID Ordem dos Enfermeiros~~ (UCuDagVc79VVXXPFJurgXIiw adicionado — sessão 5)
- [x] ~~SPP Pediatria~~ (confirmado: canal não existe no YouTube — sessão 5)

## Code Review — Sessão 3 (2026-04-09)

### Corrigido
- **Weighted average distorcida** — `buildTrend.ts` usava `sum(v²)/sum(v)`, corrigido para média simples
- **Fallback misturava períodos** — `useAxisData.ts` podia comparar snapshot parcial com valor BD de período diferente; agora usa BD completa quando dados insuficientes
- **Emergentes nunca expiravam** — `5_fetch_google_trends.py` agora reseta `is_emergent` quando variação < 50% ou sem dados
- **YouTube falsos positivos** — `4_fetch_youtube_trends.py` agora usa word boundaries + blacklist (política, futebol, etc.)
- **YouTube axis mismatch** — `saude_mental` (underscore) corrigido para `saude-mental` (hyphen)
- **Alertas stale** — `detectAlerts.ts` exclui emergentes com variação negativa
- **Debunking sem data** — componente agora mostra `data_publicacao`, ordenado por data desc
- **Notícias sem limite** — query limitada a 12 meses (performance)
- **keyword_id no debunking** — script `8_link_debunking_keywords.py` linkou 35/35 registos

### Limitações conhecidas (não corrigidas)
- **Período "7d" com dados semanais** — workflow corre 1x/semana, logo "7d" terá 1-2 snapshots. Não engana (mostra dados BD) mas não acrescenta granularidade
- **Debunking sem expiração** — entradas antigas aparecem como actuais; recomendação: adicionar TTL ou aviso visual de staleness
- ~~**Notícias acumulam na BD**~~ — resolvido sessão 5: limpeza semanal condicional por eixo (`scripts/9_cleanup_old_news.py`)

## Migração Supabase — Sessão 4 (2026-04-12)

### Concluído
- **Migração completa** de `cyjwhmuakmiytypewwfw` (Lovable) → `ijpxjpbjudaddfatibfl` (Marta)
- **17 tabelas recriadas** com schema Lovable (drop + recreate); 2 preservadas (bookmarks, eixos_archive)
- **Dados migrados**: ~7100 rows do Lovable + 136 rows transformados da Marta (debunking + guiões)
- **Config actualizada**: `.env`, `config.toml`, workflow GitHub Actions, 5 scripts Python
- **Backup** dos dados originais da Marta em `scripts/marta_backup/` (5 ficheiros JSON)
- **SQL consolidado** das 38 migrations em `scripts/migration_consolidada.sql` (749 linhas)
- **Scripts auxiliares**: `scripts/migrate_data.py`, `scripts/switch_supabase.sh`

### Regra de merge aplicada
- Conflito por ID → ganha a instância com mais registos nessa tabela
- debunking (36) e guiões (100): dados da Marta, transformados para schema Lovable
- bookmarks (179→182): Lovable + 3 da Marta merged
- Tudo o resto: Lovable

---

## Padrões estabelecidos

- **Lovable:** em abandono desde 07/09/2026 (ver Crítico nº 4). Até ao corte, Marta envia
  sempre os prompts ela própria
- **claude.ai não escreve no repositório:** o `CONTEXT.md` que a janela do claude.ai lê está
  em Project Knowledge e é uma cópia só de leitura. O ficheiro vivo é
  `~/Documents/health-pulse-portugal/CONTEXT.md`, e só o Claude Code ou a Marta lá escrevem.
  As duas cópias divergirem foi o problema identificado a 14/08/2026
- **Claude Code:** usar para trabalho de código, scripts, commits (comando `claude`, a partir
  de `~/Documents/health-pulse-portugal`)
- **claude.ai:** estratégia, explicações, briefings entre sessões
- **Supabase:** duas instâncias até a transição fechar; confirmar sempre em qual se está a
  trabalhar antes de alterar dados. Agendamento (`pg_cron`) só via ficheiro de migração,
  nunca no dashboard — foi assim que o cron da instância antiga ficou invisível no repositório
  e continuou a copiar dados de Abril durante meses sem ser detectado
- **Recolha de dados:** uma falha de recolha nunca se escreve como valor. `NULL` + estado
  explícito, nunca `0` — um zero é indistinguível de um dado real e corrompe a série
- **GitHub commits:** via Claude Code (git normal)
- **Troca de sessão:** Claude actualiza CONTEXT.md + cria `docs/sessoes/YYYY-MM-DD.md`
- **Rigor científico:** documentar sempre a fonte e limitações metodológicas
- **Fontes peer-reviewed:** MSD Manuals, Acta Médica PT, RPMGF, SciELO, Cochrane
- **Benchmark negativo:** cada pseudociência tem link MSD como contra-narrativa
- **/sobre editável:** DB sobre_conteudo ganha sobre ficheiro sobreContent.ts
