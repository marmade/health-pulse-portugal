# Vocabulário de pesquisa — candidatos por eixo (passo 3)

**Data:** 18/09/2026 · **Estado:** primeira passagem, por rever pela Marta

## O que se leu, e o que isto não mostra

**Corpo 1 — `health_questions`, fonte `pytrends`:** 1013 linhas, *related queries* do Google
Trends (`geo=PT`) recolhidas pelo script 6 em torno das keywords. Cobrem **48 das 82
keywords**; as outras 34 não devolveram nada (recolha bloqueada ou termo sem volume — o
corpo não distingue). Lidas do arquivo `docs/arquivo/2026-09-16-health-questions-autocomplete/`.

**Corpo 2 — `relatedQueries.csv` descarregados à mão a 15/09:** `menopausa` e `depressão`,
Portugal, 5 anos, categoria Saúde. Em `docs/google-trends/menopausa/` e
`docs/google-trends/saude-mental/depressao/` (a pasta foi reorganizada por eixo pela Marta a
18/09, durante esta análise).

**Corpo 3 — as cinco sondas que a Marta descarregou a 18/09 de manhã**, em
`docs/google-trends/alimentacao/`, no formato novo do Trends (`time_series_*`,
`searched_with_top-*`, `searched_with_rising-*`, `by_region_*`; **mensal**, 61 pontos):
`alimentação`, `emagrecer`, `ozempic`, `jejum intermitente`, e a comparação `dieta
mediterrânica · jejum intermitente · dieta cetogénica · dieta proteica · dieta`. Lidas
abaixo, em "Alimentação — o que as sondas de 18/09 responderam".

**Corpo 4 — a categoria Saúde do Trends sem termo** (a Marta, ~12:30): seis janelas em
`docs/google-trends/categoria-saude/`, README com a leitura. Em resumo: o TOP da categoria é
metade lixo (`meo`, `twitch`, `tempo`, `chatgpt`) e metade **acesso a serviços** e
**comercial**; as doenças estão no RISING — e o RISING é **a lista dos Emergentes reescrita
pelos dados**: `fígado gorduroso`, `hantavírus`, `candida auris`, `norovírus`, `lipedema`,
`creutzfeldt-jakob`, `mosquito tigre asiático`, `difteria`, `vírus do nilo ocidental`,
`cyclospora`, `vibrio`, `mounjaro`, `perimenopausa`, `tdah`.

**Corpo 5 — pesquisas relacionadas das 82 keywords pelo `pytrends`**, a partir do Mac (18/09,
tarde): `related-queries-pytrends/related_queries_2026-09-18.csv` e `recolha.log` com o
estado de cada pedido (ok / sem dados / falhou). Script ao lado, `recolher.py`. Por ler.

**Limite dos corpos 1, 2 e 5:** as *related queries* são pesquisas que contêm ou acompanham o
termo pedido. Revelam **como se formula** um conceito que já está na lista; **não revelam
conceitos que não estão** (o exemplo da Marta — `dieta proteica` — não pode aparecer aqui,
porque nenhuma keyword o contém). Para esses, ver "Sondas" no fim.

**Contagens por heurística (regex, não revisão linha a linha):** marcadores brasileiros em 29
linhas (regex que incluía `transtorno`, que a Marta diz usar-se em Portugal — contagem por rever); inglês ou pedido de tradução em 39; nomes comerciais, medicamentos ou produtos em 66.

---

## Achado transversal 1 — homónimos: sete termos da lista medem outra coisa

Com a categoria Saúde ligada no Trends, e ainda assim:

