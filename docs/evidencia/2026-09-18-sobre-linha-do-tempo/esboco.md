# Linha do tempo do método — esboço para a Marta visualizar

**Data:** 18/09/2026 · **Estado:** ESBOÇO, revisto pela Marta ao fim do dia (maqueta em HTML:
artefacto privado `claude.ai/artifact/YWEA2XEqtVRaFek9RgQWTx`). Nada disto está na página. Voz: impessoal, de equipa —
"descobriu-se", "fez-se", "auditou-se" (decisão da Marta ao ler a primeira versão, que estava
na primeira pessoa). Profundidade: "para eles terem uma ideia do que aconteceu" — o essencial em três
linhas, o detalhe em prosa curta com uma tabela quando a tabela conta a história melhor do
que o texto. A assistência do Claude Code aparece numa nota geral no fim da secção, não em
cada marco.

---

## A. A régua (como ficaria no ecrã, em computador)

```
 LINHA DO TEMPO DO MÉTODO                                                    ver tudo

 Mar          Abr          Mai          Jun          Jul          Ago          Set
 ●──●─────────●────────────●────────────────────────●────────────●───────────●●●●──
    27/03     12/04        21/05                    28–29/07     13–14/08    07–09 · 14–16 · 18

                          ┌ Junho e Julho: pausa. O sistema continuou a correr sozinho
                          └ e, como se descobriu em Setembro, a escrever dados errados
                            todos os dias.
```

**Introdução (texto da Marta):** *O método de desenvolvimento da ferramenta foi desenhado à
medida que foi sendo feito, e fruto de descobertas. Os pontos representam um dia em que se
assumiu que uma coisa não era o que se pensava e que foi fazendo com que a estrutura do
código fosse sendo alterada.*

Decisões de forma (18/09, em conversa):
- Régua proporcional ao tempo, os sete meses sempre visíveis; a pausa vê-se como espaço e
  tem nota própria, **sem a razão** (a Marta tirou "por outra carga de trabalho").
- **Sem contagem de commits**: 1028 em Março são da ferramenta e os 2 de Maio são do robô
  do Lovable; o número enganava mais do que explicava.
- Os pontos são acontecimentos; ao clicar, o texto abre por baixo, a régua não se mexe; o
  último aberto por omissão; "ver tudo" lê como capítulo. No telemóvel, lista vertical.
