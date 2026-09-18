# A regra dos alertas (fase 3) — desenho, com exemplos calculados sobre os dois lotes

**Data:** 18/09/2026, sessão 16 · **Estado:** DESENHO. Nada disto corre no dashboard nem grava
nada. A regra foi **calibrada nos lotes que existem** (12 meses `4dad25b9`, 5 anos
`ec6cc6fc`, ambos da lista actual de 82) e os parâmetros ficaram fixados nesse dia — logo o
que está abaixo não é um teste cego da regra, é a regra a explicar-se nos dados em que nasceu.
O teste cego é o que as semanas seguintes fizerem. Script: `scripts/testes/teste_5_alertas.py`
(lê com a chave pública, não escreve nada); saídas em `docs/evidencia/2026-09-18-alertas/`.

> Etiquetas como no resto do projecto: `[bd]` lido da base, `[ficheiro]` lido do repositório,
> `[calculado]` saído do script deste documento. Onde uma frase é inferência, diz-se.

---

## 1. O que um alerta afirma

> *"Na última semana completa, a procura por X esteve acima do que as oito semanas anteriores,
> o ruído do Google e a época do ano explicam."*

Três consequências do que a frase diz e não diz:

- **É dentro do eixo, na régua da âncora.** `valor_eixo` é comparável entre termos do mesmo
  eixo e do mesmo lote; entre eixos, não — o ranking entre eixos foi retirado a 18/09 e a
  regra não o ressuscita. Um alerta na saúde mental e um nos emergentes não se ordenam.
- **Não diz porquê.** Um pico de `depressão` em Janeiro é a tempestade, não a doença (corpo 1,
  16/09). A regra detecta; a leitura é da Marta — e é por isso que o alerta tem de mostrar o
  número, a referência e o factor sazonal, não só uma bandeira.
- **Compara "esta semana" com "as anteriores"**, como a fase 3 sempre disse. Não é
  "este ano contra o anterior" (isso é a variação do gráfico) nem "este termo contra os
  outros" (isso é o top 5).

## 2. Os dados, e as quatro armadilhas que a regra tem de contornar `[bd]` `[calculado]`

1. **A semana parcial.** O Google marca o último ponto como parcial (`trends_pontos.is_partial`):
   nos dois lotes, **todos os 290 pontos de 2026-09-13 são parciais** — a semana ainda estava a
   decorrer quando o lote correu, sexta-feira. Um valor parcial é sempre mais baixo. A regra
   avalia a **última semana completa** (2026-09-06 nos lotes de 18/09) e nunca a parcial.
   **Achado colateral:** as vistas `trends_termo_52s` e `trends_termo_mensal` (`20260918200000`)
   não excluem a semana parcial — o `maximo_52s` e o `pico_em` podem apontar para ela. Corrige-se
   terça, na mesma passagem das migrações.
2. **O piscar dos termos pequenos.** Abaixo do limiar de volume, o Google devolve **0** nessa
   semana; acima, um inteiro. Um termo pequeno alterna: `suplementos alimentares` nas últimas
   20 semanas = 0 · 0 · 19 · 0 · 0 · 19 · 0 · 23 · 21 · 23 · 29 · 0 · 0 · 23 · 0 · 19 · 0 · 0 · 2 · 13.
   Com uma referência a zero, **qualquer** semana com valor "sobe infinitamente". A primeira
   versão da regra, sem defesa contra isto, disparou **538 vezes em 253 semanas** — 61 só no
   `PTSD` (155 zeros em 262 semanas). É a mesma lição de 09/09: **zero não é um valor, é
   "abaixo do limiar"** — e agora medida na régua semanal.
3. **A amostragem.** Dois pedidos iguais nunca vêm iguais (método, secção 5: diferença média
   1,9 pontos, máxima 8, na régua do pedido). Uma subida de 2 pontos não é subida. E na régua do
   eixo os pontos vêm multiplicados pelo factor de calibração — o piso de ruído tem de vir
   multiplicado também.
