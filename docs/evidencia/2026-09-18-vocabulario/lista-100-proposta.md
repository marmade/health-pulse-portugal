# Lista de 100 keywords — proposta em duas colunas (rascunho para a Marta cortar e pôr)

**Data:** 18/09/2026 · **Estado:** PROPOSTA. Nada disto está na base de dados. A decisão é
da Marta; o que ficar aplica-se numa migração única (`UPDATE keywords`), com data e razão.

## A regra que a lista segue

Cada linha tem **duas colunas**: o **termo institucional** (de onde veio — DGS, SNS 24,
CUF, a lista actual) e o **termo de pesquisa** (como os portugueses o escrevem no Google,
segundo os cinco corpos lidos hoje). Quando as duas coincidem, é uma só. Quando a segunda
está vazia, é porque **ninguém pesquisa aquilo com aquela formulação** — e isso fica na
lista como achado, não como keyword.

Tipos: **V** vernáculo (doença, sintoma, condição) · **C** comercial / terapêutico · **S**
acesso a serviços · **T** tendência recente.

Evidência, abreviada: *rq* = pesquisas relacionadas (pytrends, hoje, 982 linhas); *cat* =
categoria Saúde sem termo (seis janelas, hoje); *5a* = comparação a 5 anos de hoje ou de
15/09; *corpo1* = as 1013 do arquivo de 16/09.

**Contagem, conferida contra as tabelas:** 25 por eixo = 100. Das 82 actuais, **61 ficam**
— 31 tal como estão, 28 reformuladas para a forma que as pessoas escrevem, 1 muda de eixo
(`enxaqueca`), e `dependências` e `alcoolismo` juntam-se numa linha — e **21 saem**, quase
todas por não terem procura com aquela formulação. **Entram 40**, todas com a evidência ao
lado. (A primeira versão deste parágrafo dizia 44 / 38 / 56; estava errada e foi corrigida
no próprio dia, contando linha a linha.)

---

## Saúde mental — 25

| # | institucional (actual) | pesquisa (proposta) | tipo | evidência | acção |
|---|---|---|---|---|---|
| 1 | ansiedade | ansiedade | V | rq TOP `ansiedade sintomas` 100; 5a mediana 72 | mantém — âncora secundária de cima |
| 2 | — | crise de ansiedade | V | rq TOP 26, +50%; corpo1 | **novo** |
| 3 | — | ansiedade social | V | rq TOP 11 | **novo** |
| 4 | depressão | depressão sintomas | V | rq TOP 100; `depressão` sozinha = tempestades (corpo1, cat) | **reformula** — homónimo |
| 5 | — | depressão pós-parto | V | corpo1 TOP | **novo** |
| 6 | stress | stress sintomas | V | rq TOP `stress e ansiedade` 93, `stress sintomas` 88; `stress` = engenharia/brinquedos | **reformula** — homónimo |
| 7 | burnout | síndrome de burnout | V | rq TOP `sintomas burnout` 100; `burnout` = jogo de vídeo | **reformula** — homónimo |
| 8 | pânico | ataque de pânico | V | rq TOP 100; `pânico` = cinema | **reformula** — homónimo |
| 9 | PTSD | stress pós-traumático | V | corpo1: PTSD só em inglês | **reformula** — sigla inglesa |
| 10 | alzheimer | alzheimer | V | rq 48; TOP `sintomas alzheimer` 100 | mantém |
| 11 | demência | demência | V | rq 39; TOP `demência sintomas` 100 | mantém |
| 12 | insónia | insónias | V | rq TOP `insónias` 100 (o plural é a forma) | **reformula** |
| 13 | suicídio | suicídio | V | rq 3; corpo1 10 | mantém — absorve `prevenção suicídio` |
| 14 | automutilação | automutilação | V | rq 10, TOP `significado` 100 | mantém |
| 15 | fobia social | fobia social | V | rq 9, TOP `sintomas` 100 | mantém |
| 16 | anorexia nervosa | anorexia | V | corpo1: 1 linha com o nome clínico | **reformula** |
| 17 | TDAH adulto | tdah | V/T | cat RISING `tdah` +750%, `phda` +300%; rq TOP `tdah o que é` 100 | **reformula** |
| 18 | perturbação bipolar | bipolar | V | 5a hoje: mediana 9, regular (2,0); o nome clínico deu 0 | **reformula** |
| 19 | perturbação obsessivo-compulsiva | toc | V | sem dados com o nome clínico; `toc` por testar | **reformula** — a confirmar |
| 20 | perturbações do espectro do autismo | autismo | V | 5a hoje: mediana 28, regular (2,4) | **reformula** |
| 21 | dependências · alcoolismo | dependências | V | rq TOP `comportamentos aditivos e dependências` 100; alcoolismo falhou (429) | mantém, junta as duas |
| 22 | — | psiquiatra | S | 5a hoje: mediana 20, a mais regular (1,6) — **âncora** | **novo** |
| 23 | — | psicologa | S | com o filtro Saúde: mediana 14 (as outras formas dão 0); sem filtro: 36. Sem acento e no feminino é como se escreve. **Fica com nota:** o filtro (decisão da Marta, método 5b) tira-lhe mais de metade | **novo** — com ressalva |
| 24 | — | antidepressivos | C | corpo1: sertralina, escitalopram, paroxetina, `melhor antidepressivo para ansiedade` | **novo** — comercial |
| 25 | — | calmantes naturais | C | corpo1 +150%; rq `calmantes para ansiedade` +50%; passiflora, ashwagandha | **novo** — comercial |

