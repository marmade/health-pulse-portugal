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

---

## Modelo de Dados — Lado A (Reportagem Viva)

**`keywords` é o elemento central** — todas as tabelas de monitorização ligam a ela via `keyword_id` (FK, nullable).

```
keywords (central)
    ↓ keyword_id (FK, nullable)
├── debunking        + eixo, explicacao, data_publicacao
├── news_items
├── youtube_trends
└── health_questions
```

### Tabelas completas
`keywords`, `health_questions`, `news_items`, `debunking`, `youtube_trends`, `historical_snapshots`, `app_settings`, `trends_cache`

### Tabelas — Lado B
`revisao_pares`, `contactos_projecto`

### Keywords por eixo
- `saude-mental`: **33** (+10 inseridas a 2026-03-20, baseadas no PNSM)
- Total activas: **83**

---

## Automatização — GitHub Actions

**Workflow:** `youtube-trends.yml` — "Actualização Semanal — Reportagem Viva"
**Schedule:** Segundas-feiras 06:00 UTC (07:00 Lisboa) | Também disparo manual

### 5 passos:
1. Google Trends PT (`scripts/5_fetch_google_trends.py`) — 83 keywords → `current_volume`, `change_percent`, `trend`
2. Perguntas de saúde (`scripts/6_fetch_health_questions.py`) → `health_questions`
3. Refresh trends (Edge Function `refresh-trends`) — snapshots históricos
4. RSS feeds (Edge Function `fetch-rss-feeds`) — 15 feeds portugueses
5. YouTube (`scripts/4_fetch_youtube_trends.py`) — 4 queries compostas por eixo

**Verificar:** https://github.com/marmade/health-pulse-portugal/actions

---

## Estado do Admin

| Tab | Estado |
|---|---|
| KEYWORDS | ✅ 83 keywords |
| DEBUNKING | ✅ 35 registos; Select `keyword_id` + auto-fill `eixo` + `explicacao` + `data_publicacao` |
| NOTÍCIAS | ✅ Bug Select eixo corrigido; Select `keyword_id` adicionado |
| TEXTOS | ✅ OK |
| GUIÕES | ✅ OK |
| PLATAFORMA | ✅ OK |
| SOBRE | ✅ 11 blocos todos "Guardado" (zero Fallback) |
| BOOKMARKS | ✅ `comunicacao_cientifica` adicionado; 30 registos corrigidos |
| BENCHMARK | ✅ OK |
| REVISAO PARES | ✅ Tabela criada; formulário funcional; toggle "Modo Apresentação" |

---

## Páginas — Lado B (Diz que Disse)

### `/editorial/bookmarks`
- Cards com `bg-white`

### `/revisao-pares`
- 4 cards de eixo: fundo branco, sem linha azul grossa à esquerda
- Perfil A + Perfil B: Nome, Especialidade/Cargo, Email (ícone `mailto:` na mesma linha do cargo), Telefone, Link, Bio
- Sumário do Eixo
- **Comunidade Científica** — cor `#f2fcfa`
- **Agentes de Trabalho** — cor `#ede8ff`
- Tabela `contactos_projecto`: `tipo`, `nome`, `especialidade`, `email`, `telefone`, `link`, `bio`
- Toggle "Modo Apresentação" no admin — oculta email e telefone em toda a página

### `/briefing`
- Mito da semana: carrega dinamicamente da `debunking` (mais recente); fallback "Sem mito registado esta semana"
- Badges de eixo — aguardam fix: `font-bold text-[8px] px-1.5 py-0.5 rounded-sm` sem `opacity-50`
- "SINAIS EMERGENTES" (era "SINAL DE ALERTA") — aguarda deploy

---

## Pendentes

### Enviados ao Lovable, aguardam confirmação
- 🔲 `/briefing` — voxpop 3→5 perguntas, layout coluna única, `text-xs`, PDF completo
- 🔲 `/briefing` — badges de eixo corrigidos
- 🔲 `/briefing` — "SINAIS EMERGENTES" + remover badge EMERGENTE por linha

### A implementar
- 🔲 Mito da semana automático — match por `keyword_id` com top keywords trending (prompt pronto)
- 🔲 Admin — formulários `youtube_trends` e `health_questions` (quando criados, adicionar Select `keyword_id`)
- 🔲 Preencher `keyword_id` nos 35 registos existentes do `debunking`
- 🔲 Confirmar segunda-feira (06:00 UTC) — 83 keywords com volumes no workflow

### Opcional
- 🔲 Limpar `news_items` com matches espúrios anteriores a 2026-03-20
- 🔲 Feeds RSS institucionais curados com eixo directo

---

## Padrões estabelecidos

- **Lovable:** Marta envia sempre os prompts ela própria
- **Supabase via browser:** POST/PATCH via `fetch` no console; aba admin deve estar activa
- **GitHub commits:** `api.github.com` fora da allowlist do proxy — usar Claude in Chrome ou commit manual; PAT a revogar imediatamente após uso
- **Badges de eixo (design system):** `inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm`
- **Troca de sessão:** Claude avisa sempre e envia briefing; actualiza CONTEXT.md + cria `docs/sessoes/YYYY-MM-DD.md`
