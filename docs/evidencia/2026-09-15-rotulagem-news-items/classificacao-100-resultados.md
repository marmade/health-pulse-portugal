# Classificação humana das 100 notícias — resultados, 15/09/2026

> **Classificação feita pela Marta**, na tarde de 15/09/2026, sobre a amostra de 100 com
> semente `amostra-rotulagem-2026-09-15`. Reproduzível por `analise-classificacao.py` nesta
> pasta; saída guardada em `output-classificacao-2026-09-15.txt`, com o `sha256` das entradas
> à cabeça.
>
> **O ficheiro de registo é `amostra-100-TRABALHO-v2.csv`.** O `.numbers` ao lado é a cópia
> de trabalho do Numbers e não é a fonte.

---

## O instrumento estava mal construído, e descobriu-se a usá-lo

A primeira passagem (`amostra-100-TRABALHO.csv`) tinha **uma** coluna:
*"o rótulo está certo?"*. Ao classificar, a Marta respondeu ora a essa pergunta ora a outra
— *"esta notícia pertence ao corpus de saúde?"* — conforme a linha. As notas provam-no nas
suas palavras:

> *Instituto Ricardo Jorge:* "doenças raras **fazem sentido entrar**, só o rótulo não me
> parece relacionado" · *APAV:* "violência doméstica **entra na saúde, é um S**, mas síndrome
> do ovário poliquístico não me parece o rótulo indicado" · *Bolsa de investigação:*
> "**entra** na vida institucional, mas candidíase é outra vez o rótulo errado"

**São duas variáveis independentes** — uma sobre a máquina, outra editorial — e a coluna
aceitava só uma resposta. A amostra foi refeita com duas colunas
(`amostra-100-TRABALHO-v2.csv`), mantendo a primeira passagem como referência.

**Consequência, e é a razão de isto estar escrito:** o número da primeira passagem (38)
**não mede nenhuma das duas**. É a média de duas perguntas diferentes. Apresentá-lo como
"proporção de rótulos errados" teria subestimado o defeito em 15 pontos.

---

## As duas medidas, separadas

`[sessão 14][ficheiro][agregado]` n = 100. Intervalos de confiança de 95%, método de Wilson.

| | | IC 95% |
|---|---|---|
| **rótulo errado** | **53 / 100** | [43,3% ; 62,5%] |
| **não pertence ao corpus** | **39 / 100** | [30,0% ; 48,8%] |
| *primeira passagem (mistura)* | *38 / 100* | *não interpretável* |

**Esta é a medição que faltava** à afirmação nº 1 da lista de quinta — *"estas notícias são
deste eixo"*. O `keyword_id` está preenchido em 100% das 310 linhas e **está errado em
cerca de metade**.

## Os quatro quadrantes

| | pertence | não pertence | dúvida |
|---|---|---|---|
| **rótulo certo** | **43** | **0** | 2 |
| **rótulo errado** | **9** | **39** | 5 |
| rótulo duvidoso | 0 | 0 | 2 |

- **39 — errado e não pertence.** Lixo mal rotulado. Alvo óbvio.
- **9 — errado mas pertence.** Notícias de saúde a sério com o rótulo trocado. **Não se
  deitam fora; corrigem-se.** É a distinção que a coluna única escondia.
- **0 — certo mas não pertence.** O quadrante que na sessão se chamou "caso Pepa" **está
  vazio**: a decisão editorial da Marta foi que uso coloquial de termo clínico **pertence**.
  É posição tomada, não ausência de casos.

## Por tipo de fonte

| fonte | n | rótulo errado | não pertence |
|---|---|---|---|
| media | 78 | 53% [42;63] | **50%** [39;61] |
| institucional | 20 | **60%** [39;78] | **0%** [0;16] |
| factcheck | 2 | 0% [0;66] | 0% [0;66] |

**A hipótese "entidades de saúde contra jornais" confirma-se — mas para a pertinência, não
para o rótulo.** Nenhuma notícia institucional é irrelevante; metade das de jornal são. O
rótulo, esse, erra tanto ou mais nas institucionais (60%), porque **depende do algoritmo e
não da fonte**.

*Ressalva:* 20 e 2 são amostras pequenas; ver a largura dos intervalos antes de citar.

**As 7 institucionais marcadas `D` na pertinência são todas do mesmo tipo:** *Módulo 4*,
*Call for Abstracts*, *Concurso de Expressão Artística*, *Resumo do 1.º dia*, *Webinar* —
mais a página de spam do `spesf.pt`. **Vida institucional, não conteúdo clínico.** A hesitação
caiu toda no mesmo sítio, o que sugere que o eixo útil pode não ser a origem da fonte mas
**"conteúdo clínico" contra "vida da instituição"** — que se aplicaria aos dois lados, porque
um jornal também publica nomeações e prémios. **Hipótese, não medição.**

---

## O que a regra nova faz — e o custo tem outra explicação

Regra simulada: fronteira de palavra + procura só no título + sem as sete siglas de três
letras (as decisões 1, 2 e 3 de `decisoes-2026-09-15.md`).

- **Dos 53 rótulos errados, resolve 52 — 98%.**
- **Das 52 que pertencem, deita fora 18 — 35%.**

