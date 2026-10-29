# Creatina: alerta "em curso" que dura demais — regra nova e simulação, 29/10/2026

Simulação do Claude Code, só com leituras, sobre a decisão da Marta de 29/10 (`2026-10-29-cowork.md`
§16). Não se mexeu em código nem na base.

Base da simulação: o lote `2d0a7be3` (recolha de 25/10). A regra actual (`scripts/trends_alertas.py`)
recalculada aqui dá exactamente as 1195 linhas gravadas em `trends_alertas` (mesmos termo, semana,
tipo e semana_n), e por isso as diferenças abaixo vêm só da regra nova.

**Parâmetros que fixei:**
- **"Muito tempo" = mais de 26 semanas (meio ano).** Nos cinco anos do lote há 151
  acontecimentos. 148 duram 15 semanas ou menos (o mais longo é uma época de gripe A). Os outros
  três duram 31, 39 e 251 semanas, e nada fica entre 15 e 31. As 26 semanas separam os dois grupos
  com folga dos dois lados.
- **O patamar novo** é o "valor normal" de sempre: a mediana das 8 semanas anteriores, que já está
  no novo nível quando o alerta faz meio ano. Não há uma segunda definição de "normal".

## 1. A regra nova, em linguagem simples

1. Um alerta abre como até aqui e fica "em curso" enquanto o valor estiver pelo menos 1,5 vezes
   acima do valor normal de antes do disparo (decisão 3 de 18/09, sem mudança).
2. **Se continuar em curso mais de 26 semanas, deixa de ser alerta.** Passa a "tendência de subida
   desde [data do início]": uma linha à parte, sem bandeira.
3. **A partir daí o termo volta a ser avaliado como qualquer outro**, contra o valor normal das 8
   semanas anteriores, que já é o patamar novo. Uma subida nova acima do patamar dá um alerta novo,
   com bandeira, "1.ª semana". Enquanto esse alerta durar, é ele que aparece. Quando acabar, a
   linha da tendência volta.
4. **A tendência acaba quando o valor desce para menos de 1,5 vezes o valor normal de antes**, ou
   seja, quando o termo regressa ao nível antigo.
5. **Uma linha por termo e por semana, por esta ordem:** alerta (subida ou aparecimento) primeiro,
   depois a tendência, e só depois "sazonal" e "a observar". Durante a tendência, "a observar" e
   "sazonal" não aparecem. É o que já acontece hoje durante um alerta em curso.

## 2. O que muda nos cinco anos do lote 2d0a7be3

**Passam a "tendência" três termos:**

| Termo | Eixo | Alerta desde | Valor normal de antes | Tendência | Semanas |
|---|---|---|---|---|---|
| creatina | alimentação | 02/01/2022 | 40,8 | de 03/07/2022 a 18/10/2026 (continua) | 225 |
| jejum intermitente | alimentação | 26/12/2021 | 21,6 | de 26/06/2022 a 18/09/2022 | 13 |
| dengue | emergentes | 04/02/2024 | 7,3 | de 18/08/2024 a 01/09/2024 | 3 |

- **Linhas:** 241 deixam de ser "subida, em curso" (da 27.ª semana em diante) e passam a
  "tendência". O total fica em 1195.
- **Fica igual:**
  - nenhum alerta desaparece;
  - as linhas "a observar" (504), "sazonal" (42) e "aparecimento" (20) ficam iguais;
  - o factor sazonal fica igual em todas as linhas, e por isso os "Previsíveis para <mês>" do
    briefing não mudam.
- **Aparece um alerta novo, por causa do patamar novo: dengue, semana de 04/08/2024.**
  - Na 27.ª semana do alerta de Fevereiro, o valor normal é 14,7 (as 8 semanas anteriores, já no
    patamar) e a dengue está a 36,7: 2,5 vezes acima, z = 3,0. Dá alerta, "1.ª semana", e
    continua na semana de 11/08 (22,0).
  - Com a regra actual estas duas semanas eram "em curso, 27.ª e 28.ª semana", contadas contra os
    7,3 de Fevereiro. Depois do alerta novo volta a tendência, até 01/09.
  - Nota: o pico de 28/07/2024 (69,7, 9,5 vezes acima) cai na 26.ª semana do alerta de Fevereiro.
    Ainda é "em curso", nas duas regras.
