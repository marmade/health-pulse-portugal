# Testes — 09/09/2026 (sessão 12)

Três testes para decidir o lado A com dados, não com suposições. **Não são
recolha**: nenhum escreve na base de dados. Escrevem para `docs/evidencia/`.

As regras de decisão estão escritas **dentro de cada ficheiro, antes de correr**.
É de propósito: uma regra escrita depois de ver o resultado não é uma regra.

| | teste | precisa de rede? | estado |
|---|---|---|---|
| 1 | `teste_1_janela_24m.py` — granularidade e cobertura de uma descarga de 24 meses | sim (`pytrends`) | **por correr** |
| 2 | `teste_2_vocabulario.py` — institucional vs linguagem corrente, no mesmo pedido | sim (`pytrends`) | **por correr** |
| 3 | `teste_3_distancia.sql` — distância entre as 83 keywords e as 4626 perguntas | não | **CORRIDO a 09/09** |

## Antes de correr os testes 1 e 2

```
pip install "pytrends==4.9.2" "urllib3<2.0"
```

**A partir de IP residencial.** Em GitHub Actions dá 429 — os *runners* são
datacenter e o Google bloqueia-os. É a mesma razão pela qual os passos 1 e 3 do
workflow estão comentados desde 14/08.

Se der 429, os scripts **param**. Não insistem em ciclo e não escrevem `0` no
lugar de um valor que não veio: um `0` aqui seria indistinguível de "ninguém
procura isto", que é exactamente o erro que custou as 3462 linhas de
`historical_snapshots`.

## Teste 2 — rever antes de correr

A tabela `PARES` no topo do ficheiro tem 10 pares. **Oito das reformulações
saíram das `health_questions`** — são formulações que o Google devolveu como
reais, não invenções minhas. **Três estão marcadas `DUVIDOSO`** porque as
propus eu e podem ser conceito vizinho em vez de reformulação:

- `saúde mental jovens` → `ansiedade adolescentes`
- `saúde mental no trabalho` → `stress no trabalho`
- `peso na menopausa` → `engordar na menopausa`

**A validade do teste depende disto.** Se a reformulação for outro conceito, o
resultado não diz nada sobre vocabulário. Esta escolha é editorial e é da Marta,
não minha.

Os dois últimos pares são **controlos**: espera-se que nem a reformulação tenha
sinal. Se tiverem, a hipótese fica mais forte do que o previsto; se não tiverem,
confirma-se que há temas de volume genuinamente baixo, que é o outro ramo.

## O que cada resultado decide

- **Teste 1** decide o schema: se a granularidade for semanal, a comparação
  mês-a-mês precisa de uma regra de agregação escrita, porque as semanas
  atravessam meses.
- **Teste 2** confirma ou mata a hipótese do vocabulário (ver `CONTEXT.md`,
  secção "Hipótese do vocabulário").
- **Teste 3** já deu resultado: `docs/evidencia/2026-09-09-distancia-vocabulario/`.

## O que estes testes NÃO resolvem

A questão da **keyword-âncora** continua em aberto, e nenhum destes testes lhe
toca. Fica registado o que se sabe: a âncora só é precisa se houver afirmações
**entre** descargas; se todas as afirmações forem dentro de uma descarga só, o
conjunto mudar de semana para semana não corrompe nada.
