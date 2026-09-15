# Dois `pg_cron` na instância antiga — 15/09/2026

> Prova de que `cyjwhmuakmiytypewwfw` **não está congelada**: um dos dois agendadores
> internos corre todos os dias desde 09/03/2026, sem falhar um único dia — incluindo os
> 156 dias posteriores à migração de 12/04/2026.

## Ficheiros

| ficheiro | query | sha256 |
|---|---|---|
| `cron-job-export-2026-09-15.csv` | `select jobid, schedule, command, active from cron.job order by jobid` | `bade9b8bca920f24252a85a92d25e8ecf97af512f1afae469ceca83b689d8eb2` |
| `cron-job-run-details-2026-09-15.csv` | `select jobid, status, start_time, end_time from cron.job_run_details order by start_time desc limit 30` | `5d6da16d92915ab1ac33da275c655d40fc833c67f8a94a8f1e6753efdb70cd76` |
| `cron-job-1-periodo-2026-09-15.csv` | `select min(start_time), max(start_time), count(*) from cron.job_run_details where jobid = 1` | `6868cfa5a8129517d6f3b0ca5ea10e49827c31ecf424bf659adcaca1ff20dea0` |

Corridas no **SQL editor do Lovable Cloud** a 15/09/2026, entre as 10:50 e as 11:20 (hora
local).

**Fidelidade das cópias:** os três ficheiros vieram do computador da Marta para esta pasta
através da sessão do Cowork, em base64, com o sha256 comparado nas duas pontas. São cópias,
não transcrições.

## Onde foi corrido, e porque foi ali

`[bd]` Instância `cyjwhmuakmiytypewwfw`, pelo **SQL editor do Lovable Cloud** — o único
acesso administrativo que existe a esta instância. O MCP Supabase responde "You do not have
permission" e a chave `anon` do histórico do git não lê o schema `cron`.

**O painel "Cloud" do Lovable É esta instância.** Verificado a 15/09/2026 por comparação de
contagens: o painel mostra `historical_snapshots` 12072, `health_questions` 3362,
`news_items` 2128, `bookmarks` 180, e pedidos REST directos a
`cyjwhmuakmiytypewwfw.supabase.co` com a chave `anon` (`scripts/switch_supabase.sh:48`)
devolvem exactamente os mesmos quatro números.

## Os dois jobs

| jobid | active | schedule | invoca |
|---|---|---|---|
| 1 | **true** | `0 6 * * *` (diário, 06:00 UTC) | `fetch-rss-feeds` → escreve `news_items` |
| 2 | false | `0 6 * * *` | `refresh-trends` → escreveria `historical_snapshots` |

Os dois usam `net.http_post` com a chave `anon` da instância antiga em claro no corpo do
comando. Essa chave já estava no histórico público do git — isto não acrescenta exposição,
mostra o mecanismo.

## O histórico de execuções do job 1

**191 execuções, de 09/03/2026 06:00 UTC a 15/09/2026 06:00 UTC.** As 30 mais recentes
(17/08 a 15/09) estão todas com `status = succeeded`, sem uma única falha, sempre às
06:00:00 UTC.

*Aritmética minha:* o intervalo 09/03–15/09 inclusive tem **191 dias** e há **191
execuções** — uma por dia, todos os dias, durante seis meses e uma semana. E de 12/04/2026,
data da migração para `ijpxjpbjudaddfatibfl`, até hoje vão **156 dias** em que este job
continuou a correr numa instância que o projecto já tinha abandonado.

### `succeeded` aqui não significa que escreveu

Cada execução dura cerca de **100 ms** (*aritmética minha*: 06:00:00.214546 →
06:00:00.313409, a 15/09). Recolher 44 feeds RSS não se faz em décimo de segundo. O
`net.http_post` **despacha** o pedido e devolve — logo `succeeded` diz que o pedido saiu,
não que a Edge Function correu, nem que escreveu.

