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

---

## 4. RESOLVIDO — Causa raiz da divergência "instância antiga vs. nova"

**Sessão de diagnóstico: 2026-07-29** (via chat Claude + Claude Code + Supabase MCP)

O site publicado lê da instância antiga gerida pelo Lovable (`cyjwhmuakmiytypewwfw`),
não da instância manual da Marta (`ijpxjpbjudaddfatibfl`). Causa raiz confirmada por
git log, não por suposição:

- Commit `9f2e367` (12/04/2026) migrou correctamente `.env`, workflow e
  `config.toml` para a instância nova. Ficou correcto durante mais de um mês.
- Commit `5246597` (21/05/2026), autor `gpt-engineer-app[bot]` (motor do Lovable),
  mensagem "Changes", dentro de um commit-pai "Update plan / Plan file updated
  during planning mode" — reverteu o `.env` de volta para a instância antiga.
- **Mecanismo:** quando o Lovable Cloud está ligado a um projecto, cada edição no
  editor visual pode reescrever a ligação Supabase de volta para a instância que
  o Lovable gere — mesmo sem alteração de código, mesmo em "modo de planeamento".
  Confirmado na documentação oficial do Lovable (`docs.lovable.dev/integrations/supabase`).
- **Implicação prática:** enquanto o Lovable Cloud estiver ligado a este projecto,
  usar o editor visual pode reverter a escolha da instância nova a qualquer
  momento, sem aviso. Por confirmar: estado da ligação no separador Cloud do
  editor Lovable.

**Estado de dados, comparado directamente (verificado por SQL em ambas):**

| | Antiga (`cyjwhmuakmiytypewwfw`) | Nova (`ijpxjpbjudaddfatibfl`) |
|---|---|---|
| historical_snapshots | 12072 linhas | 3298 linhas |
| Última actualização | 2026-07-27 (viva até ontem) | 2026-04-12 (parada há 3,5 meses) |
| news_items | 1328 linhas | 158 linhas |
| Edge Functions deployadas | 7 de 7 | 5 de 7 |

**Mecanismo do "escritor invisível" da antiga, identificado:** `pg_cron` + `pg_net`
(extensões nativas do Postgres para agendamento dentro da própria base de dados).
Activadas na migração original do Lovable (`20260308113243`), com os
`cron.schedule(...)` em si criados manualmente no dashboard Supabase — nunca
ficaram em ficheiro, por isso nunca apareceram em nenhuma auditoria de código
anterior. Confirmado por MCP directo na instância nova: as mesmas extensões
existem lá (herdadas do schema migrado), mas `select * from cron.job` devolve
**zero linhas** — a capacidade foi migrada, o agendamento nunca foi.

Achado secundário, sem relação com o caso: ficheiro workflow duplicado e órfão em
`scripts/.github/workflows/youtube-trends.yml` — confirmado que não executa
(GitHub só lê `.github/workflows/` na raiz do repo) e não menciona Supabase.
Candidato a remoção por higiene, sem urgência.

**Hipótese levantada e refutada:** ligação entre o hardcode de datas em
`pdfExport.ts` (`["2025-10"..."2026-03"]`, já registado na secção anterior) e a
janela de dados reais da instância antiga. Verificação por `git log -L` na linha
exacta: escrita no commit `1abd33e`, 27/03/2026 — é uma janela fixa de 6 meses a
terminar no mês em que o ficheiro foi escrito, sem relação com o início da
corrupção dos dados de trends (que começou depois, em Abril). Registar como
coincidência de calendário, não como pista.

**Por investigar, ainda em aberto:**
- `.env` (com chave publishable Supabase) está commitado no repo público, fora
  do `.gitignore`. Confirmar se as RLS policies protegem adequadamente os dados
  antes de assumir que isto é inofensivo.

**Extensão da corrupção — confirmada por SQL (2026-07-29):**

De 82 keywords activas em `historical_snapshots`, **82 têm o valor de
`search_index` congelado** nos últimos 20 dias (`palavras_com_sinal_real = 0`).
Confirmado por query de variância por keyword.

Verificação da data de corte, sobre os últimos 90 dias: as 5 keywords com
mudança mais recente mostram todas a mesma última data real — **2026-04-30**.
Não há nenhuma keyword com mudança registada depois dessa data. Ou seja, o
corte não é gradual: dados de trends reais até 30/04/2026, e a partir de
01/05/2026, cerca de três meses seguidos (Maio, Junho, Julho) de valores
repetidos, sem sinal real nenhum.

`news_items`, alimentado por um job diferente (`fetch-rss-feeds-daily`,
confirmado Active), mantém-se real e contínuo até 2026-07-27 — a corrupção
afecta só a tabela de trends, não as notícias.

