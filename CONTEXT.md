# CONTEXT.md — Reportagem Viva / Diz que Disse
> Ficheiro de memória vivo do projecto. Actualizado no início/fim de cada sessão de trabalho com IA.
> Log histórico por sessão: docs/sessoes/YYYY-MM-DD.md

---

## Última actualização: 20/03/2026

---

## Estado actual

### Workflow de automatização
- GitHub Actions: `youtube-trends.yml` — corre segundas 06:00 UTC, trigger manual disponível
- 5 passos em sequência:
  1. Google Trends PT (`scripts/5_fetch_google_trends.py`) — volumes reais 73 keywords → Supabase
  2. Perguntas em crescimento (`scripts/6_fetch_health_questions.py`) → tabela `health_questions`
  3. Refresh trends — Edge Function `refresh-trends` → snapshots históricos
  4. RSS feeds — Edge Function `fetch-rss-feeds` → 15 feeds portugueses
  5. YouTube (`scripts/4_fetch_youtube_trends.py`) — v4, 36 canais PT curados, 4 queries por eixo
- Run #9 disparado 20/03/2026 — passo 1 ✅ passo 2 🔄 passos 3-5 ⏳

### Dashboard (Lado A — Reportagem Viva)
- Preview: https://preview--health-pulse-pt.lovable.app/
- Admin: /admin (password: healthpulse2026)
- Eixos: Saúde Mental, Alimentação, Menopausa, Emergentes
- Vista eixo individual: bloco Health Questions + YouTube escondido quando `activeAxis !== 'all'` (Opção B aplicada)

### Pendentes Lovable (prompts preparados, ainda não enviados)
- **PROMPT 1** — Layout 2×2 na vista de eixo individual:
  - Linha 1: TrendChart (esq.) | Keywords/Top5 (dir.)
  - Linha 2: Perguntas de Saúde (esq.) | Alertas de Pesquisa (dir.)
  - Ficheiros: `src/components/AxisColumn.tsx` (props `hideChart`/`hideKeywords`) + `src/pages/Index.tsx`
- **PROMPT 2** — Filtrar SearchAlerts pelo eixo activo:
  - `axisAlerts` filtra por `a.axisLabel === filteredData[activeAxis]?.label`

### Pendentes gerais
- Audit admin tab BOOKMARKS (não feito)
- Bug: NOTÍCIAS eixo temático Select não pré-preenche no edit
- 5 blocos SOBRE ainda como "Fallback" (guardar no Supabase antes do launch)

---

## Identidade do Projecto

- **Nome:** Reportagem Viva / Diz que Disse
- **Repositório:** github.com/marmade/health-pulse-portugal
- **Lovable project ID:** 69209c37-6f9e-4a84-bea9-8e56d0eace5a
- **Autora:** Marta (mestranda em Comunicação de Ciência, FCSH-UNL, nº 2024110168)

---

## Missão
Plataforma de monitorização de narrativas de saúde em Portugal. Os dados do Lado A (Reportagem Viva) informam os outputs do Lado B (Diz que Disse — editorial de comunicação científica). Amostra editorial em 3 eixos: Saúde Mental, Alimentação, Menopausa.

---

## Arquitectura

### Lado A — Dashboard
4 eixos: Saúde Mental | Alimentação | Menopausa | Emergentes

- Supabase Lovable: `cyjwhmuakmiytypewwfw.supabase.co`
- Supabase manual (Marta): `ijpxjpbjudaddfatibfl.supabase.co` (não tem tabelas dos scripts)
- Tabelas: keywords, health_questions, news_items, debunking, youtube_trends, historical_snapshots, app_settings, trends_cache, eixos_archive, revisao_pares
- Edge Functions: `refresh-trends`, `fetch-rss-feeds`

### Lado B — Editorial Diz que Disse
- Formato vídeo estilo Vox Pop, handle @roevbros
- Duo científico em frente à câmara (revisão de pares)
- Distribuição: Instagram / TikTok / YouTube

---

## Stack Técnico
- Frontend: Vite + React + TypeScript + Tailwind + shadcn/ui (Lovable)
- Backend: Supabase
- Automatização: GitHub Actions + Python scripts
- YouTube API v3: quota 10.000/dia, ~400 unidades/run (v4)

---

## Design Language
- Cores: Azul `#0000FF` + Magenta `#FF00FF` sobre fundo branco
- Tipografia: Space Grotesk (monospace para dados)
- Sem sombras, sem gradientes

---

## Estrutura Editorial (Lado B)
- Menu principal: REPORTAGEM VIVA | BOOKMARKS | BENCHMARK | TEXTOS | PLATAFORMA | SOBRE
- EditorialSubNav: GUIÕES | REVISÃO DE PARES | TEXTOS | BOOKMARKS
- Páginas com SubNav: Guioes, Bookmarks, Benchmark, RevisaoPares

---

## Scripts Python
- `4_fetch_youtube_trends.py` — v4, 36 canais PT, 1 query por eixo (4 total)
- `5_fetch_google_trends.py` — is_emergent auto (change >= 50 e current >= 10)
- `6_fetch_health_questions.py` — expandir_mural() adiciona termos novos

---

## Componentes chave
- `EditorialSubNav.tsx` — segunda linha de menu Editorial
- `eixoPdfExport.ts` — exporta PDF por eixo/semana
- `RevisaoPares.tsx` — revisão de pares com cards por eixo
- `AxisColumn.tsx` — receberá props `hideChart`/`hideKeywords`
- `SearchAlerts.tsx` — será filtrado por eixo activo

---

## Notas técnicas
- Commits via GitHub web editor ou Contents API (PAT clássico, scope `repo`)
- Lovable: descrever problema visual, não código; DOM inspection com `querySelectorAll` antes de escrever prompts
- Selects shadcn/Radix: selector `[role="combobox"]`; opções só no DOM quando dropdown aberto
- Google Docs: fetch via `/export?format=txt`
- Resumos: `docs/sessoes/YYYY-MM-DD.md` (histórico); `CONTEXT.md` (estado vivo)

---

## Histórico de decisões

| Data | Decisão |
|------|---------|
| — | Nome "Passa-Palavra" rejeitado |
| — | Nome final: Reportagem Viva / Diz que Disse |
| — | Admin fora do menu, acesso por URL directo |
| — | RLS Supabase actualizado para CRUD |
| Mar 2026 | YouTube v4: 36 canais PT, 4 queries (~95% redução quota) |
| 20/03/2026 | Estrutura `docs/sessoes/` criada para logs históricos |

---

*Actualizado pelo Claude no fim de cada sessão*
