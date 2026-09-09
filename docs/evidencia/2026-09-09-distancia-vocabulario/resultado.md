# Teste 3 — distância entre A (keywords do Estado) e B (perguntas reais)

Corrido a 09/09/2026 na instância `ijpxjpbjudaddfatibfl`. SQL em
`scripts/testes/teste_3_distancia.sql`. Sem rede, sem `pytrends`.

## Agregado

| | |
|---|---|
| keywords (A) | 83 (82 activas) |
| perguntas (B) | 4626 |
| **com correspondência literal em B** | **63** |
| **só por raiz** | **9** |
| **sem correspondência nenhuma** | **11** |

## Os casos que interessam

Termos **sem resolução no Google Trends** e com **0 correspondências literais**
nas perguntas reais, mas **muitas pela raiz** — o conceito é procurado, a
formulação institucional não é:

| keyword institucional | literal | por raiz | raiz usada |
|---|---|---|---|
| `libido menopausa` | 1 | **135** | menopausa |
| `doenças da tiroide` | **0** | **38** | tiroide |
| `saúde mental no trabalho` | 7 | 28 | trabalho |
| `prevenção suicídio` | **0** | **23** | suicídio |
| `síndrome do ovário poliquístico` | 2 | 23 | poliquístico |
| `saúde mental jovens` | **0** | **21** | jovens |
| `síndrome de intestino irritável` | 9 | 79 | irritável |

E os que não aparecem de todo, por nenhuma via — candidatos a "volume
genuinamente baixo" e não a problema de vocabulário:

`açúcar e saúde` · `calor extremo e saúde` · `equipas comunitárias saúde mental` ·
`fitoterapia menopausa` · `microplásticos sangue` · `perturbação obsessivo-compulsiva` ·
`perturbações do espectro do autismo` · `poluição e saúde` ·
`saúde mental ensino superior` · `saúde mental sem-abrigo`

## Leitura

**Isto não confirma a hipótese — mede uma coisa diferente dela.** Mede distância
entre duas listas de vocabulário, não presença de sinal no Google Trends. Um
termo pode ter 0 correspondências em B e ter sinal no Trends, e o contrário
também.

O que dá é a matéria-prima para o teste 2, e uma observação forte por si:
**`prevenção suicídio` tem zero correspondências literais e 23 pela raiz.** As
pessoas procuram "suicídio causas" e "o que é suicídio" — as formulações vieram
do `autocomplete`, ou seja, do próprio Google. Não procuram "prevenção suicídio".

Quem confirma ou mata a hipótese é o teste 2, que põe os dois termos no mesmo
pedido e compara o sinal.