**Saem (13):** `terapia online` (sem dados hoje), `solidão` (24 rq, nenhuma de saúde — é
literatura e música), `enxaqueca` (→ Emergentes, decisão da Marta), `prevenção suicídio`
(→ 13), e as **10 de linguagem de programa**, todas sem dados: `desinstitucionalização
saúde mental`, `saúde mental jovens`, `saúde mental sem-abrigo`, `saúde mental no
trabalho`, `competências socioemocionais`, `saúde mental escolar`, `equipas comunitárias
saúde mental`, `reabilitação psicossocial`, `saúde mental ensino superior`, `literacia em
saúde mental`. **Ficam na coluna institucional como o achado principal do eixo.**

## Alimentação — 25

| # | institucional (actual) | pesquisa (proposta) | tipo | evidência | acção |
|---|---|---|---|---|---|
| 1 | anemia | anemia | V | rq 46, TOP `anemia sintomas` 100; 5a mediana 72 | mantém — âncora secundária de cima |
| 2 | — | alimentos ricos em ferro | V | corpo1; rq RISING `alimentos ricos em ferro para curar anemia` | **novo** |
| 3 | colesterol alto | colesterol alto | V | 5a mediana 17, regular — **âncora** | mantém |
| 4 | diabetes tipo 2 | diabetes tipo 2 | V | rq 23; cat RISING `diabetes mellitus` +160% | mantém |
| 5 | pré-diabetes | pré-diabetes | V | rq TOP `pré-diabetes sintomas` 100 | mantém |
| 6 | jejum intermitente | jejum intermitente | V/T | rq 50; sonda hoje TOP `16h` +120% | mantém |
| 7 | suplementos alimentares | suplementos | C | rq TOP `melhores suplementos alimentares` 77; cat TOP `prozis`, `creatina` | **reformula** |
| 8 | — | creatina | C | cat TOP 13–15 em três janelas, RISING +400% | **novo** — comercial |
| 9 | dieta mediterrânica | dieta mediterrânica | V | máx 5 ao lado de `dieta`; TOP é a feira de Tavira | mantém — **por confirmar sem `dieta`** |
| 10 | — | dieta | V | sonda hoje: 100, mediana 69 | **novo** — o termo genérico |
| 11 | — | alimentação saudável | V | sonda `alimentação` TOP 83 | **novo** |
| 12 | — | emagrecer | V/T | sonda hoje: 100, e o RISING é todo farmacológico | **novo** |
| 13 | — | ozempic | C/T | sonda hoje: 0 em 2021 → 100 em Fev/2026 | **novo** — comercial |
| 14 | — | canetas para emagrecer | C/T | sonda `emagrecer` RISING Breakout; `mounjaro` cat +1200%, `wegovy` | **novo** — comercial |
| 15 | — | alimentação anti-inflamatória | T | sonda `alimentação` RISING +700% | **novo** |
| 16 | — | fígado gorduroso | V/T | cat RISING **+2950%** (12 meses) | **novo** |
| 17 | — | hipertensão | V | cat RISING `hipertensão arterial` +200% | **novo** — a confirmar o eixo |
| 18 | alergias alimentares | alergias alimentares | V | rq TOP `mais comuns` 100 | mantém |
| 19 | refluxo gastroesofágico | refluxo | V | corpo1 12; rq falhou (429) | **reformula** |
| 20 | intolerância à lactose | intolerância à lactose | V | rq 17, RISING fortes | mantém |
| 21 | doença celíaca | doença celíaca | V | corpo1 8; rq falhou (429) | mantém |
| 22 | intolerância ao glúten | glúten | V | rq 6 | **reformula** |
| 23 | obesidade infantil | obesidade | V | 5a 15/09: máx 10 ao lado de ansiedade; `infantil` 1 rq | **reformula** |
| 24 | ultraprocessados | ultraprocessados | V/T | rq 4; corpo1 `ultraprocessados sono estudo` | mantém |
| 25 | síndrome de intestino irritável | intestino irritável | V | rq falhou (429); corpo1 0 | **reformula** — por confirmar |

