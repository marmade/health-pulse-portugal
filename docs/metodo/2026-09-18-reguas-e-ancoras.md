# Réguas e âncoras — como se mede o Google Trends neste projecto

**Data:** 18/09/2026 · **Estado:** método decidido com a Marta; a lista de keywords ainda
está em revisão (ver `docs/evidencia/2026-09-18-vocabulario/`), logo os grupos do fim são
a separação da lista **actual** e mudam com ela.

> Este documento existe porque a Marta pediu que ficasse escrito: *"preciso que deixes
> isto escrito pois eu vou-me esquecer."* Está tudo aqui, com a evidência de onde saiu.

---

## 1. O problema: o Trends não dá números, dá réguas

O Google Trends publica um índice de 0 a 100 em que **100 é o ponto mais alto daquela
descarga**. Não há contagens. Consequência, vista nos ficheiros da Marta de 15/09:

- `menopausa` descarregada **sozinha**: máximo 100.
- `menopausa` descarregada **com mais quatro termos**, no mesmo dia: máximo **33** — a régua
  foi fixada pela `ansiedade`.

> **Corrigido a 25/09/2026:** a régua desta comparação não é a da `ansiedade`, é a de
> `depressão`. Em `docs/google-trends/comparacao/2026-09-15-5termos-pesquisa-PT-5a.csv` os
> cinco termos têm máximos menopausa 33 · ansiedade 43 · depressão 100 · alimentação 52 ·
> obesidade 10. Erro encontrado a 20/09 (`docs/sessoes/2026-09-20.md` §2).

Mesmo termo, mesmas semanas, números diferentes. **Dois ficheiros diferentes nunca se
comparam entre si.** Foi isto que estragou as 3462 linhas de `historical_snapshots`: valores
de pedidos diferentes colados na mesma tabela como se fossem uma série.

Duas perguntas diferentes, duas descargas diferentes:
- **"Como se comporta este termo?"** (tendência, sazonalidade) → o termo sozinho chega.
- **"Qual destes termos é mais pesquisado?"** → têm de vir **no mesmo pedido**.

## 2. Uma descarga de grupo serve para as duas perguntas

Verificado a 18/09 com os ficheiros de 15/09: a série de um termo dentro de uma comparação
é **a mesma curva** que a série do termo sozinho, só noutra escala.

| termo | máximo na comparação | correlação com a descarga solo | diferença depois de reescalar |
|---|---|---|---|
| menopausa | 33 | 0,998 | média 0,9 pontos, máxima 2 |
| ansiedade | 43 | 0,998 | média 0,7, máxima 2 |
| obesidade | **10** | 0,981 | média 2,9, máxima 7 |

Logo: **uma descarga por grupo dá o comparativo (os números como vêm) e o comportamento
individual (cada termo reescalado ao seu máximo).** A excepção são os termos esmagados —
máximo abaixo de ~15 no grupo —, que perdem forma porque o Google só dá inteiros. Esses
repetem-se com uma âncora mais pequena (secção 6).

## 3. A janela decide o detalhe

Medido nas seis descargas de `menopausa` de 18/09 (`docs/google-trends/menopausa/janelas-2026-09-18/`),
no exportador novo do site:

| janela | pontos | um ponto por | serve para |
|---|---|---|---|
| 5 anos | 61 | **mês** | tendência e sazonalidade |
| 12 meses / ano civil | 53 | semana | alertas ("esta semana contra as anteriores") |
| 90 / 30 dias | 90 / 30 | **dia** | casos notícia → procura |
| 7 dias | 43 | ~4 horas | — |

O `pytrends` (secção 5) devolve **semanal a 5 anos** (262 pontos) — mais fino do que o
exportador novo. As descargas manuais de 15/09 também eram semanais (formato antigo).

**"Comparar com o período anterior" não é uma cópia.** Quando se pede a comparação, o
Google normaliza os dois períodos **na mesma régua** (o 100 é o máximo dos dois) — em 3 dos
4 pares de 18/09 a série "simples" e a "com período anterior" diferem. E a coluna do
período anterior vem **com as datas do período actual e os valores do anterior**: o
conversor deixa-a de fora e regista que o fez.

## 4. TOP e RISING (pesquisas relacionadas)

- São do termo **seleccionado** no painel — por omissão o primeiro (10:51 e 10:54 eram
  ambos de *ansiedade*), mas dá para escolher outro (11:14 era de *sarampo*, o terceiro).
- **Numa comparação só um termo tem TOP/RISING.** Para as sondas de vocabulário, cada termo
  vai **sozinho**.
