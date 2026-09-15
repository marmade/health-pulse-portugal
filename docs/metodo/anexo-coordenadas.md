# Anexo — coordenadas dos cinco casos de 14/09/2026

Aparato para a frase de `2026-09-14-afirmacao-e-coisa-afirmada.md`: *"as afirmações
documentais divergiram do sistema que descreviam, em três modos distintos, e todas foram
detectadas por comparação directa com o sistema."*

> **Âmbito, e uma desactualização declarada.** Este anexo dá coordenadas aos **cinco casos
> conhecidos a 14/09/2026** — A1, A2, A3, B1, C1. A 15/09/2026 a nota passou a **oito**: B2 (o
> `succeeded` do `pg_cron`), B3 (a coluna `timed_out` vazia) e B4 (a frase verdadeira e vazia
> sobre o deploy). **Esses três não têm coordenadas aqui.** A evidência deles está em
> `docs/evidencia/2026-09-15-cron-instancia-antiga/` (B2, B3) e em
> `docs/arquivo/2026-09-15-news-items-viva/README.md` (B4), e os commits são de 15/09/2026 —
> mas o aparato de graus não foi estendido a eles. Fica dito em vez de o número calar a
> diferença.

Cada caso é ligado abaixo ao seu ponto imutável. O repositório é **público** —
`github.com/marmade/health-pulse-portugal` —, portanto tudo o que é commit, ficheiro ou
linha de ficheiro pode ser verificado por qualquer pessoa, sem credenciais e sem pedir nada
a ninguém.

Compilado a 14/09/2026.

---

## Os três graus de prova

O grau não mede a confiança na afirmação. Mede **quem a pode auditar**.

| grau | significa | quem pode verificar |
|---|---|---|
| **1** | Existe no repositório público, num commit identificado | **qualquer pessoa** |
| **2** | Auditável por quem tenha credenciais da base de dados, ou por transcrição datada do resultado | quem tenha acesso, ou quem aceite a transcrição |
| **3** | Não verificável, e dito como tal | ninguém — fica registado como não verificável |

**Nenhum dos cinco casos é de grau 3.** Há afirmações de grau 3 no corpo do trabalho — as
*inferências* estão marcadas como tal no `AUDIT.md` e nesta nota —, mas não entre os casos.

---

## A tabela

| caso | data | modo | artefacto | grau | coordenada imutável |
|---|---|---|---|---|---|
| **A1** — cópia do estado congelada | 14/08→09/09/2026, resolvido 14/09 | A | **nenhum** — vivia na interface do claude.ai | **2** | `docs/sessoes/2026-09-14.md`, secção "O arranque: uma divergência de origem, e a sua causa" |
| **A2** — secção Stack contraditória | 09/09→14/09/2026 | A | `CONTEXT.md` | **1** | correcção `4d7504e`; pai `33b62b8`, ficheiro `CONTEXT.md` l.100–102 contra l.416 e l.428 |
| **A3** — cabeçalho a prometer idempotência | 12/04→14/09/2026 | A | `scripts/migration_consolidada.sql` | **1** | correcção `eacbfbf`; pai `2c563e1`, ficheiro l.4–5 |
| **B1** — `sha256` com alcance indevido | 14/09/2026 | B | mensagem de commit | **1** | afirmação em `92bfadf`; correcção em `d657344` |
| **C1** — histórico de migrações | 03→09/2026, achado 14/09 | C | `supabase/migrations/` + histórico remoto | **1** listagem · **2** remoto | listagem em `d657344`; lado remoto transcrito abaixo |

---

## A1 — a cópia do estado, congelada a 14/08

**Modo A. Grau 2 — testemunho, e não pode ser outra coisa.**

A cópia do `CONTEXT.md` no Project Knowledge do claude.ai estava no estado de 14/08/2026
enquanto o ficheiro vivo no repositório ia em 09/09/2026. Uma sessão leu a cópia como estado
actual.

**Não há artefacto no repositório, e não é omissão.** A cópia vivia na interface do
claude.ai, que não é versionável, e **já não existe**: foi substituída a 14/09/2026 por um
apontador para o repositório, decisão que fechou a divergência e ao mesmo tempo eliminou a
prova dela. Inventar-lhe um commit seria uma instância da família B.

**Coordenada:** `docs/sessoes/2026-09-14.md`, secção "O arranque: uma divergência de origem,
e a sua causa". Primeiro commit do registo: `c414ab9`. A secção está marcada `[declarado]` no
próprio registo — a substituição foi feita na janela de estratégia e transcrita, não
verificada no terminal.

**O que um terceiro pode verificar:** que o registo o afirma, e a data em que o afirmou. Não
o facto. É a distinção que o grau 2 existe para marcar.

---

## A2 — a secção Stack contraditória