4. **A régua muda de lote para lote.** `psiquiatra` na última semana completa: 83,4 no lote de
   12 meses, 73,2 no de 5 anos — o mesmo Google, réguas diferentes. A regra só olha para
   **razões e distâncias dentro de um lote**; e deu z = 2,0 e 2,3 nos dois — o que se queria.

## 3. A regra

Para cada termo, no lote de 5 anos, semana a semana:

| passo | o que faz | parâmetro fixado |
|---|---|---|
| **a. Elegibilidade** | O termo só pode ter alerta de *subida* se tiver **procura regular**: das 8 semanas de referência, pelo menos 6 com valor > 0, e mediana > 0. Senão, vai ao passo f. | `N_REF = 8`, `MIN_COM_DADOS = 6` |
| **b. Referência** | A **mediana** das 8 semanas completas anteriores. Mediana, não média: um pico há três semanas não pode levantar a referência e esconder o de hoje. | |
| **c. Ruído** | 1,4826 × MAD das mesmas 8 semanas (o equivalente robusto do desvio-padrão), com dois pisos: **2 pontos × factor** (a amostragem, na régua do eixo) e **10 % da referência**. O maior dos três. | `PISO_ABS = 2`, `PISO_REL = 0,10` |
| **d. Subida** | Dispara se `(x − ref) / ruído ≥ 3` **e** `x / ref ≥ 1,5`. As duas: o z sozinho dispara em séries muito planas com subidas pequenas; a razão sozinha dispara no ruído dos pequenos. | `Z_MIN = 3`, `RAZAO_MIN = 1,5` |
| **e. Sazonalidade** | Para cada ano anterior no lote (até 4), o **factor sazonal** = máximo da mesma semana ± 1 nesse ano ÷ mediana das 8 anteriores nesse ano — o que aquela época costuma fazer. Toma-se a mediana dos anos. Se o factor ≥ 1,5 e `x ≤ ref × factor × 1,25`, a subida é **sazonal**: mostra-se como tal, não é alerta. | `TOL_SAZONAL = 1,25` |
| **f. Aparecimento** | Para os termos **não elegíveis** (o caso dos emergentes): dispara se o valor na **régua do próprio pedido** for ≥ 20 — acima do piscar, que vive nos 10–19 — **e** ≥ 2 × o máximo das 52 semanas anteriores. | `RAW_MIN = 20`, `MULT = 2` |
| g. *A observar* (opcional) | z ≥ 2 sem chegar ao alerta. Um nível abaixo, para o ecrã não ficar vazio nas semanas calmas — **por decidir**, ver secção 7. | |

Sem bibliotecas: mediana, MAD e uma divisão. Cabe numa vista SQL ou numa função de 40 linhas
em TypeScript, e cabe numa página da tese.

**Porquê 8 semanas.** Curto para ser "recente" (dois meses), longo para a mediana absorver 3–4
semanas de piscar. Com 12 a diferença é pequena (varrimento, secção 5) e a referência começa a
atravessar estações.

**Porquê o lote de 5 anos e não o de 12 meses.** O `pytrends` devolve semanal a 5 anos (262
pontos): tem a mesma granularidade e mais quatro anos para a sazonalidade. O lote de 12 meses
não acrescenta nada à regra. Sem ano anterior no lote, não há desconto sazonal — e isso vê-se
nos dados: o `jejum intermitente` dispara como alerta a 02/01/2022 (primeiro ano do lote) e é
descontado como sazonal em Janeiro de 2023 e 2024 (×3,5–3,8, o Ano Novo).

## 4. Os Emergentes: por pico, não por mediana

O registo da sessão já o dizia: *"emergente é pico e não mediana."* Medido `[calculado]`, nas
últimas 52 semanas completas do lote de 5 anos, régua do `avc`:

| ordenado por **mediana** | | | ordenado por **pico** | | |
|---|---|---|---|---|---|
| avc | 31,2 | 52/52 semanas > 0 | **candida auris** | pico **283** (11/01/2026) | 3/52 |
| sepsis | 7,5 | 41/52 | avc | 96 (16/11/2025) | 52/52 |
| *tudo o resto* | 0 | | vírus nipah | 51 (25/01/2026) | 3/52 |
| | | | sepsis | 34 (09/08/2026) | 41/52 |
| | | | lúpus | 7 | 10/52 |

