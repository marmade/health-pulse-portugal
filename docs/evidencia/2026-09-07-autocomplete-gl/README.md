# Evidência — Google Autocomplete não segmenta por país

**Data da recolha:** 07/09/2026
**Recolhido por:** Marta Madeira, manualmente, em browser, a partir de ligação doméstica em Portugal
**Contexto:** verificação da proveniência geográfica das perguntas da tabela `health_questions` (`source = 'autocomplete'`), recolhidas por `scripts/7_fetch_autocomplete_questions.py`

---

## Questão

O script 7 envia `hl=pt`, `gl=pt` e o cabeçalho `Accept-Language: pt-PT`. Apesar disso,
o corpus resultante contém marcadores de português do Brasil (89 ocorrências de
"estresse" contra 27 de "stress"; 16 referências ao SUS). Pretendia-se determinar se o
parâmetro `gl` produz alguma alteração no resultado devolvido.

## Método

Query de teste, mantida constante: `tratamento para depressão`

Quatro pedidos, dois endpoints, dois valores de `gl`. Respostas guardadas em bruto,
sem qualquer transformação.

| Ficheiro | Endpoint | Parâmetros |
|---|---|---|
| `01-suggestqueries-firefox-A.json` | `suggestqueries.google.com/complete/search` | `client=firefox`, `hl=pt`, `gl` = pt ou br |
| `02-suggestqueries-firefox-B.json` | `suggestqueries.google.com/complete/search` | `client=firefox`, `hl=pt`, `gl` = o outro valor |
| `03-google-chrome-gl-pt.json` | `www.google.com/complete/search` | `client=chrome`, `hl=pt`, `gl=pt` |
| `04-google-chrome-gl-br.json` | `www.google.com/complete/search` | `client=chrome`, `hl=pt`, `gl=br` |

**Ressalva de rigor:** nos ficheiros 01 e 02 não ficou registado qual corresponde a
`gl=pt` e qual a `gl=br`. Como as duas respostas são idênticas, a conclusão do par
não depende dessa distinção. Os ficheiros 03 e 04 têm correspondência confirmada.

## Resultado

Identidade byte a byte dentro de cada par, verificada por MD5:

```
fa5766d4d576596cb3dd9e6f60af6f2a  01-suggestqueries-firefox-A.json
fa5766d4d576596cb3dd9e6f60af6f2a  02-suggestqueries-firefox-B.json
ea7a0f17206a0f59476eea79afdafa31  03-google-chrome-gl-pt.json
ea7a0f17206a0f59476eea79afdafa31  04-google-chrome-gl-br.json
```

Marcadores ortográficos presentes em todas as quatro respostas, incluindo as pedidas
com `gl=pt`: **"eletrochoque"** e **"refratária"** — formas do português do Brasil
(em português europeu, "electrochoque" e "refractária").

## Conclusão

O parâmetro `gl` é aceite sem erro e não produz qualquer efeito no resultado, em
nenhum dos dois endpoints. O Google Autocomplete não permite segmentação geográfica
por esta via.

O comportamento é consistente com a natureza da fonte: o autocomplete pondera as
sugestões pela frequência histórica das queries na língua, não pelo território de
origem. O português do Brasil domina o volume da língua por uma ordem de grandeza.

Não é um defeito do script. É uma propriedade da fonte, que não responde à pergunta
que lhe estava a ser feita.

## Consequências para o protótipo

1. As linhas de `health_questions` com `source = 'autocomplete'` não são segmentáveis
   por país, nem retroactivamente nem à cabeça. Não existe informação de origem para
   registar.
2. O bloco do dashboard "Perguntas de Saúde em Crescimento — Dúvidas reais da população
   detetadas nos motores de pesquisa" não é sustentado pelos dados no que respeita a
   "da população" (portuguesa).
3. O autocomplete mantém-se como fonte, com objecto redefinido: deixa de responder
   "o que perguntam os portugueses" e passa a responder "como se formula a dúvida em
   língua portuguesa".
4. A segmentação territorial passa a depender do Google Trends, que aceita `geo=PT` e
   restringe de facto — e do RSS e do YouTube, cujas fontes portuguesas são
   seleccionadas manualmente.

## Achado secundário

O endpoint `www.google.com/complete/search?client=chrome` devolve mais informação do
que aquele que o script usa: 15 sugestões em vez de 10, e dois campos ausentes na
versão antiga — `google:suggestrelevance` e `google:suggesttype`.

Valores de relevância observados neste teste:
`[700, 602, 601, 600, 560, 559, 558, 557, 556, 555, 554, 553, 552, 551, 550]`

A escada final, a descer de uma unidade em cada posição, indica desempate ordinal e
não medição de volume. Ainda assim, é um valor devolvido pela fonte, ao contrário do
`relative_volume` actualmente gravado pelo script 7, que é calculado a partir da
posição na lista (`max(10, 100 - pos * 5)`) e não corresponde a nenhuma medição.
