# AUDIT.md — Reportagem Viva / Diz que Disse
> Registo de problemas identificados por diagnóstico manual do workflow.
> Sessão de diagnóstico: 2026-07-28
> Este ficheiro deve ser colocado na raiz do repositório e continuado pelo Claude Code.

---

## Contexto da sessão

Sintoma inicial reportado: dashboard não estava a renovar dados às segundas-feiras
como esperado, e não havia acumulação de PDFs (esta segunda expectativa revelou-se
incorrecta — a exportação de PDF é manual/client-side, nunca foi automatizada).

Diagnóstico feito directamente no GitHub Actions e Supabase (via browser), não
apenas por inspecção de código.

---

## 1. RESOLVIDO — Supabase pausado + workflow GitHub Actions desactivado

**Causa raiz:** dupla, em cadeia.

- O projecto Supabase `ijpxjpbjudaddfatibfl` (instância manual da Marta, free tier)
  pausou por inactividade prolongada do projecto.
- Em paralelo, o GitHub desactivou automaticamente o workflow `youtube-trends.yml`
  ("Actualização Semanal — Reportagem Viva") por ausência de actividade no
  repositório há mais de 60 dias — comportamento padrão do GitHub Actions para
  workflows agendados (`schedule`).
- As runs #27, #28, #29 (6-20 Julho 2026) falharam todas no Passo 0 ("Ping Supabase
  wake up") com `curl` exit code 6 (falha de resolução DNS/ligação), consistente
  com a instância pausada.

**Acções tomadas:**
- Projecto Supabase resumido via "Resume project" no dashboard.
- Workflow reactivado via botão "Enable workflow" no GitHub Actions.
- Run manual #30 (workflow_dispatch) disparada como teste — **concluiu com
  sucesso em 38m 57s**, confirmando a causa.

**Falha de desenho identificada, a corrigir:** o script de wake-up
(`0 — Ping Supabase (wake up)`) foi desenhado para tolerar uma instância lenta a
arrancar (`if [ "$CODE" != "200" ]` com espera de 30s), mas isto só funciona se o
`curl` conseguir estabelecer ligação e devolver algum código HTTP. Quando a falha
é ao nível da rede (DNS/ligação recusada, exit code do curl ≠ 0), o script aborta
imediatamente por `set -e` implícito, sem nunca chegar ao `if` nem esperar os 30s.
O mecanismo de recuperação falha silenciosamente exactamente no cenário para o
qual foi desenhado. Recomendação: verificar o exit code do `curl` separadamente
do código HTTP, e só então decidir se vale a pena esperar e tentar de novo.

---

## 2. EM CURSO — Google Trends (pytrends) bloqueado sistematicamente (HTTP 429)

**Causa raiz:** `pytrends` — a biblioteca usada em `scripts/5_fetch_google_trends.py`
— foi **arquivada pelo mantenedor em Abril de 2025** e já não recebe correcções.
O Google reforçou entretanto as suas defesas anti-scraping, e os pedidos feitos a
partir de IPs de runners do GitHub Actions (datacenter, partilhados, muito usados
por scrapers) são bloqueados com HTTP 429 ("too many 429 error responses").

