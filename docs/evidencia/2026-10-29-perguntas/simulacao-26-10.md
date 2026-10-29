A regra nova bate com a simulação do Cowork nos três pontos. Não mexi em código nem na base, só li.

**Resultado na recolha de 26/10** (41 perguntas):
- **A exclusão tira uma só:** "como se escreve alzheimer", de saúde mental, que estava no tecto (9999).
- **Ordem:** dentro de cada eixo é a de 28/09. Empatadas partilham a posição, como no top dos termos.

| Eixo | Lugar | Pergunta | Subida | Posição no Google |
|---|---|---|---|---|
| Saúde mental (7) | 1 | como saber se sou bipolar | +4150% | 1 |
| | 2 | qual a diferença entre psicólogo e psiquiatra | +2300% | 3 |
| | 3 | causas do autismo | +1700% | 8 |
| | 4 | sintomas de ataque de pânico | +150% | 1 |
| | 5 | diferença entre psicólogo e psiquiatra | +90% | 4 |
| Alimentação (12) | 1 | como tratar anemia | fora de escala | 1 |
| | 1 | quais os alimentos ricos em ferro | fora de escala | 1 |
| | 1 | quantos passos por dia para emagrecer | fora de escala | 1 |
| | 1 | o que é a doença celíaca | fora de escala | 1 |
| | 5 | como tratar o refluxo | fora de escala | 2 |
| Menopausa (9) | 1 | como saber se tenho endometriose | fora de escala | 1 |
| | 1 | sintomas de osteoporose | fora de escala | 1 |
| | 3 | sintomas de candidíase vaginal | fora de escala | 2 |
| | 4 | o que é endometriose na mulher | +8250% | 2 |
| | 5 | quais os sintomas da menopausa | +300% | 1 |
| Emergentes (12) | 1 | o que são doenças cardiovasculares | fora de escala | 1 |
| | 1 | sintomas lúpus fase terminal | fora de escala | 1 |
| | 3 | o que causa avc | fora de escala | 2 |
| | 4 | sintomas dengue adulto | fora de escala | 8 |
| | 5 | sintomas de dengue e zika | fora de escala | 12 |

- **Saúde mental:** entra "como saber se sou bipolar", e as duas variantes psicólogo/psiquiatra ficam lado a lado, como decidiste.
- **Alimentação:** anemia, ferro, passos, celíaca e refluxo.
- **Nenhum empate no 5.º lugar.** Os empates que há são em 1.º e 3.º lugar, dentro do top. Não há empate no corte porque a 6.ª de cada eixo fica sempre abaixo da 5.ª: saúde mental +70%, alimentação +1850%, menopausa +160%, emergentes +9100%.

**Outras formas do mesmo tipo de pergunta.** Percorri as 5377 linhas da `health_questions`. "Como se escreve" só aparece em "alzheimer". Há outras duas famílias, e a decisão é tua:
1. **Tradução:** "X em inglês" e "X tradução" (enxaqueca, tdah, sarampo, psicóloga, "o que é ptsd em ingles", "burnout tradução"…).
   - Quase todas são pytrends com `is_question = false`: não entram no briefing nem no painel do site.
   - Só "o que é ptsd em ingles" é do autocomplete e é pergunta, por isso pode aparecer no painel.
   - **Proponho excluir**: tal como a escrita, perguntam pela palavra e não pela saúde.
2. **Significado:** "o que significa autismo", "o que significa tdah", "o que significa osteopenia", "significado de burnout"…
   - **Proponho não excluir**: perguntam o que a condição é, como as "o que é…", e isso é dúvida de saúde.

**Parâmetros técnicos que fixei:**
- **O lugar:** cada pergunta grava o lugar dentro do eixo num campo novo, `lugar`, porque `posicao` já é a posição devolvida pelo Google.
- **Quando conta como empate:** quando duas perguntas têm a mesma subida (ou estão ambas fora de escala) e a mesma posição no Google. A ordem da recolha só serve para mostrar as empatadas por ordem, e não desfaz o empate.
- **No site:** a exclusão vale no painel de perguntas, incluindo as "relacionadas" que se abrem ao carregar numa pergunta, no `eixos_archive` e no briefing.
- **Secção "Perguntas mais pesquisadas" do /briefing da semana corrente:** hoje mostra as 8 maiores subidas de sempre, sem eixo. Proponho que passe a usar a mesma regra sobre a recolha mais recente, para o ecrã não divergir do arquivo.

Diz-me se excluo também as de tradução e se aceitas a mudança na secção da semana corrente. Depois faço o código e os testes.