- O ficheiro não traz o termo: ver `docs/google-trends/INDICE-2026-09-18.md`.
- Com a categoria Saúde ligada, os homónimos entram na mesma (`depressão` = tempestades,
  `stress` = engenharia e brinquedos, `pânico` = cinema). Ver o documento de vocabulário.

## 5. Automatizar: o `pytrends` funciona a partir do Mac da Marta

Testado a 18/09/2026, 7 pedidos, todos respondidos em ~1 s, **nenhum 429**. Os bloqueios
de Agosto vinham dos IPs do GitHub Actions, não da ferramenta.

**Prova de que dá os mesmos números que a descarga manual** — `menopausa` sozinha, 5 anos,
PT, categoria Saúde, `pytrends` contra o CSV manual de 15/09, semanal contra semanal:

| semanas | máximo | correlação | diferença média | pontos com dif. ≤ 2 | dif. máxima |
|---|---|---|---|---|---|
| 262 | 100 / 100 | **0,987** | 1,9 pontos | 190 de 262 | 8 |

A diferença que resta é **amostragem do próprio Google**: dois pedidos iguais nunca vêm
exactamente iguais. Pesa mais nos termos pequenos (`menopausa precoce`, entre 0 e 19,
correlacionou a 0,19 numa comparação mensal-vs-semanal). Consequência: **para grupos com
termos pequenos, repetir o pedido 2–3 vezes e tirar a média.**

- Ambiente: `.venv-trends/` (no `.gitignore`), `pytrends==4.9.2`, `urllib3<2.0` — as versões
  do workflow.
- Categoria **45 = "Todas as categorias > Saúde"**, confirmado no próprio Google.
- Pausa entre pedidos: 15 s. Com a lista actual, ~23 pedidos no passo 1 → **5–10 minutos**.

**Onde corre:** no Mac da Marta, pelo `launchd`, à segunda de manhã. O Mac tem de estar
**ligado** (a dormir serve: corre ao acordar; desligado, a semana fica registada como
`sem recolha`). A Marta não precisa de estar ao computador nem de ter nada aberto. Plano B:
um comando à mão, `python scripts/5_fetch_google_trends.py`, faz exactamente o mesmo.

**A API oficial do Google Trends** (alfa, acesso por candidatura, escala consistente entre
pedidos): **candidatura entregue pela Marta a 18/09/2026, sem resposta.** Se entrar, as
âncoras deixam de ser precisas; os dados por grupos continuam comparáveis com os novos.

## 5b. A categoria Saúde: testada, e não faz o que se pensava (18/09, tarde)

Todos os pedidos e descargas até aqui levaram a categoria 45 (Saúde), para filtrar
homónimos. Dois testes, feitos porque o `psicólogo` dava zero:

**Teste 1 — `psicólogo`, com e sem acento, com e sem categoria** (5 anos, PT, ao lado de
`psiquiatra`):

| termo | com categoria: mediana / zeros | sem categoria: mediana / zeros |
|---|---|---|
| psiquiatra | 61 / 0 | 50 / 0 |
| psicólogo | **0 / 250** | 16 / 0 |
| psicologo | 0 / 183 | **33 / 0** |
| psicóloga | 0 / 221 | 13 / 0 |
| psicologa | 14 / 61 | **36 / 0** |

O zero era a categoria: o Google classifica "psicólogo" fora de Saúde. E o acento parte o
termo (como a Marta já tinha provado com `depressão`/`depressao` a 15/09): as pessoas
escrevem **sem acento e no feminino** — `psicologa` é a forma com mais procura.

**Teste 2 — as pesquisas relacionadas de `depressão`, com e sem categoria**, contando as
que são tempestades ou meteorologia:

| | TOP | RISING |
|---|---|---|
| com categoria Saúde | 5 de 25 | 18 de 25 |
| sem categoria | 4 de 25 | 16 de 25 |

**A categoria não filtra os homónimos** — a diferença é ruído — **e esconde termos de
saúde** que o Google classifica noutro sítio. Custa e não dá.

**Decisão da Marta (18/09/2026): o filtro fica, para facilitar a vida — e é uma
LIMITAÇÃO do estudo, a escrever na secção de limitações da tese, não como nota de rodapé.
O texto que a acompanha, onde quer que um número saia daqui:**

> *A categoria "Saúde" é o que o Google entende por saúde, por regras que não publica.
> Não filtra homónimos (a `depressão` continua a ser tempestades com o filtro ligado) e
> esconde termos que o Google classifica noutro sítio (`psicólogo`). Os valores são
> "pesquisas que o Google classificou como Saúde", não "pesquisas sobre saúde".*

