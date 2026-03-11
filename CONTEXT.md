## Sessão — Março 2026: YouTube Trends + Automação GitHub Actions

### O que foi construído

**Coluna "Tendências YouTube"** — nova secção no dashboard, coluna direita da área "Perguntas de Saúde em Crescimento":
- Componente `YouTubeTrendsPanel` criado via Lovable
- Tabela `youtube_trends` criada automaticamente pelo Lovable no Supabase (`cyjwhmuakmiytypewwfw`)
- Estrutura da tabela: `id, titulo, canal, views, url, eixo, data_publicacao, thumbnail_url, created_at`
- O dashboard lê: `youtube_trends?select=*&order=views.desc&limit=15`
- Visual final: thumbnail + título clicável + canal + eixo temático + views formatadas
- [DECISÃO] Thumbnails mantidas — ficam mais ricas visualmente

**Script Python** — `scripts/4_fetch_youtube_trends.py` (na raiz do repositório, pasta `scripts/`):
- Lê as 73 keywords activas do Supabase
- Faz pesquisa na YouTube Data API v3
- Escreve top vídeos em `youtube_trends`
- Execução manual: `python3 4_fetch_youtube_trends.py A_CHAVE_YOUTUBE`

**GitHub Actions** — automação semanal:
- Ficheiro: `.github/workflows/youtube-trends.yml`
- Corre todas as segundas-feiras às 06:00 UTC (cron: `0 6 * * 1`)
- Também pode ser disparado manualmente (workflow_dispatch)
- YouTube API key guardada como secret no repositório: `YOUTUBE_API_KEY`
- Testado e confirmado: **Status Success** (51s) ✅

### Problema encontrado e resolvido
O ficheiro `.github/workflows/youtube-trends.yml` foi inicialmente criado dentro de `scripts/` em vez da raiz — o GitHub não reconhecia o workflow. Corrigido criando o ficheiro no caminho correcto via URL directa do GitHub.

### Aviso menor
O workflow mostra 1 warning: `actions/checkout@v3` e `actions/setup-python@v4` usam Node.js 20 que está deprecated. Não afecta funcionamento actual mas convém actualizar para `@v4` / `@v5` numa próxima sessão.

# CONTEXT.md — Reportagem Viva
> Ficheiro de memória do projeto para continuidade entre sessões de trabalho com IA.
> Atualizar no final de cada sessão relevante.

---

## Identidade do Projeto

- **Nome:** Reportagem Viva
- **Repositório:** github.com/marmade/health-pulse-portugal
- **Autora:** Marta (mestranda em Comunicação de Ciência, FCSH-UNL, nº 2024110168)
- **Orientador:** Alexandre Duarte
- **Lançamento previsto:** Outubro 2026 — Mês da Saúde Mental
- **Contexto académico:** Projeto de tese de mestrado sobre monitorização de desinformação em saúde

---

## Missão

Plataforma de monitorização de desinformação em saúde, com camadas editoriais e arquivísticas. Combina investigação, comunicação de ciência e ferramentas digitais para combater a desinformação.

---

## Arquitetura — 3 Camadas

### 1. Dashboard Privado de Monitorização
Painel interno com 4 eixos temáticos:
- **Saúde Mental**
- **Alimentação**
- **Menopausa**
- **Emergentes**

**Backend:** Supabase
- Tabelas: keywords, debunking entries, news items, snapshots
- 2 Edge Functions:
  - `refresh-trends` 
  - `fetch-rss-feeds` (cobre 13 feeds portugueses)

**Navegação do dashboard (2 linhas de menu):**
- Linha 1 — editorial (topo direito): `TEXTOS` | `SOBRE`
- Linha 2 — dashboard: `OVERVIEW` / `SAÚDE MENTAL` / `ALIMENTAÇÃO` / `MENOPAUSA` / `EMERGENTES` / `BRIEFING`

**Páginas existentes:**
- `/textos` — placeholder criado
- `/sobre` — inclui agradecimentos a: António Granado, Matilde Gonçalves, Luís Veríssimo, Ana Sanchez, Joana Lobo Antunes, António Gomes da Costa
- `/admin` — painel completo, fora do menu principal, acessível diretamente por URL
  - Autenticação por password: `healthpulse2026`
  - 3 tabs CRUD: Keywords / Debunking / Notícias
  - Ligado ao Supabase com RLS atualizado

### 2. Diz que Disse
- Formato vídeo estilo Vox Pop
- Handle: `@roevbros`
- Duo científico em frente à câmara
- Distribuição: Instagram / TikTok / YouTube

### 3. Bom Saber! *(futuro)*
- App arquivo consultável pelo público
- Em desenvolvimento/planeamento

---

## Stack Técnico

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Vite + React + TypeScript |
| UI Components | shadcn/ui |
| Backend/DB | Supabase |
| Edge Functions | Supabase Edge Functions |

---

## Design Language

- **Cor principal:** Azul `#0000FF` sobre fundo branco
- **Tipografia:** Space Grotesk
- **Estilo:** Minimalista editorial
- **Regras:** Sem sombras, sem gradientes

---

## Decisões & Histórico Relevante

| Data aprox. | Decisão / Evento |
|-------------|-----------------|
| — | Nome "Passa-Palavra" rejeitado — conflito com Festival Passa a Palavra |
| — | Nome final: Reportagem Viva |
| — | Admin panel implementado fora do menu principal, acesso direto por URL |
| — | RLS do Supabase atualizado para suportar as operações CRUD do admin |
| — | 13 feeds RSS portugueses integrados na Edge Function fetch-rss-feeds |

---

## Para Atualizar Aqui

No final de cada sessão de trabalho relevante, pedir ao Claude:
> *"Faz um resumo desta conversa para adicionar ao CONTEXT.md — decisões tomadas, raciocínios importantes, estado atual."*

Copiar o output para este ficheiro e fazer commit.

---

*Última atualização: Março 2026 — gerado a partir de memória de sessões anteriores*
