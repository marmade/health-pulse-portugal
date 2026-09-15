# A rotulagem de `news_items` não é reproduzível — 15/09/2026

> **Achado por leitura de ficheiro.** Não depende de medição nenhuma, e é verificável por
> qualquer pessoa no repositório público. Alargado no terminal com duas verificações à base
> de dados, assinaladas abaixo.

Distinto dos três defeitos já documentados em
`docs/arquivo/2026-09-15-news-items-viva/README.md` — `includes` sem fronteira de palavra,
primeiro-a-casar, e siglas curtas entre os sinónimos. **Aqueles dizem que o rótulo está
errado. Este diz que não há critério a que o rótulo obedeça.**

---

## O achado central: a ordem da lista é um acidente

`[sessão 14][ficheiro]` `supabase/functions/fetch-rss-feeds/index.ts`.

**`:138-144`** — `matchesKeyword` devolve o **primeiro** termo da lista que apareça no texto:

```ts
for (const kw of keywords) {
  if (lower.includes(kw.toLowerCase())) return kw;
}
```

**`:154-157`** — a consulta que constrói essa lista **não tem `ORDER BY`**:

```ts
const { data: keywordRows, error: kwErr } = await sb
  .from('keywords')
  .select('id, term, synonyms')
  .eq('is_active', true);
```

O PostgreSQL não garante ordem sem `ORDER BY`, e a ordem de varrimento do *heap* muda quando
uma linha é actualizada ou inserida. Logo **"o primeiro a casar" não é um critério — é a
ordem de arrumação física da tabela**, e duas corridas da mesma função sobre a mesma notícia
podem produzir rótulos diferentes sem nada ter mudado no código nem nos dados.

---

## Alargamento 1 — há uma segunda indeterminação, e esta está nos dados

`[sessão 14][bd]` Consulta à tabela `keywords` da instância viva, 15/09/2026.

O código constrói também um `Map` de resolução (`:161-172`), onde cada termo **e cada
sinónimo** aponta para o *keyword* canónico. `Map.set` com a mesma chave **sobrescreve**: o
último a escrever ganha.

**Duas chaves colidem de facto, hoje:**

| chave | é termo canónico de | é sinónimo de |
|---|---|---|
| `stress` | `stress` | **`ansiedade`** |
| `doença celíaca` | `doença celíaca` | **`intolerância ao glúten`** |

Para estas duas cadeias, **qual dos dois *keywords* fica no `Map` depende da ordem da mesma
consulta sem `ORDER BY`**. E há uma consequência que não é óbvia: o `Map` resolve **depois**
do `matchesKeyword`, logo o rótulo gravado pode **discordar do termo que casou** — a função
pode casar em `stress` e gravar `ansiedade`.

**Estado observado hoje**, e é observação e não garantia: as notícias com "stress" no texto
estão gravadas como `stress` (2 linhas) e uma como `ansiedade` — esta última contém as duas
palavras, logo não distingue as hipóteses. **Nenhuma re-corrida foi feita.**

---

## Alargamento 2 — a ordem NÃO está estável por desenho, e o escritor activo é outro

`[sessão 14][ficheiro]` Esta é uma **correcção** à primeira leitura do achado, que dizia que o
escritor mais provável de `keywords` é o `5_fetch_google_trends.py` e que, estando comentado
desde 14/08/2026, a ordem estaria plausivelmente estável.

O script 5 está comentado, sim. **Mas não é o único escritor, e o outro está activo.**

`scripts/6_fetch_health_questions.py`, função `expandir_mural()`, faz um **`POST` a
`/rest/v1/keywords`** (`:330-334`) com `Prefer: resolution=ignore-duplicates`. É uma
**inserção**. E o script 6 é o **passo 2 do workflow, activo** — corre todas as segundas
(`.github/workflows/youtube-trends.yml:62`).

**Porque é que ainda não mexeu na ordem:** `expandir_mural()` **falha com HTTP 400 todas as
semanas**, achado na sessão 11 e registado na 12 (`docs/sessoes/2026-09-09.md:143`), **ainda
sem diagnóstico**.

Ou seja: a estabilidade actual da ordem não é sorte de um passo desligado — **assenta num
*bug* não diagnosticado**. No dia em que esse `400` for corrigido, as inserções começam, cada
inserção muda a ordem do *heap*, e a rotulagem passa a variar entre corridas. **A correcção
de um defeito activaria outro**, e nada no repositório ligava as duas coisas até hoje.

---

## O que NÃO se afirma

- **Não está observado que a ordem tenha mudado alguma vez.** Que *pode* mudar é propriedade
  do PostgreSQL, não medição feita aqui.
- **Nenhuma re-corrida foi feita** a comparar rótulos da mesma notícia entre execuções. Era
  o teste decisivo e exigiria redeployar e correr a função duas vezes.
- **Não se sabe qual das duas indeterminações dominou** nos 310 registos existentes, nem se
  alguma delas produziu de facto um rótulo diferente do que produziria hoje.
- **Não se afirma que o `400` do `expandir_mural()` seja fácil de corrigir**, nem que
  corrigi-lo seja desejável. Só que corrigi-lo tem esta consequência.

---

## Consequência para a decisão de quinta

Acrescenta uma quinta decisão de método à lista do `CONTEXT.md`, e é a mais simples de todas:
**a consulta precisa de `ORDER BY` determinista** — por exemplo por comprimento do termo
descendente, se a regra escolhida for "o mais específico ganha", ou por `id` se for só para
fixar.

Mas a ordem determinista **sozinha não resolve** as duas colisões do `Map`: `stress` e
`doença celíaca` continuariam a resolver para um dos dois *keywords* de forma fixa **mas
arbitrária**. Isso é decisão editorial — se `stress` é um eixo próprio ou um sinónimo de
`ansiedade`, não pode ser as duas coisas.

**Não implementar ainda.** As decisões de método saem do varrimento de quinta.
