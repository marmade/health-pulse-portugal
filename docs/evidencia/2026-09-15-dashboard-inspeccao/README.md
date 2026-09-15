# Inspecção do dashboard — 15/09/2026

> **O que é:** seguir cada número que a página apresenta ao leitor até à sua origem.
> Não é auditoria de código nem revisão de UI — é verificar se o que está escrito no ecrã
> é sustentado pelo dado que está por baixo.
>
> **Âmbito limitado. Ver "O que NÃO foi inspeccionado" no fim** — esta passagem cobre a
> página principal (`/`) e os componentes que ela usa. Não é varrimento completo.

## Ficheiros desta pasta

| ficheiro | o que é |
|---|---|
| `ranking-urgencia.py` | reimplementa em Python o ranking que o dashboard calcula, a partir do instantâneo |
| `keywords-volumes-2026-09-15.json` | as 83 keywords com `current_volume`, `previous_volume`, `change_percent` |
| `app-settings-2026-09-15.json` | o `last_refreshed` que o cabeçalho mostra |
| `output-ranking-2026-09-15.txt` | saída do script, com `sha256` da entrada à cabeça |

O script **não toca na base de dados** — lê o instantâneo versionado.

---

## Achado 1 — o ranking de urgência inverte-se, e mostra o contrário do que ordena

**"Prioridade de comunicação esta semana"** é a única coisa na página que diz ao leitor
**o que fazer**. `[sessão 14][ficheiro]` `src/pages/Index.tsx:116-122`:

```ts
const avgChange = allKw.reduce((s, k) => s + k.changePercent, 0) / allKw.length;
const emergentCount = allKw.filter((k) => k.isEmergent).length;
const alertCount = alerts.filter((a) => a.axisLabel === axis.label).length;
const score = avgChange + (emergentCount * 30) + (alertCount * 20);
```

Reproduzido por `ranking-urgencia.py`. **Os dois ordenamentos não coincidem em nenhuma
posição:**

| | por `avgChange` — o que os dados dizem | pelo `score` — o que a página mostra |
|---|---|---|
| 1.º | alimentação −52,0% | **emergentes, score +12,6** |
| 2.º | menopausa −54,7% | alimentação, score −2,0 |
| 3.º | saúde mental −56,4% | menopausa, score −54,7 |
| 4.º | **emergentes −57,4%** | saúde mental, score −56,4 |

**`emergentes` é o último por `avgChange` e o primeiro por `score`.** É também o **único
eixo com score positivo** — e nenhum eixo tem `avgChange` positivo.

**E ao lado de "emergentes", em 1.º lugar, a página imprime `-57%`** (`Index.tsx:263`
mostra `avgChange`, não o score). O leitor vê o eixo mais prioritário rotulado com a maior
queda da lista, sem explicação de como as duas coisas se conciliam.

### Três keywords decidem a ordem inteira

| eixo | keyword | antes → depois | variação | conta como |
|---|---|---|---|---|
| alimentação | `refluxo gastroesofágico` | 6 → 13 | +116,7% | emergente (+30) e alerta (+20) |
| emergentes | `avc` | 34 → 59 | +73,5% | emergente (+30) e alerta (+20) |
| emergentes | **`candida auris`** | **1 → 2** | **+100,0%** | **alerta (+20)** |

`candida auris` **passa de 1 para 2** num índice normalizado 0–100 — movimento no chão da
escala — e contribui **20 pontos**, mais do que a distância entre o 3.º e o 4.º lugar.

**A fórmula não usa só dados partidos: amplifica-os 30 e 20 vezes, e depois ordena por
eles.** Os pesos foram escolhidos para uma escala de percentagens; os sinais que os
disparam são movimentos de uma e duas unidades.

> **Correcção registada.** Uma primeira leitura desta inspecção afirmou que o `alertCount`
> estava **inerte a zero** nos quatro eixos. **É falso** — há 3 alertas, verificados com a
> consulta abaixo, e são eles que produzem a inversão para o 1.º lugar em vez do 2.º. A
> afirmação errada fazia o defeito parecer **menor** do que é.