**É a mesma armadilha que o `AUDIT.md` secções 2 e 3 descrevem para o `success` do GitHub
Actions.** Duas ferramentas diferentes, o mesmo erro de leitura: um estado verde que reporta
o despacho e é lido como resultado.

O que prova que houve escrita não é o verde — é o crescimento de `news_items`: **1994**
linhas a 09/09/2026 (`CONTEXT.md`, tabela de Verificações) contra **2128** a 15/09/2026
(leitura REST desta data).

## O que isto prova

1. **`news_items` da instância antiga cresce todos os dias.** *Aritmética minha:* 134 linhas
   em 6 dias, ~22/dia — compatível com uma recolha diária sobre 44 feeds.
2. **`historical_snapshots` está parada por o job 2 estar inactivo**, não por avaria.
   Coerente com as 12072 linhas inalteradas e com o congelamento a partir de 14/04/2026 já
   registado na sessão 12.
3. **Nenhum dos dois consta do repositório.** Não há ficheiro de migração que os crie. Foram
   criados no dashboard — exactamente o cenário que a regra de "Padrões estabelecidos"
   descreve: *"foi assim que o cron da instância antiga ficou invisível no repositório e
   continuou a copiar dados de Abril durante meses sem ser detectado"*. Até hoje era
   suspeita; passa a observação, com o comando e as 191 execuções à vista.

## O que isto NÃO prova

- **Não prova que cada uma das 191 execuções escreveu.** Prova que foram despachadas. Ver a
  ressalva sobre os 100 ms acima.
- **Não diz quando os jobs foram criados**, só quando correram pela primeira vez com
  registo. A primeira execução registada é de 09/03/2026 — um dia depois de o projecto ter
  sido criado (08/03/2026, `AUDIT.md` 6.3) —, mas `cron.job_run_details` pode ser purgada e
  isso não foi verificado.
- **Não diz desde quando o job 2 está inactivo.** A tabela `cron.job` não guarda essa data.
- Não foi verificado se existem agendadores fora do schema `cron`.
- ~~Não foi verificado se a instância **nova** tem jobs equivalentes. **Fica por fazer.**~~
  **Feito, e no mesmo dia** — ver `docs/sessoes/2026-09-15.md` §2.5. `select count(*) from
  cron.job` contra `ijpxjpbjudaddfatibfl`, por MCP Supabase: **0**. Re-confirmado no
  terminal a 15/09/2026 antes deste commit. A instância nova não tem agendador interno
  nenhum; toda a automação dela passa pelo GitHub Actions, que está versionado.

## Consequência para o `CONTEXT.md`

A descrição "congelada a 30/04" é **falsa para `news_items`** e verdadeira para
`historical_snapshots`. A instância antiga é descrita no documento como inerte e escreve
todas as manhãs às 06:00 UTC.

## Nota antes de apagar

Apagar a instância (Crítico nº 4) destrói esta prova. É essa a razão de esta pasta existir
antes da decisão, e não depois.

---

# Acrescento de 15/09/2026, 11:42 — a escrita fica provada, e quantificada

`[sessão 14][bd][agregado]` `select count(*), count(*) filter (where created_at >=
'2026-04-12'), min(created_at), max(created_at) from news_items`, no SQL editor do Lovable
Cloud. Ficheiro `news-items-antes-depois-migracao-2026-09-15.csv`, sha256
`6239b4490ff5a0fdeca010d78634cd0a4d7382f8f0a680a014fb030980f925f5`.

| | |
|---|---|
| total | **2128** |
| criadas em ou depois de 12/04/2026 | **1975** |
| mais antiga | 2026-03-08 11:08:46 UTC |
| mais recente | **2026-09-15 06:00:54 UTC** |

## 1. A ressalva dos 100 ms fica levantada — houve escrita, e sabe-se a que horas

A execução do cron de hoje arrancou às **06:00:00.214546** e a linha mais recente de
`news_items` tem `created_at` **06:00:54.130258**. *Aritmética minha:* **53,9 segundos**
depois.

