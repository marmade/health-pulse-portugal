# `health_questions` — as 3634 linhas de autocomplete

> Exportadas a **16/09/2026**, antes de se tocar no
> `scripts/7_fetch_autocomplete_questions.py`. É essa a razão de existir desta pasta:
> o Crítico nº 7 diz **"exportar primeiro… mexer antes perde-as"**, e este é o "primeiro".

## Ficheiros

| ficheiro | linhas | bytes | sha256 |
|---|---|---|---|
| `health_questions_autocomplete.json` | 3634 | 1 519 909 | `1cb163b76b939d0eae7f692a6e31b76146fa1f6c412833fce8d909ea2f0b72cd` |
| `health_questions_autocomplete.csv` | 3634 | 727 817 | `a2ed671036b8af2cd4074ee6ea3ba0d72b9683e0ba697bb2cdf97f825f1eb810` |
| `health_questions_completa.json` | 4647 | 1 929 146 | `babbc71d9657dd631484d9f96362bd44d8d57798bc71b031b9bf27e3b875642a` |
| `health_questions_completa.csv` | 4647 | 916 220 | `8bdf6c19e07e0fd35c6b1ec1cf529c9cd82d0264077caa7925c15bc39629c265` |

**A tabela inteira foi exportada a seguir, no mesmo dia, e por uma razão que só apareceu
depois.** O Crítico nº 7 pedia as 3634 de autocomplete; ao verificar o que o dashboard
mostra de facto, viu-se que **o painel só mostra linhas de `pytrends`** — logo guardar só
metade da tabela era guardar a metade que não está na página. Os ficheiros `_completa`
têm as 4647 linhas, as duas fontes.

O **JSON é o ficheiro de referência** — mantém tipos e nulos. O CSV é para abrir e ler.
Os dois têm as mesmas 3634 linhas: conferido por comparação do conjunto de `id`.

## Como foram obtidas

`[sessão 15][bd]` Instância **`ijpxjpbjudaddfatibfl`** (a viva), leitura REST com a chave
publicável do `.env`, paginada de 1000 em 1000 e ordenada por `id` para a paginação ser
estável:

```
GET /rest/v1/health_questions?select=*&source=eq.autocomplete&order=id.asc
Range: 0-999, 1000-1999, …      Prefer: count=exact
```

**Verificado no acto:** o `content-range` do servidor devolveu **3634**, foram descarregadas
**3634**, e os `id` são **3634 distintos** — nenhuma linha repetida, nenhuma perdida entre
páginas. O número bate com o que o `CONTEXT.md` regista desde 14/08/2026.

Contagens do mesmo momento, para contexto: `health_questions` tem **4647** linhas no total —
**3634** de `source=autocomplete` e **1013** de `source=pytrends`. Nenhuma com `source` nulo.

## O que lá está dentro

**3634 perguntas distintas** — não há duplicados — todas com `is_question = true`.
`relative_volume` entre **10 e 100**, média **27,1**.

| eixo | linhas |
|---|---|
| `saude-mental` | 1475 |
| `alimentacao` | 893 |
| `menopausa` | 742 |
| `emergentes` | 524 |

**71 clusters distintos.** Os maiores: `avc` 144, `candidíase` 140, `enxaqueca` 135,
`depressão` 130, `ansiedade` 125, `anemia` 124, `alzheimer` 122, `osteoporose` 117.

## Uma coisa que a exportação mostrou, e não se andava a procurar

`last_seen_at` vai de **28/03/2026** a **07/09/2026**, e a distribuição não é uniforme:

**2725 das 3634 linhas (75%) têm `last_seen_at` = 07/09/2026.** As outras **909** não são
vistas desde antes disso — há linhas paradas em Março, Abril, Maio, Junho e Agosto.

Duas leituras, e as duas importam:

1. **A tabela acumula, não retrata.** O `upsert` tem chave `(question, axis, source)` e
   actualiza o `last_seen_at` de quem reaparece; quem deixa de aparecer no autocomplete
   **fica lá na mesma, com a data antiga**. Logo "3634 perguntas" não é "3634 perguntas que
   as pessoas fazem hoje" — é tudo o que alguma vez foi recolhido desde Março.
2. **A última recolha foi a 07/09/2026, e não é semanal.** O passo 2B do
   `youtube-trends.yml` está **comentado desde 14/08/2026**, junto com os passos 1 e 3, pelo
   motivo dos zeros do script 5. Ou seja: o autocomplete **não corre na automação**, e o que
   aqui está é um retrato parado, não uma série viva.

*Aritmética minha* em ambos os pontos: 3634 − 2725 = 909, e as datas são as do próprio
ficheiro.

## O que isto NÃO prova

- **Não prova que as 909 linhas antigas tenham deixado de existir no Google.** Só que não
  foram revistas na corrida de 07/09 — que pode ter falhado parcialmente, ter usado outra
  lista de seeds, ou ter sido interrompida. **Não foi apurado.**
- **Não diz porque é que a corrida de 07/09 aconteceu**, já que o passo está comentado desde
  14/08. Foi corrida à mão, presumivelmente — mas isso é inferência, não observação.
- Não valida o conteúdo das perguntas. A ambiguidade de termos que o `CONTEXT.md` regista
  (`solidão` já contamina esta tabela) **está aqui dentro**, tal e qual.