A limitação vai para a página (proveniência dos gráficos), para o apêndice metodológico e para a secção de limitações.
O script grava a categoria em cada pedido (`trends_pedidos.categoria`), logo uma corrida
sem filtro para comparação é sempre possível. Os homónimos tratam-se pela formulação, como
a lista de 100 faz.

## 6. Grupos com âncora — a regra

1. **Um eixo são vários grupos.** O Trends compara 5 termos por pedido; cada grupo é
   **4 termos + a âncora do eixo**, e a âncora repete-se em todos os grupos do eixo.
2. **A âncora liga as réguas.** Se marca 33 no grupo 1 e 66 no grupo 2, o grupo 2 está numa
   régua com metade da escala, e converte-se. Sem âncora, cada grupo é uma régua solta.
3. **Passo 2 para os esmagados.** Termos com máximo < ~15 no passo 1 voltam a ser pedidos
   com uma **âncora secundária** — um termo que no passo 1 ficou a 20–40 — e a conversão
   faz-se em dois saltos (West, R. 2020, *Calibration of Google Trends Time Series*, CIKM).
   O script decide isto pelos resultados.
4. **Entre eixos:** um pedido extra com as quatro âncoras juntas, para o ranking entre eixos
   (se ficar) estar numa escala só.
5. **Critérios da âncora:** regular (máximo / mediana ≤ 3 — sem picos de notícia), tamanho
   médio (mediana ≥ 10 na régua do maior termo do eixo), sem homónimo, **e do eixo** — a
   régua não precisa de pertencer ao eixo para funcionar, mas a Marta não quer a saúde
   mental medida por uma dor de cabeça (18/09), e tem razão: o documento tem de se ler.

## 7. As âncoras, escolhidas com dados a 18/09/2026

Um pedido por eixo, 5 candidatas juntas, 5 anos, PT, Saúde:

| eixo | termo | máx | mediana | máx/mediana | zeros | veredicto |
|---|---|---|---|---|---|---|
| Saúde mental | ansiedade | 100 | 72 | 1,4 | 0 | regular, mas grande demais para âncora principal |
| | enxaqueca | 29 | 15 | 1,9 | 0 | regular, mas **não é saúde mental** (é neurologia) — a Marta recusou-a como âncora a 18/09; e a sua presença na lista deste eixo é para rever |
| | burnout | 59 | 12 | 4,9 | 0 | pico (jogo de vídeo?) — não |
| | demência | 30 | 6 | 5,0 | 22 | pico (Bruce Willis) — não |
| | insónia | 5 | 0 | — | 254 | sem sinal |
| | **psiquiatra** | 33 | 20 | **1,6** | 0 | **âncora** (2.º pedido) — a mais regular de todas; é saúde mental; sem homónimo |
| | bipolar | 18 | 9 | 2,0 | 1 | alternativa: uma condição, mas pequena |
| | autismo | 66 | 28 | 2,4 | 0 | regular; neurodesenvolvimento — fronteira do eixo é da Marta |
| | psicólogo | 4 | 0 | — | 250 | **zero com a categoria Saúde** — inexplicado, segunda vez que aparece; a perceber |
| | perturbação de ansiedade · psicoterapia · depressão sintomas | 4–11 | 0–4 | — | 111–261 | sem sinal |
| Alimentação | anemia | 100 | 72 | 1,4 | 0 | regular, grande — âncora secundária de cima |
| | **colesterol alto** | 35 | 17 | 2,1 | 3 | **âncora** |
| | jejum intermitente | 44 | 12 | 3,7 | 58 | irregular |
| | diabetes tipo 2 | 89 | 10 | 8,9 | 39 | pico de notícia ("china descobre cura") |
| | suplementos alimentares | 15 | 7 | 2,1 | 105 | pequeno demais |
| Menopausa | **menopausa** | 58 | 26 | 2,2 | 0 | **âncora** |
| | endometriose | 100 | 14 | 7,1 | 0 | pico anual (mês da endometriose, Março) |
| | osteoporose · candidíase · cancro da mama | 9–25 | 5–9 | ≤ 2,8 | ≤ 6 | regulares mas pequenos |
| Emergentes | **avc** | 100 | 34 | 2,9 | 0 | **âncora** — a única com volume |
| | lúpus | 18 | 0 | — | 186 | sem sinal regular |
| | sepsis | 34 | 6 | 5,7 | 81 | pequeno e em inglês |
| | doenças cardiovasculares · resistência antibióticos | 5–8 | 0 | — | 237–261 | sem sinal |

