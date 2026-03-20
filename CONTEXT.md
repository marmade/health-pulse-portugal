# CONTEXT.md — Reportagem Viva / Diz que Disse
> Fonte de verdade do estado actual do projecto. Actualizado a cada sessão.
> Última actualização: 2026-03-20

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

---

## Eixos Temáticos

| Código | Nome |
|---|---|
| `saude-mental` | Saúde Mental |
| `alimentacao` | Alimentação |
| `menopausa` | Menopausa |
| `emergentes` | Emergentes |

Amostra editorial (lado B): Saúde Mental, Alimentação, Menopausa.

---

## Tabelas Supabase (instância Lovable)

`keywords`, `health_questions`, `news_items`, `debunking`, `youtube_trends`, `historical_snapshots`, `app_settings`, `trends_cache`

### Keywords por eixo (contagem actual)
- `saude-mental`: **33** (era 23; +10 inseridas a 2026-03-20, baseadas no PNSM)
- `alimentacao`: —
- `menopausa`: —
- `emergentes`: —
- **Total activas:** 73 (aprox.)

---

## Automatização — GitHub Actions

**Workflow:** `youtube-trends.yml` — "Actualização Semanal — Reportagem Viva"
**Schedule:** Segundas-feiras 06:00 UTC (07:00 Lisboa) | Também disparo manual

### 5 passos em sequência:
1. **Google Trends PT** (`scripts/5_fetch_google_trends.py`) — 73 keywords → `current_volume`, `change_percent`, `trend` na tabela `keywords`. Demora ~15 min.
2. **Perguntas de saúde** (`scripts/6_fetch_health_questions.py`) — `pytrends.related_queries()` → tabela `health_questions`
3. **Refresh trends** (Edge Function `refresh-trends`) — snapshots históricos
4. **RSS feeds** (Edge Function `fetch-rss-feeds`) — 15 feeds portugueses (Público, RTP, Observador, DGS, Polígrafo, etc.)
5. **YouTube** (`scripts/4_fetch_youtube_trends.py`) — 4 queries compostas por eixo (~400 unidades quota/run); secret `YOUTUBE_API_KEY` no GitHub

**Run #6:** disparado manualmente a 16/03/2026.

**Como verificar:** https://github.com/marmade/health-pulse-portugal/actions — confirmar ✅ verde nos 5 passos.

---

## Estado do Admin (auditoria completa)

### Tabs confirmadas
| Tab | Estado |
|---|---|
| KEYWORDS | ✅ OK |
| DEBUNKING | ✅ OK |
| TEXTOS | ✅ OK |
| GUIÕES | ✅ OK |
| PLATAFORMA | ✅ OK |
| SOBRE | ✅ OK — 11 blocos todos "Guardado" no Supabase (zero Fallback) |
| BOOKMARKS | ✅ Auditado — `comunicacao_cientifica` adicionado ao `BOOKMARK_CATEGORIAS`; 30 registos corrigidos |
| NOTÍCIAS | ✅ Bug Select corrigido — `normalizeToAxis()` mapeia termos para eixos + mostra termo original |

---

## Benchmark Page

- Dois componentes: *Benchmark +* (referências positivas) e *Benchmark −* (contra-exemplos)
- Layout: duas colunas (+ esquerda, − direita)
- Cor de fundo dos cards condicional: azul para +, magenta para −
- Filtros: TODOS (reset global) → NACIONAL/INTERNACIONAL (1.º nível) → PORTAIS/PERSONAS (sub-filtros aditivos)
- Tipografia: sem uppercase nos nomes, `font-semibold`, sem bullet points em col3/col4, tamanho reduzido

---

## Pendentes

### Opcional / baixa prioridade
- 🔲 Limpar `news_items` com matches espúrios anteriores a 2026-03-20
- 🔲 Feeds RSS institucionais curados com eixo directo

### A confirmar na próxima segunda-feira (06:00 UTC)
- 🔲 Confirmar que as 10 novas keywords de saúde mental (inseridas 2026-03-20) aparecem com volumes no próximo run do workflow

---

## Padrões estabelecidos

- **Lovable:** Marta envia sempre os prompts ela própria — Claude prepara o texto mas nunca digita nem clica enviar
- **Supabase via browser:** POST/PATCH via `fetch` no console do browser; aba admin deve estar activa
- **GitHub commits:** Via Contents API (`PUT .../contents/<path>`) com PAT — buscar SHA actual primeiro; PAT deve ser revogado imediatamente após uso
- **shadcn/Radix:** `[role="combobox"]` é o selector correcto para Selects; opções só estão no DOM quando o dropdown está aberto
- **Google Docs:** `fetch()` para `/export?format=txt` via console, retrieval em chunks via `window._chunks[]`
- **Troca de sessão:** Claude avisa sempre e envia briefing resumido para copiar
- **Sessões:** Quando Marta dá briefing, Claude actualiza CONTEXT.md (estado actual) e cria `docs/sessoes/YYYY-MM-DD.md` (log histórico imutável)