- **Creatina:** com o patamar novo, a creatina **nunca volta a dar alerta** de 2022 a 2026.
  - O patamar sobe de 145,8 (Julho de 2022) para 188,6 (2023), 281,9 (2024) e 264,4 (2025), e
    está em 235,3 a 18/10/2026.
  - O valor nunca chega a 1,5 vezes isso.
  - Em 16 semanas teria ficado "a observar" contra o patamar. A tendência esconde-as, tal como o
    "em curso" as esconde hoje.

## 3. O que muda na semana de 18/10 (a do último briefing)

As partes 1–3 dos "Sinais emergentes" calculadas para a semana de 18/10:

| Parte | Regra actual | Regra nova |
|---|---|---|
| Novos | 2 | 2 (iguais) |
| Em curso | 3: creatina (251.ª semana), dengue (2.ª), sarampo (3.ª) | 2: dengue (2.ª), sarampo (3.ª) |
| A observar | 2 | 2 (iguais) |
| Tendência (linha nova) | — | creatina: tendência de subida desde 02/01/2022 (190,6; o valor normal antes era 40,8) |

- **Os "Previsíveis para Outubro" não mudam.**
- **O briefing de 19–25/10 que está gravado não muda.** Foi gravado a 26/10, antes das quatro
  partes, e o arquivo não se reescreve. A diferença aparece a partir do briefing de 2/11.

**Ponto para a tua decisão: a data do início.** A tendência da creatina diz "desde 02/01/2022",
mas, como o Cowork viu, essa é a primeira semana calculável do lote (a série começa a
24/10/2021). É o princípio dos dados, não o do fenómeno. Proponho escrever "desde pelo menos
02/01/2022" quando o alerta abriu na primeira semana calculável. Hoje isso só acontece com a
creatina. O texto é teu.

## 4. O que isto exige

1. **Migração** (o Cowork aplica): a tabela `trends_alertas` só aceita os tipos subida,
   aparecimento, sazonal e a_observar (`check`). É preciso acrescentar "tendencia". Também na
   `migration_consolidada.sql` (regra 2). A função `gravar_alertas_lote` não muda.
2. **Código** (Claude Code):
   - `scripts/trends_alertas.py`: a regra, com o parâmetro das 26 semanas registado com data, e
     testes em `scripts/testar_trends_alertas.py`;
   - `docs/metodo/2026-09-18-alertas-regra.md`: a decisão nova, com data;
   - `_shared/emergentes.ts`: a tendência sai de "em curso" e vai para uma linha à parte;
   - a página `/briefing` e o PDF;
   - o ecrã (`AlertasEixo` e `useTrendsLote`): a linha à parte, sem bandeira.
3. **Nova gravação dos `trends_alertas` do lote 2d0a7be3**, com
   `python3 scripts/trends_alertas.py --lote 2d0a7be3 --gravar`.
   - Grava num só pedido, tudo ou nada, como a 15/10. Só depois da migração.
   - Pode corrê-la o Claude Code, com a chave lida pelo script, como a 15/10; ou outra pessoa, se
     preferires que a base fique toda com o Cowork. Decide tu.
   - Os lotes antigos ninguém os lê e ficam como estão.
4. **Publicação da `archive-weekly`** (o Cowork), com o `emergentes.ts` novo, antes da corrida
   de 2/11.
5. **Calendário — atenção ao domingo 1/11.**
   - A recolha de domingo (`recolher_domingo.sh`, nesta máquina) calcula os alertas do lote novo
     com o `trends_alertas.py` do repositório.
   - Se o código novo estiver no repositório e a migração não estiver aplicada, a gravação dos
     alertas falha no `check`: o lote fica gravado, mas sem alertas, e o briefing de 2/11 sai com
     os sinais vazios.
   - Por isso a migração tem de estar aplicada antes de o código novo chegar à máquina que corre
     a recolha, ou então tudo fica para depois de 2/11.
6. **Textos (decisão tua):**
   - a frase da linha da tendência no ecrã e no briefing;
   - talvez uma frase em "Como ler os alertas" a dizer que um alerta com mais de meio ano passa a
     tendência.