| termo da lista | o que contamina (exemplos do corpo) | formulação de saúde que evita a contaminação |
|---|---|---|
| **`stress`** | engenharia (*von mises stress*, *shear stress*, *stress strain curve*), testes de CPU (*furmark*, *cinebench*), brinquedos (*bola anti stress*), cosmética (*vichy stress resist*), crédito (*taxa de stress crédito habitação*), agricultura (*stress hídrico*), música | `stress crónico`, `como aliviar o stress`, `sintomas de stress` — ou o **tópico** |
| **`depressão`** | meteorologia (*depressão fria*, *próxima depressão em portugal 2026*, *qual o nome da próxima depressão*, e os nomes: *kristin, leonardo, marta, óscar, garoe, ciarán…*), 1929, *depressão respiratória*, *depressão barométrica* | `depressão sintomas` (TOP = 100), `teste de depressão`, `depressão pós-parto` — ou o **tópico** *Depression (mood)* |
| **`pânico`** | cinema (*Todo Mundo em Pânico*, *Pânico 7*, *Pânico na Floresta*), *botão de pânico* | `ataque de pânico`, `crise de pânico` |
| **`solidão`** | literatura e música (*Cem Anos de Solidão*, *Olá Solidão*, *Adeus Solidão*) — **quase nenhuma pesquisa de saúde nas 24 linhas** | não há formulação limpa; `solidão idosos`? a testar |
| **`burnout`** | jogo de vídeo (*Burnout Paradise*, *Burnout Revenge*, *Burnout Legends*), livro | `síndrome de burnout`, `burnout no trabalho`, `burnout sintomas` |
| **`sepsis`** | quase tudo em inglês (*guidelines 2026*, *sofa score*, *surviving sepsis campaign*, celebridades estrangeiras) — o termo é inglês | `sépsis`, `septicemia` (aparece no corpo) |
| **`PTSD`** | sigla inglesa (*ptsd meme*, *ptsd radio*, *what is ptsd*) | `stress pós-traumático`, `perturbação de stress pós-traumático` |

**Consequência para a lista:** cada uma destas keywords, descarregada como termo, mede uma
mistura. Ou se substitui pela formulação de saúde, ou se usa o tópico do Trends (que
desambigua), ou fica com a ressalva escrita. **Decisão da Marta, termo a termo.**

O mesmo fenómeno já tinha aparecido no autocomplete a 16/09 (`stress hídrico`, `pânico 7`,
`avc toy`). Não é uma excepção; é uma classe.

## Achado transversal 2 — contaminação brasileira, com marcadores limpos

`estresse`, `oq é`, `cardápio`, `remedio`, `emagrece quantos quilos`, `todo mundo em
pânico`, `terapia online brasil`, `síndrome do pânico`, e nomes (*Maya Massafera*, *Heloísa
Perissé*). **29 linhas por regex, provavelmente mais.** O `geo=PT` do pytrends não impede
isto: quem pesquisa de Portugal lê conteúdo brasileiro, e o Google devolve o que é
pesquisado, não o que é português.

**`transtorno` não é marcador** — a primeira versão desta secção dizia que era, e a Marta
corrigiu a 18/09: também se usa em Portugal. O julgamento de origem é dela, como já era
para o filtro do painel das perguntas.

## Achado transversal 3 — os acontecimentos mediáticos (casos para a fase 4)

Não são keywords. São **o objecto do projecto** — o momento em que uma notícia gera procura —
e ficam guardados como casos:

- **AVC:** *toy avc* (várias formas), *nuno markl segundo avc*, *joaquim monchique avc*,
  *rui malheiro avc*, *ministro avc*, *faria dias avc*, *demi lovato avc*
- **Alzheimer / demência:** *chris hemsworth alzheimer*, *ricardo salgado alzheimer*,
  *bruce willis* (demência), *ator com alzheimer*
- **Menopausa:** *claudia raia menopausa* (Breakout), *teatro menopausa*, *76 sintomas da
  menopausa* (Breakout), *t-shirt menopausa*
- **Diabetes:** *china descobre cura para diabetes tipo 1 e 2*
- **Jejum intermitente:** *jejum intermitente prémio nobel*
- **Dieta mediterrânica:** *feira da dieta mediterrânica tavira 2026* (evento, não notícia)
- **Ansiedade:** *divertida mente 2 ansiedade* (filme), *o meu nome não é ansiedade*,
  *vacina para ansiedade*