**Mas as 18 não são perda legítima da regra.** Nove delas têm o **rótulo certo** e caem por
a lista escrever o conceito de outra maneira do que a imprensa:

| título | termo na lista | o que o título diz |
|---|---|---|
| Gripe **das aves** volta a ser detetada em Torres Vedras | `gripe aviária H5N1` (sin.: `gripe aviária`, `influenza aviária`) | "gripe das aves" |
| Aumentam os casos de **Mpox**: Portugal com 40 novas infeções | `mpox portugal` (sin.: `varíola dos macacos`) | "Mpox" |
| **Poluição do ar** em Lisboa ultrapassa limites da OMS | `poluição e saúde` (sin.: `qualidade do ar`) | "poluição do ar" |
| DGS lança campanha contra uso excessivo de **antibióticos** | `resistência antibióticos` (sin.: `superbactérias`) | "antibióticos" |

`[sessão 14][bd]` **58 dos 82 termos canónicos (71%) têm mais do que uma palavra**, e 13
desses não têm sinónimo nenhum: `prevenção suicídio`, `reabilitação psicossocial`,
`saúde mental jovens`, `literacia em saúde mental`, `desinstitucionalização saúde mental`,
`equipas comunitárias saúde mental`, `saúde mental escolar`, `saúde mental ensino superior`,
`competências socioemocionais`, `candida auris`, `incontinência urinária`,
`intolerância à lactose`, `saúde mental sem-abrigo`.

**Exigir a frase inteira no título é demasiado estrito, e a razão é de fundo:**
`mpox portugal`, `poluição e saúde` e `gripe aviária H5N1` **não são nomes de coisas — são
strings de pesquisa**, herdadas de a lista ter sido construída como sementes do Google
Trends. A imprensa escreve o conceito; a lista escreve a consulta.

### ~~Isto é a hipótese do vocabulário, medida no segundo mapa~~ — CORRIGIDO no mesmo dia

> ⚠️ **O título e a leitura desta subsecção estão errados, e foram corrigidos a 15/09/2026,
> horas depois.** `[sessão 14][ficheiro]` A verificação que os desfaz: **os conceitos simples
> não existem na lista** — nem `mpox`, nem `obesidade`, nem `poluição`, nem `antibióticos`,
> nem `gripe`; `saúde mental` aparece em 8 termos e **nunca sozinho**.
>
> `mpox portugal` **não é como ninguém nomeia o mpox**, nem a instituição nem a rua: o
> `portugal` é um restritor de consulta. Logo isto **não é** a hipótese do vocabulário medida
> noutro mapa — é um **defeito de construção da lista**, achado distinto e **mais forte**,
> porque se verifica por leitura e não depende de hipótese nenhuma sobre como se pesquisa.
>
> **Do lado das notícias a hipótese do vocabulário tem um caso genuíno:** `gripe aviária`
> (e `influenza aviária`) contra "gripe das aves" — aí a lista nomeia mesmo o conceito, em
> registo técnico, e a forma corrente falta. **Um caso não é demonstração.**
>
> **As duas coisas partilham a origem** — a lista nasceu como sementes do Trends — **e
> partilhar origem não é confirmar-se uma à outra.** Ver `CONTEXT.md`, secção da hipótese do
> vocabulário. O texto abaixo fica como estava, porque o registo não se falsifica.


Até 15/09/2026 a prova estava só no lado das pesquisas: 38 de 82 keywords sem resolução na
própria série do Google Trends (`CONTEXT.md`, Verificações, 09/09/2026). **Agora existe
também no lado das notícias** — a mesma lista falha a apanhar notícias de saúde corretamente
identificadas, pela mesma razão: nomeia os assuntos de uma maneira que não é a de quem
escreve nem a de quem pesquisa.

**A mesma lista falha nos dois mapas, e falha pelo mesmo motivo.** Deixa de ser uma limitação
técnica de rodapé e passa a ser achado sobre o método, obtido com dados do próprio protótipo.

---

## Decisão nova que sai daqui — a sexta

**Separar, na lista de keywords, o nome do conceito da consulta de pesquisa.** Um termo tem
de poder ser as duas coisas sem ser a mesma: `mpox` é o conceito, `mpox portugal` é a
consulta. Só o primeiro serve para rotular notícias.

**É curadoria, não implementação** — e é da Marta, não do Claude Code. Não entra na quinta.

---

## O que NÃO está estabelecido

- **A proporção vale para esta amostra de 100**, tirada das 310 da instância viva com semente
  registada. Os intervalos de confiança são os da tabela e não devem ser omitidos ao citar.
- **Não houve segundo classificador.** Não há medida de concordância entre juízes: os 53% e
  os 39% são o juízo de uma pessoa, declarado como tal.
- **A classificação foi feita só pelos títulos**, sem abrir as notícias — em duas linhas a
  Marta anotou explicitamente não saber ao que a notícia se referia. Isso é coerente com a
  decisão 2 (procurar só no título) e é o mesmo que o leitor tem à frente, mas **é uma
  limitação e não uma escolha neutra**.
- **A leitura sobre "vida institucional" é hipótese**, apoiada em 7 linhas.
- **Nada foi implementado.** Nenhum ficheiro de código foi alterado.