**Decisão fechada:** instância nova (`ijpxjpbjudaddfatibfl`) passa a oficial.
Razão: nenhuma das duas instâncias tem trends fiáveis nos últimos três meses,
mas a antiga fabrica dados a fingir que são reais, enquanto a nova apresenta
um vazio honesto. Para um projecto académico, dados fabricados e não
identificáveis como tal pesam mais contra do que a ausência de dados.

**Próximos passos, por esta ordem:**
1. Exportar de `cyjwhmuakmiytypewwfw`, antes de qualquer desligamento: (a)
   `historical_snapshots` filtrado a `snapshot_date <= '2026-04-30'` (única
   fatia real); (b) `news_items` na íntegra (mantém-se real até 27/07).
2. Importar esses dados para `ijpxjpbjudaddfatibfl`, preenchendo o vazio que
   lá existe entre 2026-04-12 e a data de hoje, na medida do possível.
3. Recriar em `ijpxjpbjudaddfatibfl` os jobs `fetch-rss-feeds-daily` e
   `refresh-trends-daily` (este último corrigido, via trendspy + backoff,
   já decidido na secção 3) — desta vez como ficheiro de migração
   (`supabase/migrations/`), não configuração manual no dashboard, para não
   se repetir o problema descrito acima.
4. Confirmar no separador Cloud do Lovable se a ligação Supabase↔Lovable
   continua activa e decidir se se desliga, agora que a antiga deixa de ser
   oficial.

---

## 5. RESOLVIDO — Escrita pública bloqueada por RLS na instância antiga

**Sessão de verificação: 2026-08-13** (via Claude Code, REST API directa)

Sessão curta de verificação, sem alterações a código, dados ou configuração.
Estado do repositório marcado com a tag git `estado-2026-08-13` (commit `f037e54`).

**Configuração, tal como está hoje:**

- O `.env` continua a apontar para a instância antiga (`cyjwhmuakmiytypewwfw`),
  com chave `anon`. A decisão da secção 4 — instância nova passa a oficial —
  ainda não está reflectida em nenhum ficheiro.
- **Não existem credenciais da instância nova em lado nenhum do projecto.** Só há
  um ficheiro de ambiente (`.env`); não há `.env.local` nem qualquer variável a
  apontar para `ijpxjpbjudaddfatibfl`.
- O `.env` **não está no `.gitignore`** e está versionado (`tracked`), pelo que o
  seu conteúdo está no histórico do repositório público. Confirma o item deixado
  em aberto na secção 4.

**Leitura com a chave anon (instância antiga) — permitida:**

| Tabela | Pedido | Resultado |
|---|---|---|
| `historical_snapshots` | `GET ?select=*&limit=1` | HTTP **200**, com dados |
| `news_items` | `GET ?select=*&limit=1` | HTTP **200**, com dados |

A instância antiga está viva e legível. Isto viabiliza a exportação prevista no
ponto 1 dos próximos passos da secção 4 sem precisar da chave `service_role`.

**Escrita com a chave anon (instância antiga) — bloqueada:**

| Tabela | Pedido | Resultado |
|---|---|---|
| `historical_snapshots` | `POST` de 1 linha de teste | HTTP **401**, Postgres `42501` |
| `news_items` | `POST` de 1 linha de teste | HTTP **401**, Postgres `42501` |

Mensagem devolvida nos dois casos: `new row violates row-level security policy`.
`42501` é `insufficient_privilege`: há RLS activa e nenhuma policy concede
`INSERT` ao papel `anon`. **Nenhuma linha foi inserida** — não ficou lixo de teste
em nenhuma das tabelas.

**Conclusão sobre a origem da corrupção de Maio-Julho:** o vector "escrita externa
por terceiros através da chave exposta no repositório público" fica **eliminado
por teste**, não por suposição. Reforça a atribuição ao `pg_cron` feita na secção
4, mas não a fecha — só este vector foi testado.

**Vectores de escrita ainda por verificar** (nenhum deles exige escrever seja o que
for para ser verificado):
- chave `service_role` usada pelo workflow do GitHub Actions;
- Edge Functions deployadas na instância antiga, que correm com privilégios próprios;
- alterações manuais via dashboard Supabase.

**Por verificar — RLS de `contactos_projecto`:** é a única tabela do projecto que
pelo nome guarda dados de pessoas. As duas tabelas testadas hoje estão protegidas
na escrita mas abertas na leitura; se `contactos_projecto` seguir o mesmo padrão,
os contactos são publicamente legíveis com uma chave que está num repositório
público. Verificar isto antes de qualquer outra higiene de segurança — tem
prioridade sobre tirar o `.env` do repo, porque a chave anon é pública por desenho
e é a RLS que faz o trabalho.