- **Suicídio:** *suicídio viseu*
- **Dias mundiais** (sazonalidade de campanha, a descontar nos alertas): *dia mundial do
  avc*, *dia nacional do doente com avc*, *dia mundial do alzheimer*, *dia mundial do lúpus*,
  *dia da endometriose*, *dia do cancro da mama* / *mês do cancro da mama*, *dia mundial da
  prevenção do suicídio*, *dia europeu da enxaqueca*, *dia mundial da incontinência
  urinária*, *dia mundial da doença celíaca*

---

## Por eixo

Legenda: **V** formulação vernácula (candidata a keyword) · **C** comercial / terapêutico
(fica, como quarta categoria — decisão da Marta, 18/09) · **T** tendência ou cruzamento.
As listas são de candidatos; a escolha é da Marta.

### Alimentação (12 keywords com dados, de 18)

**O que as sondas de 18/09 responderam** (Corpo 3):

- **`dieta proteica`: 0 em todos os 61 meses** ao lado de `dieta` (100). `dieta cetogénica`
  máximo 3, `dieta mediterrânica` máximo 5. **Na régua de `dieta`, nenhuma das três tem
  sinal em Portugal.** A pergunta da Marta fica respondida na direcção — não é a formulação
  usada —, mas a régua é a de `dieta`, que esmaga tudo: para saber se `proteica` tem *algum*
  sinal, repetir a comparação **sem `dieta`** (regra do máximo < 15).
- **`emagrecer` é a palavra, e o RISING é todo farmacológico:** *mounjaro para emagrecer*,
  *ozempic portugal*, *wegovy*, *canetas para emagrecer* — todos Breakout. A série de
  `ozempic` vai de 0 (2021) ao máximo em **Fevereiro de 2026** e está a 68 em Setembro. TOP:
  *comprimidos para emagrecer*, *emagrecer rápido* (+140%). **É a tendência que a Marta
  intuía — e é a categoria comercial, não uma dieta.**
- **`alimentação`:** TOP *alimentação saudável* (83), *dia da alimentação*, *cadeira
  alimentação* (ruído — puericultura), *alimentação bebé*. RISING: *alimentação
  anti-inflamatória* (+700%), *alimentação cetogénica* (+800%, base pequena), *wordwall
  alimentação saudável* (material escolar).
- **`jejum intermitente`:** TOP *o que é* (71), *livro* (66), *16h* (54, +120%). RISING:
  *calcular jejum intermitente*, *jejum intermitente na menopausa*, *na gravidez*.


- **V:** `anemia ferropriva` / `anemia ferropénica`, `alimentos ricos em ferro`, `sintomas
  de anemia`, `como saber se tenho anemia` · `colesterol alto o que não comer`, `colesterol
  ldl`, `triglicerídeos` · `diabetes tipo 2 tem cura`, `sintomas de diabetes tipo 2` ·
  `refluxo tem cura` · `alimentos ultraprocessados` · `doença celíaca o que não pode comer`
- **T:** `jejum intermitente 16h` / `12h` / `para emagrecer` (a formulação real do jejum é
  *emagrecer*, não *benefícios*), `ultraprocessados sono estudo`, `beterraba é bom para
  anemia`, `fruta que cura anemia em 2 dias`
- **C:** `medicamento para diabetes tipo 2`, `app jejum intermitente grátis`, `chá para
  anemia`, `suplementos alimentares para idosos`
- **Ruído a excluir:** `anemia em gatos`, `linfócitos`, `anemia` em inglês

**Nota:** `suplementos alimentares` tem o maior volume da tabela `keywords` (62) e **uma só
related query**. O que as pessoas pesquisam sobre suplementos não passa pela palavra
*suplementos alimentares* — passa pelo nome do suplemento (ver `ashwagandha`, `passiflora`
na saúde mental). É o caso mais claro de "vocabulário institucional vs. de pesquisa" neste
eixo, e onde a categoria comercial mais vai pesar.

### Saúde mental (19 com dados, de 33 — e 14 sem nada, quase todas de programa)