O `candida auris` a 283 é real, não artefacto: no pedido dele (passo 1, com o `avc`) **foi ele o
100** da semana de 11/01/2026 e o `avc` ficou a 35 (factor 2,833). Três semanas com dados em 52,
mediana zero, pico 3× a mediana do `avc` — é a assinatura de um emergente, e a mediana
apaga-a. **Para este eixo, o top 5 ordena-se pelo máximo das 52 semanas completas**, com o
número de semanas com dados ao lado (3/52 lê-se de outra maneira que 52/52).

E o alerta natural do eixo é o **aparecimento** (passo f), não a subida: um termo que não
existia e passa a existir. A subida exige procura regular, que os emergentes por definição não
têm — `1 em 15` elegível na última semana (o `avc`).

## 5. O que a regra fez sobre os cinco anos `[calculado]`

**Varrimento dos parâmetros** (`saida-varre.txt`), 84 termos × 253 semanas = 21 252 avaliações:

| N_REF | z ≥ | razão ≥ | elegíveis | subidas | sazonais | **alertas** | semanas com alerta | máx/semana |
|---|---|---|---|---|---|---|---|---|
| **8** | **3** | **1,5** | 5043 (24 %) | 127 | 18 | **109** | 86 de 253 | 3 |
| 8 | 3 | 2 | 5043 | 64 | 10 | 54 | 50 | 2 |
| 8 | 4 | 1,5 | 5043 | 79 | 13 | 66 | 60 | 2 |
| 8 | 4 | 2 | 5043 | 52 | 9 | 43 | 41 | 2 |
| 12 | 3 | 1,5 | 5489 (26 %) | 136 | 25 | 111 | 84 | 4 |

Com os parâmetros fixados: **109 subidas + 8 aparecimentos em 5 anos ≈ 23 por ano, 0,5 por
semana**, nunca mais de 4 numa semana (3, só de subidas). Por ano: 29 · 14 · 23 · 21 · 30 (2022–2026, o último
até Setembro). Sobre as 5043 avaliações elegíveis, 2,2 % disparam.

**Só 24 % das avaliações são elegíveis.** Na última semana completa, **17 dos 84 termos** têm
procura regular — saúde mental 8/34, menopausa 5/17, alimentação 3/18, emergentes 1/15. Com a
lista actual, a regra de subida só existe para um quinto dos termos. É a razão da lista de 100
dita por outro número: os outros 67 não têm série onde um alerta caiba.

**O desconto sazonal apanhou o que devia** (18 casos): o `jejum intermitente` no Ano Novo
(×3,5–3,8 em 2023 e 2024), o `cancro da mama` em Outubro (×2,0–2,7 em 2023, 2024 e 2025 — o
mês da prevenção; em 2022 disparou como alerta porque não havia ano anterior), o `alzheimer`
em Setembro de 2023 (×1,7; o Dia Mundial é a 21/09) e a `endometriose` em Julho de 2023 e
2025 (×2,1–7,7, a seguir ao Julho de 2022).

**Os alertas que coincidem com casos que o projecto já tinha registado:**

| semana | termo | x / ref | z | o que o projecto registou | grau |
|---|---|---|---|---|---|
| 12/02/2023 | demência | 91 / 20 = ×4,6 | 18 | pico "Bruce Willis" (método, secção 7) — o diagnóstico foi anunciado a 16/02/2023 | data confere |
| 19/04/2026 | diabetes tipo 2 | 253 / 30 = **×8,3** | **30** | pico de notícia "china descobre cura" (método, secção 7); é o maior z dos 5 anos | inferência: o método não regista a data |
| 16/11/2025 | avc | 96 / 33 = ×3,0 | 11 | `toy avc` no corpo 1; é o maior pico do `avc` em 5 anos | inferência: a data do caso não está registada |
| 25/01 e 01/02/2026 | depressão | 657 / 105 = **×6,3** | 14 | o termo mede tempestades (corpo 1, provado a 16/09); é a época delas | inferência quanto ao evento |
| 11/01/2026 | candida auris | aparecimento, raw 100 | — | `candida auris` +750 % na categoria Saúde (RISING, 18/09) | confere |
| 19/07/2026 | pânico | aparecimento, raw 75 | — | `pânico` = cinema (corpo 1) | homónimo — a lista de 100 troca-o por `ataque de pânico` |