**Modo A. Grau 1.**

A secção Stack descrevia a instância antiga como "em uso de facto" e dizia que o `.env`
apontava para lá. Era verdade a 13/08/2026 e deixou de ser a 09/09/2026, **sem que a secção
fosse actualizada** — enquanto, no mesmo ficheiro, o Crítico nº 3 e a tabela de Verificações
diziam o contrário.

| | commit | ficheiro |
|---|---|---|
| estado com a contradição | `33b62b8` | `CONTEXT.md`, 708 linhas |
| correcção | `4d7504e` | `CONTEXT.md` |

**As duas metades, no ficheiro do commit-pai `33b62b8`:**

- **l.100–102** — `- **Em uso de facto:** cyjwhmuakmiytypewwfw.supabase.co (Lovable) — é para
  aqui que o site publicado aponta. A migração da sessão 4 foi apagada: o .env aponta para a
  instância antiga e não contém credenciais da nova (verificado 13/08/2026)`
- **l.416** — Crítico nº 3, `.env` fora do tracking e a apontar para a instância certa,
  datado de 09/09/2026
- **l.428** — no mesmo Crítico: o bundle compilado contém `ijpxjpbjudaddfatibfl` e **zero
  ocorrências de `cyjwhmuakmiytypewwfw`**
- **l.63** — linha da tabela de Verificações com a mesma conclusão, de 09/09/2026

**Reprodução, sem credenciais:**

```
git show 33b62b8:CONTEXT.md | sed -n '100,102p'
git show 33b62b8:CONTEXT.md | sed -n '416p;428p'
```

As duas saídas contradizem-se, e são do mesmo ficheiro no mesmo commit. **É esse o achado** —
não que o documento estivesse desactualizado face ao mundo, mas que estivesse desactualizado
face a si próprio.

---

## A3 — o cabeçalho a prometer idempotência

**Modo A. Grau 1. É a única linha da tabela que um terceiro pode reproduzir por execução.**

| | commit | ficheiro |
|---|---|---|
| estado com a promessa falsa | `2c563e1` | `scripts/migration_consolidada.sql`, 632 linhas |
| correcção | `eacbfbf` | o mesmo, 660 linhas |

**No ficheiro do commit-pai `2c563e1`:**

- **l.4** — `-- Generated: 2026-04-12`
- **l.5** — `-- Source: 38 incremental migrations consolidated into a single idempotent script`

O corpo foi editado a 09/09/2026 — 31 políticas de escrita pública substituídas por uma nota
de nove linhas — e o cabeçalho não acompanhou até 14/09/2026.

**A promessa nunca foi verdadeira.** As 24 `CREATE POLICY` não têm `IF NOT EXISTS` — o
PostgreSQL não o oferece para políticas — e não havia uma única `DROP POLICY IF EXISTS` no
ficheiro. O **ponto de morte de uma segunda corrida é a l.429** do ficheiro pré-correcção:

```
git show 2c563e1:scripts/migration_consolidada.sql | sed -n '429p'
-- CREATE POLICY "Allow public read on trends_cache"
```

**Reprodução por execução, sem credenciais deste projecto.** Qualquer pessoa com uma base
PostgreSQL vazia à sua disposição pode:

```
git show 2c563e1:scripts/migration_consolidada.sql > consolidada-pre-correccao.sql
# correr uma vez  -> passa
# correr outra vez -> ERROR: 42710: policy "Allow public read on trends_cache"
#                     for table "trends_cache" already exists
```

Não é preciso acesso a nenhuma instância deste projecto: o ficheiro é DDL puro, sem inserções
de dados. **É a única das cinco linhas que se verifica sem aceitar a palavra de ninguém.**

---

## B1 — o `sha256` com alcance indevido

**Modo B. Grau 1 — e o artefacto é uma mensagem de commit, não um ficheiro.**

A 14/09/2026 foi calculado no terminal o `sha256` do ficheiro
`scripts/migration_consolidada.sql` e comparado com o do ficheiro versionado. Coincidiam. Daí
foi tirada uma conclusão que o cálculo não sustenta.

**A afirmação errada, tal como está na mensagem de `92bfadf`:**

> Uma verificação feita no terminal, que o registo não tinha: o sha256 do ficheiro
> corrido é idêntico ao do ficheiro versionado. A ressalva de 6.5 sobre o ficheiro
> ter sido transmitido pela janela de conversa, e não copiado byte a byte, NÃO se
> aplica a este segundo teste — é o mesmo ficheiro, e está provado por hash, não
> por consequência.

**O que estava errado.** O `sha256` prova que o ficheiro **em disco** é idêntico ao
**commitado**. Não prova que o **texto executado contra a base** fosse idêntico ao ficheiro —
o texto foi composto a partir de uma leitura anterior mais quatro alterações, e passou pela
janela de conversa. Uma verificação verdadeira a responder a uma pergunta diferente da que
lhe foi feita.

