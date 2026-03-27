# CONTEXT.md — Reportagem Viva / Diz que Disse
> Fonte de verdade do estado actual do projecto. Actualizado a cada sessão.
> Última actualização: 2026-03-27 (sessão 2)

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
- **Backend:** Supabase — duas instâncias DISTINTAS:
  - **Lovable** (gerida pelo Lovable): `cyjwhmuakmiytypewwfw.supabase.co` — NÃO aparece no dashboard da Marta; alterações só via prompts Lovable, migrations, ou API com anon key
  - **Manual (Marta)**: `ijpxjpbjudaddfatibfl.supabase.co` — única acessível directamente no dashboard do Supabase
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
| RSS feeds | 42 | Media geral, media saúde, institucional, nutrição, sociedades científicas, ONG, farmacêutica, divulgação, fact-check |
| YouTube canais | 55 | Media, institucional, sociedades, hospitais, academia, ONG, fact-check, internacional |
| Bookmarks referência | 76 | Todas as sociedades médicas AJOMED + institucionais + ONG |
| Fontes peer-reviewed | 5 | MSD Manuals, Acta Médica Portuguesa, RPMGF, SciELO PT, Cochrane |

---

## Automatização — GitHub Actions

**Workflow:** `youtube-trends.yml` — "Actualização Semanal — Reportagem Viva"
**Schedule:** Segundas-feiras 06:00 UTC (07:00 Lisboa) | Também disparo manual

### 7 passos:
1. Google Trends PT (`scripts/5_fetch_google_trends.py`) → `keywords`
2. Perguntas pytrends (`scripts/6_fetch_health_questions.py`) → `health_questions` (source=pytrends)
3. Perguntas autocomplete (`scripts/7_fetch_autocomplete_questions.py`) → `health_questions` (source=autocomplete)
4. Refresh trends (Edge Function `refresh-trends`) → `historical_snapshots`
5. RSS feeds (Edge Function `fetch-rss-feeds`) → `news_items`
6. YouTube (`scripts/4_fetch_youtube_trends.py`) → `youtube_trends`
7. Guiões semanais (Edge Function `generate-guioes-weekly`) → `guioes_semanais`
8. Arquivo semanal (Edge Function `archive-weekly`) → `eixos_archive` + `briefings_archive`

### Edge Functions
| Nome | Função |
|---|---|
| `refresh-trends` | Cria snapshots históricos (sem alterar volumes) |
| `fetch-rss-feeds` | Recolhe notícias de 42 RSS feeds |
| `archive-weekly` | Arquiva 4 eixos + briefing |
| `generate-guioes-weekly` | Gera guiões dos 4 eixos (5 banco + 5 IA) |
| `generate-guiao-questions` | Gera perguntas IA via Perplexity Sonar |
| `generate-diz-que-disse` | Gera conteúdo Diz que Disse para briefing |

---

## Dashboard — Dados 100% Reais

- **Zero mock data** — eliminados Math.random, kwPeriodMult, mock fallbacks
- **Gráficos**: `historical_snapshots` via `buildTrend.ts`, média ponderada por volume
- **Volumes por período**: recalculados via snapshots (7d/30d/12m)
- **Alertas**: thresholds 30% (7d), 50% (30d), 40% (12m) + emergentes automáticos
- **Ranking urgência**: "Prioridade de comunicação esta semana" no overview e briefing

---

## Estado do Admin

| Tab | Estado |
|---|---|
| KEYWORDS | ✅ 83 keywords |
| DEBUNKING | ✅ 36 registos |
| NOTÍCIAS | ✅ OK |
| TEXTOS | ✅ OK |
| GUIÕES | ✅ OK — geração automática semanal |
| PLATAFORMA | ✅ OK |
| SOBRE | ✅ Editável — DB ganha sobre ficheiro (base limpa) |
| BOOKMARKS | ✅ 76 referências + 6 categorias + badges eixo |
| BENCHMARK | ✅ Verificado — personas + pseudociência + MSD links |
| REVISÃO PARES | ✅ OK |

---

## Pendentes

- [x] ~~Correr workflow manualmente para popular snapshots e guiões~~ (disparado 2026-03-27)
- [ ] Deploy edge functions novas no Supabase Lovable (generate-guioes-weekly, archive-weekly)
- [x] ~~Migração colunas eixo/subcategoria nos bookmarks~~ (pedido ao Lovable 2026-03-27)
- [x] ~~Token GitHub revogado~~
- [ ] Channel IDs em falta: SPP (Pediatria), Ordem dos Enfermeiros
- [ ] Migração para Supabase da Marta (quando for para produção)
- [ ] TED Talks / referências audiovisuais (Lado B — decisão adiada)
- [ ] Sazonalidade (precisa de 2+ anos de dados)
- [ ] Preencher keyword_id nos registos do debunking

---

## Padrões estabelecidos

- **Lovable:** Marta envia sempre os prompts ela própria
- **Claude Code:** usar para trabalho de código, scripts, commits (alias `rv`)
- **claude.ai:** estratégia, explicações, briefings entre sessões
- **Supabase Lovable:** alterações de dados via API com anon key; DDL via prompts Lovable
- **GitHub commits:** via Claude Code (git normal)
- **Troca de sessão:** Claude actualiza CONTEXT.md + cria `docs/sessoes/YYYY-MM-DD.md`
- **Rigor científico:** documentar sempre a fonte e limitações metodológicas
- **Fontes peer-reviewed:** MSD Manuals, Acta Médica PT, RPMGF, SciELO, Cochrane
- **Benchmark negativo:** cada pseudociência tem link MSD como contra-narrativa
- **/sobre editável:** DB sobre_conteudo ganha sobre ficheiro sobreContent.ts