A cadeia fecha-se inteira: o `pg_cron` despacha, a Edge Function corre, a linha aparece. O
que antes era "o pedido saiu" passa a ser **"o pedido saiu e a escrita chegou"**, com a
distância entre os dois medida.

Isto não invalida a ressalva geral — `succeeded` continua a não provar escrita, e 100 ms
continua a ser tempo de despacho. O que se provou foi **esta** execução, pelo efeito e não
pelo estado.

## 2. 93% do conteúdo foi escrito depois do abandono

*Aritmética minha:* 2128 − 1975 = **153** linhas anteriores a 12/04/2026, e **1975**
posteriores — **92,8% do total**.

A instância foi abandonada a 12/04/2026 e produziu, depois disso, treze vezes mais conteúdo
do que tinha produzido antes. O que o projecto deixou para trás não era um arquivo parado:
era um sistema em funcionamento, a acumular material que ninguém lia, em cima de dados
pessoais que ninguém tinha fechado.

*Nota:* as 153 linhas anteriores são compatíveis com as "158 notícias migradas do Lovable"
registadas no `CONTEXT.md`, secção Estado do Admin, mas **não são o mesmo número** e a
diferença não foi investigada. O filtro põe o próprio dia 12 do lado de "depois".

## 3. Para o apêndice metodológico

É o caso mais limpo de falha silenciosa que este projecto produziu, e distingue-se dos
outros num ponto: os outros são erros de leitura de estado — um `success` que não prova
escrita, um documento que se contradiz. Este é **infraestrutura que a ferramenta criou e não
registou em lado nenhum**, a correr durante 191 dias, 156 deles depois de o projecto ter
mudado de casa.

Não houve engano de ninguém. Houve uma automação que não deixou rasto no sítio onde se
procura rasto.

---

# Acrescento de 15/09/2026, 11:56 — o mesmo evento, três estados que se contradizem

`[sessão 14][bd]` `select count(*), min(created), max(created) from net._http_response` e
depois `select id, status_code, content_type, timed_out, error_msg, left(content,500) from
net._http_response`, no SQL editor do Lovable Cloud.

Ficheiros: `net-http-response-contagem-2026-09-15.csv` (sha256
`2fc0b99b2a1f532568bf48771b115e6f0eeb02db6981f4e9afd4dacb149823f1`) e
`net-http-response-detalhe-2026-09-15.csv` (sha256
`23a2d2524c5199bccb5c49ac8ef43288bbdc15f28433baad1f6c5070f94f8470`).

## O registo existe, e é um erro

O `pg_net` guarda **uma** resposta — o `created` é de hoje, 06:00:00.320625 UTC. As
anteriores foram purgadas pela própria extensão. Essa única entrada (`id` 333) tem
`status_code` **vazio**, `content` **vazio**, e `error_msg`:

> `Timeout of 5000 ms reached. Total time: 5001.281000 ms (DNS time: 178.884000 ms,
> TCP/SSL handshake time: 99.029000 ms, HTTP Request/Response time: 4722.418000 ms)`

O cliente esperou cinco segundos pela Edge Function, desistiu, e registou falha.

## E a escrita aconteceu

A linha mais recente de `news_items` tem `created_at` **06:00:54** — 54 segundos depois do
despacho. A função continuou a correr depois de o cliente ter deixado de a ouvir.

## Três estados para o mesmo evento

| onde | o que diz | o que realmente observa |
|---|---|---|
| `cron.job_run_details` | `succeeded` | que o `select net.http_post(...)` executou sem erro de SQL |
| `net._http_response` | timeout, falhou | que a resposta HTTP não chegou em 5 s |
| `news_items` | linha escrita às 06:00:54 | o efeito |

**Nenhum dos dois estados registados corresponde ao que aconteceu.** O verde afirma sucesso
sobre uma coisa que não observa; o vermelho afirma falha sobre uma execução que funcionou. O
único sítio onde está a verdade é o efeito.

