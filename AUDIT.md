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

## 3. RESOLVIDO — Edge Functions em falta (HTTP 404)

> **Corrigido a 14/08/2026.** O corpo original desta secção, escrito na sessão de
> 28-29/07, identificava as funções erradas. A correcção está no fim, a seguir ao
> registo original, que se mantém para não apagar o rasto do diagnóstico.

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

---

### Correcção — verificado a 14/08/2026 (MCP Supabase, `list_edge_functions`)

**As duas funções identificadas acima estão activas.** `generate-guioes-weekly` e
`archive-weekly` foram deployadas a **28/07/2026, às 17:23 e 17:21** respectivamente,
na mesma tarde em que a run #30 devolveu os 404 — e continuam `ACTIVE`.

**A hipótese 1 estava correcta quando os 404 foram observados** (run #30, manhã de
28/07): nesse momento as funções não existiam mesmo na instância nova. Deixou de o
ser às 17:21 e 17:23 desse mesmo dia, quando foram deployadas. O texto acima foi
escrito depois disso e **nunca foi actualizado**, pelo que ficou a apontar como em
falta duas funções que já lá estavam.

**Estado real a 14/08/2026** — 5 de 7 deployadas, todas `ACTIVE`, todas em
`version: 1`, todas deployadas entre as 17:20 e as 17:27 de 28/07/2026:

| Função | Estado | Deploy |
|---|---|---|
| `refresh-trends` | ACTIVE | 28/07/2026 17:20 |
| `archive-weekly` | ACTIVE | 28/07/2026 17:21 |
| `generate-guioes-weekly` | ACTIVE | 28/07/2026 17:23 |
| `google-trends` | ACTIVE | 28/07/2026 17:24 |
| `fetch-rss-feeds` | ACTIVE | 28/07/2026 17:27 |

**As que faltam são outras duas:** `generate-diz-que-disse` e `generate-guiao-questions`
— precisamente as que chamam a API da Perplexity. Confirmado por POST directo a
`generate-diz-que-disse`, que devolveu `HTTP 404 — {"code":"NOT_FOUND"}`.

**Achado secundário, com consequência:** `updated_at` é igual a `created_at` nas
cinco, e todas estão em `version: 1`. Nunca foram redeployadas desde 28/07. Qualquer
alteração feita no repositório a `supabase/functions/` depois dessa data **não está
em produção** — o código que corre na instância é o dessa tarde.

**Por fazer:** deploy das duas funções em falta, com as condições de segurança
registadas nos Restantes do `CONTEXT.md` (verificação de chamador por segredo
partilhado; renomear `VITE_PERPLEXITY_API_KEY`).

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

## 4. Causa raiz da divergência "instância antiga vs. nova"

**RESOLVIDO** quanto à causa raiz · **NÃO VERIFICADO** quanto à qualidade dos dados da
instância antiga (revisão de 07/09/2026)

> **REVISÃO DE 07/09/2026 — ler antes do resto da secção.**
>
> **O que se mantém verificado.** A causa raiz — o Lovable reverter o `.env` para a
> instância antiga — foi reconfirmada hoje por `git log --format="%h %ad" -- .env`: o commit
> `5246597` é de **21/05/2026**, posterior à migração `9f2e367` de 12/04/2026. O mecanismo
> está provado e não é posto em causa.
>
> **O que passa a NÃO VERIFICADO.** A afirmação de que a instância antiga tem "dados de
> trends reais até 30/04/2026", mais abaixo em *Extensão da corrupção*. Nunca foi testada
> com os critérios aplicados a 07/09/2026 à instância nova — procura de valores fora do
> intervalo 0–100 e de valores presos no mínimo. Na instância nova, o período **09/03 a
> 12/04/2026**, que é exactamente o mesmo período nas duas, tem 16 linhas com `search_index`
> acima de 100 (impossível num índice normalizado 0–100) e 43% das linhas presas no valor 1.
>
> **Porque é que o teste de 29/07 não chega.** Mediu **variância** — a série mexe ou está
> congelada? — e não **plausibilidade** — estes valores podem existir? Uma série pode variar
> e ser fabricada: foi isso que se encontrou na instância nova. "Última data com mudança =
> 30/04" prova que houve escrita até aí, não prova que o que foi escrito é real.
>
> **Como tem de ser feito o teste.** Não basta procurar valores fora de 0–100. As 240 linhas
> de seed retrodatado da instância nova foram inseridas a **08/03/2026**, um dia antes do
> início do período 09/03–12/04, e as duas instâncias partilham origem — o mesmo projecto
> Lovable. A hipótese a testar na antiga é dupla: **(1)** tem valores impossíveis?
> **(2)** tem o mesmo bloco de seed retrodatado inserido num único minuto? A segunda só
> aparece agrupando por `date_trunc('minute', created_at)`. Foi esse agrupamento que revelou
> o seed; uma consulta por `snapshot_date` não o teria apanhado, porque as datas do seed
> estão espalhadas por seis meses.
>
> **Consequência.** Os pontos 1 e 2 dos *Próximos passos* ficam **suspensos** até correr na
> instância antiga o teste acima. Se o resultado for igual, são cancelados — seria importar
> dados indefensáveis para a instância limpa.
>
> Ver `CONTEXT.md` (tabela de Verificações e secção Suspensos) e
> `docs/sessoes/2026-09-07.md`, ponto 2.

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

