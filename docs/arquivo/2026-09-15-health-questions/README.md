# `health_questions` da instância viva — exportação de 15/09/2026

Exportação feita na sessão 14 para cumprir o **Crítico nº 7**: *"exportar primeiro as 3634
linhas de autocomplete que já estão na base de dados. Só depois tocar no script — mexer
antes perde-as."*

O item só pedia o autocomplete. O `pytrends` foi exportado ao lado por custar o mesmo e
permitir comparar as duas fontes sem voltar à base — e foi nessa comparação que apareceu o
achado da secção final.

## Método

`[sessão 14][bd]` Leitura REST a `ijpxjpbjudaddfatibfl.supabase.co/rest/v1/health_questions`,
filtrada por `source`, com a chave `anon` do `.env`, `Accept: text/csv`, paginada em blocos
de 1000 com `order=id.asc`.

| ficheiro | registos | colunas |
|---|---|---|
| `health_questions_autocomplete.csv` | **3634** | 12 |
| `health_questions_pytrends.csv` | **1013** | 12 |

As contagens batem exactamente com `select source, count(*) … group by source` na base, e as
12 colunas batem com o `information_schema` (verificado a 15/09 na comparação administrativa).

Períodos: autocomplete **28/03 a 07/09/2026** — parado desde que o passo 2B foi comentado a
09/09; pytrends **27/03 a 14/09/2026**, ainda a crescer.

---

## O autocomplete: o que o `AUDIT.md` previa, agora contado

`[sessão 14][ficheiro][agregado]` Análise dos 3634 registos exportados.

| campo | valor |
|---|---|
| `growth_percent` = 0 | **3634 de 3634 (100%)** |
| `is_question` = verdadeiro | **3634 de 3634 (100%)** |
| `relative_volume` = 10 | **2408 de 3634 (66,3%)** |
| `relative_volume` — valores distintos | 19 |
| `keyword_id` preenchido | **0** |

Os três primeiros confirmam, com contagem, o que estava registado como leitura de código
(`scripts/7_fetch_autocomplete_questions.py`, linhas 142, 146 e 151): o volume é a posição na
lista disfarçada de volume, o crescimento é a constante zero, e tudo é marcado como pergunta
mesmo quando não é.

**O 66,3% é a confirmação mais dura.** O `AUDIT` previa que o `pos` acumulasse ao longo dos
10 *seeds* e que a partir da 19.ª sugestão o valor fosse sempre o mínimo. **Dois terços do
maior conjunto de dados do projecto são o mesmo número fabricado.**

Distribuição por eixo: saúde mental 1475, alimentação 893, menopausa 742, emergentes 524.

---

## O achado: a fabricação documentada é a pequena

`[sessão 14][ficheiro][agregado]` + `[ficheiro]` `scripts/6_fetch_health_questions.py`.

O `CONTEXT.md` regista uma fabricação no script 6: `"breakout"` convertido em
`growth = 5000` (linhas 199-200). Nos dados exportados:

| valor de `growth_percent` | linhas | % de 1013 |
|---|---|---|
| **9999** | **368** | **36,3%** |
| 5000 (*breakout*) | **3** | 0,3% |
| outros (142 valores distintos ao todo) | 642 | 63,4% |

**O 9999 não é *breakout*.** A linha 212 do mesmo script faz `min(growth, 9999)`: é um
**tecto**. Como o *breakout* vira 5000, e 5000 passa o tecto sem ser tocado, os 368 são
crescimentos reais **iguais ou superiores a 9999%, todos achatados ao mesmo número**. O maior
valor abaixo do tecto é 9950.

Consequência: **mais de um terço dos valores de crescimento do pytrends não são um número, são
"pelo menos 9999"** — e não há nada no dado que os distinga de um crescimento de exactamente
9999%. Qualquer ordenação, média ou gráfico que os use trata um limite como se fosse medida.

**O que isto tem de particular:** a fabricação que o projecto documentou afecta **3 linhas**;
a que não documentou afecta **368**. Não foi erro de leitura do código — a linha 212 estava
lá para ser lida. A atenção foi para a conversão explícita, que se anuncia, e passou ao lado
do tecto, que não se anuncia. É a mesma família dos outros achados desta semana: o estado
declarado observado em vez do efeito.