- **Sem travessões** no texto da página. **Sem "instância"** (é sempre "base de dados", "a do
  projecto" / "a antiga, criada pela ferramenta"), **sem `AUDIT.md`** nem nomes de ficheiros:
  o júri não os conhece nem lhes vai ter acesso. Onde se diz que algo divergiu, diz-se
  **porquê**.
- Cada marco: data, título, três colunas *Pensava-se · Descobriu-se · Mudou*, prosa. A frase
  das 82 palavras-chave (Março) e a nota da assistência ocupam a largura toda.

---

## B. Um marco, escrito por inteiro — 18/09/2026

### 18 de Setembro — o Google Trends não dá números, dá réguas

**Pensava-se** que os valores do Google Trends eram comparáveis entre descargas, e que a
lista de 82 palavras-chave media o que dizia medir.
**Descobriu-se** que 100 é o máximo *daquela descarga*, que a categoria "Saúde" não filtra o
que se julgava, e que um quarto da lista não tinha procura com aquela formulação.
**Mudou:** uma âncora por eixo, escolhida com dados; a lista refeita em duas colunas; uma
regra de alertas escrita e testada em cinco anos; o dashboard a ler de um lote só.

Foi o dia em que se percebeu porque é que os gráficos nunca tinham batido certo. O Google
Trends publica um índice de 0 a 100 em que **100 é o ponto mais alto da descarga que se
fez**; não há contagens. `menopausa` descarregada sozinha: máximo 100. Descarregada com mais
quatro termos, no mesmo dia: máximo 33, porque a régua passou a ser a da `ansiedade`. Mesmo
termo, mesmas semanas, números diferentes. Tudo o que o dashboard tinha somado até aí, 3462
linhas de séries "históricas", colava descargas diferentes como se fossem uma.

A solução veio de uma verificação simples: a curva de um termo dentro de uma comparação é a
mesma curva do termo sozinho, só noutra escala (correlação 0,998). Logo, uma descarga de
grupo serve para as duas perguntas, "qual é maior?" e "como se comporta?", desde que haja um
termo comum a ligar as réguas. Escolheu-se uma **âncora por eixo**, com critérios escritos
(regular, de tamanho médio, sem homónimo, e do eixo):

| eixo | âncora | mediana | máx/mediana | porquê |
|---|---|---|---|---|
| Saúde mental | psiquiatra | 20 | 1,6 | a mais regular de todas; `enxaqueca` era melhor régua, mas não é saúde mental |
| Alimentação | colesterol alto | 17 | 2,1 | `anemia` era grande demais |
| Menopausa | menopausa | 26 | 2,2 | o eixo não tinha o próprio termo na lista |
| Emergentes | avc | 34 | 2,9 | a única com volume: os "emergentes" da lista eram manchetes, não procura |

No mesmo dia testou-se a categoria "Saúde" do Google, usada desde o início para filtrar
homónimos. Não filtra: `depressão` continua a ser sobretudo tempestades com o filtro ligado
(18 em 25 pesquisas relacionadas). E esconde: `psicólogo` dá zero com o filtro e mediana 36
sem ele, porque as pessoas escrevem `psicologa`, sem acento e no feminino. O filtro
manteve-se e ficou escrito como **limitação**: os valores são "pesquisas que o Google
classificou como Saúde", não "pesquisas sobre saúde".

A lista de palavras-chave saiu deste dia refeita. Leram-se cinco corpos de dados (quase
duas mil pesquisas relacionadas, sondas feitas à mão, a categoria Saúde sem termo) e a lista
passou a ter **duas colunas: o termo institucional** (DGS, SNS) **e o termo que as pessoas
escrevem**. Das 82, 61 ficam (28 reformuladas: `PTSD` → `stress pós-traumático`, `menopausa
masculina` → `andropausa`), 21 saem por não terem procura com aquela formulação, 40 entram.
As dez de linguagem de programa (*"literacia em saúde mental"*, *"equipas comunitárias"*)
ficam na coluna institucional como o achado principal: o vocabulário da instituição não é o
de quem pesquisa.

Por fim, os alertas. O que o dashboard chamava "pico" era uma percentagem sobre a tabela
parada desde Agosto: um termo que passava de 1 para 2 dava "+100 %". Escreveu-se uma regra e
correu-se sobre cinco anos de dados antes de a ligar: esta semana contra a mediana das oito
anteriores, com o ruído do Google descontado e a sazonalidade aprendida dos anos anteriores.
Em cinco anos dispara 109 vezes: o anúncio da demência de Bruce Willis, a notícia da "cura"
da diabetes, as tempestades de Janeiro (porque `depressão` mede tempestades, e a regra não o
esconde). E descobriu-se pelo caminho que **só 17 dos 84 termos têm procura regular**: a
lista nova existe também por causa deste número.

---

## C. Os outros marcos — só o essencial (aprovado pela Marta como escala)

**27 de Março — os dados tinham de ser reais.** *Pensava-se* que o dashboard mostrava dados.
*Descobriu-se* que parte dos números era gerada ao acaso pela ferramenta que o construiu.
*Mudou:* tudo o que não vinha de uma recolha foi eliminado; os gráficos passaram a ler
séries recolhidas. *(a toda a largura:)* As 82 palavras-chave existiam desde o início,
levantadas de fontes oficiais (DGS e SNS) para cobrir as pesquisas relacionadas com saúde.
Foi uma das primeiras decisões do projecto, e a única parte do sistema de Março que chegou
intacta a Setembro.

**12 de Abril — uma base de dados só.** *Pensava-se* que a base de dados criada pela
ferramenta e a base de dados do projecto eram a mesma coisa. *Descobriu-se* que eram duas, e
que 17 das 19 tabelas tinham estruturas diferentes: nomes de colunas trocados, colunas em
falta. *Mudou:* migração para a base de dados do projecto, tabela a tabela, e o site ligado a
ela.

**21 de Maio — a ferramenta desfez a migração sem aviso.** *Pensava-se* que o site lia da
base de dados do projecto desde Abril. *Descobriu-se*, só em Julho, que neste dia a
ferramenta que construiu o site tinha reescrito, num commit automático, a ligação de volta
para a base antiga. Bastou abrir o editor. *Mudou:* nada nesse dia. Ninguém deu por isso, e é
por isso que a pausa que se segue não foi neutra: durante dois meses o site serviu uma base
e as recolhas escreveram noutra.
*(Verificado: os dois commits de 21/05 são de `gpt-engineer-app[bot]`; `AUDIT.md` secção 4.)*

**28 e 29 de Julho — o diagnóstico: porque é que as duas bases divergiam.** *Pensava-se* que
a base antiga tinha ficado para trás em Abril e o site lia da nova. *Descobriu-se* que o site
publicado lia da base antiga desde 21 de Maio, e que as duas divergiam há dois meses: uma a
servir o site, a outra a receber as recolhas. A causa ficou provada pelo histórico de
alterações do código, não por suposição. *Mudou:* a base de dados do projecto passou a ser
a oficial, por decisão escrita; a ligação da ferramenta ficou marcada para ser cortada.

**13 e 14 de Agosto — o sistema não estava a recolher.** *Pensava-se* que o Google Trends
era recolhido todas as segundas, pelo processo automático. *Descobriu-se* que o Google
bloqueava os pedidos feitos a partir dos servidores onde o processo corria, desde o Verão.
*Mudou:* os passos foram desligados. A série parou a 10 de Agosto, coisa que o dashboard só
confessou em Setembro.

**7 a 9 de Setembro — zero não é um valor.** *Pensava-se* que um zero na tabela queria dizer
"ninguém pesquisa isto". *Descobriu-se* que queria dizer "a recolha falhou", e que a base de
dados aceitava escrita de qualquer pessoa sem autenticação. *Mudou:* a escrita fechada; a
regra "afirmação sem método é suposição" passou a valer para tudo o que o dashboard mostra.

**14 a 16 de Setembro — o que o sistema fazia sozinho.** *Pensava-se* que a base de dados
antiga estava parada. *Descobriu-se* que escrevia todos os dias desde Março, por uma tarefa
agendada dentro da própria base, invisível no código; que as notícias eram rotuladas por
pedaços de palavra (`candida` em *recandidatura*); que o "volume" das perguntas era a
posição na lista. *Mudou:* o site publicado fora da ferramenta de origem; a base antiga
apagada; a hipótese que guia o resto do trabalho, **as pessoas não pesquisam com as palavras
das instituições**, ganhou os primeiros dados.

---

## D. Nota geral (no fim da secção, a toda a largura)

> Este trabalho foi feito com assistência do Claude Code (Anthropic), usado como par de
> verificação: cada afirmação desta linha do tempo tem um registo com data, comando e
> resultado no repositório do projecto. As decisões, o que medir, o que manter, o que
> retirar, são da autora.

## E. Por fazer

1. Escrever os sete marcos restantes por inteiro, na escala do de 18/09 ou abaixo (a Marta:
   *"não quero tudo, é para eles terem uma ideia do que aconteceu"*).
2. A régua no `/sobre` (código), a ler o texto de ficheiros Markdown no repositório, um por
   marco.
3. O 22/09 entra quando for passado.