**Saem (3):** `dieta cetogénica` (máx 3 ao lado de `dieta`; 3 rq), `alimentação plant-based`
(sem dados), `açúcar e saúde` (sem dados).

## Menopausa / saúde reprodutiva — 25

| # | institucional (actual) | pesquisa (proposta) | tipo | evidência | acção |
|---|---|---|---|---|---|
| 1 | — | menopausa | V | 5a mediana 26, regular — **âncora**; era o eixo sem o termo | **novo** |
| 2 | menopausa sintomas | sintomas menopausa | V | rq da menopausa TOP 100 (as duas ordens) | mantém, ordem das pessoas |
| 3 | — | perimenopausa | V/T | 5a hoje: **97**, nasceu na janela; RISING +150% | **novo** |
| 4 | — | pré-menopausa | V | rq da menopausa TOP 18 | **novo** |
| 5 | — | idade menopausa | V | rq da menopausa TOP 27 | **novo** |
| 6 | menopausa precoce | menopausa precoce | V | rq 14; 5a máx 19 | mantém |
| 7 | menopausa masculina | andropausa | V | 5a hoje: máx 53, regular; `masculina` 2 rq | **reformula** |
| 8 | endometriose | endometriose | V | rq 45; 5a máx 100 (pico anual) | mantém |
| 9 | — | adenomiose | V | corpo1: 4 formulações | **novo** |
| 10 | — | mioma | V | corpo1 | **novo** |
| 11 | candidíase | candidíase | V | rq 50 | mantém |
| 12 | síndrome do ovário poliquístico | sop | V | nome clínico: 0; `sop` no corpo1 | **reformula** |
| 13 | cancro da mama | cancro da mama | V | rq 35; RISING é a corrida anual | mantém |
| 14 | osteoporose | osteoporose | V | rq 38 | mantém |
| 15 | — | osteopenia | V | rq da osteoporose TOP 39 | **novo** |
| 16 | incontinência urinária | incontinência urinária | V | rq 26 | mantém |
| 17 | suores noturnos | suores noturnos | V | rq 7, TOP `sintomas` 92 | mantém |
| 18 | — | afrontamentos | V | rq da menopausa TOP `calores menopausa` 12 — **qual das duas palavras, é a Marta que sabe** | **novo, por decidir** |
| 19 | doenças da tiroide | tiroide | V | sem dados com `doenças da`; `tiroide` por testar | **reformula** — por confirmar |
| 20 | terapia hormonal | reposição hormonal | V/C | rq da menopausa RISING +170% | **reformula** |
| 21 | — | menstruação | V | sonda hoje: 100, mediana 71 | **novo** |
| 22 | — | ginecologista | S | sonda hoje: 71, regular | **novo** — serviços |
| 23 | fitoterapia menopausa | suplemento menopausa | C | rq RISING +120–140%; `fitoterapia` sem dados | **reformula** — comercial |
| 24 | — | climacare | C | rq RISING **+2000%** | **novo** — comercial, marca |
| 25 | — | estradiol | C | rq da menopausa TOP 9 | **novo** — comercial |

**Saem (3):** `secura vaginal` (sem dados), `libido menopausa` (sem dados), `peso na
menopausa` (1 rq; a pergunta real é `emagrecer`, que está na Alimentação).

## Emergentes — 25

