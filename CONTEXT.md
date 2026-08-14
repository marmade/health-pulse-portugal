# CONTEXT.md — Reportagem Viva / Diz que Disse
> Fonte de verdade do estado actual do projecto. Actualizado a cada sessão.
> Última actualização: 2026-08-14 (sessão 8)
> Incidente em curso desde Maio/2026 — ver `AUDIT.md` para o diagnóstico completo.

---

## Verificações

> Cada linha diz o que foi verificado, quando e como. Afirmação sem método é suposição.
> Antes de agir sobre qualquer destas linhas, confirma a data: verificação com mais de um mês não é estado actual.

| Afirmação | Data | Método | Resultado |
|---|---|---|---|
| Instância `ijpxjpbjudaddfatibfl` está viva e recebe escrita do workflow | 14/08/2026 | Contagem REST de `historical_snapshots` | 3462 linhas, data máxima 10/08/2026 |
| Passo 3 (`refresh-trends`) escreve na instância nova todas as segundas | 14/08/2026 | +164 linhas desde 29/07 = 2 × 82 keywords (inferência aritmética) | Confirmado, com inferência assinalada |
| `refresh-trends` copia `current_volume` sem validar | 14/08/2026 | Leitura directa de `supabase/functions/refresh-trends/index.ts` | Confirmado; insert único e atómico, resposta 200 conta linhas preparadas, não gravadas |
| Escrita anónima via REST bloqueada por RLS | 13/08/2026 | POST com chave anon a duas tabelas | HTTP 401, Postgres 42501. **Só duas tabelas testadas** |
| Escrita via Edge Function | — | Não testado | Em aberto. `verify_jwt = false` confirmado na instância nova; desconhecido na antiga |
| RLS de `contactos_projecto` | — | Não testado | Em aberto. Única tabela com dados pessoais |
| Edge Functions deployadas na instância nova | 14/08/2026 | MCP Supabase `list_edge_functions` | 5 activas: `refresh-trends`, `archive-weekly`, `generate-guioes-weekly`, `google-trends`, `fetch-rss-feeds` |
| Edge Functions em falta | 14/08/2026 | MCP + POST a `generate-diz-que-disse` | `generate-diz-que-disse` e `generate-guiao-questions` (HTTP 404) |
| Código das funções em produção | 14/08/2026 | MCP: todas em versão 1, deploy 28/07/2026 17:20–17:27 | Nunca redeployadas. Alterações no repositório desde 28/07 NÃO estão em produção |
| `VITE_PERPLEXITY_API_KEY` existe como secret na instância nova | 14/08/2026 | Painel Supabase (verificado pela Marta) | Existe, criada 12/04/2026. Sem função deployada que a leia |
| `6_fetch_health_questions.py` usa `pytrends` e pode falhar em silêncio | — | Não verificado | Em aberto. Mesma exposição a HTTP 429 do script de Trends |

---

## Projecto

**Reportagem Viva** — dashboard de monitorização de narrativas de saúde em Portugal (lado A)
**Diz que Disse** — editorial de comunicação de ciências da saúde (lado B)

- Lovable preview: https://preview--health-pulse-pt.lovable.app/
- Admin: https://preview--health-pulse-pt.lovable.app/admin (password: healthpulse2026)
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

> **Ressalva.** O princípio de zero mock data mantém-se no código, mas nenhuma das duas
> instâncias tem hoje uma série de trends fiável, e por razões diferentes:
>
> - **Antiga (`cyjwhmuakmiytypewwfw`) — congelada.** Dados de trends reais até **30/04/2026**;
>   a partir de 01/05, 82 de 82 keywords repetem o último valor sem sinal real. É esta a
>   instância que o site publicado lê, e ela apresenta valores parados como se fossem actuais.
> - **Nova (`ijpxjpbjudaddfatibfl`) — contaminada por zeros.** Desde a retoma do workflow
>   (03/08), as falhas de recolha entram na série como `0`, indistinguíveis de interesse
>   nulo real.
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

---

## Prioridades — decisão de 2026-08-13

**Prioridade à Reportagem Viva (lado A). Lado B em pausa deliberada.** O lado B não recebe
conteúdo novo há meses — `guioes` desde 09/03/2026, `debunking` desde 25/03/2026 — e essa
pausa passa a ser explícita, não acidental: enquanto a série de trends não for defensável,
o esforço vai todo para o lado A. Reavaliar quando os pendentes críticos estiverem fechados.

## Pendentes

### Críticos — por esta ordem (13/08/2026)

A ordem é deliberada: cada item depende do anterior, ou é mais urgente do que ele.

1. [ ] **Verificar RLS de `contactos_projecto`.** Dados pessoais; única tabela por testar.
   Determina a gravidade real da chave exposta no repositório
2. [ ] **Exportar dados da instância antiga**, antes de qualquer desligamento —
   `historical_snapshots` até 30/04/2026 (única fatia real) e `news_items` na íntegra.
   Leitura confirmada possível a 13/08/2026
3. [ ] **Importar esses dados para a instância nova**, preenchendo o vazio entre 12/04/2026
   e a retoma do workflow, na medida do possível
4. [ ] **Actualizar `.env` e env vars do Lovable** para `ijpxjpbjudaddfatibfl`
5. [ ] **Cortar a ligação Lovable Cloud↔Supabase.** Enquanto estiver activa, o editor visual
   pode alterar o `.env` sem aviso e desfazer o item 4
6. [ ] **`NULL` + `collection_status` no script de Trends** (`5_fetch_google_trends.py`) —
   parar de escrever `0` em falhas de recolha. Cada semana que o workflow corre sem isto
   acrescenta zeros falsos à série da instância oficial
7. [ ] **Substituir `pytrends` por `trendspy` + backoff** (`AUDIT.md` secção 2) — ataca a
   causa das falhas que o item 6 passa a registar honestamente

### Restantes

- [ ] **Corrigir o `.gitignore` para excluir o `.env` — obrigatoriamente ANTES do item 4 dos
      Críticos** (actualizar o `.env` com as credenciais da instância nova). Se o ficheiro
      continuar versionado quando lá forem escritas as credenciais da instância viva, essas
      credenciais vão parar a um repositório público. Tirar do tracking agora não as remove
      do histórico — o que lá está exposto continua exposto —, mas impede que as novas lá
      entrem. Ordem correcta: `.gitignore` → `git rm --cached .env` → só depois escrever as
      credenciais novas.
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
- [ ] `.env` fora do `.gitignore` e versionado — higiene, sujeito a confirmação do RLS de
      `contactos_projecto`: se essa tabela não estiver protegida, a chave exposta dá acesso
      a dados pessoais
- [ ] `eixos_archive` vazia — será populada no próximo workflow semanal (segunda-feira 06:00 UTC)
- [ ] Actualizar /sobre bloco "fontes-de-dados": 16→44 feeds RSS, 36→56 canais YouTube, adicionar Google Autocomplete como fonte (via Lovable)
- [ ] Análise aos gráficos: verificar cálculo de `change_percent` em `5_fetch_google_trends.py` — confirmar coerência com /sobre, avaliar defensabilidade metodológica
- [ ] Saúdes.pt como fonte de curadoria manual de keywords e debunking (origem comercial Medis — a documentar)
- [ ] TED Talks / referências audiovisuais (Lado B — decisão adiada)
- [ ] Sazonalidade (precisa de 2+ anos de dados)

### Concluídos

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

- **Lovable:** Marta envia sempre os prompts ela própria
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
