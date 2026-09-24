# news_items antes de seguir os nomes novos — 24/09/2026

**344 linhas, 11 colunas**, a tabela inteira como estava às 17h de 24/09/2026, antes de
qualquer correcção de rótulos. `sha256.txt` tem a impressão digital do ficheiro.

## Porque existe

A migração `20260918180000` (lista de 100) **renomeou 29 keywords** — `depressão` passou a
`depressão sintomas`, `stress` a `stress sintomas`, `sepsis` a `sépsis`. As linhas, os ids e
as FKs ficaram intactos; o que mudou foi o nome.

O `related_term` das notícias guarda o **nome**, não o id. Logo, 160 das 344 passaram a ter um
rótulo que já não corresponde a nenhuma keyword activa. Isso tem efeito no ecrã: a página
inicial mostra-as na mesma (na vista "todos" não há filtro por keyword), **mas ao escolher um
eixo o filtro é `related_term` contra os termos activos desse eixo** (`src/pages/Index.tsx`
l.87–89, `src/hooks/useAxisData.ts` l.36) — e aí desapareciam, sem aviso.

Dentro das 160 há dois casos:

| grupo | notícias | rótulos | o que se passa |
|---|---|---|---|
| **A** | 142 | 24 | a keyword só mudou de nome; o `keyword_id` aponta para a linha certa e activa |
| **B** | 18 | 4 | a keyword foi desactivada pela lista de 100; perderam mesmo o eixo |

A correcção de 24/09 trata **só do grupo A**, e é mecânica: `related_term` passa a ser o nome
actual da keyword que o `keyword_id` já indica. Não há juízo nenhum a fazer, e nada se
inventa. O grupo B fica para a rotulagem a sério, com a regra nova aplicada aos títulos.

## A pedido da Marta

*"Quando o fizeres, que não seja por cima: guarda o rótulo antigo numa coluna ou num CSV de
arquivo antes de gravar o novo, como fizeste com o autocomplete."* É este ficheiro. Os nomes
antigos também continuam vivos na base, nos `synonyms` e no `termo_institucional` de cada
keyword renomeada — mas isso é a origem do nome, não o registo do que a linha dizia. Este CSV
é o registo.

## Como reverter

Cada linha tem o `id`. Repor é escrever de volta o `related_term` deste ficheiro para o `id`
correspondente.