Achado secundário, sem relação com o caso: pasta `scripts/.github/workflows/`
duplicada e órfã — confirmado que não executa, porque o GitHub só lê
`.github/workflows/` na raiz do repositório. **Tinha dois ficheiros, não um:**

- `youtube-trends.yml` — workflow duplicado, não menciona Supabase.
- `7_fetch_autocomplete_questions.py` — **não registado nesta nota até
  14/09/2026, e não é cópia do script activo.** É a versão anterior a
  09/09/2026: tem a chave `anon` escrita no código (l.30) e **não tem a guarda
  `os.environ.get("SUPABASE_SERVICE_ROLE_KEY")`** que faz o script activo parar
  em voz alta quando o secret falta. Correr esta por engano seria correr sem
  gravar nada — é pior do que a activa, não igual.

**Movidos a 14/09/2026** (sessão 13), com `git mv` e sem apagar nada, para
`_antigos/scripts-github-workflows-youtube-trends.yml` e
`_antigos/scripts-github-workflows-7_fetch_autocomplete_questions.py`.
A pasta `scripts/.github/` deixou de existir.

**Mover não removeu a chave `anon` do repositório nem do histórico, e não
precisava:** a chave `anon` é pública por desenho e o que fecha o risco é o
RLS, fechado a 09/09/2026 — ver `CONTEXT.md`, Crítico nº 1. Isto foi higiene,
não foi tapar um buraco de segurança.

**Hipótese levantada e refutada:** ligação entre o hardcode de datas em
`pdfExport.ts` (`["2025-10"..."2026-03"]`, já registado na secção anterior) e a
janela de dados reais da instância antiga. Verificação por `git log -L` na linha
exacta: escrita no commit `1abd33e`, 27/03/2026 — é uma janela fixa de 6 meses a
terminar no mês em que o ficheiro foi escrito, sem relação com o início da
corrupção dos dados de trends (que começou depois, em Abril). Registar como
coincidência de calendário, não como pista.

**Respondido a 07/09/2026 — estava em aberto desde 29/07:**
- ~~`.env` (com chave publishable Supabase) está commitado no repo público, fora
  do `.gitignore`. Confirmar se as RLS policies protegem adequadamente os dados
  antes de assumir que isto é inofensivo.~~
  **Respondido, e a resposta é má.** O `.env` contém só variáveis `VITE_*`, sem
  `service_role` — mas a RLS **não** protege. A `contactos_projecto` tem quatro políticas
  `qual = true`: leitura, inserção, alteração **e remoção** públicas, sobre 4 linhas com
  nome, e-mail, telefone, especialidade e bio de pessoas reais. A chave é pública por
  desenho; era a RLS que tinha de fazer o trabalho, e não faz. Ver `CONTEXT.md`, Crítico
  nº 1.

**Extensão da corrupção — confirmada por SQL (2026-07-29).**
**Números não fiáveis para decidir exportação — ver a revisão de 07/09/2026 no topo desta
secção.** O que se segue mede variância, não plausibilidade.

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
1. **SUSPENSO (07/09/2026).** Exportar de `cyjwhmuakmiytypewwfw`, antes de qualquer
   desligamento: (a) `historical_snapshots` filtrado a `snapshot_date <= '2026-04-30'`;
   (b) `news_items` na íntegra (mantém-se real até 27/07). **Condição para retomar:**
   correr primeiro na instância antiga o teste descrito na revisão no topo desta secção.
   A premissa de que a fatia até 30/04 é a "única fatia real" é precisamente a afirmação
   que não está verificada.
2. **SUSPENSO (07/09/2026).** Importar esses dados para `ijpxjpbjudaddfatibfl`,
   preenchendo o vazio que lá existe entre 2026-04-12 e a data de hoje. Depende
   inteiramente do ponto 1.
3. Recriar em `ijpxjpbjudaddfatibfl` os jobs `fetch-rss-feeds-daily` e
   `refresh-trends-daily` (este último corrigido, via trendspy + backoff,
   já decidido na secção 3) — desta vez como ficheiro de migração
   (`supabase/migrations/`), não configuração manual no dashboard, para não
   se repetir o problema descrito acima.
4. Confirmar no separador Cloud do Lovable se a ligação Supabase↔Lovable
   continua activa e decidir se se desliga, agora que a antiga deixa de ser
   oficial.

---

## 5. Escrita pública e RLS na instância antiga

**RESOLVIDO** quanto à escrita via REST nas duas tabelas testadas · **EM ABERTO** quanto ao
RLS de `contactos_projecto` na instância antiga e aos vectores por Edge Function
(revisão de 07/09/2026)

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

**Conclusão sobre a origem da corrupção de Maio-Julho — corrigida a 14/08/2026.**

A redacção original desta conclusão dizia que o vector "escrita externa por terceiros
através da chave exposta no repositório público" ficava **eliminado por teste**. Era
demasiado ampla: eliminava um caminho e dava a entender que os eliminava todos.

**O que se mantém válido.** O teste de escrita directa via **REST** devolveu **HTTP 401**
(Postgres `42501`) nas duas tabelas testadas da instância antiga. A chave anon exposta
não permite escrever por esse caminho, e isso está provado.