| # | institucional (actual) | pesquisa (proposta) | tipo | evidência | acção |
|---|---|---|---|---|---|
| 1 | avc | avc | V | rq 49; 5a mediana 34 — **âncora** | mantém |
| 2 | enxaqueca (de Saúde mental) | enxaqueca | V | rq 50; 5a mediana 15, regular | **muda de eixo** — decisão da Marta |
| 3 | doenças cardiovasculares | doenças cardiovasculares | V | rq 13; 5a mediana 0 | mantém — **por confirmar**; `enfarte` como alternativa |
| 4 | lúpus | lúpus | V | rq 32; 5a mediana 0, 186 semanas a zero | mantém — pequeno, mas com formulações |
| 5 | sepsis | sépsis | V | `sepsis` em inglês; `septicemia` no corpo1 | **reformula** |
| 6 | candida auris | candida auris | V/T | cat RISING +750%; rq falhou (429) | mantém |
| 7 | vírus nipah | vírus nipah | V/T | rq 6 | mantém — pequeno |
| 8 | sarampo surto | sarampo | V | 5a hoje: máx 35 com `surto` = sem dados | **reformula** |
| 9 | dengue europa | dengue | V | `europa` sem dados | **reformula** — por confirmar |
| 10 | mpox portugal | mpox | V | `portugal` sem dados | **reformula** — por confirmar |
| 11 | gripe aviária H5N1 | gripe das aves | V | o caso genuíno de 15/09 (notícias) | **reformula** |
| 12 | long covid | long covid | V | rq 20 — em inglês, mas é assim que se escreve | mantém |
| 13 | — | covid sintomas | V | rq `covid symptoms` 99; cat 2004→hoje | **novo** |
| 14 | — | gripe A | V | cat RISING `gripe a sintomas` +700% | **novo** |
| 15 | — | hantavírus | T | cat RISING **+3000%** (12 meses), Breakout (2025→) | **novo** |
| 16 | — | vírus do nilo ocidental | T | cat RISING +2300% (90 dias) | **novo** |
| 17 | — | mosquito tigre | T | cat RISING +3250% (30 dias) | **novo** |
| 18 | — | norovírus | T | cat RISING +200% | **novo** |
| 19 | — | difteria | T | cat RISING +700% (30 dias), +190% (5 anos) | **novo** |
| 20 | — | creutzfeldt-jakob | T | cat RISING Breakout (30 dias) | **novo** |
| 21 | calor extremo e saúde | onda de calor | V/T | cat RISING `aviso de temperatura elevada` +2200%, `aviso de calor excessivo` +1600%; `calor extremo e saúde` sem dados | **reformula** |
| 22 | microplásticos sangue | microplásticos | T | `sangue` sem dados | **reformula** — por confirmar |
| 23 | — | lipedema | V/T | cat RISING +950% (5 anos) | **novo** — eixo por decidir |
| 24 | — | infeção sexualmente transmissível | V | cat RISING +1050% (90 dias) | **novo** — eixo por decidir |
| 25 | — | vacinas | S | sonda hoje TOP: `boletim de vacinas`, `sns24`, `vacinas 2 meses` | **novo** — serviços |

**Saem (2):** `resistência antibióticos` (5a: 261 de 262 semanas a zero), `poluição e
saúde` (sem dados).

---

## O que esta lista muda no desenho

- **Os quatro eixos ficam com a mesma forma:** 25 cada, com V, C, S e T em todos. O mural
  mostra as duas colunas; a distância entre elas é a tese à vista.
- **Os Emergentes deixam de ser uma lista de manchetes** e passam a ser o RISING da
  categoria Saúde — o que emergiu de facto em Portugal. É o eixo que mais muda: 12 dos 25
  são novos.
- **A Saúde mental perde 10 termos de programa** e ganha-os como achado: o vocabulário da
  instituição não é o de quem pesquisa.
- **Cada "por confirmar" é um pedido ao Trends** — cerca de 12. Fazem-se na primeira
  corrida do script 5, que já os põe na régua do eixo; não é preciso descarregar à mão.

## O que fica para a Marta

1. Cortar e pôr, linha a linha. As justificações estão ao lado para isso mesmo.
2. `afrontamentos` ou `calores` — julgamento de falante.
3. `lipedema`, `infeção sexualmente transmissível`, `hipertensão`: em que eixo.
4. ~~Se o script corre sem categoria~~ — **decidido: o filtro fica, com ressalva escrita** (método 5b).
