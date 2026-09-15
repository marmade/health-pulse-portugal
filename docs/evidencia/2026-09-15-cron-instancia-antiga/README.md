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