**O que não foi testado.** O caminho por **Edge Function**, em nenhuma das duas
instâncias. As funções autenticam-se internamente com `service_role`, que ignora RLS por
definição — `refresh-trends` é o exemplo lido em código. Se forem invocáveis sem
autenticação, existe um caminho de escrita que não passa pela RLS e que não exige sequer
a chave anon.

**Estado da verificação do `verify_jwt`, por instância** — a distinção importa, porque
esta secção trata da instância antiga e a evidência recolhida é da nova:

| Instância | `verify_jwt` | Como se sabe |
|---|---|---|
| Nova (`ijpxjpbjudaddfatibfl`) | `false` nas 7 | `supabase/config.toml` (que aponta para esta instância) + estado deployado confirmado por MCP a 14/08/2026 |
| Antiga (`cyjwhmuakmiytypewwfw`) | **desconhecido** | Não verificado. A secção 4 regista 7 de 7 funções deployadas, mas a sua configuração de autenticação nunca foi inspeccionada |

Ou seja: na instância nova o caminho está aberto e confirmado; na antiga é plausível por
analogia — as funções vieram do mesmo projecto Lovable — mas **não está verificado**, e
não deve ser tratado como se estivesse.

**O que uma invocação não autenticada permitiria, e o que não permitiria.** Permitiria
**disparar as escritas que as funções já fazem** — snapshots repetidos em
`historical_snapshots`, recolhas de RSS, arquivos semanais. **Não permitiria injectar
valores à escolha**, porque as funções copiam dados de origens fixas e não aceitam
valores do chamador. O risco realista é poluição da série e ruído, não fabricação
dirigida de dados.

Quanto à atribuição da corrupção ao `pg_cron` feita na secção 4: continua a ser a
explicação mais sustentada, mas por eliminação parcial, não por prova directa.

**Vectores de escrita ainda por verificar** (nenhum deles exige escrever seja o que
for para ser verificado):
- chave `service_role` usada pelo workflow do GitHub Actions;
- Edge Functions deployadas na instância antiga, que correm com privilégios próprios;
- alterações manuais via dashboard Supabase.

**RLS de `contactos_projecto` — respondido para a instância NOVA, em aberto para a ANTIGA
(revisão de 07/09/2026).**

A redacção original desta secção previa que, se `contactos_projecto` seguisse o padrão das
duas tabelas testadas a 13/08 — protegidas na escrita, abertas na leitura —, os contactos
seriam publicamente **legíveis**. **A previsão ficou aquém do que se encontrou.** Na
instância nova (`ijpxjpbjudaddfatibfl`), a tabela tem RLS activa mas com **quatro políticas
`qual = true`**: leitura, inserção, alteração **e remoção** públicas, sobre 4 linhas com
nome, e-mail, telefone, especialidade e bio de pessoas reais. Não são apenas publicamente
legíveis — são publicamente **apagáveis**.

**A distinção de instância mantém-se, e importa.** Esta secção trata da instância **antiga**
(`cyjwhmuakmiytypewwfw`); o achado de 07/09/2026 é da **nova**. Na antiga, o RLS de
`contactos_projecto` continua **por verificar**, e não deve ser inferido por analogia — pela
mesma razão pela qual o `verify_jwt` da antiga não foi inferido do da nova, acima nesta
secção.

A prioridade que esta secção estabelecia mantém-se e sai confirmada: a chave anon é pública
por desenho, e é a RLS que tem de fazer o trabalho. Ver `CONTEXT.md`, Crítico nº 1.

---

## 6. Auditoria da `migration_consolidada.sql` — 14/09/2026

Feita na sessão 13, a pedido de um pendente que esta auditoria acabou por **refutar**.
Registo completo em `docs/sessoes/2026-09-14.md`.

**Fontes.** `[bd]` = instância `ijpxjpbjudaddfatibfl` lida ao vivo por MCP Supabase
(`pg_policies`, `pg_indexes`, `information_schema.columns`, `pg_extension`,
`list_migrations`, `list_tables`). `[ficheiro]` = `scripts/migration_consolidada.sql` no
disco, 632 linhas, 27180 bytes, modificado a 09/09/2026.

### O que foi refutado

Vale mais do que o que foi confirmado.

- **Hipótese: a consolidada recria o recipiente dos contactos em `revisao_pares`.**
  Refutada. `[bd]` As colunas `telefone_a`, `telefone_b`, `email_a` e `email_b` existem na
  base viva, iguais às do ficheiro. A decisão de 09/09 foi ao nível dos **dados** (esvaziar),
  não do schema, e o ficheiro é DDL — numa recriação nasceriam vazias.
- **Hipótese: o ficheiro reintroduz a leitura pública de `trend_data` contra uma decisão
  revertida.** Refutada — ver 6.1.

### 6.1 — a acusação era falsa, e contradizia o ficheiro que a fazia

`[bd]` A política `Allow public read on trend_data`, papel `public`, está **activa** na base
de dados. `[ficheiro]` As secções 2.3 e 5.3 reproduzem-na. Logo o ficheiro **descreve o
estado actual e não o contradiz**: a migração que removeu a escrita anónima — ficheiro local
`20260909190000_sem_escrita_anonima_em_todas_as_tabelas.sql`, aplicada no remoto como versão
`20260909181907` (os dois números são a mesma migração, ver 6.3) — mexeu **só em escrita e
nunca tocou em leitura**. Não houve segunda reintrodução de decisão revertida: houve uma,
`contactos_projecto`, tratada a 09/09/2026.