- **V:** `crise de ansiedade`, `ataque de ansiedade`, `sintomas físicos de ansiedade`,
  `ansiedade sintomas físicos`, `como acalmar a ansiedade`, `perturbação de ansiedade
  generalizada` · `depressão sintomas`, `teste de depressão`, `depressão pós-parto`, `como
  ajudar uma pessoa com depressão` · `ataque de pânico`, `crise de pânico` · `síndrome de
  burnout`, `burnout no trabalho`, `burnout parental` · `demência frontotemporal`, `demência
  de corpos de lewy`, `demência vascular`, `demência vs alzheimer` · `alzheimer precoce`,
  `primeiros sinais de alzheimer`, `alzheimer é hereditário` · `enxaqueca com aura`,
  `enxaqueca menstrual`, `enxaqueca ocular`, `diferença entre dor de cabeça e enxaqueca` ·
  `tdah adulto` · `suicídio assistido`, `linha de prevenção do suicídio`
- **T:** `burnout autista` / `autistic burnout`, `adhd burnout`, `burnout digital`, `cptsd`,
  `100 sintomas de ansiedade`, `ansiedade na adolescência`
- **C (o eixo com mais):** `alprazolam`, `sertralina`, `escitalopram`, `paroxetina`,
  `vortioxetina` / `brintellix`, `gabapentina`, `inderal`, `calmantes naturais para
  ansiedade`, `passiflora`, `ashwagandha`, `suplementos para ansiedade`, `melhor
  antidepressivo para ansiedade` · `sumatriptano`, `maxalt`, `nurofen enxaqueca`, `aquipta`,
  `triptanos`, `botox para enxaqueca`, `daith piercing enxaqueca`, `touca para enxaqueca` ·
  `terapia online gratuita`, `terapia de casal online`
- **Sem dados, e é o padrão previsto pela hipótese do vocabulário:** `desinstitucionalização
  saúde mental`, `saúde mental jovens`, `saúde mental sem-abrigo`, `saúde mental no trabalho`,
  `competências socioemocionais`, `saúde mental escolar`, `equipas comunitárias saúde mental`,
  `reabilitação psicossocial`, `saúde mental ensino superior`, `literacia em saúde mental`
  — 10 das 14. Linguagem de programa. E também `perturbação bipolar`, `perturbação
  obsessivo-compulsiva`, `perturbações do espectro do autismo` — aqui a hipótese é outra:
  as pessoas escrevem `bipolar`, `toc`, `autismo`. **Sonda a fazer.**

### Menopausa (10 com dados, de 16)

- **V:** `pré menopausa` (TOP 18), `idade menopausa` (TOP 27), `menopausa o que é`,
  `tratamento menopausa`, `pós menopausa` · `reposição hormonal` (+170%), `terapia hormonal
  de substituição` · `endometriose profunda`, `endometriose intestinal`, `adenomiose`,
  `endometriose tem cura`, `quem tem endometriose pode engravidar` · `candidíase recorrente`,
  `candidíase na gravidez` · `sop` (a sigla, não "síndrome do ovário poliquístico" — que
  está na lista e **não devolveu nada**) · `mioma` · `sinais de cancro da mama`, `rastreio
  cancro da mama` · `osteoporose tem cura`, `t score osteoporose` · `incontinência urinária
  pós-parto`
- **T:** `jejum intermitente na menopausa` (Breakout), `endo belly`, `barriga de
  endometriose`, `lei da endometriose`, `como perder peso na menopausa`
- **C:** `climacare` (+2000%), `wells menopausa` (+500%), `suplemento menopausa` (+120%),
  `estradiol`, `progesterona` · `fluconazol`, `clotrimazol`, `pomada para candidíase`,
  `óvulo para candidíase dose única` · `prolia`, `injeção para osteoporose anual preço` ·
  `ryeqo endometriose`