```sql
select axis, term, current_volume, previous_volume, change_percent,
       (change_percent >= 50 and current_volume >= 10) as conta_emergente,
       (change_percent >= 40) as gera_alerta
from keywords where is_active and change_percent >= 40 order by axis, change_percent desc;
```

---

## Achado 2 — metade das keywords activas está a zero, e o zero é ambíguo

`[sessão 14][bd]` **43 das 82 keywords activas têm `current_volume = 0`** (52%).

```sql
select count(*) filter (where current_volume = 0) as zero, count(*) as activas
from keywords where is_active;
```

**Um `0` aqui significa ao mesmo tempo "ninguém procura isto" e "a recolha falhou".** O
`5_fetch_google_trends.py` escreve `0` quando a recolha falha em vez de manter o valor
anterior ou marcar erro — está registado no `CONTEXT.md`, secção Automatização, desde
13/08/2026.

**Não se afirma qual das duas causas domina: ninguém contou, e o dado não permite contar.**
A indistinção **é** o defeito. Nas palavras que o `CONTEXT.md` já usa: **o estado real é
desconhecido**, e o dashboard apresenta-o como uma queda medida.

É sobre esta média que o `avgChange` é calculado, e é ela que aparece no ecrã como `-52%`,
`-55%`, `-57%`.

---

## Achado 3 — o painel de perguntas ordena por um número fabricado

`[sessão 14][ficheiro]` `src/components/HealthQuestionsPanel.tsx:31` ordena por
`relative_volume` descendente, e `:103` desenha a barra com `width: ${relativeVolume}%`.

O `relative_volume` **é a posição na lista, não um volume**:
`max(10, 100 - rank*8)` no script 6 e `max(10, 100 - pos*5)` no script 7 — já registado no
`CONTEXT.md`, Verificações, 07/09/2026.

**Consequência medida:**

```sql
select relative_volume, count(*) from health_questions
group by relative_volume order by relative_volume desc limit 3;
```

**263 linhas empatadas no valor 100.** O painel mostra 15 (ou 30 na vista geral) e ordena
**só** por esse campo — logo **quais 15 dos 263 aparecem é indeterminado**, decidido pela
ordem que a base devolver. É a mesma classe de problema que
`docs/evidencia/2026-09-15-rotulagem-news-items/` documenta para os rótulos.

O que estava no topo a 15/09/2026:

```sql
select question, source, relative_volume, growth_percent
from health_questions order by relative_volume desc, question limit 12;
```

> *"a solidão dos números primos"* — um romance de Paolo Giordano
> *"a grande solidão"* · *"adeus solidão"*
> *"associação portuguesa de familiares e amigos dos doentes de alzheimer"* — o nome de
> uma instituição, não uma pergunta

E a maioria com `growth_percent = 9999`, que é o **tecto** do script 6 e não uma medida —
ver `docs/arquivo/2026-09-15-health-questions/`.

**A barra que o leitor vê é o número inventado desenhado à escala.**

---

## Achado 4 — um carimbo de data para quatro fluxos com ritmos diferentes

`[sessão 14][bd]` `app_settings.last_refreshed = 2026-08-10T08:27:23Z`, que o cabeçalho
mostra como **"ACTUALIZADO 10/08/2026"**.

`[sessão 14][ficheiro]` Quem escreve esse valor é a Edge Function `refresh-trends`
(`supabase/functions/refresh-trends/index.ts:55-59`) — **o passo 3 do workflow, comentado
desde 14/08/2026**. O carimbo ficou parado no dia em que o passo foi desligado.

**Não é falso — é incompreensível.** Na mesma página, ao mesmo tempo:

| fluxo | actualizado em |
|---|---|
| `news_items` | **14/09/2026** (run #38) |
| `health_questions` (pytrends) | **14/09/2026** |
| `health_questions` (autocomplete) | 07/09/2026 (passo 2B desligado a 09/09) |
| `keywords` / `historical_snapshots` | **parados desde 10/08** |

Um único carimbo não pode descrever isto, e o que ele descreve é o fluxo mais antigo.

---

## O que está genuinamente bem, e não é cortesia

- **Não há dados de demonstração.** `Index.tsx:31` — *"Use only real DB data — no mock
  fallback"* — e cumpre-se: tudo o que está errado vem da base, nada é inventado no
  frontend. Num protótipo desta idade, é raro.
- **A arquitectura separa o que deve separar.** Os componentes não calculam factos; os
  hooks leem; a base é a fonte única.
- **O `client.ts` pára com mensagem explícita** se faltarem as variáveis de ambiente.
- **Todos os defeitos acima estão agora medidos**, com script reproduzível. Há uma semana,
  nenhum estava.

---

## O diagnóstico de fundo

**Todos os defeitos encontrados estão na camada de dados, e a camada de apresentação não
tem nenhuma noção de qualidade.**

Não existe estado "desconhecido" em lado nenhum. O `0` é procura nula **e** falha de
recolha. O `relative_volume` é volume **e** posição na lista. O `keyword_id` diz "é deste
tema" com 53% de erro medido. O `9999` é crescimento **e** tecto.

**O dashboard apresenta tudo com a mesma confiança visual — porque nunca lhe foi dada
informação para distinguir.** A regra que já está escrita no `CONTEXT.md` — *`NULL` +
estado explícito, nunca `0`* — não é higiene de dados: é a correcção que **faz o resto
aparecer sozinho**.

---

## Ordem de trabalho — DUAS LEITURAS, e nenhuma é decisão tomada

**Há divergência sobre por onde começar. Fica registada como divergência.**

**Leitura A — recolha primeiro.** O Crítico nº 6 (`NULL` + `collection_status`) antes de
qualquer correcção de apresentação. Argumento: se os rótulos forem corrigidos na quinta e a
página voltar a parecer coerente, os `-52%` continuam lá e **passam a ter ar de medida
fiável**. Corrigir o que se vê antes do que se mede torna o erro mais difícil de encontrar,
não menos.

**Leitura B — os rótulos primeiro.** O trabalho de quinta **não depende** do Crítico nº 6:
o `news_items` é o **único fluxo que não está partido** — recolhe todos os dias, e o defeito
é de rotulagem, não de recolha. A correcção é barata, está decidida, e o Crítico nº 6 está
**bloqueado numa decisão sobre o Google Trends aberta desde 07/09/2026**. Fazer depender o
barato e decidido do caro e indeciso trava os dois.

**Não decidido a 15/09/2026.**

---

## Pendentes que saem desta inspecção

1. **O ranking de urgência precisa de estado explícito — não de desaparecer.**
   `[decisão de desenho, da Marta]` A recomendação **não** é remover o bloco, é mostrar
   **"sem dados fiáveis para esta semana"** quando os dados não sustentam um ranking. A
   diferença importa: remover esconde o problema, declarar mostra-o. **Não implementar** —
   é decisão de desenho e não de código.
2. **Rever os pesos 30 e 20 quando houver dados a sério.** Foram escolhidos para uma escala
   de percentagens e são disparados por movimentos de uma unidade. Mesmo com recolha
   corrigida, um bónus fixo de 30 pontos sobre uma média de percentagens não tem escala
   comum.
3. **Desempate determinista no painel de perguntas**, pela mesma razão do `ORDER BY` dos
   rótulos: 263 empates e 15 lugares.

---

## O que NÃO foi inspeccionado

**Isto não é um varrimento completo, e não deve ser lido como tal.** Ficaram de fora:

- **`/briefing`** (`Briefing.tsx`, 780 linhas)
- **`/guioes`** (`Guioes.tsx`, 744 linhas)
- **`/mural`**, **`/plataforma`**, **`/revisao-pares`**, **`/textos`**, **`/sobre`**,
  **`/editorial/bookmarks`**, **`/editorial/benchmark`**
- **As exportações em PDF** — `pdfExport.ts`, `briefingPdfExport.ts`, `eixoPdfExport.ts`,
  `csvExport.ts`. **São provavelmente o que vai para a tese**, e merecem a mesma passagem
  que a página principal levou aqui.
- **O comportamento no browser.** Tudo acima é leitura de código cruzada com dados. **Nada
  foi observado a correr**, e o ramo dos `historical_snapshots` em `useAxisData.ts:104-111`
  não foi exercitado.