O `CONTEXT.md` escrevia as duas coisas **a quinze linhas de distância**: que uma tabela vazia
com RLS e só leitura pública "não expõe nada" (item do `trend_data`) e que essa mesma leitura
pública era uma decisão de segurança revertida (item da consolidada). Mesma família da
contradição da secção Stack, encontrada mais cedo no mesmo dia — e desta vez o texto
contraditório foi escrito **de raiz nessa sessão**, não herdado de meses antes.

### 6.2 — a idempotência é uma afirmação falsa, e falha no dia para que o ficheiro existe

`[ficheiro]` Cabeçalho l.5: "single **idempotent** script". Tabelas, índices e extensões usam
`IF NOT EXISTS`; as **24 `CREATE POLICY` não usam** — o PostgreSQL não tem `IF NOT EXISTS`
para políticas — e **não existe uma única `DROP POLICY IF EXISTS`** no ficheiro. Segunda
corrida sobre uma base que já tenha as políticas aborta em l.429.

O cenário real não é a instância nova e limpa: é a **primeira corrida interrompida a meio** e
a segunda a morrer na primeira política.

### 6.3 — nem a pasta de migrações nem o histórico remoto reconstroem a base que existe

`[ficheiro]` 42 ficheiros em `supabase/migrations/`. `[bd]` **8 registos** no histórico
remoto. E a relação entre os dois lados parte-se de duas maneiras diferentes, que importa não
confundir:

- **4 dos 8 registos remotos não têm ficheiro local nenhum** — `create_base_tables`,
  `create_dependent_tables`, `fix_eixos_archive_correct_schema` e
  `add_eixo_and_subcategoria_to_bookmarks`, todos de Março. **História perdida:** foram
  aplicados e não ficou o SQL.
- **Os outros 4 têm ficheiro local com o mesmo nome e número de versão diferente.** Não é
  ausência, é **a mesma migração com duas identidades**:

| ficheiro local | versão aplicada no remoto |
|---|---|
| `20260909160000_contactos_projecto_rls_restrict.sql` | `20260909151958` |
| `20260909180000_revisao_pares_sem_escrita_anonima.sql` | `20260909180147` |
| `20260909190000_sem_escrita_anonima_em_todas_as_tabelas.sql` | `20260909181907` |
| `20260909200000_revisao_pares_sem_contactos.sql` | `20260909192141` |

*Inferência, não verificada:* o projecto foi criado a 08/03/2026 e o histórico remoto começa
a 25/03 — compatível com o Lovable a aplicar SQL directo sem registar, e com o registo a
começar quando se passou a aplicar por CLI/MCP.

**Consequência verificada:** um `db push` desta pasta **não vê nenhuma das quatro correcções
de 09/09 como aplicada** — o nome coincide, a versão não, e é pela versão que o Supabase
decide. A consolidada é na prática o único caminho de reconstrução que existe. **Isso aumenta
a importância dela, não diminui** — e é o que torna 6.2 sério.

### 6.4 — três imprecisões menores — **fechadas a 14/09/2026, nas quatro partes**

> **Estado:** as duas partes de estado foram corrigidas no ficheiro e **verificadas por
> execução** (6.7): o índice nasce com a definição da instância real e a assinatura de
> políticas com nome passou a coincidir. As duas imprecisões restantes — o `749` e o
> cabeçalho antigo — são **história, não estado**: ficam registadas abaixo e não se corrigem
> retroactivamente.

- `[ficheiro]` O ficheiro tem **632 linhas, não 749**. O número errado estava no `CONTEXT.md`
  e no `CLAUDE.md`, corrigido a 14/09/2026. *Inferência:* 749−632 = 117, compatível com a
  substituição das 31 políticas de escrita pela nota de nove linhas a 09/09 — o que faria do
  749 um número pré-09/09 nunca actualizado. O `docs/sessoes/2026-04-12.md` mantém o 749:
  era exacto quando foi escrito, e alinhar registo histórico com o presente é falsificá-lo.
- `[ficheiro]` Cabeçalho "Generated: 2026-04-12", num ficheiro com notas de 09/09 no corpo e
  modificado a 09/09. O "38 incremental migrations" era exacto a 12/04 (42 locais menos as 4
  de 09/09). **O corpo foi actualizado e o cabeçalho não** — outra vez o defeito da Stack.
- **[CORRIGIDO]** Nome de política divergente: `Allow public read on bookmarks`
  `[ficheiro]` l.565 contra `Public read` `[bd]`. Renomeado no ficheiro a 14/09/2026, e a
  assinatura md5 das políticas **com nome** passou a coincidir com a da base (6.7).
- **[CORRIGIDO]** `idx_eixos_archive_axis_week` existia `[bd]` e faltava à secção 3
  `[ficheiro]` — logo "recreate the full schema" não era exacto. Acrescentado a 14/09/2026
  com a definição `(axis, week_start DESC)`, **lida de `pg_indexes.indexdef` na instância
  real**; o segundo teste confirmou que nasce idêntico (6.7). Os índices `idx%` do ficheiro
  passaram de 9 para 10, o número que a base tem.

### 6.5 — o ficheiro foi corrido, e a promessa da linha 6 cumpre-se