Os outros — `burnout` 26/06/2022 (×4,8, z = 18) e 09/10/2022 (×3,5), `endometriose` Julho de
2022 (quatro semanas seguidas, até ×7,7), `refluxo` 11/12/2022 (×2,7) e 11/05/2025 (raw 100),
`sepsis` 09/08/2026 (×5,2), `psiquiatra` 09/06/2024 (×1,7) — **não têm explicação registada**.
Não é defeito da regra: é a lista de casos da fase 4 a crescer por si.

**A última semana completa (06/09/2026), nos dois lotes** (`saida-ultima.txt`): **nenhum
alerta**. Dois "a observar": `avc` z = 2,0 (×1,4) e `psiquiatra` z = 2,0 / 2,3 (×1,2). Os dois
lotes concordam.

## 6. Limitações — para a secção da tese

- **Calibrada nos dados que a descrevem.** Os limiares saíram de um varrimento sobre estes
  lotes; a validação é prospectiva. Não se mexe nos parâmetros à vista de uma semana que não
  agradou — muda-se com registo e data, como a lista.
- **A referência é curta de propósito e por isso um pico que dura levanta-a.** A `endometriose`
  em Julho de 2022 disparou quatro semanas seguidas com a mesma referência (22): a regra vê
  quatro alertas onde há um acontecimento. Ver a decisão 3.
- **A sazonalidade precisa de anos anteriores elegíveis** — no primeiro ano do lote não há
  desconto, e um termo que só ganhou procura regular este ano também não tem.
- **Os homónimos disparam** (`depressão`, `pânico`). A regra não os distingue; a lista de 100
  é que os trata, pela formulação. Até terça, as duas maiores subidas dos 5 anos são tempestades.
- **Herda a limitação da categoria Saúde** (método, 5b): os valores são "pesquisas que o Google
  classificou como Saúde".
- **Abaixo do limiar não há regra possível.** 67 dos 84 termos não têm série; um alerta lá seria
  o piscar do Google com outro nome.

## 7. O que fica para a Marta

1. **Os limiares:** z ≥ 3 e ×1,5 (≈ 23 alertas por ano na lista actual) ou z ≥ 4 e ×2 (≈ 9).
   A primeira lê melhor; a segunda quase só apanha acontecimentos.
2. **O nível "a observar"** (z ≥ 2): existe no ecrã ou não? A favor: a maior parte das semanas
   não tem alerta, e o bloco fica vazio. Contra: um nível fraco gasta a atenção.
3. **Um acontecimento que dura:** semanas consecutivas do mesmo termo são o mesmo alerta
   ("em curso, 3.ª semana") ou alertas novos? Proposta: o mesmo, enquanto a razão se mantiver
   ≥ 1,5 contra a referência **de antes do primeiro disparo**.
4. **O aparecimento é só dos emergentes ou de todos os eixos?** Nos 5 anos disparou 8 vezes: 3
   nos emergentes, 4 na alimentação, 1 na saúde mental (o `pânico`, cinema).
5. **O que o ecrã mostra por alerta:** proposta — termo, valor, referência, "×1,8 contra as 8
   semanas anteriores", e o factor sazonal quando existir ("em anos anteriores esta época faz
   ×2,0"). O número antes da bandeira.

## 8. Reproduzir

```
python3 scripts/testes/teste_5_alertas.py            # resumo e a lista dos 135 disparos
python3 scripts/testes/teste_5_alertas.py ultima     # a última semana completa, nos dois lotes
python3 scripts/testes/teste_5_alertas.py varre      # o varrimento da tabela da secção 5
```

Corre com o `.env` do repositório (chave pública), sem `pytrends` e sem escrever nada. Na terça,
depois do lote da lista nova, corre-se outra vez: os números da secção 5 mudam, a regra não.
