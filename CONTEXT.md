## Última actualização: 19/03/2026

### Novas tabelas
- `eixos_archive` — arquivo semanal por eixo (auto-gerado quando se abre um eixo no dashboard)
- `revisao_pares` — dupla científica por eixo, editável no admin

### Estrutura Editorial (Lado B)
- Menu principal: REPORTAGEM VIVA | BOOKMARKS | BENCHMARK | TEXTOS | PLATAFORMA | SOBRE
- Segunda linha (EditorialSubNav): GUIÕES | REVISÃO DE PARES | TEXTOS | BOOKMARKS
- Páginas com SubNav: Guioes, Bookmarks, Benchmark, RevisaoPares
- GUIÕES removido do menu principal do Lado A

### Scripts Python
- `4_fetch_youtube_trends.py` — verifica país do canal via API (só PT ou sem país); cache em memória
- `5_fetch_google_trends.py` — is_emergent calculado automaticamente (change >= 50 e current >= 10)
- `6_fetch_health_questions.py` — expandir_mural() adiciona termos novos automaticamente

### Componentes chave
- `EditorialSubNav.tsx` — segunda linha de menu do Editorial
- `eixoPdfExport.ts` — exporta PDF por eixo/semana
- `RevisaoPares.tsx` — página de revisão de pares com cards por eixo
- `AxisColumn.tsx` — mostra arquivo semanal com botão PDF
-

# CONTEXT.md — Reportagem Viva
> Ficheiro de memória do projeto para continuidade entre sessões de trabalho com IA.
> Atualizar no final de cada sessão relevante.

---

## Identidade do Projeto

- **Nome:** Reportagem Viva
- **Repositório:** github.com/marmade/health-pulse-portugal
- **Autora:** Marta (mestranda em Comunicação de Ciência, FCSH-UNL, nº 2024110168)
- **Contexto académico:** Projeto de tese de mestrado sobre monitorização de desinformação em saúde

---

## Missão

Plataforma de monitorização de desinformação em saúde, com camadas editoriais de arquivo. Combina investigação, comunicação de ciência e ferramentas digitais para desenvolver conteúdos de combate à desinformação relacionada com a saúde.

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

### 2. Diz que Disse — Conteúdo Editorial
- Formato vídeo estilo Vox Pop
- Handle: `@roevbros`
- Duo científico em frente à câmara (revisão de pares)
- Distribuição: Instagram / TikTok / YouTube

### 3. *(futuro)*
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