`[sessão 13][bd]` Num projecto Supabase **descartável**, `teste-consolidada-descartavel`,
ref `hypztdsgzuykoksrurto`, eu-west-1, plano free, custo **0 USD**. A instância real
`ijpxjpbjudaddfatibfl` **não foi tocada**.

**Era a primeira execução deste ficheiro desde que foi gerado a 12/04/2026.** Até
14/09/2026, tudo o que se sabia dele — incluindo 6.2, 6.3 e 6.4 acima — sabia-se **por
leitura**. A secção 6.5 é a parte que passou a ser observada.

**Corrida 1, base vazia: passou inteira.** 2 extensões, 19 tabelas, 10 índices, 19
`ENABLE ROW LEVEL SECURITY` e 24 políticas, **zero erros**. `CREATE EXTENSION pg_cron`
**não** falhou por privilégios num projecto novo — hipótese que tinha sido admitida como
possível e que fica **refutada**. A promessa da linha 6, "run on a fresh Supabase instance
to recreate the full schema", **cumpre-se**.

**O schema produzido é o certo.** Comparado com a instância real:

| | teste | real |
|---|---|---|
| tabelas | 19 | 19 |
| políticas | 24 | 24 |
| índices `idx%` | **9** | **10** |
| assinatura md5 das colunas | `48ba226abfeb347bf2734a123c8944f7` | **igual** |
| assinatura md5 das políticas, **com** o nome | `e6907c4d96fd5dc96087977f6c9b2842` | `1a9a969bc40f5ba54b5041a0707885d0` |
| assinatura md5 das políticas, **sem** o nome | `3cc48946875e9a1cf2f00987e5521cfc` | **igual** |

As duas divergências são exactamente as previstas em 6.4, agora **medidas**: o índice a
menos é o `idx_eixos_archive_axis_week`, e as assinaturas de políticas só divergem quando o
nome entra no cálculo. Tirando o nome, são idênticas — ou seja **a única diferença de
políticas entre o ficheiro e a base era o nome de uma delas** (`bookmarks`), e **nenhum
efeito divergia**. As duas foram corrigidas no ficheiro a 14/09/2026.

**Corrida 2, repetição: falhou, com o código à vista.**
`ERROR: 42710: policy "Allow public read on trends_cache" for table "trends_cache" already
exists`. Como tudo o que a precede tem `IF NOT EXISTS`, o ponto de morte é a **l.429**, a
primeira política. **6.2 passa de dedução a observação.**

> **Nota de método.** O ficheiro foi transmitido ao projecto de teste **pela janela de
> conversa, não copiado byte a byte**. A fidelidade da transmissão é atestada pela
> assinatura md5 das colunas coincidir com a da instância real — uma só letra trocada
> mudaria o md5. É uma atestação forte do schema resultante, não uma prova de que os 27180
> bytes eram idênticos.

### 6.6 — a candidata da transacção, testada e parcialmente refutada

`[sessão 13][bd]` Duas experiências no projecto de teste, cada uma com um `CREATE TABLE`
seguido de um erro deliberado a meio:

| experiência | a tabela sobreviveu? |
|---|---|
| **sem** `BEGIN` | **não** |
| **com** `BEGIN` … `COMMIT` | **não** |

**A candidata não acrescenta nada no caminho testado.** O caminho de execução usado — MCP
`execute_sql` — **já envolve o lote numa transacção por si**, logo o `BEGIN` era redundante
ali. A hipótese de 6.2, tal como estava formulada, fica **parcialmente refutada**.

**Mas o que o teste revela é mais útil do que a candidata: a protecção vem de quem corre o
ficheiro, não do ficheiro.**

- `psql` **sem** `--single-transaction` confirma instrução a instrução e **deixaria a base a
  meio**. **Este caminho NÃO foi testado** — exigia a senha da base do projecto de teste.
  **Por verificar.**
- O editor SQL do painel Supabase envolve o lote, como o MCP.

**Decisão, aplicada ao ficheiro a 14/09/2026:** `BEGIN`/`COMMIT` entram — **não por serem
necessários no caminho testado**, mas para que a garantia **deixe de depender de quem corre
o ficheiro**. No dia da emergência ninguém escolhe o caminho de execução com cuidado.

**A decisão foi depois verificada por execução, não deixada em inferência — ver 6.7.** O
ficheiro já alterado foi corrido de ponta a ponta numa base vazia e passou, **incluindo o
`CREATE EXTENSION pg_cron` dentro de um bloco de transacção explícito**: a hipótese de que
alguma instrução recusasse correr lá dentro fica **refutada por execução**. A afirmação do
cabeçalho sobre a corrida interrompida deixou de ser raciocínio e passou a ser medida.

### 6.7 — o ficheiro corrigido foi corrido, e o schema passou a coincidir nas três assinaturas

`[sessão 13][bd]` **Motivo do segundo teste:** a correcção da secção anterior alterou o
ficheiro e **ele não voltou a ser corrido**. O cabeçalho novo afirmava que uma corrida
interrompida não deixa rasto, e essa afirmação era inferência; pior, se alguma instrução
recusasse correr dentro de um bloco de transacção explícito, o ficheiro teria ficado com um
cabeçalho novo e um corpo que já não corria. **Trocar uma afirmação falsa por outra** era o
risco, e é exactamente o defeito que esta secção documenta.