~~*Ressalva:* **não foi verificado** se o tecto de 9999 existe desde o início ou se foi
acrescentado depois, nem se as 368 linhas se concentram nalguma keyword ou período. Fica por
fazer.~~ **As duas foram verificadas no mesmo dia — ver o acrescento no fim deste ficheiro.**
Resumo: o tecto existe desde o commit que criou o script (16/03/2026) e as 368 linhas **não**
se concentram — estão em todos os eixos e em todos os meses.

---

## Para o Crítico nº 7

O item está cumprido do lado da exportação: as 3634 linhas estão fora da base, verificadas, e
o script pode ser mexido sem as perder.

O que o achado acrescenta ao item: **corrigir o script 7 não chega.** O script 6 tem um tecto
que achata 36,3% dos seus valores, e isso não estava na lista do que há para corrigir.

---

# Acrescento de 15/09/2026 — as duas ressalvas, fechadas no terminal

> **Verificação feita no terminal** (Claude Code) antes de commitar esta pasta. Os catorze
> valores declarados acima foram todos reconferidos e **batem exactamente**. As duas ressalvas
> que a secção do achado deixava em aberto ficam respondidas aqui, e as respostas **agravam**
> a leitura em vez de a atenuarem.

## 1. O tecto existe desde o primeiro dia

`[sessão 14][ficheiro]` `git log -L 212,212:scripts/6_fetch_health_questions.py`.

A linha `"growth_percent": min(growth, 9999)` entrou no commit **`0af49a4`, de 16/03/2026** —
o commit que **criou** o script. Nunca foi alterada.

Consequência: **todos os valores de crescimento do pytrends que existem passaram por este
tecto.** Não há um período anterior, limpo, que se possa recuperar.

## 2. As 368 linhas NÃO se concentram — e isso é pior

`[sessão 14][ficheiro][agregado]` Contagem das 368 por eixo e por mês.

**Por eixo:**

| eixo | no tecto | total | % do eixo |
|---|---|---|---|
| `emergentes` | 83 | 163 | **50,9%** |
| `alimentacao` | 80 | 205 | 39,0% |
| `menopausa` | 54 | 147 | 36,7% |
| `saude-mental` | 151 | 498 | 30,3% |

**Por mês:** 03/2026 44,2% · 04/2026 47,1% · 05/2026 34,3% · 06/2026 34,4% · 08/2026 28,1% ·
09/2026 33,3%.

**Não há concentração nenhuma.** Está em todos os quatro eixos e em todos os seis meses, entre
28% e 51%. Se estivesse concentrado numa keyword ou numa semana má, podia ser excluído por
filtro e o resto salvava-se. **Difuso, não se filtra:** qualquer subconjunto que se escolha
traz cerca de um terço dos valores achatados.

**E o eixo mais afectado é o `emergentes`, com 50,9% — metade.** É o eixo cuja razão de
existir é detectar sinal novo, isto é, **crescimento**. Metade dos seus valores de crescimento
não é um número, é "pelo menos 9999".

## 3. Um terceiro achado, não procurado: as 3 linhas de *breakout* estão mal rotuladas

`[sessão 14][ficheiro]` Ao listar as 3 linhas com `growth = 5000`:

| data | eixo | pergunta |
|---|---|---|
| 2026-04-27 | `alimentacao` | quais os sintomas de anemia |
| 2026-03-28 | `saude-mental` | toxina botulínica enxaqueca |
| 2026-04-06 | **`menopausa`** | **candidíase cutânea tratamento** |

A terceira não é de menopausa, e a segunda não é de saúde mental. **É a mesma falha de
rotulagem que a análise das notícias encontrou hoje** (`docs/sessoes/2026-09-15.md`, secção da
rotulagem): o eixo atribuído não corresponde ao conteúdo. Aqui são 3 linhas de 1013 e não muda
nenhuma conclusão — **fica registado porque mostra que o defeito não é só do `news_items`**,
é do critério de atribuição de eixo em geral.

*Ressalva:* 3 linhas não medem nada. A proporção de rótulos errados em `health_questions`
**não foi contada**, nem nas 1013 nem nas 3634.