**Evidência da run #30:** das 82 keywords activas, a partir da keyword 5
("menopausa precoce") a maioria dos pedidos seguintes falhou com 429. Confirmados
113+ ocorrências do erro só nos primeiros ~90 keywords/linhas de log inspeccionadas.
O script tem fallback (mantém o valor anterior — "Sem dados — mantido"), pelo que
**o passo reporta sucesso (verde) mesmo quando a maioria das keywords não é
actualizada**. Isto significa que runs anteriores marcadas como bem-sucedidas
(#23-#26) podem ter sofrido o mesmo problema sem que isso fosse visível sem
inspecção do log.

**Decisão tomada (sessão de 2026-07-28):** não introduzir serviço pago (SerpApi,
DataForSEO) — orçamento estimado ~€0,40-25/mês consoante o serviço, mas Marta
decidiu não adicionar mais uma dependência paga. Mitigação sem custo:

1. Substituir `pytrends` por `trendspy` (fork mantido activamente) em
   `scripts/5_fetch_google_trends.py`. **Verificar a API do trendspy antes de
   assumir que é um substituto directo — nomes de métodos podem diferir.**
2. Introduzir espera aleatória de 3-8 segundos entre cada pedido de keyword
   (actualmente não há qualquer delay, o que facilita a detecção como bot).
3. Adicionar um contador no fim do script: X de 82 keywords actualizadas com
   sucesso vs. Y mantidas com valor anterior — para ter visibilidade real da
   taxa de sucesso, já que o "sucesso" do passo não reflecte isto actualmente.

**Nota metodológica para a tese:** esta limitação deve ser documentada
explicitamente na secção de Limitações (a actual, em `/sobre`, só cobre a
semântica do índice Google Trends, não a fiabilidade da recolha). É uma
limitação estrutural do ecossistema (pytrends abandonado, API oficial do Google
Trends ainda em alpha fechado desde Julho 2025, sem acesso geral previsto),
não uma falha de desenho do sistema da Marta.

**Por fazer:** implementar a mitigação acima e voltar a testar via
`workflow_dispatch`, comparando a taxa de sucesso antes/depois.

---

## 3. POR INVESTIGAR — Duas Edge Functions em falta (HTTP 404)

Descoberto na run #30, passos finais do workflow:

- **Passo 6 "Guiões semanais":** `HTTP 404 — generate-guioes-weekly devolveu HTTP 404`
- **Passo 7 "Arquivo semanal":** `HTTP 404 — archive-weekly devolveu HTTP 404`

Estas duas Edge Functions não existem (ou não respondem) na instância Supabase
actual. Hipóteses a verificar, por ordem de probabilidade:

1. Nunca foram migradas da instância antiga gerida pelo Lovable
   (`cyjwhmuakmiytypewwfw.supabase.co`) para a instância manual da Marta
   (`ijpxjpbjudaddfatibfl.supabase.co`).
2. Foram renomeadas nalgum momento e o workflow ficou a apontar para nomes
   obsoletos.
3. Foram apagadas por engano.

**Impacto:** desconhecido ainda — depende do que estas funções deveriam fazer.
Os nomes sugerem geração de guiões semanais (Diz que Disse) e arquivo de dados
da semana anterior. Se forem funcionalidade que a Marta pensava estar activa,
isto é uma lacuna silenciosa adicional, do mesmo tipo que o problema #2 (o
workflow reporta sucesso global mesmo com estes dois passos a falhar — são só
avisos, `Warning:`, não erros fatais).

**Por fazer:** listar as Edge Functions realmente deployadas na instância
`ijpxjpbjudaddfatibfl` (via Supabase MCP ou dashboard) e comparar com o que o
workflow espera encontrar. Decidir se se recriam as funções, se se actualiza o
workflow para apontar para os nomes correctos, ou se estes passos devem
simplesmente ser removidos do workflow (se a funcionalidade já não for
necessária).

---

## Itens da auditoria de código mais ampla, ainda pendentes (não cobertos hoje)

Estes fazem parte do plano de 5 fases discutido, ainda não iniciado:

- Fase 2: Schema e restantes Edge Functions Supabase (RLS policies, integridade FKs)
- Fase 3: Camada de fetching no frontend (bug já confirmado: `pdfExport.ts` tem
  meses hardcoded `["2025-10"..."2026-03"]`, desactualizado desde Abril)
- Fase 4: Admin panel (bug confirmado: NOTÍCIAS Select não pré-preenche no edit;
  BOOKMARKS por auditar)
- Fase 5: Exportação de PDF e relatórios (decidir se mantém manual ou automatiza;
  corrigir hardcode de datas)