**Procedimento.** Projecto `hypztdsgzuykoksrurto` restaurado da pausa; as 19 tabelas largadas
com `CASCADE` e as extensões `pg_cron` e `pg_net` removidas, para reproduzir uma base
genuinamente vazia — confirmado antes de correr: 0 tabelas, 0 políticas, 0 das duas
extensões. Estrutura verificada antes do teste: 660 linhas, `BEGIN` na l.28, `COMMIT` na
l.655, primeira instrução executável na l.38 e última na l.630 — **nenhuma instrução fora da
transacção** —, 24 `CREATE POLICY` e 11 instruções de índice.

> **A ressalva de transmissão de 6.5 mantém-se aqui — não foi fechada.** O texto executado
> contra a base **não** foi lido do ficheiro de uma ponta à outra: foi composto a partir da
> leitura anterior mais as quatro alterações, e a leitura feita antes deste teste foi de
> **estrutura** — linhas do `BEGIN` e do `COMMIT`, primeira e última instrução executável,
> contagens, linhas alteradas —, não do conteúdo integral.
>
> **O que o `sha256` `2b4eb167cbb671cd7df82f731819b43b0e7799c175515223bce079321e241a9a` faz,
> e só isso:** fixa **de que versão do ficheiro** este teste fala. Foi confirmado no terminal
> contra a cópia em disco, que é idêntica à versionada. **Não atesta o texto executado.**
>
> **O que 6.7 tem a mais do que 6.5 não é identidade — é consequência mais forte.** Em 6.5
> coincidiam **duas** assinaturas; aqui coincidem **as três**, incluindo a de políticas
> **com** o nome, que é a mais sensível a qualquer alteração de texto. E o índice
> acrescentado nasceu com definição **literalmente igual** à da instância real. Uma
> composição infiel teria de reproduzir por acaso 24 nomes de política e uma definição de
> índice — possível de imaginar, difícil de acontecer.
>
> **Prova por identidade do texto executado é inalcançável com as ferramentas actuais:**
> exigiria o ficheiro chegar à base **sem passar pela janela** — ou seja, senha da base e
> `psql`. É o mesmo obstáculo do item que ficou em aberto, e por isso os dois fecham juntos
> ou não fecham.

**Resultado: passou.** Incluindo `CREATE EXTENSION pg_cron` **dentro** da transacção
explícita — ver 6.6.

**E o schema produzido é agora exactamente o da instância real, nas três assinaturas:**

| | teste, ficheiro corrigido | real |
|---|---|---|
| tabelas | 19 | 19 |
| políticas | 24 | 24 |
| índices `idx%` | **10** | **10** |
| extensões alvo | 2 | 2 |
| assinatura md5 das colunas | `48ba226abfeb347bf2734a123c8944f7` | **igual** |
| assinatura md5 das políticas, **com** o nome | `1a9a969bc40f5ba54b5041a0707885d0` | **igual** |

A assinatura de políticas com o nome era `e6907c4d96fd5dc96087977f6c9b2842` antes da
correcção e **passou a coincidir**: a renomeação da política de `bookmarks` para
`Public read` **fechou a última divergência de políticas**. Os índices `idx%` passaram de 9
para 10, e o índice acrescentado **nasceu com a definição idêntica à real** —
`CREATE INDEX idx_eixos_archive_axis_week ON public.eixos_archive USING btree (axis, week_start DESC)`.

> **Proveniência da definição do índice.** O `(axis, week_start DESC)` não foi escolha de
> ninguém: foi **lido de `pg_indexes.indexdef` na instância real a 14/09/2026**, antes de ser
> escrito no ficheiro. A definição não chegou a passar para o registo de sessão — só o nome
> do índice passou —, e o terminal aplicou-a assinalando que não a conseguia verificar do
> lado dele. **A omissão foi do registo, e o reparo estava certo.** Fica aqui a proveniência
> que faltava.

**Nota de método, para o apêndice.** Este teste existe porque uma correcção foi aplicada e
dada por boa **sem ser corrida**. O padrão repetiu-se três vezes num dia — a secção Stack, o
cabeçalho da consolidada, e depois a própria correcção do cabeçalho: **o corpo muda e a
afirmação sobre o corpo fica para trás.** Não é descuido de quem escreve; é o que acontece
quando a afirmação e a coisa afirmada vivem em sítios diferentes.

### O que confere

`[bd]` + `[ficheiro]`, sem divergência: 19 tabelas contra 19, nomes iguais; 24 políticas
contra 24; **zero políticas de escrita para `public` ou `anon`** em qualquer secção — a
decisão de 09/09 está fielmente reflectida; `contactos_projecto` sem políticas nos dois
lados, com a nota da 5.19 a proibir a reposição; colunas de `revisao_pares`,
`contactos_projecto` e `eixos_archive` idênticas; `UNIQUE(axis, week_start)` nos dois lados;
`pg_cron` e `pg_net` declarados e instalados.

### Leitura

**O ficheiro está em melhor estado do que o pendente que o acusava.** A regressão de
segurança anunciada não existe. O que existia eram duas afirmações falsas **dentro do próprio
ficheiro** — a idempotência e a data de geração —, um índice e um nome de política em falta,
e um histórico de migrações que não corresponde a nada.

