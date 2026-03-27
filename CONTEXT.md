# CONTEXT.md — Reportagem Viva / Diz que Disse
> Fonte de verdade do estado actual do projecto. Actualizado a cada sessão.
> Última actualização: 2026-03-27

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
  - **Lovable** (gerida pelo Lovable): `cyjwhmuakmiytypewwfw.supabase.co` — NÃO aparece no dashboard da Marta; alterações só via prompts Lovable ou migrations
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

### Tabelas completas
`keywords`, `health_questions`, `news_items`, `debunking`, `youtube_trends`, `historical_snapshots`, `app_settings`, `trends_cache`

### Tabelas — Lado B
`revisao_pares`, `contactos_projecto`

### health_questions — schema actual
```
id, question, growth_percent, relative_volume, axis, axis_label,
cluster, is_question, keyword_id, updated_at,
source (TEXT DEFAULT 'pytrends'),        ← adicionado 2026-03-27
last_seen_at (TIMESTAMPTZ DEFAULT now()) ← adicionado 2026-03-27
```
**Constraint única:** `health_questions_question_axis_source_key` → `(question, axis, source)`

### Valores de source
- `"pytrends"` — script 6, co-ocorrências em crescimento
- `"autocomplete"` — script 7, queries reais do Google Autocomplete

### Keywords por eixo
- `saude-mental`: 33 | Total activas: 83

---

## Automatização — GitHub Actions

**Workflow:** `youtube-trends.yml` — "Actualização Semanal — Reportagem Viva"
**Schedule:** Segundas-feiras 06:00 UTC (07:00 Lisboa) | Também disparo manual

### 6 passos:
1. Google Trends PT (`scripts/5_fetch_google_trends.py`) → `keywords`
2. Perguntas pytrends (`scripts/6_fetch_health_questions.py`) → `health_questions` (source=pytrends)
3. Perguntas autocomplete (`scripts/7_fetch_autocomplete_questions.py`) → `health_questions` (source=autocomplete)
4. Refresh trends (Edge Function `refresh-trends`) → snapshots históricos
5. RSS feeds (Edge Function `fetch-rss-feeds`) → 15 feeds portugueses
6. YouTube (`scripts/4_fetch_youtube_trends.py`) — 4 queries compostas por eixo

---

## Estado do Admin

| Tab | Estado |
|---|---|
| KEYWORDS | ✅ 83 keywords |
| DEBUNKING | ✅ 35 registos |
| NOTÍCIAS | ✅ Bug Select eixo corrigido |
| TEXTOS | ✅ OK |
| GUIÕES | ✅ OK |
| PLATAFORMA | ✅ OK |
| SOBRE | ✅ 11 blocos todos "Guardado" |
| BOOKMARKS | ✅ `comunicacao_cientifica` adicionado |
| BENCHMARK | ✅ OK |
| REVISAO PARES | ✅ Tabela criada; formulário funcional |

---

## Pendentes

- 🔲 Correr script 7 manualmente (Claude Code) e verificar dados reais
- 🔲 Correr script 6 manualmente e verificar filtro de ruído em acção
- 🔲 Decidir como o dashboard distingue as duas fontes (source) ao utilizador
- 🔲 Preencher `keyword_id` nos 35 registos do `debunking`
- 🔲 Mito da semana automático — match por `keyword_id` com top keywords trending

---

## Padrões estabelecidos

- **Lovable:** Marta envia sempre os prompts ela própria
- **Claude Code:** usar para trabalho de código, scripts, commits (alias `rv`)
- **claude.ai:** estratégia, explicações, briefings entre sessões
- **Supabase via browser:** POST/PATCH via `fetch` no console; aba admin deve estar activa
- **GitHub commits:** via Claude Code (git normal) ou GitHub Contents API com PAT (revogar imediatamente)
- **Troca de sessão:** Claude avisa sempre e envia briefing; actualiza CONTEXT.md + cria `docs/sessoes/YYYY-MM-DD.md`
- **Rigor científico:** documentar sempre a fonte e limitações metodológicas de cada métrica
