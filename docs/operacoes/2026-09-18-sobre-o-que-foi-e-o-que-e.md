# A página /sobre — o que um dia foi e o que é agora

**Data:** 18/09/2026, sessão 16, ao fim do dia · **Estado:** ANÁLISE, a pedido da Marta
(*"analisa o que um dia foi e o que é agora… talvez fizesse sentido ter uma timeline
metodológica"*). Nada foi alterado na página nem na base. Lido: `src/pages/Sobre.tsx` (369
linhas) e os 11 blocos de `sobre_conteudo` na base viva, com a chave pública.

---

## 1. Como a página está construída — importa para saber onde se muda o quê

- **Metade vem da base, metade está escrita no código.** Os blocos "Os 4 eixos", "Fontes de
  dados", "Metodologia", "Limitações" e "Agradecimentos" lêem de `sobre_conteudo` (a base
  ganha ao ficheiro `src/data/sobreContent.ts`). Mas **"O que é", "Para que serve" e o
  diagrama "Como funciona" estão escritos no TSX** — e os blocos `o-que-e-rv`, `o-que-e-dqd`,
  `para-que-serve` e `como-funciona` que existem na base **nunca são lidos**. Mudar esses na
  base não muda nada no ecrã.
- **Três números diferentes para a mesma coisa.** RSS: "42 fontes" (texto e diagrama) — são
  **41** no código, e uma delas ("Observador Fact Check") devolve o feed geral do Observador.
  YouTube: "48 canais" (texto) e "55 canais" (diagrama) — são **56** no script 4.
- **Nenhum bloco diz de quando é.** A página descreve, em grande parte, o sistema de Março de
  2026, e nada no ecrã o denuncia.

## 2. O que a página afirma e já não é verdade — bloco a bloco

| bloco | o que diz | o que é a 18/09/2026 |
|---|---|---|
| O que é (Reportagem Viva) | "em tempo real" | semanal; a série do Trends esteve parada de 10/08 a 18/09; agora é um lote por corrida, e o dashboard lê de um lote só |
| Para que serve | "detectar sinais emergentes antes de chegarem aos media" | o eixo Emergentes mostrou o contrário: a lista era feita de manchetes (`sarampo surto`, `dengue europa`), sem procura. Passa a ser o RISING da categoria Saúde + a regra de aparecimento |
| Fontes — Google Trends | "12 meses", "Related Queries", "actualização do dashboard às segundas" | 5 anos, semanal, **grupos com âncora** (uma régua por eixo); categoria Saúde como **limitação escrita**; corre **do Mac da Marta** (launchd, a instalar) — o passo do GitHub Actions está comentado desde 14/08 |
| Fontes — Detecção assistida | emergentes = "+50 % com volume mínimo de 10"; alertas ">30 % a 7 dias, >50 % a 30, >40 % a 12 meses" | tudo substituído pela **regra de 18/09**: mediana + MAD sobre 8 semanas, elegibilidade (procura regular), sazonalidade descontada no lote de 5 anos, aparecimento para os sem procura regular. `docs/metodo/2026-09-18-alertas-regra.md` |
| Fontes — Curadoria editorial | debunking "curadoria manual, FALSO / ENGANADOR / SEM EVIDÊNCIA / IMPRECISO"; cobertura mediática "curadoria editorial dos artigos" | fact-check vem da **Google Fact Check Tools API**, só editores portugueses, com o veredicto tal como o editor o publica (Observador: Errado / Enganador / Esticado / Certo); as 36 linhas manuais de 25/03 estão na tabela e fora do ecrã. As notícias são **rotuladas automaticamente** por palavra inteira e categoria do feed — não há curadoria |
| Metodologia — Sinais emergentes / Alertas | os limiares antigos | já não existem (ver acima) |
| Metodologia — O índice | "+X % compara o período actual com o anterior, a partir dos snapshots" | os snapshots são a série parada de 10/08. Hoje: variação = 2026 contra 2025, mês a mês, na régua do eixo; top 5 = mediana das 52 semanas |
| Metodologia — Gráficos | "média aritmética de **todas** as keywords do eixo; cada keyword contribui igualmente" | média dos **5 do top**, na mesma régua — a média de todas era arrastada pelos que estão a zero (11 dos 17 da menopausa), e "cada keyword na sua régua" era o erro das réguas incomparáveis |
| Como funciona (diagrama) | Trends "semanal · pytrends" no nível automático (Edge Functions); "Dashboard: keywords + alertas" | o Trends corre no Mac, não nas Edge Functions; os alertas são os da regra de 18/09 |
| Limitações | "não é possível comparar valores entre temas diferentes" | **dentro do eixo é** — é para isso que existe a âncora; entre eixos continua a não ser (o ranking foi retirado por isso) |
| | "a detecção de sazonalidade não está implementada" | está, desde 18/09 (factor sazonal dos anos anteriores do lote) |
| | "thresholds de alertas (30–50 %)" | já não existem |
| | "os gráficos dependem da acumulação de snapshots" | já não dependem |
| | **faltam** | a categoria Saúde do Google (não filtra homónimos — `depressão` continua a ser tempestades —, esconde `psicólogo`); a amostragem do Google (dois pedidos iguais diferem ±2); **só 17 dos 84 termos têm procura regular** com a lista actual; a hipótese do vocabulário e a lista de 100 em duas colunas (institucional / pesquisa) |