**As quatro primeiras foram corrigidas a 14/09/2026, depois de o ficheiro ter sido corrido
pela primeira vez** (6.5 e 6.6): cabeçalho reescrito sem a palavra "idempotent" e com a
condição de uso à vista, corpo envolvido em `BEGIN`/`COMMIT`, `idx_eixos_archive_axis_week`
acrescentado, política de `bookmarks` renomeada para `Public read`. **E o ficheiro corrigido
foi então corrido outra vez** (6.7), porque uma correcção dada por boa sem ser corrida é o
mesmo defeito noutra roupa: passou, e o schema que produz coincide com o da instância real
nas três assinaturas.

**O histórico de migrações (6.3) não é corrigível** — é o que é, e é por isso que continua a
ser o achado mais importante desta secção: foi o único que sobreviveu a tudo o resto.

Para o apêndice metodológico, **6.3 vale mais do que a correcção**: o plano de recuperação
assentava num registo de migrações que não descreve a base de dados que existe, e ninguém
mentiu — a ferramenta que construiu o projecto escrevia sem registar. É uma observação sobre
o que acontece à rastreabilidade quando se constrói com ferramentas que escrevem por nós.

### Resolvido a 14/09/2026

- [x] **A re-corrida e a corrida interrompida — fechadas, e verificadas por execução.** O
      ficheiro passou a declarar a condição de uso no cabeçalho, sem a palavra "idempotent",
      e o corpo ficou envolvido em `BEGIN`/`COMMIT`. **O ficheiro já corrigido foi corrido de
      ponta a ponta numa base vazia e passou** (6.7) — incluindo o `CREATE EXTENSION pg_cron`
      dentro da transacção explícita, hipótese de recusa **refutada por execução**. A
      afirmação do cabeçalho sobre a corrida interrompida **não é inferência**.
- [x] **6.4, as duas partes de estado.** `idx_eixos_archive_axis_week` acrescentado com a
      definição lida de `pg_indexes.indexdef`; política de `bookmarks` renomeada para
      `Public read`. **As três assinaturas do schema produzido coincidem agora com as da
      instância real**, incluindo a de políticas com nome, que era a última a divergir.
      Restam as imprecisões **históricas** — o `749` e o cabeçalho "Generated: 2026-04-12" —,
      que são **registo do que se pensou e quando**, não estado a corrigir.
- [x] **Cabeçalho do SQL.** Reescrito: data de geração, data de edição do corpo, data em que
      o cabeçalho a acompanhou, condição de uso e remissão para 6.5, 6.6 e 6.7.

### Em aberto

- [ ] **O comportamento pelo caminho `psql` sem `--single-transaction`.** Com o
      `BEGIN`/`COMMIT` dentro do ficheiro a questão perde peso — a transacção passou a ser
      **propriedade do ficheiro e não do executor** —, mas **não foi medida**: exige a senha
      da base, que não estava disponível. É **a única afirmação desta secção que continua a
      assentar em leitura e não em execução**.
- [ ] **Apagar o projecto de teste `hypztdsgzuykoksrurto`.** Está **pausado** desde
      14/09/2026 e custa 0 USD, logo não há urgência. **Exige o painel do Supabase:** o MCP
      não elimina projectos, só pausa.

---

## 7. Um número de outra regra dentro do documento do método — 24/09/2026

**Erro dentro de `docs/metodo/2026-09-18-alertas-regra.md`. Não é uma divergência entre o
método e o código** — foi assim que o reportei primeiro, à Marta, e estava errado. Fica
escrito aqui pela ordem em que aconteceu, porque a primeira versão do achado circulou.

### O que estava escrito, e o que está na tabela

A secção 8 do método descrevia o conteúdo de `trends_alertas` para o lote de 5 anos de
18/09/2026 assim:

> 394 linhas: 149 semanas de subida (**109 disparos + 40 "em curso"**), 8 aparecimentos,
> 18 sazonais, 219 a observar.

Os totais estão certos e batem com a base: 149 + 8 + 18 + 219 = 394, verificado por consulta.
**O que não bate é a repartição das 149.** Na tabela, contando `semana_n`:

| | no documento | na tabela |
|---|---|---|
| semanas de subida | 149 | 149 ✓ |
| — disparos | **109** | **84** |
| — em curso | **40** | **65** |

### De onde veio o 109

Da **tabela de calibragem dos limiares**, secção 5 do mesmo documento — coluna "alertas",
linha dos parâmetros escolhidos (N_REF 8, z ≥ 3, razão ≥ 1,5). Esse varrimento correu **antes
de a máquina de estados existir**: a decisão 3, na secção 6, ainda a dava como *"a implementar
com a fase 3"*. O 109 é a contagem **sem estado** — quantas semanas disparariam se a
referência fosse recalculada todas as semanas. O **40** nunca foi contado: saiu de subtrair
109 a 149.

**E o próprio documento tinha o número certo, noutro sítio.** A decisão 3 escreve *"109
subidas → 84 acontecimentos"* — que é exactamente o que o código produz. A frase da secção 8 é
que juntou um número de uma regra com os totais de outra.

### As duas definições, e a que fica

**No código** (`scripts/trends_alertas.py`, `alertas_do_termo`, l.66–107): um acontecimento
começa na semana em que a subida dispara (`semana_n = 1`, `inicio` = essa semana) e **continua**
enquanto o valor se mantiver ≥ 1,5× a referência **congelada** de antes do disparo. Enquanto
está em curso, **não pode começar outro**. A referência e o ruído ficam congelados para que o
`z` gravado seja sempre `(valor − referência) / ruído`, como a coluna diz.