- **Sem dados:** `secura vaginal`, `libido menopausa`, `menopausa masculina`, `fitoterapia
  menopausa`, `doenças da tiroide`, `síndrome do ovário poliquístico`. A `menopausa`
  simples — o termo com mais procura do eixo — **não está na lista**; está `menopausa
  sintomas`, que é a sua related query nº 1.

### Emergentes (7 com dados, de 15)

- **V:** `mini avc`, `micro avc`, `avc transitório` / `ait`, `sintomas de avc dias antes`,
  `sintomas de avc feminino`, `princípio de avc`, `via verde avc` (o programa do SNS,
  pesquisado pelo nome) · `septicemia` · `candida auris sintomas`, `candida auris em
  portugal` · `lúpus sintomas`, `lúpus tem cura` · `vírus nipah sintomas`
- **Sem dados (8 de 15):** `dengue europa`, `microplásticos sangue`, `resistência
  antibióticos`, `sarampo surto`, `calor extremo e saúde`, `mpox portugal`, `poluição e
  saúde`, `gripe aviária H5N1`. Todas com forma de **manchete ou de relatório**, não de
  pesquisa: as pessoas escrevem `sarampo`, `dengue`, `mpox`, `gripe das aves` (o caso
  genuíno já registado a 15/09). É o eixo onde a hipótese do vocabulário mais pesa, como o
  `CONTEXT.md` previa.

---

## Sondas propostas — descargas de `relatedQueries` para a Marta fazer

Termos largos, que não estão na lista, para encontrar o que a lista não contém. Portugal ·
5 anos · Saúde · descarregar as duas listas (TOP e RISING). Guardar em
`docs/google-trends/sondas/<termo>/`.

**Feito a 18/09 pela Marta, sem esperar pela lista:** a categoria Saúde sem termo (Corpo 4),
que responde a "o que não está na lista" melhor do que qualquer sonda com termo.

| eixo | sondas |
|---|---|
| Alimentação | ~~`dieta` · `emagrecer` · `alimentação saudável`~~ **feitas a 18/09** (mais `ozempic`, `jejum intermitente` e a comparação das dietas). Falta: a comparação das dietas **sem `dieta`** |
| Saúde mental | `psicólogo` · `saúde mental` (já tens a série; falta o relatedQueries) · `bipolar` |
| Menopausa | `menopausa` (feito) · `ginecologista` · `hormonas` |
| Emergentes | `surto` · `vírus` · `sintomas` (esta última é transversal — é a palavra que mais aparece em todos os eixos) |

Nove descargas que faltam. Guardar na pasta do eixo, como a Marta já faz.

**Nota técnica, para mim:** o formato novo do Trends (`time_series_*.csv`, cabeçalho
`"Time"`, mensal) **não é lido pelo `converter_trends_csv.py`**, que espera `Week/Day/Month`.
Adaptar antes de carregar a fase 1.

**Alternativa a testar antes:** instalar o `pytrends` na máquina da Marta e pedir as
*related queries* das sondas daqui. Os 429 vinham dos IPs do GitHub Actions; de uma ligação
doméstica, com pausas, pode funcionar — e pouparia as doze descargas. Não foi tentado; é
instalar um pacote e contactar o Google a partir da rede dela, logo pede-se antes.

## Decisões da Marta já tomadas (18/09)

- **O comercial fica**, como quarta categoria com nome próprio.
- **`transtorno` não é marcador de origem** — usa-se em Portugal.
- **`enxaqueca` sai da saúde mental**; a estar, é nos emergentes. Aplicar com as outras
  alterações da lista, numa única migração (`UPDATE keywords SET axis`), com data e razão.
- **As 100 keywords vão para o mural**, quando a lista fechar — *"o mural é só de palavras"*.

## O que fica por decidir (da Marta)

1. Os sete homónimos: substituir, usar tópico, ou manter com ressalva — termo a termo
2. Que candidatas V entram na lista, e se a lista passa a ter as duas colunas
   (institucional / pesquisa)
3. A categoria C: entra no dashboard como bloco próprio, ou só na análise?
4. Se as sondas se fazem à mão ou se se tenta o `pytrends` local primeiro
