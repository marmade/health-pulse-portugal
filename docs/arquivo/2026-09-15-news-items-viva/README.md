# `news_items` da instância viva + amostra para classificação — 15/09/2026

Preparação para o varrimento de quinta 17/09. Três coisas: o corpus exportado, uma amostra
de 100 com semente registada para classificação à mão, e o **mecanismo da má rotulagem,
identificado no código**.

## Ficheiros

| ficheiro | conteúdo |
|---|---|
| `news_items_viva.csv` | as **310** linhas de `news_items` de `ijpxjpbjudaddfatibfl`, 9 colunas |
| `amostra-100-para-classificar.csv` | 100 linhas, com colunas vazias para a classificação humana |

`[sessão 14][bd]` Leitura REST com a chave `anon` do `.env`, `Accept: text/csv`,
`order=id.asc`. 310 registos, igual ao `count(*)` da base.

## A amostra, e como se reproduz

**Semente: `amostra-rotulagem-2026-09-15`.**

A ordem **não** usa gerador aleatório. É `md5(id || semente)`, ordenada
ascendentemente, e ficam as primeiras 100. Isto reproduz-se em qualquer linguagem, em
qualquer máquina, hoje ou daqui a um ano — ao contrário de `order by random()` com `setseed`,
que depende da versão do PostgreSQL.

Colunas para preencher à mão:

- **`CLASSIFICACAO_rotulo_certo_S_N_D`** — `S` o `related_term` corresponde ao conteúdo, `N`
  não corresponde, `D` duvidoso.
- **`NOTAS`** — livre.

A coluna `pista_subcadeia` é **auxiliar e não é a resposta**: assinala quando o termo ou a
sua sigla aparece como subcadeia no título. Serve para ver o mecanismo, não para classificar.
**63 das 100 têm pista.**

---

## O mecanismo da má rotulagem — identificado, não inferido

`[sessão 14][ficheiro]` `supabase/functions/fetch-rss-feeds/index.ts:138-144`.

```ts
function matchesKeyword(text: string, keywords: string[]): string | null {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) return kw;
  }
  return null;
}
```

**Três defeitos, e o terceiro é o que produz o absurdo:**

1. **`includes` sem fronteira de palavra.** Qualquer ocorrência da cadeia conta, mesmo no
   meio de outra palavra.
2. **O primeiro que casa ganha** (`return kw`), pela ordem em que a tabela vier. Não é o
   melhor rótulo — é o primeiro.
3. **A lista inclui os sinónimos**, e vários sinónimos são **siglas de três letras** ou
   raízes curtas.

`[sessão 14][bd]` Os sinónimos da tabela `keywords` que explicam a amostra:

| termo canónico | sinónimo | o que ele apanha |
|---|---|---|
| `candidíase` | **`candida`** | **candida**to, **candida**tura, re**candida**tura |
| `síndrome do ovário poliquístico` | **`SOP`** | **sop**a, **Sop**hia, **Sop**hie |
| `perturbação obsessivo-compulsiva` | **`POC`** | é**poc**a, é**poc**as |
| `terapia hormonal` | **`THS`** | Ca**thS**tart |
| `perturbações do espectro do autismo` | **`PEA`** | — |
| `refluxo gastroesofágico` | **`azia`** | apanha "azia" a sério, e também dentro de palavras |

É por isto que **notícias de política eleitoral aparecem rotuladas como uma infecção
fúngica**, e **receitas de sopa como síndrome do ovário poliquístico**.

**`depressão` é um caso diferente e não se corrige com fronteiras de palavra:** é homónimo
legítimo — depressão clínica e depressão meteorológica. "Há 13 distritos em aviso amarelo
devido à chuva" está na amostra, rotulada `depressão`, e a palavra está lá de facto.

**Onde procura também importa:** `searchText` é o título **mais os primeiros 200 caracteres
da descrição** (l.209). Um rótulo pode vir da descrição e não ter pista nenhuma no título —
é parte da explicação para as 37 das 100 sem pista visível.

*Ressalva:* isto explica o mecanismo. **Não mede a proporção de rótulos errados** — é para
isso que serve a amostra, e essa contagem exige critério humano.

---

## O diff que se queria saber antes de quinta: NÃO há diff

`[sessão 14][ficheiro]` + `[bd]` A questão era: redeployar a `fetch-rss-feeds` para corrigir
isto traz consigo o que se acumulou no repositório desde 28/07/2026?

**Não traz nada, porque não há nada acumulado.**

| | |
|---|---|
| Versão em produção | **1**, deploy **28/07/2026 16:27:29 UTC** (MCP `get_edge_function`) |
| Último commit a `fetch-rss-feeds/index.ts` | **`6fda952`, 12/04/2026** |
| Commits a **qualquer** ficheiro de `supabase/functions/` desde 28/07/2026 | **zero** |

O deploy é **posterior** à última alteração do ficheiro. Confirmado também por conteúdo: os
269 linhas do repositório contêm os 12 marcadores distintivos que li na versão em produção, e
as contagens estruturais coincidem — 41 entradas em `FEEDS`, 3 `userAgents`, 1 `factcheck`.

### Isto corrige uma linha do `CONTEXT.md`

A tabela de Verificações diz, desde 14/08/2026: *"Nunca redeployadas. Alterações no
repositório desde 28/07 NÃO estão em produção."*

A frase é **verdadeira e vazia**: não existem alterações desde 28/07. Lida como aviso — e é
assim que soa — sugere uma divergência acumulada que **não existe**, e foi com base nela que
se descartou corrigir o `<![CDATA[` como "deploy às cegas".

**Consequência para quinta:** redeployar a `fetch-rss-feeds` **não é um deploy às cegas**. É
deployar o mesmo código que já lá está, mais a correcção que se decidir fazer. O risco que
travava a decisão era de uma divergência imaginária.

*O que continua verdadeiro:* a função nunca foi redeployada, e **nenhum redeploy foi
testado**. Não haver divergência de código não é o mesmo que ter provado que o *pipeline* de
deploy funciona.
