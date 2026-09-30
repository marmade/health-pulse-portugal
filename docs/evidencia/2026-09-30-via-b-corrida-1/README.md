# 1.ª corrida de teste da via B — 30/09/2026

A primeira comparação, no mesmo dia, da recolha do Google Trends pelos dois caminhos: a
**via funcao** (GitHub → `trends-buscar-grupo` no Supabase → Google) e a **via pytrends**
(Mac → Google). As três corridas foram `--dry-run`: nada foi gravado na base.
Registo da sessão: `docs/sessoes/2026-09-30.md`; análise e decisões: `2026-09-30-cowork.md`
§12–14.

## Ficheiros

| ficheiro | o que é |
|---|---|
| `dump-via-funcao.json` | script 5 pela via funcao, no workflow `via-b-corrida-de-teste.yml`, arrancado à mão pela Marta. Artefacto `dump-via-funcao-36738888020` do GitHub, tirado do zip sem alterações |
| `dump-via-pytrends.json` | script 5 pela via pytrends, no Mac — 1.ª corrida |
| `dump-via-pytrends-2.json` | script 5 pela via pytrends, no Mac — 2.ª corrida, o controlo |
| `calculo_tres_dumps.py` | o cálculo que deu os números do controlo (secção 3), nos pedidos comuns aos três dumps. Corrido em linha na sessão; passado para ficheiro com o mesmo texto e corrido de novo às 17:43 de Lisboa, com os mesmos números. Corre-se da raiz do repositório |
| `lado_a_lado.py` | a primeira versão desse cálculo, tal como estava. Falhou (`IndexError`): o controlo não chegou todo e o `comparar_vias.py` pára antes dos números. Guardado por ser parte do que se fez |

## Horas (UTC, primeiro e último pedido de cada dump)

| corrida | de | até |
|---|---|---|
| via funcao | 15:43:34 | 15:53:10 |
| via pytrends, 1.ª | 15:44:44 | 15:55:13 |
| via pytrends, 2.ª (controlo) | 16:10:17 | 16:21:13 |

## Resultados

1. **Critério aprovado antes da corrida** (`2026-09-30-cowork.md` §12), com
   `scripts/comparar_vias.py` sobre a via funcao e a 1.ª pytrends: **NÃO PASSOU.** 33 de 33
   pedidos pelas duas vias; 5 dos 8 pedidos do passo 2 diferentes (dependem dos números do
   passo 1); semanas e marcações de semana incompleta iguais nos 28 pedidos comuns. Medianas
   dos 100 termos: correlação 0,790 (referência ≥ 0,987), diferença média 0,83 (≤ 1,9),
   92,5 % das semanas a ≤ 2 (≥ 72,5 %). 82 termos e 9 pedidos inteiros abaixo da referência.
2. **Top 5 de cada eixo: igual nas duas vias** — os mesmos 5 termos, pela mesma ordem, nos
   quatro eixos. A maior diferença de valor é creatina: 207,8 pela via funcao, 193,8 pela
   pytrends.
3. **Controlo pytrends × pytrends.** A 2.ª corrida teve quatro 429; um pedido falhou depois da
   repetição (saúde mental, passo 1, `psiquiatra·bipolar·calmantes naturais·crise de
   ansiedade·demência`) e o passo 2 de saúde mental não correu: 31 pedidos. Nos 27 pedidos
   comuns aos três dumps (conta fora das regras do comparador):

   | | funcao × pytrends | pytrends-2 × pytrends |
   |---|---|---|
   | mediana da correlação | 0,814 | 1,000 |
   | mediana da diferença média | 0,79 | 0,00 |
   | mediana das semanas a ≤ 2 | 92,8 % | 100 % |
   | pedidos abaixo por inteiro | 8 | 0 |

   Top 5 igual nos três dumps.

## O que isto não prova

- **O controlo não mede o ruído entre origens.** As duas corridas pytrends saíram do mesmo Mac,
  com 25 minutos de intervalo, e deram números idênticos. Que o Google devolva a mesma amostra
  à mesma origem e outra a outra origem é uma leitura, não verificada — e, se for assim, a
  diferença entre a via funcao e a pytrends nos termos pequenos não diz qual das duas está
  mais perto do valor "verdadeiro".
- O top 5 igual é de um dia só.
- Nenhuma corrida gravou: os dumps não mostram como sairia um lote, nem os alertas, que
  dependem da série de cada termo.

A 1.ª corrida fica **NÃO PASSOU** pelo critério de §12 e não se reclassifica. O critério das
corridas seguintes mudou depois deste resultado, por decisão da Marta: `2026-09-30-cowork.md`
§14.