**Correcção:** `d657344`. O `sha256` fica no `AUDIT.md` 6.7 com a função que tem — **fixar de
que versão do ficheiro o teste fala** — e a ressalva de transmissão de 6.5 é explicitamente
mantida.

**Reprodução:**

```
git log --format=%B -1 92bfadf   # a afirmação errada
git log --format=%B -1 d657344   # a correcção
```

A mensagem de `92bfadf` **não foi reescrita**, por estar publicada. A regra em vigor —
histórico anota-se, não se reescreve — aplica-se também a mensagens de commit.

---

## C1 — o histórico de migrações

**Modo C. Grau 1 na listagem, grau 2 no lado remoto. É o único caso sem correcção possível.**

### A metade de grau 1 — a pasta

`supabase/migrations/` tem **42 ficheiros**, verificável em qualquer commit desta sessão:

```
git ls-tree --name-only d657344 supabase/migrations/ | wc -l
# 42
```

Os quatro de 09/09/2026:

```
supabase/migrations/20260909160000_contactos_projecto_rls_restrict.sql
supabase/migrations/20260909180000_revisao_pares_sem_escrita_anonima.sql
supabase/migrations/20260909190000_sem_escrita_anonima_em_todas_as_tabelas.sql
supabase/migrations/20260909200000_revisao_pares_sem_contactos.sql
```

### A metade de grau 2 — o histórico remoto

**Não está no repositório e não pode estar:** é uma consulta à base de dados. Transcrita
abaixo com data, para ser auditável por quem tenha credenciais.

**Consulta:** MCP Supabase `list_migrations`, projecto `ijpxjpbjudaddfatibfl`, **14/09/2026**.
**Resultado — 8 registos, e só 8:**

| versão | nome |
|---|---|
| `20260325175113` | `create_base_tables` |
| `20260325175135` | `create_dependent_tables` |
| `20260325180407` | `fix_eixos_archive_correct_schema` |
| `20260327222809` | `add_eixo_and_subcategoria_to_bookmarks` |
| `20260909151958` | `contactos_projecto_rls_restrict` |
| `20260909180147` | `revisao_pares_sem_escrita_anonima` |
| `20260909181907` | `sem_escrita_anonima_em_todas_as_tabelas` |
| `20260909192141` | `revisao_pares_sem_contactos` |

**O cruzamento das duas metades, que é o achado.** A relação parte-se de duas maneiras
diferentes, e confundi-las apaga o resultado:

- **4 dos 8 registos remotos não têm ficheiro local nenhum** — os de Março. História perdida:
  foram aplicados e não ficou o SQL.
- **Os outros 4 têm ficheiro local com o mesmo nome e número de versão diferente.** Não é
  ausência, é a mesma migração com duas identidades. Como o Supabase decide pela versão e não
  pelo nome, **um `db push` não vê nenhuma das quatro correcções de 09/09 como aplicada**.

Equivalente em `AUDIT.md` secção 6.3, no commit `d657344` l.498.

---

## Uma ressalva que atravessa a tabela toda

**"Verificável" aplica-se às divergências, não às suas causas.**

Todas as cinco linhas acima permitem a alguém confirmar **que a divergência existiu** — o
texto está no commit, a segunda corrida devolve o erro, a listagem tem 42 ficheiros e o
histórico tem 8 registos. Nenhuma delas prova **porque** existiu.

O caso mais claro é o C1. A explicação escrita — o Lovable aplicou SQL directo sem registar,
e o registo só começou quando se passou a aplicar por CLI/MCP — é **dedução compatível com as
datas**: o projecto foi criado a 08/03/2026 e o histórico remoto começa a 25/03. É plausível,
encaixa, e **não é verificável**. O registo que a provaria é precisamente o registo que não
existe — é essa a definição do modo C.

Está marcada como *inferência, não verificada* no `AUDIT.md` 6.3, e repete-se aqui para que a
tabela não empreste às causas o grau que só as divergências têm.

O mesmo vale, em menor escala, para o `749` de A3: que o número estivesse errado é grau 1;
que a diferença de 117 linhas venha da substituição das 31 políticas pela nota de nove linhas
é dedução.

---

## Limite deste anexo

As coordenadas de grau 1 apontam para commits do ramo `main` de um repositório que continua a
ser trabalhado. **Um commit é imutável; o repositório não é** — pode ser tornado privado,
movido ou apagado, e nesse dia as coordenadas deixam de valer para terceiros.

Fechar isso exige um instantâneo depositado fora do GitHub, com identificador permanente.
Está registado como pendente no `CONTEXT.md`.
