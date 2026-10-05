# Corrida de teste #4 da via B — 05/10/2026, a 2.ª da versão nova

A recolha do Google Trends pelos dois caminhos no mesmo dia (UTC): a **via funcao** (GitHub →
`trends-buscar-grupo` no Supabase → Google) e a **via pytrends** (Mac → Google). As duas
corridas foram `--dry-run`: nada foi gravado na base. Registo da sessão:
`docs/sessoes/2026-10-05.md`; análise do Cowork: `2026-10-05-cowork.md` §7.

## Ficheiros

| ficheiro | o que é |
|---|---|
| `dump-via-funcao.json` | script 5 pela via funcao, corrida agendada do workflow `via-b-corrida-de-teste.yml` (id 37308998146, commit `6cce31b`). Artefacto `dump-via-funcao-37308998146`, descarregado pela Marta, tirado do zip sem alterações. sha256 do zip `ea56deb5…ff64da5b`; do JSON `c9b5135d…115d9da6` |
| `dump-via-pytrends.json` | script 5 pela via pytrends, no Mac (`.venv-trends`) — o controlo do mesmo dia |
| `pytrends.txt` | a saída completa dessa corrida do pytrends |
| `pytrends-tentativa-falhada-python-errado.txt` | 1.ª tentativa do pytrends, às 21:58: corrida com o `python3` do sistema, que não tem o módulo. Falhou no `import`, antes de qualquer pedido ao Google |
| `comparar_vias.txt` | o output de `scripts/comparar_vias.py dump-via-funcao.json dump-via-pytrends.json` (saída 1) |

## Horas (UTC, primeiro e último `fetched_at` de cada dump)

| corrida | de | até |
|---|---|---|
| via funcao | 12:22:55 | 13:09:08 |
| via pytrends | 22:03:48 | 22:14:19 |

O cron estava às 05:23; o GitHub arrancou a corrida às 12:21 (7 h de atraso). **As duas vias
correram com ~9 h de distância** — na #3 foram 5 min.

## Resultados

1. **Critério de 30/09 §14: NÃO PASSOU.** Pela via funcao chegaram **29 de 31** pedidos; dois
   falharam com 429 do Google depois da segunda volta:
   `saude-mental p1 psiquiatra·bipolar·calmantes naturais·crise de ansiedade·demência` e
   `menopausa p2 tiroide·sop·suores noturnos·suplemento menopausa`. São 31 e não 33 porque o
   passo 2 depende dos números do passo 1. O pytrends chegou todo (33 de 33). Não se
   reclassifica.
2. **Via funcao: 62 tentativas no dump**, todas em **eu-west-1**; 29 com dados, 33 com erro
   (429 do Google, dentro de uma resposta 200 da função). Segunda volta em **10 pedidos**,
   8 recuperados (na #3: 1). Como 31 pedidos dão 62 chamadas está em `2026-10-05.md` §3.
3. **Via pytrends:** dois 429, recuperados na repetição de 60 s.
4. **Só informação — o top 5 de emergentes não coincide**, e nas duas vias há empates
   decididos pela ordem de inserção (`2026-10-05.md` §4):

   | | 3.º | 4.º | 5.º | 6.º | 7.º |
   |---|---|---|---|---|---|
   | #3 funcao e pytrends | enxaqueca 23,0 | gripe A 11,5 | sarampo 10,15 | (outro) | covid sintomas 7,67 |
   | #4 funcao | enxaqueca 22,667 | gripe A **22,667** | sarampo 10,30 | (outro) | covid sintomas 7,56 |
   | #4 pytrends | enxaqueca 22,667 | gripe A **11,333** | covid sintomas **11,333** | sarampo 10,00 | — |

   Os outros três eixos têm o mesmo top 5 nas duas vias. Na via funcao, porém, entram no top
   5 **psiquiatra** (saúde mental) e **tiroide** (menopausa), que estavam nos dois pedidos que
   falharam. O valor deles veio de outros pedidos `[ficheiro]`: psiquiatra é a âncora de
   saúde mental e está nos 6 pedidos do passo 1 — os calibrados vêm dos 5 que chegaram;
   tiroide vem do pedido do passo 1 `menopausa·sop·suores noturnos·suplemento
   menopausa·tiroide` — no pedido do passo 2 que falhou era a âncora secundária, e o script
   não usa a âncora do passo 2 (script 5, l.328). O que faltou ao eixo `[ficheiro]`:
   `bipolar`, `calmantes naturais`, `crise de ansiedade` e `demência` **não têm nenhum valor
   calibrado** — ficaram fora da ordenação; e o **passo 2 de saúde mental não correu**,
   porque a âncora secundária (`bipolar`) estava no pedido falhado. `sop`, `suores noturnos`
   e `suplemento menopausa` ficaram com o valor do passo 1, sem a afinação do passo 2. O
   `top5` do dump não assinala nada disto. **Por explicar:** se um termo pode entrar ou sair
   do top 5 por isso sem aviso (`2026-10-05.md` §6).

## O que isto não prova

- Porque é que houve tantos 429 hoje. A região não mudou (eu-west-1 em todas as
  tentativas, também nos logs do Supabase). A hora — meio-dia UTC, por causa do atraso — é
  hipótese não verificada.
- Que as diferenças de valores entre vias venham da via. Com 9 h de distância a hora é mais
  uma variável não controlada.