**O que continua certo:** os quatro eixos e a razão deles (`eixos-intro`, datas comemorativas
+ Emergentes como vigilância); o YouTube por canais curados; o arquivo semanal (a v2 testa-se
segunda 21/09); os guiões com Perplexity Sonar (passo 6 do workflow, activo); agradecimentos;
créditos.

## 3. A timeline metodológica — sim, e é a forma certa

O método actual **não foi desenhado — foi descoberto**, achado a achado. Reescrever a
"Metodologia" como se tivesse sido sempre isto apagava precisamente o que a torna defensável
numa tese. É o mesmo princípio da nota no `CLAUDE.md` sobre a regra 2: *"fica registado para
que a regra não seja lida como se tivesse sido sempre isto."*

**Forma proposta:** uma secção **"Linha do tempo do método"** entre "Metodologia" e
"Limitações". Cada entrada: **data · o que se pensava · o que se descobriu · o que mudou**. A
"Metodologia" fica curta — só o estado actual — e remete para a linha do tempo.

**Os marcos, tirados dos registos das sessões** (`docs/sessoes/`):

| quando | o que se pensava | o que se descobriu | o que mudou |
|---|---|---|---|
| **Mar/2026** | um dashboard gerado no Lovable, com dados de exemplo enquanto a recolha não existia | 27/03: parte dos números era inventada (`Math.random()`, *mocks*) | dados falsos eliminados; os gráficos passam a ler `historical_snapshots`. As 82 keywords são da Marta, de fontes oficiais (DGS, SNS 24, CUF) — uma das primeiras decisões |
| **Abr/2026** | duas instâncias Supabase eram uma coisa só | 17 das 19 tabelas tinham esquemas diferentes | migração para a instância própria (`ijpxjpbjudaddfatibfl`) |
| **Mai–Ago/2026** | o pytrends corria todas as segundas no GitHub Actions | o Google bloqueia os IPs do GitHub (429); 14/08 os passos são comentados; a série pára a **10/08** — e o dashboard continua a mostrá-la como actual | — (o problema fica sem dono até Setembro) |
| **07–09/09** | os zeros na tabela eram "ninguém pesquisa isto" | **zero não é um valor, é falha de recolha**; as 3462 linhas de `historical_snapshots` colavam valores de pedidos diferentes como se fossem uma série; a escrita anónima estava aberta | escrita anónima fechada; o pipeline escreve com `service_role`; "afirmação sem método é suposição" passa a regra do `CONTEXT.md` |
| **14–16/09** | a instância antiga estava congelada; as notícias eram rotuladas por keyword; `relative_volume` era volume | a instância antiga escrevia sozinha desde Março (pg_cron invisível); a rotulagem casava `candida` em *recandidatura* e não era reproduzível; `relative_volume` era a **posição na lista**, não procura | publicado fora do Lovable (15/09); instância antiga apagada (16/09); o script 7 deixa de inventar números; a hipótese do vocabulário ganha evidência |
| **18/09** | o Trends dava números comparáveis entre descargas; a categoria Saúde filtrava; a lista de 82 media o que dizia medir; alertas = "+40 %" sobre a tabela | **o Trends dá réguas, não números** (100 = o máximo *daquela descarga*); uma descarga de grupo dá o comparativo e o individual (correlação 0,998); a categoria não filtra homónimos e esconde termos; 21 das 82 não têm procura com aquela formulação; os "alertas" eram "+100 %" de 1 → 2 | **réguas e âncoras** (uma âncora por eixo, escolhida com dados); a categoria passa a limitação escrita; a **lista de 100 em duas colunas** (institucional / pesquisa); a **regra dos alertas** escrita e calibrada em 5 anos; o dashboard lê de **um lote** só; ranking, bloco de alertas e selector de período retirados com nota |
| **22/09 (a vir)** | | | lista de 100 aplicada; notícias por palavra inteira e categoria do feed; fact-check com fonte real; primeiro lote da lista nova |

Cada linha tem evidência no repositório (`docs/sessoes/`, `docs/metodo/`, `docs/evidencia/`).
A timeline não é narrativa — é índice.

## 4. Duas sugestões de forma

1. **Uma data de "última revisão" visível por bloco.** É por não a haver que ninguém reparou
   que a página descrevia Março.
2. **A timeline guardada na base** (`sobre_conteudo`, bloco `linha-do-tempo`, formato
   `data|título|antes|depois`), para se acrescentar sem commit — e, ao mesmo tempo, pôr os
   blocos hoje escritos no código a ler da base, para deixar de haver dois sítios que dizem
   coisas diferentes.

## 5. Próximo passo, se a Marta quiser

Escrever o texto novo dos blocos (metodologia, limitações, fontes, "o que é") e a timeline
**como proposta em ficheiro**, para cortar e pôr — como se fez com a lista de 100. Só depois
entra na base e no código.
