# Pergunta ao Claude Code — desenho do script 5 (Google Trends)

> Discutido no Cowork a 15/09/2026, à tarde. Nada foi implementado.
> **Quero a tua opinião, incluindo discordância.** Se o desenho abaixo estiver errado,
> diz onde.

## O que está em causa

Reescrever `scripts/5_fetch_google_trends.py` de raiz, para que as pesquisas voltem a dar
uma série utilizável — gráficos e comparações que se leiam.

## Factos apurados hoje

- **O `pytrends` foi arquivado em Abril de 2025 e não tem manutenção.** Os scripts 5 e 6
  dependem dele. Os HTTP 429 não são um limite de ritmo que se contorne com pausas — é uma
  biblioteca abandonada a ler endpoints não documentados do Google.
- **A API oficial do Google Trends continua em alpha por candidatura**, sem inscrição aberta
  e sem data de abertura. A candidatura de 09/09/2026 não teve resposta.
- **Volume necessário** *(aritmética do Cowork)*: 82 keywords em grupos de 5 com uma âncora
  fixa dá 4 termos novos por pedido → **21 pedidos por passagem completa**.
- **Preços, a 15/09/2026:** DataForSEO pay-as-you-go, entre $0,001 e $0,009 por pedido, com
  depósito mínimo de $50 sem validade (≈ $0,80/mês para este volume) · SerpApi $25/mês por
  1000 pesquisas · Trends MCP com tier gratuito de 100/mês · `trendspyg` (sucessor
  comunitário do pytrends) grátis, com a mesma fragilidade.
- **POR VERIFICAR:** se o endpoint do DataForSEO devolve granularidade **diária** numa janela
  de 8 meses com geo Portugal. A documentação mostra o exemplo agregado **à semana**. Têm
  sandbox gratuito. **Testar antes de pagar.**

## O desenho proposto

1. **Série diária por keyword.** Janela única de ~8 meses (acima disso o Google devolve
   semanal em vez de diário), `geo=PT`. Dá ~240 pontos por termo, ~20 mil linhas no total.
2. **Grupos de 5 com keyword-âncora.** O Google normaliza 0–100 ao máximo de cada pedido,
   logo curvas pedidas em separado estão em réguas diferentes. A âncora repete-se em todos os
   grupos e serve para as converter na mesma escala.
   Referência já citada no Crítico nº 6: West, R. (2020), *Calibration of Google Trends Time
   Series*, CIKM '20, pp. 2257-2260. DOI 10.1145/3340531.3412075
3. **Cada descarga é guardada inteira**, com `fetched_at`, `window_start`, `window_end` e
   identificador do pedido. **As descargas anteriores não se apagam.** O dashboard lê **uma**
   de cada vez; nunca se colam valores de duas descargas na mesma linha.
4. **`NULL` + `collection_status` nas falhas, nunca `0`.**
5. **A fonte da recolha fica isolada numa função no topo do ficheiro**, para trocar de
   fornecedor sem mexer no resto.

## O raciocínio que quero que critiques

**Análise semanal não precisa de recolha semanal.** Uma descarga de 8 meses de dados diários
já contém as ~35 semanas lá dentro, todas na mesma régua. O que estraga a escala é recolher
uma semana de cada vez. Portanto: todas as segundas-feiras repete-se a descarga da janela
**inteira** (21 pedidos), e a descarga mais recente é internamente coerente de ponta a ponta.

Consequência assumida: o valor de Março na descarga de hoje **não é o mesmo número** que o
valor de Março na descarga do mês passado, porque o máximo da janela mudou. O arquivo das
descargas anteriores serve para auditar a medição, não para colar séries.

## Perguntas

1. O desenho está certo? O que lhe falta ou está errado?
2. Vale a pena pagar, ou fica-se pelo `trendspyg` grátis?
3. Qual é a ordem de trabalho — o que se faz primeiro?
4. A tabela `historical_snapshots` actual (3462 linhas, nada aproveitável) arquiva-se e
   esvazia-se, ou há razão para a manter?

## Estado do repositório

**7 ficheiros alterados sem commit**, feitos no Cowork esta tarde. `tsc` passa (exit 0);
**o `npm run build` não foi corrido** — o `node_modules` está compilado para macOS e o shell
da ponte é Linux.

| ficheiro | alteração |
|---|---|
| `src/hooks/useHistoricalData.ts` | paginação — o browser recebia 1000 das 3462 linhas, as mais antigas, e Abril e Agosto nunca chegavam à página |
| `src/lib/buildTrend.ts` | ausência de recolha deixou de ser escrita como `0`; fica indefinida para o gráfico desenhar lacuna (3 períodos) |
| `src/components/TrendChart.tsx` | anos calculados em vez de literais "2026"/"2025"; linha tracejada também corta nas lacunas |
| `src/lib/eixoPdfExport.ts` | sinal `+` forçado — `lúpus` saía `+-50%` |
| `src/lib/briefingPdfExport.ts` | o mesmo em 3 sítios (função `fmtPct`); crachá fact-check nunca disparava (comparava com `fact-check`, a base tem `factcheck`); volume ausente deixa de ser impresso |
| `src/lib/pdfExport.ts` | sinal `+` forçado em 2 sítios |
| `src/pages/Briefing.tsx` | briefing arquivado escrevia `vol. 0` fabricado; passa a `null` |

## Achados do Cowork que ainda não estão em ficheiro

- **Em "7d" e "30d" o gráfico não mostra dados errados — não mostra nada.** Os dois filtram
  por data (`useHistoricalData.ts:26-34`) e não há snapshots desde 10/08. São três botões de
  período em que dois não têm objecto.
- **Correcção ao `CONTEXT.md`, Verificações, linha de `historical_snapshots` (07/09):** diz
  *"3018 (09/03–12/04) têm valores acima de 100 num índice normalizado 0–100"*. Medido nas
  3462 linhas a 15/09: **3018 é o total da janela**, e dentro dela são **16** acima de 100 e
  **1309 (43,4%)** presas no valor 1. O defeito é real; o número está inflacionado. A secção
  do Dashboard repete o erro noutra forma.
- **A inspecção ao dashboard pode ganhar um achado nº 5** — o gráfico ano-a-ano, com as
  quatro causas.
