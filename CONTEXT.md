# CONTEXT.md — Reportagem Viva / Diz que Disse
> Fonte de verdade do estado actual do projecto. Actualizado a cada sessão.
> Última actualização: 2026-04-12 (sessão 5)

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
- **Backend:** Supabase — instância **única** (migração concluída sessão 4):
  - **Produção (Marta):** `ijpxjpbjudaddfatibfl.supabase.co` — acessível no dashboard do Supabase
  - ~~**Lovable** (descontinuada): `cyjwhmuakmiytypewwfw.supabase.co`~~ — mantida como arquivo, frontend já não aponta para ela
- **Design:** Space Grotesk, azul `#0000FF`, magenta `#FF00FF`, fundo branco, sem sombras nem gradientes
- **Automatização:** GitHub Actions (workflow semanal), Python scripts em `scripts/`
- **Claude Code:** instalado localmente; alias `rv` → `cd ~/health-pulse-portugal && claude`

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

### 10 passos:
0. Ping Supabase — wake up da instância se pausada (sessão 5)
1. Google Trends PT (`scripts/5_fetch_google_trends.py`) → `keywords`
2. Perguntas pytrends (`scripts/6_fetch_health_questions.py`) → `health_questions` (source=pytrends)
3. Perguntas autocomplete (`scripts/7_fetch_autocomplete_questions.py`) → `health_questions` (source=autocomplete)
4. Refresh trends (Edge Function `refresh-trends`) → `historical_snapshots`
5. RSS feeds (Edge Function `fetch-rss-feeds`) → `news_items` (com `keyword_id` — sessão 5)
4B. Limpeza notícias antigas por eixo (`scripts/9_cleanup_old_news.py`) — sessão 5
6. YouTube (`scripts/4_fetch_youtube_trends.py`) → `youtube_trends`
7. Guiões semanais (Edge Function `generate-guioes-weekly`) → `guioes_semanais`
8. Arquivo semanal (Edge Function `archive-weekly`) → `eixos_archive` + `briefings_archive`

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

## Dashboard — Dados 100% Reais

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

## Pendentes

- [x] ~~Correr workflow manualmente para popular snapshots e guiões~~ (disparado 2026-03-27)
- [x] ~~Deploy edge functions novas no Supabase Lovable~~ (obsoleto — migração para Marta concluída)
- [x] ~~Migração colunas eixo/subcategoria nos bookmarks~~ (pedido ao Lovable 2026-03-27)
- [x] ~~Token GitHub revogado~~
- [x] ~~Preencher keyword_id nos registos do debunking~~ (35/35 linkados — sessão 3)
- [x] ~~Aplicar migração idx_news_items_date~~ (incluída na migração consolidada — sessão 4)
- [x] ~~Migração para Supabase da Marta~~ (concluída sessão 4 — 2026-04-12)
- [x] ~~Ping Supabase no workflow~~ (passo 0, wake up antes dos outros passos — sessão 5)
- [x] ~~Limpeza semanal de notícias por eixo~~ (`scripts/9_cleanup_old_news.py`, passo 4B — sessão 5)
- [x] ~~Debunking ordenado por data_publicacao DESC~~ (3 queries corrigidas — sessão 5)
- [x] ~~keyword_id no RSS fetch~~ (`fetch-rss-feeds/index.ts` agora insere keyword_id — sessão 5)
- [x] ~~Backfill keyword_id em news_items~~ (158/158 resolvidos, `scripts/10_backfill_news_keyword_id.py` — sessão 5)
- [x] ~~Sinónimos curtos adicionados~~ (menopausa, gripe aviária, microplásticos, TDAH — sessão 5)
- [x] ~~Channel ID Ordem dos Enfermeiros~~ (UCuDagVc79VVXXPFJurgXIiw adicionado — sessão 5)
- [x] ~~SPP Pediatria~~ (confirmado: canal não existe no YouTube — sessão 5)
- [ ] **CRÍTICO: actualizar variáveis de ambiente no Lovable** — `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` para `ijpxjpbjudaddfatibfl` — sem isto o frontend em produção (lovable.app) continua a ler da instância antiga
- [ ] Deploy edge functions no Supabase da Marta (generate-guioes-weekly, archive-weekly, fetch-rss-feeds, refresh-trends, generate-guiao-questions, generate-diz-que-disse, google-trends)
- [ ] `eixos_archive` vazia — será populada no próximo workflow semanal (segunda-feira 06:00 UTC)
- [ ] Actualizar /sobre bloco "fontes-de-dados": 16→44 feeds RSS, 36→56 canais YouTube, adicionar Google Autocomplete como fonte (via Lovable)
- [ ] Análise aos gráficos: verificar cálculo de `change_percent` em `5_fetch_google_trends.py` — confirmar coerência com /sobre, avaliar defensabilidade metodológica
- [ ] Saúdes.pt como fonte de curadoria manual de keywords e debunking (origem comercial Medis — a documentar)
- [ ] TED Talks / referências audiovisuais (Lado B — decisão adiada)
- [ ] Sazonalidade (precisa de 2+ anos de dados)

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
- **Claude Code:** usar para trabalho de código, scripts, commits (alias `rv`)
- **claude.ai:** estratégia, explicações, briefings entre sessões
- **Supabase (Marta):** instância única de produção; alterações via dashboard ou API com service_role key
- **GitHub commits:** via Claude Code (git normal)
- **Troca de sessão:** Claude actualiza CONTEXT.md + cria `docs/sessoes/YYYY-MM-DD.md`
- **Rigor científico:** documentar sempre a fonte e limitações metodológicas
- **Fontes peer-reviewed:** MSD Manuals, Acta Médica PT, RPMGF, SciELO, Cochrane
- **Benchmark negativo:** cada pseudociência tem link MSD como contra-narrativa
- **/sobre editável:** DB sobre_conteudo ganha sobre ficheiro sobreContent.ts
