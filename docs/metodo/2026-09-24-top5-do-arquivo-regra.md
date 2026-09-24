# O top 5 do arquivo semanal — regra

**Decidida a 24/09/2026 pela Marta**, sessão 18. Substitui o que o `archive-weekly` fazia
desde sempre. O achado que a motivou está em `docs/sessoes/2026-09-24.md` § 3b.

---

## A regra, em três pontos

1. **O top 5 de uma semana são os cinco termos com maior valor medido nessa semana**, dentro
   do eixo. Não é a maior subida: é quem mais se procurou.
2. **Uma semana sem medição fica vazia**, com a razão registada. *"Se numa semana não entrar
   nada, não entra"* — a Marta, 24/09/2026.
3. **Nada se apaga.** Os arquivos já gravados ficam como estão; o que lhes falta é uma nota,
   não uma reescrita.

## Porque é que a regra mudou

O arquivo ordenava os termos de cada eixo pela **subida** (`change_percent`) da tabela
`keywords`, e essa tabela não é escrita desde 20/03/2026. Como o número não mudava, a
ordenação não mudava: **sete semanas seguidas com os mesmos cinco termos e os mesmos números
até à casa decimal** (03/08 a 20/09).

E a lista que saía não era a dos mais procurados. Para saúde mental, o arquivo gravava
*dependências 25 · terapia online 15 · PTSD 7.7 · demência 3.8 · pânico 0* — sem a
**ansiedade**, que é o maior termo do eixo e vale três vezes o segundo. Ordenar pela subida
de um número congelado põe os termos pequenos à frente.

Com a medição nova, cada semana tem o seu top 5, e ele muda:

| semana | os cinco mais procurados (saúde mental) |
|---|---|
| 13/09 | ansiedade 186 · stress 96 · psiquiatra 79 · alzheimer 64 · depressão 54 |
| 06/09 | ansiedade 183 · stress 81 · psiquiatra 73 · alzheimer 52 · enxaqueca 47 |
| 30/08 | ansiedade 177 · stress 89 · psiquiatra 58 · enxaqueca 54 · depressão 54 |
| 23/08 | ansiedade 156 · stress 79 · alzheimer 70 · psiquiatra 58 · depressão 54 |
| 16/08 | ansiedade 146 · stress 69 · psiquiatra 67 · depressão 61 · demência 43 |
| 09/08 | ansiedade 162 · depressão 136 · stress 67 · psiquiatra 61 · alzheimer 37 |

## De onde sai o número

**Fonte:** `trends_calibrados`, coluna `valor_eixo` — o valor do termo já posto na régua do
eixo pela âncora (ver `docs/metodo/2026-09-18-reguas-e-ancoras.md`).

**Que lote:** o **último lote completo de 5 anos** — `trends_pedidos.timeframe = 'today 5-y'`
com `trends_lotes.estado = 'completo'`, o de `fetched_at` mais recente. É o mesmo critério
que o dashboard usa (`src/hooks/useTrendsLote.ts`, l.47–52), para que o arquivo e o ecrã não
possam divergir.

**Que termos:** só os termos **activos** daquele eixo na tabela `keywords`, e só os de valor
maior que zero. A âncora pode não ser keyword, e sai do top — é a mesma regra do dashboard
(*"um top 5 dos mais pesquisados não pode ter medianas a 0"*, l.71).

**Que semana:** a semana que o arquivo está a fechar. O ponto da série cuja data cai nessa
semana.

## A semana vazia

Se não houver ponto medido para aquela semana no lote em uso, o arquivo grava a lista
**vazia** e, ao lado, a razão — a data do último ponto que existe e o lote de onde se leu.
Não repete a semana anterior, não copia o lote velho, não põe zeros.

**Isto vai acontecer já.** A medição vai até **13/09/2026**. As semanas de 14–20/09 e
21–27/09 ficam vazias enquanto o script 5 não correr outra vez.

## O que muda, e o que não muda, no código

**Muda** em `supabase/functions/archive-weekly/index.ts`:

- `top_keywords` de cada eixo (hoje l.111–124) passa a sair de `trends_calibrados`
- `top_emerging` do briefing (hoje l.199–213) passa a sair da mesma fonte

**Não muda:** a leitura da tabela `keywords` continua, porque é de lá que vêm os **nomes**
dos termos activos de cada eixo (`axisTerms`, l.117) — e são esses nomes que escolhem que
notícias (l.146) e que verificações (l.136) pertencem ao eixo. Essa parte está boa.

## Consequências conhecidas

1. **O formato do que fica gravado muda.** Deixa de ser `{term, change_percent,
   current_volume}` e passa a ser o termo e o seu valor na régua do eixo, com o lote
   identificado. Os arquivos antigos ficam com o formato antigo — é o que eles eram.
2. **O top 5 vai mudar quando a lista de 100 for aplicada.** `psiquiatra` é um dos termos
   novos e ainda não está na `keywords`; a `enxaqueca` muda de saúde mental para emergentes.
   Enquanto a migração `20260918180000` não for aplicada, o filtro pelos termos activos deixa
   `psiquiatra` de fora e mantém `enxaqueca` dentro.
3. **O arquivo passa a depender de haver recolha.** É por isso que o `launchd` deixa de ser
   um item de arrumação e passa a ser o que garante que as semanas não saem vazias.

## Estado

**Regra escrita e decidida a 24/09/2026. Por implementar.** O texto exacto da alteração ao
`archive-weekly` é para apresentar à Marta antes de se publicar seja o que for.