Isto é mais forte, para o apêndice metodológico, do que o achado dos `pg_cron` em si: não é
um sistema que falha em silêncio, é um sistema que **reporta em três direcções diferentes**
sobre o mesmo acontecimento.

## Uma inconsistência por explicar, deixada por explicar

A entrada tem `created` = 06:00:00.320625, isto é **106 ms** depois do arranque do cron
(06:00:00.214546), mas a mensagem de erro fala em **5001 ms** de tempo total. Os dois valores
não podem estar ambos certos para o mesmo instante.

*Não foi apurado* o que a coluna `created` marca no `pg_net` — se o momento do registo da
resposta, se o da criação da entrada no despacho. **Fica assinalado e não resolvido.** A
leitura de que "houve timeout" assenta no `error_msg`, não nesta coluna.

## O que isto NÃO prova

- **Não prova que as outras 190 execuções deram timeout.** O `pg_net` purga, e só existe a
  de hoje. Que o padrão se repita é plausível e **não está medido**.
- **Não prova que a função escreveu por causa desta invocação.** A coincidência temporal
  (despacho 06:00:00, escrita 06:00:54, uma só invocação nesse dia) é forte, mas é
  coincidência temporal.
- Não se sabe qual o *timeout* configurado na chamada nem se é o valor por omissão do
  `pg_net`.

---

# Acrescento de 15/09/2026 — a coluna `timed_out` está vazia

> Achado na **vistoria feita no terminal** (Claude Code) ao commitar esta pasta, por leitura
> do `net-http-response-detalhe-2026-09-15.csv` com um leitor de CSV. Não é do Cowork e não
> veio de consulta nova à base: está no ficheiro que já cá estava.

A linha `id` 333 de `net._http_response` tem `error_msg` a descrever um *timeout* de
5001,281 ms — e a coluna **`timed_out` vazia**, não `t`.

| coluna | valor |
|---|---|
| `id` | `333` |
| `status_code` | vazio |
| `content_type` | vazio |
| `timed_out` | **vazio** |
| `inicio_do_conteudo` | vazio |
| `error_msg` | `Timeout of 5000 ms reached. Total time: 5001.281000 ms …` |

## Porque é que isto importa, e não é só um detalhe

A secção acima descreve **três** sítios a contradizerem-se sobre o mesmo evento. Com isto, a
contradição deixa de ser só entre sítios e passa a existir **dentro de um deles**: a coluna
cuja função é sinalizar *timeout* **não o sinaliza**, enquanto o campo de texto da mesma
linha o descreve com precisão de microssegundos.

Se alguém for verificar isto por consulta — e a consulta natural é
`where timed_out is true` ou `where status_code >= 400` — **esta linha não aparece em
nenhuma das duas**. O registo existe, contradiz o `succeeded` do `cron`, e é invisível ao
filtro que o iria procurar.

É o mesmo padrão que o `AUDIT.md` 6.1 e a secção Stack do `CONTEXT.md` descrevem — **uma
fonte que se contradiz a si própria** —, aqui em infraestrutura em vez de documentação. Para
o apêndice metodológico é o exemplo mais afiado da série, por não precisar de duas
ferramentas para acontecer.

## O que isto NÃO prova

- **Não prova que o `pg_net` esteja avariado.** Pode ser semântica da extensão — por
  exemplo, `timed_out` só preenchido em certos modos de falha. **Não foi apurado**, e a
  documentação da extensão não foi consultada.
- **Não altera a leitura da secção acima.** Continua a assentar no `error_msg`, que é
  explícito. O que este acrescento mostra é que essa escolha de campo **não era indiferente**:
  ler pelo `timed_out` teria dado "sem falha registada".
- **Não é uma medição nova.** É leitura do CSV já guardado. Nenhuma consulta foi corrida à
  instância antiga para o escrever.
