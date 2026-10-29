# Perguntas do briefing — simulação v2 sobre a recolha de 26/10/2026, com as quase iguais juntas

Simulação do Claude Code, 29/10/2026, sobre as decisões da Marta do `2026-10-29-cowork.md` §12a. Só
leitura: não se mexeu em código nem na base. A v1 está em `simulacao-26-10.md`.

**Bate com o que o Cowork esperava.** Saúde mental fica com bipolar, psicólogo/psiquiatra (com a
variante por baixo), causas do autismo, ataque de pânico e sintomas de alzheimer. Os outros três
eixos ficam como na v1.

## A regra simulada

1. **Base:** `source = pytrends`, `is_question = true` e `updated_at` desde 26/10. São 41
   perguntas.
2. **Exclusões:** escrita (começa por "como se escreve") e tradução ("em inglês", com ou sem
   acento, ou "tradução"). Na recolha de 26/10 tiram só uma: **"como se escreve alzheimer"**
   (saúde mental, 9999). Não há nenhuma de tradução.
3. **Juntar as quase iguais, dentro de cada eixo e antes do corte:**
   - duas perguntas juntam-se quando ficam iguais depois de passar a minúsculas, tirar a
     pontuação e tirar as palavras de ligação: qual, quais, o, a, os, as, um, uma, uns, umas, que,
     de, do, da, dos, das;
   - fica à frente a forma que vem primeiro pela ordem de 28/09 (fora de escala, depois a subida,
     depois a posição no Google), ou seja a de maior subida;
   - as outras ficam por baixo, como variantes, com a subida de cada uma.
4. **Ordem e corte:** o grupo ocupa um só lugar, com os valores da forma da frente. Empate quando a
   forma da frente tem a mesma subida (ou ambas fora de escala) e a mesma posição no Google; as
   empatadas partilham o lugar. Corte no 5.º lugar, com todas as empatadas nesse lugar.

## Resultado

| Eixo | Lugar | Pergunta (à frente) | Subida | Posição no Google | Variantes (também pesquisada como) |
|---|---|---|---|---|---|
| Saúde mental (7 → 6 grupos) | 1 | como saber se sou bipolar | +4150% | 1 | |
| | 2 | qual a diferença entre psicólogo e psiquiatra | +2300% | 3 | "diferença entre psicólogo e psiquiatra" (+90%) |
| | 3 | causas do autismo | +1700% | 8 | |
| | 4 | sintomas de ataque de pânico | +150% | 1 | |
| | 5 | sintomas de alzheimer | +70% | 9 | |
| Alimentação (12 → 12) | 1 | como tratar anemia | fora de escala | 1 | |
| | 1 | quais os alimentos ricos em ferro | fora de escala | 1 | |
| | 1 | quantos passos por dia para emagrecer | fora de escala | 1 | |
| | 1 | o que é a doença celíaca | fora de escala | 1 | |
| | 5 | como tratar o refluxo | fora de escala | 2 | |
| Menopausa (9 → 9) | 1 | como saber se tenho endometriose | fora de escala | 1 | |
| | 1 | sintomas de osteoporose | fora de escala | 1 | |
| | 3 | sintomas de candidíase vaginal | fora de escala | 2 | |
| | 4 | o que é endometriose na mulher | +8250% | 2 | |
| | 5 | quais os sintomas da menopausa | +300% | 1 | |
| Emergentes (12 → 11) | 1 | o que são doenças cardiovasculares | fora de escala | 1 | |
| | 1 | sintomas lúpus fase terminal | fora de escala | 1 | |
| | 3 | o que causa avc | fora de escala | 2 | |
| | 4 | sintomas dengue adulto | fora de escala | 8 | |
| | 5 | sintomas de dengue e zika | fora de escala | 12 | |

**Nenhum empate no 5.º lugar.** A primeira que fica de fora em cada eixo:
- saúde mental: "sintomas autismo" (+40%);
- alimentação: "como fazer papas de aveia para emagrecer" (+1850%);
- menopausa: "quanto tempo dura a menopausa" (+160%);
- emergentes: "sintomas sarampo adulto" (+9100%).

## O que a regra juntou na recolha de 26/10

1. **Saúde mental:** "qual a diferença entre psicólogo e psiquiatra" (+2300%, posição 3) e
   "diferença entre psicólogo e psiquiatra" (+90%, posição 4). Fica no 2.º lugar. O lugar que
   ficou livre passa para "sintomas de alzheimer" (+70%), que na v1 era a 6.ª.
2. **Emergentes, fora do top 5:** "sintomas do dengue" (+250%, posição 15) e "sintomas da dengue"
   (+90%, posição 20). Muda só "do" para "da". Parece-me a mesma dúvida.

**O que a regra não juntou, como pediste:**
- "sintomas da candidíase" (+100%) e "sintomas de candidíase vaginal" (fora de escala), em
  menopausa;
- "causas do autismo" e "sintomas autismo", em saúde mental;
- "sintomas dengue adulto", "sintomas de dengue e zika", "sintomas do dengue" e "o que e dengue",
  em emergentes.

**Nada do que a regra juntou me parece diferente.** Percorri também todas as 3904 perguntas
(`is_question = true`) da tabela, das duas fontes: a regra forma 126 grupos com variantes. Em
nenhum deles a diferença entre as formas é outra coisa além das palavras de ligação da lista. Não
há nenhum caso em que "a" ou "o" fossem outra coisa que não artigo, nem em que "que" mudasse o
sentido.

## Notas e parâmetros técnicos

- **"dos" e "das"** não estavam na tua lista ("de/do/da"). Acrescentei-os por serem os plurais das
  mesmas palavras. Na recolha de 26/10 não mudam nada.
- **"é" fica:** não é palavra de ligação. "o que é X" e "X" não se juntam.
- **Acentos não se normalizam.** "o que e dengue" (sem acento) só se juntaria a "o que é dengue"
  se se tirassem os acentos. Nesta recolha não há esse par. Fica assim, salvo decisão tua.
- **O lugar e o empate** são os da v1, já aceites: o campo `lugar`, e o empate pela forma da
  frente.
- **No arquivo**, cada grupo grava a forma da frente com os seus valores e uma lista `variantes`
  (pergunta e subida, ou "fora de escala"). Os briefings já arquivados não têm `variantes` nem
  `lugar` e mostram-se como até aqui.