**No varrimento sem estado** (secção 5): cada semana é avaliada de novo contra a mediana das 8
anteriores. Um pico que se aguenta três semanas **deixa de disparar à terceira**, porque o
próprio pico já entrou na referência. Era este o defeito que a decisão 3 corrigia.

**Decidido pela Marta a 24/09/2026: fica a definição do código.** É a decisão 3, que ela
aprovou a 18/09, e é com ela que a linha 183 do método já concordava.

### O que se fez

- A frase da secção 8 passou a dizer **84 + 65**, com nota debaixo a explicar de onde veio o
  109 e porque é que ele continua certo **para aquilo que mede**. **Não se apagou nada** — a
  tabela da secção 5 fica como está, e o 109 continua a ser o número dela.
- **Não se mexeu no código.** Não havia nada para corrigir nele.

### Porque é que isto importa para a tese

O número que descreve os dados aparecia num documento de método a que o apêndice vai remeter.
Ninguém o teria apanhado a ler o documento sozinho: só bate ao contar as linhas da tabela. É o
mesmo padrão dos achados de Setembro — **a afirmação e a coisa afirmada têm de ser postas lado
a lado**, e aqui a coisa afirmada era uma tabela que ninguém tinha contado.

### Em aberto

- [ ] **Porque é que as semanas "em curso" cresceram no lote de 24/09.** De 65 para 508 no
      lote inteiro. Testado no próprio dia: os 40 termos novos fazem 357 dessas semanas com
      apenas 51 dos 129 disparos — têm tendências longas. **Mas os 33 termos medidos com o
      nome exactamente igual nos dois lotes também mudaram**: 47 disparos e 48 semanas em
      curso a 18/09, contra 39 e 74 a 24/09. Isto é, menos acontecimentos, cada um a durar
      mais — e isso não se explica por vocabulário novo.
      **Próximo teste, por correr:** comparar a resolução das séries dos mesmos 33 termos nos
      dois lotes. A suspeita é que um termo esmagado num grupo vinha em inteiros pequenos
      (0, 1, 0, 1) e agora, noutro grupo ou pelo passo 2, vem com resolução — e uma série com
      resolução aguenta-se acima do limiar mais semanas seguidas. **É suspeita, não
      resultado.**
- [ ] **Os alertas estão fora do ecrã** desde 24/09/2026 por causa desta pergunta em aberto,
      com nota na página. Os dados continuam a ser recolhidos e gravados.

---

## 8. Três coisas diferentes chamadas "top 5" — 24/09/2026

Achado ao responder a uma pergunta da Marta: *"em que unidade estão os números do top 5?"*.
A resposta obrigou a ler o cálculo, e a leitura destapou que **"top 5" designa três medidas
diferentes, em três sítios**, sem que nenhum deles diga qual é.

| onde | o que calcula | sobre que período | código |
|---|---|---|---|
| **arquivo semanal** | o valor medido de cada termo **naquela semana** | 1 semana | `archive-weekly/index.ts`, regra de 24/09 |
| **dashboard** | a **mediana** do valor de cada termo | últimas **52 semanas** | `trends_termo_52s.mediana_52s`, lido por `useTrendsLote.ts` |
| **registo do script 5** | a **mediana** do valor de cada termo | **os 5 anos todos** | `5_fetch_google_trends.py`, bloco da calibração |

Os três ordenam os mesmos termos, sobre os mesmos dados, e **dão listas diferentes** — o do
arquivo reage a uma semana, o do dashboard a um ano, o do script a cinco. Nenhum está errado;
o problema é chamarem-se todos o mesmo, e nenhum dizer no ecrã ou no registo qual é.

### A unidade, que também não está escrita em lado nenhum

**Nenhum dos três está no índice 0–100 do Google.** Cada pedido ao Google traz a sua própria
régua, onde o maior termo *daquele pedido* é 100. O script escolhe como **referência** o
pedido do passo 1 em que a âncora do eixo foi maior e multiplica os outros por
`mediana da âncora na referência ÷ mediana da âncora naquele pedido`.

Daí resulta que:

- a régua é o **0–100 do pedido de referência**, não do Google;
- **valores acima de 100 são esperados** — `dieta 232` lê-se "a dieta é cerca de 2,3× o maior
  termo do grupo de referência da alimentação";
- **os eixos não se comparam entre si**: cada um tem a sua âncora e a sua referência, logo
  `dieta 232` e `ansiedade 215` não estão na mesma escala.

### Nomes propostos — a Marta decide

Em linguagem corrente, sem jargão, para poderem aparecer no ecrã:

| medida | nome proposto |
|---|---|
| a semana | **os mais procurados da semana** |
| as 52 semanas | **os mais procurados do último ano** |
| os 5 anos | **os mais procurados em cinco anos** |

E, uma vez por página, a explicação da escala: *"os valores estão na régua do eixo, não numa
escala de 0 a 100, e não se comparam entre eixos."*

### Em aberto

- [ ] **Escolher os nomes** (ou outros) e aplicá-los nos três sítios.
- [ ] **Decidir se os três devem existir.** São três respostas a três perguntas diferentes, e
      pode ser essa a intenção — mas isso nunca foi decidido, foi acontecendo. Se só um for
      preciso, os outros saem.