**O eixo Emergentes é um achado, não um problema técnico:** fora `avc`, nenhuma das
candidatas tem procura regular em Portugal com esta formulação. É a hipótese do vocabulário
no seu caso mais forte — as pessoas escrevem `sarampo`, `dengue`, `gripe das aves`, não
`sarampo surto` nem `dengue europa`. O passo 2 vai precisar de uma âncora secundária
pequena (`sepsis`, mediana 6), e a lista deste eixo é a que mais tem de mudar.

## 8. As 82 keywords separadas por eixo e âncora

Lista **actual** da tabela `keywords`, ordenada pelo `current_volume` (que é de 10/08 e não é
comparável — serve só para os grupos não serem alfabéticos). A âncora do eixo entra em
**todos** os pedidos. A ordem dentro dos grupos não importa; o script pode reagrupar.

### Saúde mental — âncora `psiquiatra` (fora da lista) · 33 termos · 9 pedidos

1. `psiquiatra` + `ansiedade` · `terapia online` · `burnout` · `enxaqueca`
2. `psiquiatra` + `depressão` · `demência` · `dependências` · `stress`
3. `psiquiatra` + `suicídio` · `alzheimer` · `PTSD` · `alcoolismo`
4. `psiquiatra` + `solidão` · `pânico` · `insónia` · `anorexia nervosa`
5. `psiquiatra` + `desinstitucionalização saúde mental` · `saúde mental jovens` · `perturbação bipolar` · `saúde mental sem-abrigo`
6. `psiquiatra` + `saúde mental no trabalho` · `competências socioemocionais` · `perturbação obsessivo-compulsiva` · `saúde mental escolar`
7. `psiquiatra` + `equipas comunitárias saúde mental` · `reabilitação psicossocial` · `automutilação` · `TDAH adulto`
8. `psiquiatra` + `perturbações do espectro do autismo` · `fobia social` · `prevenção suicídio` · `saúde mental ensino superior`
9. `psiquiatra` + `literacia em saúde mental`

### Alimentação — âncora `colesterol alto` · 17 termos · 5 pedidos

1. `colesterol alto` + `suplementos alimentares` · `anemia` · `dieta mediterrânica` · `alergias alimentares`
2. `colesterol alto` + `jejum intermitente` · `refluxo gastroesofágico` · `diabetes tipo 2` · `intolerância à lactose`
3. `colesterol alto` + `doença celíaca` · `dieta cetogénica` · `obesidade infantil` · `alimentação plant-based`
4. `colesterol alto` + `ultraprocessados` · `açúcar e saúde` · `pré-diabetes` · `síndrome de intestino irritável`
5. `colesterol alto` + `intolerância ao glúten`

### Menopausa — âncora `menopausa` · 16 termos · 4 pedidos

1. `menopausa` + `menopausa sintomas` · `endometriose` · `candidíase` · `secura vaginal`
2. `menopausa` + `cancro da mama` · `osteoporose` · `menopausa precoce` · `incontinência urinária`
3. `menopausa` + `síndrome do ovário poliquístico` · `peso na menopausa` · `terapia hormonal` · `libido menopausa`
4. `menopausa` + `suores noturnos` · `doenças da tiroide` · `menopausa masculina` · `fitoterapia menopausa`

### Emergentes — âncora `avc` · 14 termos · 4 pedidos

1. `avc` + `lúpus` · `sepsis` · `candida auris` · `vírus nipah`
2. `avc` + `dengue europa` · `microplásticos sangue` · `resistência antibióticos` · `sarampo surto`
3. `avc` + `calor extremo e saúde` · `long covid` · `doenças cardiovasculares` · `mpox portugal`
4. `avc` + `poluição e saúde` · `gripe aviária H5N1`

**Mais um pedido:** `psiquiatra · colesterol alto · menopausa · avc` — a ligação entre eixos.

Total no passo 1: **23 pedidos** (9 + 5 + 4 + 4 + 1). Passo 2: os que ficarem abaixo de 15.

## 9. O que fica por decidir (da Marta)

1. A lista — os sete homónimos e as candidatas do documento de vocabulário. Os grupos acima
   refazem-se quando a lista fechar.
2. Se `ansiedade` e `anemia` (grandes, regulares) entram como âncoras secundárias "de cima",
   para os termos que ficarem esmagados na régua de `enxaqueca` / `colesterol alto`.
3. O ranking entre eixos: fica (e leva o pedido das quatro âncoras) ou sai.
4. Quando a alfa responder: migrar, ou manter o `pytrends` como fonte e a API como controlo.
