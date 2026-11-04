# Para rever — domingo 1/11/2026

Tudo o que precisa da aprovação da Marta antes de se gravar. Nada daqui está gravado no ficheiro
`src/data/sobreContent.ts`, na `sobre_conteudo` ou no site. Este ficheiro não entra em commit
até ela decidir.

Etiquetas: `[verificado]` = lido ou corrido nesta sessão · `[inferência]` = não verificado.

Índice:
1. Veredicto frase a frase (o que está hoje no /sobre)
2. Textos novos ao lado dos antigos, bloco a bloco
3. Previsíveis e Myburgh — as minhas versões
4. Rascunho das notas de método, §2 revisto
5. Diagrama "Como funciona" (código, não base)
6. /mural — medição e proposta
7. Notícias — as duas frases e a mudança no /briefing
8. Alertas na vista do eixo — as razões de 24/09
9. Achados que não se corrigem hoje
10. O que fica por decidir

---

## 1. Veredicto frase a frase `[verificado]`

O ficheiro e a base são iguais nos 11 blocos (md5 iguais, lidos a 1/11). O que está aqui vale
para os dois.

**Duas coisas que encontrei:**
- O diagrama "Como funciona" que o site mostra **não vem da `sobre_conteudo`**. Está escrito no
  `Sobre.tsx` (l.188–248 no desktop, l.289–313 no telemóvel). O texto `como-funciona` da base não
  chega ao ecrã: `fluxoSteps` (`Sobre.tsx:69`) não é usado em lado nenhum.
- Os títulos das secções só são títulos se tiverem maiúsculas e espaços (`Sobre.tsx:45` e `:162`).
  Um título com hífen, como "FACT-CHECKS", sairia como parágrafo. Para o título "FACT-CHECKS"
  funcionar, as duas expressões passam a aceitar o hífen (escolha técnica minha).

### 1.1 Fontes de dados (`sobreContent.ts:34-60`)

| # | Frase (resumida) | Veredicto | Fonte |
|---|---|---|---|
| F1a | Google Trends "recolhidos semanalmente via script Python (pytrends)" | **certa** | `scripts/recolher_domingo.sh:28`; o script 5 usa o pytrends por omissão (`5_fetch_google_trends.py`, cabeçalho, `--via`) |
| F1b | "com actualização do dashboard às segundas-feiras" | desactualizada | o site lê o lote mais recente assim que é gravado (ao domingo, à mão); o que fecha à segunda é o arquivo (`useTrendsLote.ts:7-13`) |
| F1c | "Inclui volume de pesquisa por keyword e Related Queries" | desactualizada | as pesquisas relacionadas são outro script, o 6, à segunda (workflow, passo 2, l.60–65) |
| F1d | "no período de 12 meses" | **falsa** | a recolha pede cinco anos: `--timeframe 'today 5-y'` (`recolher_domingo.sh:29`) |
| F2 | Autocomplete "perguntas detectadas automaticamente" | **falsa** | desligado a 09/09/2026 (workflow l.67–89); na base, 3634 linhas `autocomplete`, a última de 07/09/2026 |
| F3a | RSS "42 fontes portuguesas" | **falsa** | 41 entradas em `FEEDS` (`fetch-rss-feeds/index.ts:25-73`), 40 endereços distintos |
| F3b | RSS "com recolha contínua" | **falsa** | uma vez por semana, à segunda (workflow, passo 4, l.117) |
| F3c | a lista dos feeds | desactualizada | faltam o Observador geral, o 90 Segundos de Ciência, 8 sociedades (Cardiologia, Saúde Pública, SPESF, SPPSM, SPMI, SPEO, SPAVC, Neuropediatria), APAV, CPSA e Bial; o "Público Ciência" tem o mesmo endereço que o Público geral (l.25 e l.33) |
| F4a | YouTube "48 canais" | **falsa** | 56 (`4_fetch_youtube_trends.py`, `CANAIS_PT`, contados por id) |
| F4b | a lista dos canais | desactualizada | os 56 estão no código; a lista do texto tem 48 nomes |
| F4c | classificação por keyword no título, fronteira de palavra, exclusão de política e desporto | **certa** | l.149–178 |
| F4d | "top 30 por relevância (combinação de visualizações e recência)" | **certa** | `TOP_GLOBAL = 30` (l.47); pontuação views × (1 + 2/dias) (l.249–256) |
| F5 | "Detecção assistida": > 50 % com volume ≥ 10, expira abaixo de 50 %, alertas > 30/50/40 % | **falsa** | `keywords.is_emergent` sem escrita desde 14/08/2026; os alertas são os da regra de 18/09 (`trends_alertas`, `docs/metodo/2026-09-18-alertas-regra.md`) |
| F6 | "Debunking: verificação e categorização manual… FALSO / ENGANADOR / SEM EVIDÊNCIA / IMPRECISO" | **falsa** desde 29/10 | fact-checks do Observador pela Google Fact Check Tools API, só "Errado" e "Enganador" (`_shared/factchecks.ts`, `seMostra`) |
| F7 | "Cobertura mediática: curadoria editorial… com base em relevância e fundamento científico" | **falsa** | a entrada é automática: filtro de categoria nos feeds gerais e palavra-chave no título ou no início do resumo (`fetch-rss-feeds/index.ts:178-184, 256-259`) |
| F8 | Fontes de referência (lista de entidades consultadas) | **não verificável no código** | não mexo; decides tu |
| F9 | Arquivo semanal | certa no essencial, desactualizada | faltam os sinais emergentes; chama "debunking" aos fact-checks (`archive-weekly/index.ts:386-391, 549-552`) |

### 1.2 Metodologia (`sobreContent.ts:64-86`)

| # | Frase (resumida) | Veredicto | Fonte |
|---|---|---|---|
| M1 | Sinais emergentes: > 50 % e volume ≥ 10; "verdadeiramente emergentes" < 5; "picos" | **falsa** | desde 29/10 o briefing calcula os sinais pelos `trends_alertas` (`useSinaisDaSemana.ts`, `_shared/emergentes.ts`); `is_emergent` parado desde 14/08 |
| M2 | Alertas > 30 % (7 dias), 50 % (30 dias), 40 % (12 meses) | **falsa** | regra de 18/09 (mediana de 8 semanas, 1,5 vezes e z ≥ 3) |
| M3 | Debunking: categorias manuais | **falsa** | como F6 |
| M4a | Índice 0–100; 100 = pico do período | **certa** por pedido, desactualizada para o ecrã | o ecrã mostra os valores na régua da âncora, que passam de 100 (rascunho §1.2, l.61) |
| M4b | "+X%… calculadas a partir dos snapshots históricos semanais" | **falsa** | os snapshots pararam a 10/08/2026; a variação do eixo vem do lote (`trendsGrupo.ts:99-104`) |
| M5a | Gráficos: "média aritmética… de todas as keywords do eixo" | **falsa** | média mensal dos termos do top 5 (`useTrendsLote.ts:14-16`) |
| M5b | Variações "a partir dos snapshots históricos semanais" | **falsa** | como M4b |
| M6a | Guiões às segundas, 5 do banco + 5 da IA | **certa** | `generate-guioes-weekly/index.ts:157-176` (5 ao acaso do banco); `generate-guiao-questions`, "exactamente 5" (l.102) |
| M6b | IA "a partir das keywords em alta da semana" | desactualizada | a partir do top 5 medido de cada eixo (`generate-guioes-weekly/index.ts:140-146`) |
| M6c | Perplexity "com acesso a fontes verificadas em tempo real" | não verificável | o código limita a pesquisa a 17 domínios e diz que não sabe se o filtro é garantido (`generate-guiao-questions/index.ts:10-44`) |
| M6d | lista de fontes do prompt (MSD, Acta, RPMGF, SciELO, Cochrane, DGS, SNS24, OMS, sociedades) | desactualizada | a lista real tem 17 domínios, com INFARMED, Ordens, Nutrimento, ECDC (l.22–44) |
| M6e | "Todas as respostas incluem citações verificáveis" | não garantida | como M6c |
| M6f | "sujeita a revisão editorial antes de publicação" | **certa** | igual à limitação de 27/10 ("o sistema não as revê") |

### 1.3 Limitações (`sobreContent.ts:96`)

| # | Frase | Veredicto | Fonte |
|---|---|---|---|
| L1 | Índice relativo; só se compara dentro do eixo | **certa** | |
| L2 | "41 fontes seleccionadas por critério editorial" | **certa** na contagem (são os configurados), **incompleta** | 41 entradas; a 12/10/2026, 19 não responderam (`2026-10-16.md` §3.3) |
| L3 | "56 canais curados manualmente" | **certa** | `CANAIS_PT` |
| L4 | desinformação: só o Observador… | **certa** | texto da Marta, 29/10 |
| L5 | limites dos alertas testados em cinco anos | **certa** | |
| L6 | sazonalidade; o cancro da mama em 2022 | **certa** | |
| L7 | guiões por IA podem alucinar | **certa** | |

### 1.4 "Como funciona" (diagrama no `Sobre.tsx`, e o texto da base que não se vê)

| Caixa | Veredicto | Fonte |
|---|---|---|
| Google Trends · semanal · pytrends | **certa** | como F1a |
| Autocomplete · semanal · perguntas | **falsa** | como F2 |
| RSS Feeds · 42 fontes | **falsa** | como F3a |
| YouTube · 55 canais (no texto da base: 48) | **falsa** | como F4a |
| Supabase · Edge Functions · Dashboard · Arquivo | **certa** | |
| Perplexity Sonar · fontes peer-reviewed | desactualizada | a lista tem também institucionais e internacionais (M6d) |
| Guião · 5 banco + 5 IA | **certa** | M6a |
| texto da base: "10 perguntas por tema" | **certa** | 5 + 5 |

---

## 2. Textos novos ao lado dos antigos

### 2.1 Fontes de dados

**RECOLHA AUTOMÁTICA — Google Trends**

Antes:
> Google Trends: dados de pesquisa recolhidos semanalmente via script Python (pytrends), com
> actualização do dashboard às segundas-feiras. Inclui volume de pesquisa por keyword e Related
> Queries — as perguntas reais dos portugueses em crescimento. Valores reflectem o índice de
> interesse relativo em Portugal no período de 12 meses.

Depois:
> Google Trends: as 100 palavras-chave activas são pedidas uma vez por semana, ao domingo, por um
> script Python (pytrends) corrido à mão. Cada pedido devolve cinco anos de valores semanais, para
> Portugal e na categoria Saúde do Google. Os termos de cada eixo são pedidos em grupos de quatro
> com um termo comum, a âncora do eixo, e postos todos na régua dessa âncora. Cada recolha fica
> guardada como um lote, e o site lê sempre de um lote só.

**Perguntas (antes: Google Autocomplete)**

Antes:
> Google Autocomplete: perguntas de saúde detectadas automaticamente a partir das sugestões de
> pesquisa do Google para cada keyword monitorizada. Complementa as Related Queries do Google
> Trends com dúvidas formuladas em linguagem natural.

Depois:
> Perguntas: as pesquisas relacionadas do Google Trends de cada palavra-chave, recolhidas todas as
> segundas-feiras (pytrends). A recolha pelo Google Autocomplete está desligada desde 09/09/2026,
> porque gravava a posição da sugestão como se fosse procura; o painel das perguntas continua a
> mostrar as que foram recolhidas até 07/09/2026, sem números.

**Notícias (antes: RSS Feeds)**

Antes:
> RSS Feeds: 42 fontes portuguesas com recolha contínua via Edge Function automatizada. Media
> generalista (RTP, Público, Diário de Notícias, CM Jornal, SIC Notícias, Notícias ao Minuto).
> Media especializada em saúde e ciência (Público Ciência, Observador Saúde, Visão Saúde, ECO
> Saúde). Institucional (DGS, INSA, SNS, Ordem dos Médicos, SPMS, Coord. Nacional Saúde Mental).
> Nutrição e alimentação (Nutrimento PNPAS, Alimentação Saudável DGS, EIPAS). Sociedades
> científicas (Sociedade Portuguesa de Reumatologia, Sociedade Portuguesa de Ginecologia,
> SPPneumologia, Sociedade Portuguesa de Literacia em Saúde, Sociedade Portuguesa Patologia Coluna
> Vertebral, Centro de Neurociências e Biologia Celular, Sociedade Portuguesa de Esclerose
> Múltipla, GIMM Gulbenkian). Fact-check (Observador Fact Check).

Depois:
> Notícias: 41 feeds RSS configurados (40 endereços: o do Público entra duas vezes), lidos todas
> as segundas-feiras por uma Edge Function. Media generalista (Público, Observador, Diário de
> Notícias, CM Jornal, RTP, SIC Notícias, Notícias ao Minuto). Media de saúde e ciência (Observador
> Saúde, Visão Saúde, ECO Saúde, 90 Segundos de Ciência). Institucional (DGS, INSA, SNS, Ordem dos
> Médicos, SPMS, Coordenação Nacional da Saúde Mental). Nutrição e alimentação (Nutrimento PNPAS,
> Alimentação Saudável DGS, EIPAS). Dezasseis sociedades científicas e centros de investigação.
> Outros (APAV, Conselho Português para a Saúde e Ambiente, Bial). Na última contagem, a
> 12/10/2026, 22 responderam e 19 não. Dos feeds generalistas entram só os itens que o próprio
> feed classifica como saúde. De todos, entram só os que têm uma palavra-chave dos eixos, como
> palavra inteira, no título ou no início do resumo. Nenhuma notícia é escolhida à mão.

Notas:
- **Configurados contra os que respondem:** "41 feeds configurados" conta o código. "22
  responderam e 19 não" é a contagem da corrida de 12/10/2026 (`2026-10-16.md` §3.3,
  `[verificado, Cowork]`), a última que há. Não há contagem mais recente, porque esta máquina
  não tem o `gh` para ler o log de 26/10.
- O feed "Observador Fact Check" (l.73) sai da lista do texto. Os fact-checks do ecrã vêm da API,
  e não deste feed.

**YouTube**

Antes:
> YouTube: vídeos de saúde recolhidos semanalmente via script Python a partir de 48 canais
> portugueses e internacionais curados por categoria: media generalista (…), saúde institucional
> (…), ordens e sociedades científicas (…), hospitais e saúde privada (…), ciência e academia (…),
> fact-check e divulgação (…) e institucional local (…). A classificação por eixo é feita por
> correspondência de keywords no título, com delimitação por fronteira de palavra e exclusão de
> temas não relacionados com saúde (política, desporto, etc.). Dados organizados por eixo
> temático, com deduplicação por URL e selecção dos top 30 por relevância (combinação de
> visualizações e recência).

(A lista de nomes está inteira no `sobreContent.ts:42`.)

Depois:
> YouTube: 56 canais configurados, lidos todas as segundas-feiras por um script Python: media,
> autoridades de saúde, ordens e sociedades científicas, hospitais e seguros, ciência e academia,
> associações, canais internacionais, fact-check e literacia, autarquias. Um vídeo entra quando o
> título tem uma palavra-chave dos eixos, como palavra inteira, e não tem termos de desporto ou de
> política. Guardam-se os 30 com mais visualizações, com peso a mais para os mais recentes.

Nota: a lista de nomes sai, e ficam as categorias, que são as do próprio código. Para pôr os 56
nomes, tirava-os do `CANAIS_PT`.

Não ponho no texto quantos canais "respondem". A tabela guarda só os 30 vídeos finais (a 26/10
vinham de 12 canais), e isso não diz quantos canais responderam.

**Fact-checks (novo, dentro de RECOLHA AUTOMÁTICA; antes: Debunking em CURADORIA EDITORIAL)**

Antes:
> CURADORIA EDITORIAL
>
> Debunking: verificação e categorização manual de mitos e desinformação em saúde, com validação
> científica. Classificação: FALSO / ENGANADOR / SEM EVIDÊNCIA / IMPRECISO.
>
> Cobertura mediática: curadoria editorial dos artigos recolhidos via RSS com base em relevância e
> fundamento científico.

Depois (a secção CURADORIA EDITORIAL sai; a cobertura mediática fica descrita em "Notícias"):
> Fact-checks: as verificações do Observador, pesquisadas todas as segundas-feiras na Google Fact
> Check Tools API com as palavras-chave dos eixos. O Observador é o único editor português que
> publica as verificações num formato que essa API lê. Mostram-se só as que o Observador
> classificou como «Errado» ou «Enganador». As que são sobre a covid-19 ficam num separador
> próprio. A primeira recolha, a 29/10/2026, foi revista à mão; as seguintes entram sem revisão.

**ALERTAS (antes: DETECÇÃO ASSISTIDA)**

Antes:
> DETECÇÃO ASSISTIDA
>
> Keywords e sinais emergentes identificados automaticamente pelo sistema. Crescimento superior a
> 50% com volume mínimo de 10 pontos no índice Google Trends, ou termos sem histórico no ano
> anterior, são sinalizados como emergentes. O sinal emergente expira automaticamente quando a
> variação cai abaixo de 50% na actualização seguinte. Adicionalmente, o sistema detecta alertas
> de pesquisa com thresholds calibrados por período: >30% para 7 dias, >50% para 30 dias e >40%
> para 12 meses.

Depois:
> ALERTAS
>
> Os alertas calculam-se a cada recolha de domingo, termo a termo, sobre as séries do lote. A
> regra está na Metodologia.

**FONTES DE REFERÊNCIA** — fica igual (F8).

**ARQUIVO SEMANAL**

Antes:
> Todas as segundas-feiras, o workflow de actualização arquiva automaticamente os dados da semana
> anterior: top keywords, perguntas em crescimento, debunking, notícias e YouTube por eixo
> temático. Os arquivos ficam acessíveis no Briefing e em cada eixo, com possibilidade de
> exportação em PDF.

Depois:
> Todas as segundas-feiras, o arquivo grava a semana anterior: por eixo, os termos mais
> procurados, as perguntas, os fact-checks, as notícias e os vídeos; no briefing, também os sinais
> emergentes. Os arquivos ficam no Briefing e na vista de cada eixo, com exportação em PDF.

### 2.2 Metodologia

**SINAIS EMERGENTES + ALERTAS DE PESQUISA → ALERTAS e SINAIS EMERGENTES**

Antes:
> SINAIS EMERGENTES
>
> Crescimento semanal superior a 50% com volume mínimo de 10 pontos no índice Google Trends.
> Termos sem volume anterior relevante (volume anterior inferior a 5 pontos) são classificados
> como verdadeiramente emergentes (sinais novos). Termos com histórico mas com crescimento forte
> são classificados como picos.
>
> ALERTAS DE PESQUISA
>
> O sistema detecta alertas com thresholds adaptados ao período seleccionado: crescimento superior
> a 30% nos últimos 7 dias (sinais rápidos), 50% nos últimos 30 dias (aceleração sustentada) e 40%
> nos últimos 12 meses (mudanças estruturais). Keywords sinalizadas como emergentes são incluídas
> nos alertas apenas enquanto mantêm variação positiva.

Depois:
> ALERTAS
>
> Um alerta diz que um termo foi mais procurado numa semana do que costuma ser. O valor normal é a
> mediana das oito semanas anteriores. Há alerta de subida quando a semana fica pelo menos 1,5
> vezes acima desse valor e pelo menos três vezes acima da oscilação habitual do termo, medida nas
> mesmas oito semanas pelo desvio absoluto mediano. Só pode ter alerta de subida um termo com
> procura em pelo menos 6 dessas 8 semanas. Um aparecimento é um termo sem procura regular que
> chega a 20 e a pelo menos o dobro do máximo do último ano. A subida que a época do ano costuma
> trazer conta como sazonal, e não como alerta. Enquanto a subida dura, o valor normal fica o de
> antes de ela começar; ao fim de meio ano, o alerta passa a tendência e o valor normal passa a
> ser o novo nível. O 1,5 não sai de uma fórmula: foi escolhido depois de testar a regra em cinco
> anos de dados. A semana em curso não conta.
>
> SINAIS EMERGENTES
>
> No briefing, os sinais emergentes são os alertas da semana, em partes: os novos, os em curso, as
> tendências, os termos a observar (subiram sem chegar ao limite de alerta) e os previsíveis para
> o mês (termos que subiram no mesmo mês em pelo menos dois dos anos anteriores).

Fonte de cada número: o rascunho das notas de método, §1.1 e §1.2 (o 6 de 8, o MAD, o z ≥ 3, o
20 e o dobro, a sazonalidade) e §1.3 (o 1,5 escolhido); `trends_alertas.py:36-37`; a tendência a
mais de 26 semanas (`N_TEND`, `docs/metodo/2026-09-18-alertas-regra.md` §7a); os previsíveis
(`_shared/emergentes.ts:13`).

**DEBUNKING → FACT-CHECKS**

Antes:
> DEBUNKING
>
> Categorizado em: FALSO / ENGANADOR / SEM EVIDÊNCIA / IMPRECISO. Processo de curadoria manual,
> com validação por fontes científicas.

Depois:
> FACT-CHECKS
>
> O veredicto é o do Observador, guardado tal como vem. Mostram-se só «Errado» e «Enganador»; os
> outros ficam na base, e nenhum é renomeado.

**O ÍNDICE GOOGLE TRENDS**

Antes:
> O índice varia entre 0 e 100 — não representa o número absoluto de pesquisas, mas o interesse
> relativo de um termo numa região e período. O valor 100 corresponde ao pico máximo de interesse
> no período analisado. As percentagens de crescimento (+X%) comparam o volume do período actual
> com o período anterior equivalente, calculadas a partir dos snapshots históricos semanais.

Depois:
> Em cada pedido, o Google Trends dá valores de 0 a 100: 100 é a semana de maior procura nesse
> pedido. Os valores são relativos e não são números de pesquisas. O site põe os termos de cada
> eixo na régua da âncora do eixo, por isso os valores podem passar de 100, e só se comparam
> dentro do mesmo eixo.

**GRÁFICOS DE TENDÊNCIA**

Antes:
> Os gráficos de eixo utilizam a média aritmética dos índices Google Trends de todas as keywords
> do eixo. Cada keyword contribui igualmente para a curva, uma vez que o índice Google Trends
> (0–100) já reflecte a relevância relativa de cada termo. As percentagens de variação são
> calculadas comparando a média do período actual com a do período anterior equivalente, a partir
> dos snapshots históricos semanais.

Depois:
> O gráfico de cada eixo é a média mensal dos termos do seu top 5, no ano corrente e no anterior.
> A variação compara os dois anos nos meses que ambos têm. «Mais sobe» compara a média de cada
> termo nos dois últimos anos completos.

**GERAÇÃO DE GUIÕES**

Antes:
> Todas as segundas-feiras, o sistema gera automaticamente guiões de perguntas para cada eixo
> temático. Cada guião combina 5 perguntas curadas do banco base com 5 perguntas geradas por IA a
> partir das keywords em alta da semana. A geração por IA utiliza o Perplexity Sonar, um modelo de
> linguagem com acesso a fontes verificadas em tempo real. O prompt é estruturado para priorizar
> fontes peer-reviewed em português: MSD Manuals (…), Acta Médica Portuguesa (…), Revista
> Portuguesa de Medicina Geral e Familiar (…), SciELO Portugal (…) e Cochrane Library (…). São
> também utilizadas fontes institucionais: DGS, SNS24, OMS e sociedades científicas portuguesas.
> Para cada pergunta, o sistema gera uma resposta simples (para o cidadão) e um contexto
> científico mais desenvolvido (para o comunicador preparar a entrevista). Todas as respostas
> incluem citações verificáveis. Esta etapa é assistida por IA e sujeita a revisão editorial antes
> de publicação.

Depois:
> Todas as segundas-feiras, o sistema gera um guião de perguntas por eixo: 5 perguntas do banco
> base e 5 geradas por IA a partir do top 5 medido da semana. A IA é o Perplexity Sonar, com a
> pesquisa limitada a 17 domínios: MSD Manuals (edição portuguesa), Acta Médica Portuguesa,
> Revista Portuguesa de Medicina Geral e Familiar, SciELO Portugal, Cochrane Library, DGS, SNS 24,
> SNS, Ministério da Saúde, INFARMED, Ordem dos Médicos, Ordem dos Psicólogos, Nutrimento,
> Sociedade Portuguesa de Ginecologia, OMS e ECDC. Para cada pergunta, gera uma resposta simples
> (para o cidadão) e um contexto científico (para quem prepara a entrevista), com as fontes que
> devolve. É uma etapa assistida por IA: as respostas e as fontes têm de ser revistas antes de
> serem usadas.

Nota: são 17 domínios, mas 16 nomes. O MSD conta como dois domínios, `msdmanuals.com/pt/casa` e
`/pt/profissional`.

### 2.3 Limitações

As frases L1, L3, L4, L5, L6 e L7 ficam iguais. Muda a L2, e entram três frases novas. A ordem
proposta:
L1 → **nova A (categoria Saúde)** → L2 nova → L3 → L4 → L5 → L6 → **nova B (previsíveis)** →
**nova C (Myburgh)** → L7.

**L2 — RSS**

Antes:
> A cobertura RSS está limitada a 41 fontes seleccionadas por critério editorial. Não representa
> a totalidade da produção mediática portuguesa.

Depois:
> A cobertura RSS está limitada a 41 feeds seleccionados por critério editorial e não representa a
> produção mediática portuguesa. Na última contagem, a 12/10/2026, 19 desses feeds não
> responderam. A recolha é semanal, e os jornais generalistas guardam no feed só as últimas horas:
> o Público, o CM, o Observador e a RTP guardavam entre 1,5 e 5 horas (medido a 16/10/2026). A
> maior parte das notícias de cada semana já não está no feed quando a recolha corre.

Fonte: `2026-10-16.md` §3.3 e §3.4.

**Nova A — homónimos e herança da categoria Saúde** (decisão de 27/10; regra de 18/09, §6)

Antes: —

Depois:
> Os valores do Google Trends são os da categoria Saúde, que é o que o Google entende por saúde,
> por regras que não publica. A categoria não separa homónimos (a «depressão» também sobe com as
> tempestades) e esconde termos que o Google arruma noutra categoria (o «psicólogo» dá 0 com ela).
> A regra dos alertas também não distingue homónimos. Nas notícias, a «depressão» meteorológica
> sai por uma regra própria.

Fonte: `docs/metodo/2026-09-18-alertas-regra.md` §6 (l.162–165); `scripts/trends_grupos.json`,
`_categoria` (depressão: 18 de 25 tempestades com o filtro; psicólogo: 0 com o filtro);
`_shared/meteo.ts` (desde 23/10).

**Novas B e C** — ver §3.

---

## 3. Previsíveis e Myburgh — as minhas versões, para decidires

**B — Previsíveis** (pendente no `CONTEXT.md:1334-1335`; rascunho §3, l.115–118)

> Os previsíveis do briefing só contam as semanas em que o termo já se mexeu, pelo menos duas
> vezes acima da sua oscilação habitual. Um termo que sobe pouco, mas todos os anos no mesmo mês,
> não aparece.

Fonte: os previsíveis saem dos `trends_alertas` (`_shared/emergentes.ts:23`), que só têm linha a
partir de z ≥ 2 ("a observar", `trends_alertas.py:37` e l.153). "Duas vezes acima da sua
oscilação habitual" é o z ≥ 2 dito sem a letra.

Alternativa mais curta, se preferires:
> Os previsíveis do briefing só vêem os anos em que o termo subiu o bastante para ficar registado.
> Uma subida pequena que se repete todos os anos no mesmo mês não aparece.

**C — Myburgh** (rascunho §2, l.102–109; decisão de 29/10, §17a: "fica só como nota")

> As séries começam em Outubro de 2021. A tendência de subida da «creatina» começa a 02/01/2022,
> na semana a seguir a uma mudança na Google Health Trends API documentada por Myburgh (2022,
> IJERPH 19(22), 15396, doi:10.3390/ijerph192215396). Esta recolha usa o Google Trends público, e
> não essa API, e nos nossos dados não há um salto geral nessa data. A coincidência fica
> registada; não está mostrado que a mudança explique a creatina.

Fontes:
- a série começa a 24/10/2021 (`2026-10-29.md` §12.2);
- a creatina abre a 02/01/2022;
- a razão mediana Jan–Fev 2022 / Nov–Dez 2021 é 1,13 nos 41 termos, e só 6 subiram 50 % ou mais
  (`2026-10-29-cowork.md` §16, leitura do Cowork).

Pergunta para ti: uma nota com referência bibliográfica é diferente das outras limitações, que
falam só dos nossos dados. Se a quiseres mais curta no ecrã, deixava a referência completa no
rascunho e no ecrã só «(Myburgh, 2022)».

---

## 4. Rascunho das notas de método, §2 revisto

Ficheiro: `docs/evidencia/2026-09-18-sobre-linha-do-tempo/rascunho-notas-de-metodo.md`.

**§2, ponto "Desinformação" (l.97–101)**

Antes:
> - **Desinformação.** As 36 linhas de `debunking` (25/03/2026) estão todas "a verificar" (32 sem
>   link, 4 com link; lido na base a 27/10) e o ecrã só mostra as que têm veredicto, por isso a
>   secção está vazia. O `scripts/11_fetch_fact_checks.py` (Google Fact Check Tools API, só o
>   Observador, o único editor português com ClaimReview) existe desde 18/09 e nunca correu com
>   `--gravar`; nenhum workflow o chama.

Depois:
> - **Desinformação (actualizado a 01/11/2026).** Desde 29/10/2026 a secção lê a `debunking`, com
>   os fact-checks do Observador recolhidos pela Google Fact Check Tools API
>   (`scripts/11_fetch_fact_checks.py`, passo 6B do workflow, às segundas). A primeira carga (240
>   verificações, 175 da covid-19) foi revista à mão; as seguintes entram sem revisão. Mostram-se
>   só «Errado» e «Enganador». As 36 linhas de 25/03/2026 continuam «a verificar» e não aparecem.
>   Até 29/10 a secção estava vazia: o script existia desde 18/09 e nunca tinha corrido com
>   `--gravar` (`docs/sessoes/2026-10-29.md` §2–§5 e §11).

**§2, ponto Myburgh (l.102–109) e §3, l.126 ("[por escrever com a Marta] a frase final")**

Quando decidires as versões B e C, acrescento a cada um uma linha: «Frase do /sobre, aprovada
pela Marta a 01/11/2026: «…»». O que já lá está não se apaga.

**§2, ponto "Feeds RSS sem resposta" (l.95–96)**

Diz "Número datado: refazer a contagem antes de o publicar". A frase L2 nova publica o número de
12/10/2026, com a data. Não refiz a contagem, porque esta máquina não tem o `gh` para ler o log de
26/10. Acrescento ao ponto uma linha a dizê-lo. Se preferires a contagem refeita antes de
publicar, ela tem de ser lida no GitHub (log da corrida de 26/10, passo 4).

---

## 5. Diagrama "Como funciona" (código do `Sobre.tsx`)

Muda no desktop (l.188–248) e no telemóvel (l.289–313):

| Antes | Depois |
|---|---|
| Autocomplete · semanal · perguntas | Fact-checks · semanal · Observador |
| RSS Feeds · 42 fontes | RSS Feeds · 41 feeds |
| YouTube · 55 canais | YouTube · 56 canais |
| Perplexity Sonar · fontes peer-reviewed | Perplexity Sonar · 17 domínios aprovados |

As outras caixas ficam iguais.

O texto `como-funciona`, no ficheiro e na base, passa a dizer o mesmo que o diagrama, para lá não
ficar nada falso, embora não se veja:

Antes:
```
GOOGLE TRENDS|pesquisas semanais (pytrends)
GOOGLE AUTOCOMPLETE|perguntas em linguagem natural
RSS FEEDS|42 fontes portuguesas
YOUTUBE|48 canais curados
SUPABASE|base de dados + keywords
EDGE FUNCTIONS|automação semanal
ARQUIVO SEMANAL|snapshots + PDFs por eixo
PERPLEXITY SONAR|geração com citações
GUIÃO|10 perguntas por tema
```

Depois:
```
GOOGLE TRENDS|pesquisas semanais (pytrends)
FACT-CHECKS|Observador, semanal
RSS FEEDS|41 feeds
YOUTUBE|56 canais
SUPABASE|base de dados + keywords
EDGE FUNCTIONS|automação semanal
ARQUIVO SEMANAL|briefing e PDFs por eixo
PERPLEXITY SONAR|17 domínios aprovados
GUIÃO|5 do banco + 5 da IA, por tema
```

---

## 6. /mural — medição e proposta `[verificado]`

**Na base** (`historical_snapshots`):
- 3462 linhas, de 01/10/2025 a 10/08/2026, em 83 termos;
- por termo, o primeiro dia visto é Out/2025 em 40 e Mar/2026 em 43.

**O que o ecrã mostra de cada termo** (`Mural.tsx`):
- o último valor, que dá o tamanho da letra e a ordem;
- a variação ↑/↓ %, que vem da `keywords`, não da `historical_snapshots`;
- "desde mês/ano", que é o primeiro dia visto.

A média é calculada, mas não chega ao ecrã. O corte só pode mexer no "desde" e nos termos que
ficam de fora.

**No site publicado** (Chrome, Browser 1, ~15:00), 151 termos:

| | Hoje no ecrã | Lido por inteiro |
|---|---|---|
| termos com histórico | 82 "desde 04/26" | 40 "desde 10/25" e 43 "desde 03/26" |
| ex.: alergias alimentares, açúcar e saúde | 04/26 | 10/25 |
| ex.: alzheimer, anemia, ansiedade, alcoolismo | 04/26 | 03/26 |
| "bactérias carnívoras" (inactiva, última linha a 17/03) | não aparece | aparece, "desde 10/25" |
| termos sem nenhuma linha no histórico | 69 "desde 11/26" (a data de hoje) | (igual: é outro defeito) |

O último valor de cada termo não muda, porque as linhas mais recentes estão todas dentro das
1000. A ordem e o tamanho da letra também não.

**A diferença não é mínima: o "desde" está errado em todos os 82.** Proposta:
1. ler a tabela inteira por páginas, com ordem única (`lerTudo`, por `snapshot_date` e `id`, como
   no `useTrendsLote`);
2. os termos sem histórico deixam de ter "desde", em vez de mostrarem a data de hoje;
3. linha no ecrã, por baixo da contagem «151 palavras monitorizadas…»:
   > O histórico desta página parou a 10/08/2026: as datas «desde» contam até aí.

**`useAxisData.ts:37`** (página inicial, ascendente: as 1000 mais antigas):
- com lote, nenhum valor que venha dos snapshots chega ao ecrã;
- o top 5 e o gráfico vêm do lote;
- os "Sinais" só aparecem sem lote (`AxisColumn.tsx:122`);
- o ranking está retirado (`RANKING_RETIRADO`, `Index.tsx:35`);
- do `useAxisData` só chegam ao ecrã os nomes dos termos, que vêm da `keywords`.

**Diferença nula enquanto houver lote.** Isto foi lido no código, não visto no ecrã. Proposta:
não mexer, e fica registado. Sem lote (a página cai no `googleTrends.json`), os números antigos
voltariam. *Inferência:* não foi testado.

---

## 7. Notícias — as duas frases e uma mudança no /briefing `[verificado]`

**Na base**, notícias por semana (a contar da segunda), total e com termo:

| Semana | Total | Com termo |
|---|---|---|
| 14/09 | 22 | 10 |
| 21/09 | 12 | 4 |
| 28/09 | 4 | 4 |
| 05/10 | 2 | 2 |
| 12/10 | 2 | 2 |
| 19/10 | 0 | 0 |
| 26/10 | 1 | 1 |

**Página inicial** (Cobertura mediática): não está vazia, tem poucas notícias. No site, a mais
recente é de 26/10, e a anterior de 16/10. Hoje diz só «Nenhum item encontrado.» quando a lista
filtrada fica vazia (`MediaTable.tsx:140`).

Frase nova, por baixo da nota de 22/10, sempre à vista:
> Desde 24/09/2026 entram poucas notícias: a recolha é semanal, os jornais generalistas guardam no
> feed só as últimas horas, e a 12/10/2026 19 dos 41 feeds não responderam (ver Limitações, no
> /sobre).

Fonte: `2026-10-16.md` §3. A queda começa na 1.ª corrida da `fetch-rss-feeds` v4, a 24/09, que
passou a filtrar os feeds gerais pela categoria. O filtro tira cerca de 75 % dos itens (§3.2).

Pergunta para ti: a frase não fala do filtro de categoria, porque o filtro é uma escolha nossa
("canais com tag saúde") e não uma falha. Se o quiseres na frase:
> …a recolha é semanal, dos jornais generalistas só entram as notícias que eles próprios marcam
> como saúde, e esses jornais guardam no feed só as últimas horas…

**`/briefing` da semana corrente** ("O que os media dizem"):
- **Defeito encontrado:**
  - quando a semana não tem notícias, a página mostra as 5 mais recentes, de qualquer data, sem o
    dizer (`Briefing.tsx:311`);
  - por isso «Sem notícias esta semana.» (l.606) só aparece com a tabela vazia;
  - a leitura não filtra pelo termo (l.235), e entram as notícias que a reclassificação de 22/10
    tirou;
  - hoje mostra uma, a da Nutrimento de 26/10, que é da semana e tem termo.
- **Proposta:** mostrar só as da semana e com termo, como o arquivo. Sem nenhuma:
  > Nenhuma notícia com data nesta semana. A recolha é semanal e os jornais generalistas guardam
  > no feed só as últimas horas (ver Limitações, no /sobre).
- O PDF da semana corrente usa o mesmo `displayNews` (l.351) e alinha-se.
- O arquivo (`archive-weekly`, «nenhuma notícia com data entre … e …») fica para depois de 2/11,
  como decidiste.

---

## 8. Alertas na vista do eixo — as razões de 24/09 `[verificado]`

Das duas razões do comentário em `Index.tsx:270-277`:
- a (a), a contagem do método contra a do código, fechou a 24/09: fica a definição do código
  (`2026-09-24.md` §15a);
- a (b), as 65 → 508 semanas "em curso", não fechou: o teste da resolução deu INCONCLUSIVO
  (`2026-10-06.md` §6).

A página inicial mostra os alertas desde 06/10, por decisão tua, mantida a 13/10
(`2026-10-13-cowork.md` l.88).

**Mostrar ou não, decides tu.** Ligar é pouco trabalho: a vista do eixo já recebe os alertas
(`Index.tsx:268`). Bastava tirar o `hideAlertas` (l.278) e pôr o "Como ler os alertas" ao lado.

---

## 9. Achados que não se corrigem hoje `[verificado]` / `[inferência]`

- **"Público — Ciência"** (`fetch-rss-feeds/index.ts:33`): tem o mesmo endereço do Público geral
  (l.25) e não tem `geral: true`, por isso não passa pelo filtro de categoria. *Inferência:* as
  notícias do Público que o filtro tira à primeira entrada podem entrar pela segunda, com o nome
  "Público — Ciência". Para pendente, depois do fecho (notícias).
- **As setas ↑/↓ % do `/mural`** vêm da `keywords.change_percent`, que está parada. É o mesmo
  problema do "O que está a subir" (`2026-10-29.md` §16, a resolver antes de 6/11). Não é deste
  bloco.
- **A `fetch-rss-feeds` casa a palavra-chave no título e nos primeiros 200 caracteres do
  resumo** (l.259), e não só no título. A reclassificação de 22/10 foi feita só pelo título. O
  texto novo das Fontes de dados diz o que o código faz hoje.
- **Para que serve / O que é** ("Detectar sinais emergentes antes de chegarem aos media", "em
  tempo real") é o pendente `CONTEXT.md:1427`. Não está na lista de hoje e não lhe mexi.

---

## 10. O que fica por decidir

1. Os textos do §2: Fontes de dados, Metodologia, Limitações L2 e a nova A.
2. As versões B e C do §3, e se o Myburgh leva a referência completa ou só «(Myburgh, 2022)» no
   ecrã.
3. O §2 do rascunho (§4 deste ficheiro).
4. O diagrama e o texto `como-funciona` (§5).
5. O /mural: a correcção e a linha do ecrã (§6).
6. As duas frases das notícias, com ou sem o filtro, e a mudança no /briefing (§7).
7. Os alertas na vista do eixo: mostrar ou não (§8).

Depois do OK: gravo o ficheiro e a `sobre_conteudo` pela MCP, bloco a bloco (`UPDATE … where id =
… and md5(conteudo) = <lido>`), e confirmo que o md5 da base fica igual ao do ficheiro. Depois os
testes, o build, o commit sem linhas de atribuição e o push. Nada disto é do Cowork.

---

## Revisto a 1/11, depois da leitura da Marta

Só as partes que mudam com as correcções. O que não está aqui fica como nas secções acima e está
aprovado (§2, §4, §5), menos os pontos que as decisões tiraram: os alertas na vista do eixo ficam
para depois (§8), e o `useAxisData` não se mexe (§6).

**Marcas:**
- `[por confirmar]`: depende da nota do Google Trends citada por Liu (2024), que a Marta ainda não
  viu. Não se grava enquanto ela não disser.
- ⚠: uma afirmação do texto proposto que não bate com o código ou com a base. Vem com a minha
  proposta ao lado.

### R1. Alertas, na Metodologia (correcção 2)

Antes (§2.2):
> … Há alerta de subida quando a semana fica pelo menos 1,5 vezes acima desse valor e pelo menos
> três vezes acima da oscilação habitual do termo, medida nas mesmas oito semanas pelo desvio
> absoluto mediano. …

Depois:
> … Há alerta de subida quando o valor da semana é pelo menos 1,5 vezes o valor normal e a
> diferença entre os dois é pelo menos o triplo da oscilação habitual do termo, medida nas mesmas
> oito semanas pelo desvio absoluto mediano. …

O resto do parágrafo fica igual. Fonte: `trends_alertas.py:36` e l.81 (`razao >= 1,5` e `z >= 3`,
com z = diferença ÷ oscilação).

Fica fora do âmbito de hoje: o ecrã tem a mesma forma noutros dois sítios, já publicados e
aprovados.
- "Como ler os alertas" diz «pelo menos 1,5 vezes acima desse valor» (texto de 23/10).
- Cada linha de alerta diz «4,4 vezes acima do valor normal» (`fraseAlerta.ts`).

Não lhes mexo hoje. Se a correcção 2 vale também para eles, decides tu: o "Como ler" é texto teu,
e a linha do alerta muda também o briefing.

### R2. Previsíveis, nova B nas Limitações (decisão e correcção 2)

Antes (§3, versão B):
> Os previsíveis do briefing só contam as semanas em que o termo já se mexeu, pelo menos duas
> vezes acima da sua oscilação habitual. Um termo que sobe pouco, mas todos os anos no mesmo mês,
> não aparece.

Depois:
> Os previsíveis do briefing só contam as semanas em que o termo já se mexeu: aquelas em que a
> diferença para o valor normal chegou a pelo menos o dobro da sua oscilação habitual. Um termo
> que sobe pouco, mas todos os anos no mesmo mês, não aparece.

Fonte: `trends_alertas.py:37` e l.153 (`z >= 2`).

### R3. Myburgh, nova C nas Limitações (correcção 1)

Antes (§3, versão C):
> As séries começam em Outubro de 2021. A tendência de subida da «creatina» começa a 02/01/2022,
> na semana a seguir a uma mudança na Google Health Trends API documentada por Myburgh (2022,
> IJERPH 19(22), 15396, doi:10.3390/ijerph192215396). Esta recolha usa o Google Trends público, e
> não essa API, e nos nossos dados não há um salto geral nessa data. A coincidência fica
> registada; não está mostrado que a mudança explique a creatina.

Depois:
> A tendência de subida da «creatina» começa a 02/01/2022, a primeira semana de 2022. Em Julho de
> 2022, o Google mudou a amostra da Google Health Trends API, com efeito nos dados a partir de 1
> de Janeiro de 2022 (Myburgh, 2022). `[por confirmar]` Segundo Liu (2024), o Google Trends
> público, que é o que esta recolha usa, também mudou o método de recolha a 1 de Janeiro de 2022,
> e o próprio site assinala-o numa nota. `[/por confirmar]` Nos nossos dados não há um salto
> geral nessa data: de Novembro–Dezembro de 2021 para Janeiro–Fevereiro de 2022, a razão mediana
> nos 41 termos com dados é de 1,13, e só 6 subiram 50 % ou mais. Isso não prova que a creatina
> não tenha sido afectada. `[por confirmar]` A partir da recolha de 3/1/2027, a janela de cinco
> anos deixa de incluir 2021: cada lote novo fica todo medido depois da mudança, e os lotes
> anteriores continuam a atravessá-la. `[/por confirmar]`

Notas:
- **A data de 3/1/2027 é uma conta, não uma medição.** Os cinco lotes de Outubro começam
  exactamente cinco anos e um dia antes da recolha: 04/10 → 03/10/2021, …, 01/11 → 31/10/2021.
  - O lote de 27/12/2026 ainda começa a 26/12/2021, numa semana com cinco dias de 2021 e o
    1/1/2022.
  - O de 3/1/2027 começa a 02/01/2022.
  - *Inferência:* a conta assume que a recolha continua ao domingo e que o Google mantém a
    janela.
- **A frase de 3/1/2027 fica `[por confirmar]` também.** Como só a API mudou, segundo Myburgh,
  "medido depois da mudança" só vale para o Trends público se Liu se confirmar. Se Liu não se
  confirmar, proponho tirá-la. Ainda não verifiquei o Liu (2024): não li o artigo.
- **"de Novembro–Dezembro de 2021 para Janeiro–Fevereiro de 2022"** é a leitura do Cowork no lote
  `2d0a7be3` (`2026-10-29-cowork.md` §16). Não a refiz no lote de hoje.

**Referências**, como último item das Limitações (proposta de lugar; as Limitações são uma lista,
uma linha por item):
> Referências: Myburgh, P. H. (2022). Infodemiologists Beware: Recent Changes to the Google Health
> Trends API Result in Incomparable Data as of 1 January 2022. International Journal of
> Environmental Research and Public Health, 19(22), 15396. doi:10.3390/ijerph192215396.
> `[por confirmar]` Liu, K. (2024). The measurement errors of google trends data. Discover Data.
> doi:10.1007/s44248-024-00013-3. `[/por confirmar]`

Enquanto o Liu não se confirmar, grava-se a C e a lista de referências sem as partes `[por
confirmar]`. Ficam assim:
> A tendência de subida da «creatina» começa a 02/01/2022, a primeira semana de 2022. Em Julho de
> 2022, o Google mudou a amostra da Google Health Trends API, com efeito nos dados a partir de 1
> de Janeiro de 2022 (Myburgh, 2022). Nos nossos dados não há um salto geral nessa data: de
> Novembro–Dezembro de 2021 para Janeiro–Fevereiro de 2022, a razão mediana nos 41 termos com
> dados é de 1,13, e só 6 subiram 50 % ou mais. Isso não prova que a creatina não tenha sido
> afectada.
>
> Referências: Myburgh, P. H. (2022). Infodemiologists Beware: Recent Changes to the Google Health
> Trends API Result in Incomparable Data as of 1 January 2022. International Journal of
> Environmental Research and Public Health, 19(22), 15396. doi:10.3390/ijerph192215396.

Pergunta para ti: sem o Liu, a frase não diz porque é que uma mudança na API importa para dados
que não vêm da API. Gravas já esta versão, ou a C espera inteira pela confirmação?

### R4. Nota na linha da creatina no ecrã (correcção 1) — `[por confirmar]`

Hoje (página inicial, Alimentação, e "Sinais emergentes" do `/briefing` da semana corrente):
> creatina — tendência de subida desde 02/01/2022 · 190,6 (o valor normal antes era 40,8)

Depois (uma linha por baixo, em letra pequena):
> A data coincide com uma mudança do Google na recolha dos dados (ver Limitações, no /sobre).

Notas:
- **Sem o Liu,** o "na recolha dos dados" não se sustenta para o Trends público. A alternativa
  seria «A data coincide com uma mudança do Google nos dados da Health Trends API, que esta recolha
  não usa (ver Limitações, no /sobre).», mas isso diz porque é que a coincidência *não* importaria.
  Por isso a nota inteira espera pela confirmação.
- **Quando aparece** (parâmetro meu): numa tendência com início entre 26/12/2021 e 08/01/2022. Hoje
  só a creatina.
- **Onde:** só no site (`AlertasEixo.tsx` e `sinaisEmergentes.ts`). A linha é escrita pelo
  `_shared/emergentes.ts`, que é da `archive-weekly`, e não se lhe mexe antes de 2/11. O arquivo de
  2/11 e o PDF dele ficam sem a nota.

### R5. Fact-checks (correcção 3)

**Fontes de dados**

Antes (§2.1):
> Fact-checks: as verificações do Observador, pesquisadas todas as segundas-feiras na Google Fact
> Check Tools API com as palavras-chave dos eixos. O Observador é o único editor português que
> publica as verificações num formato que essa API lê. Mostram-se só …

Depois, com o teu texto:
> Fact-checks: as verificações do Observador, pesquisadas todas as segundas-feiras na Google Fact
> Check Tools API com as palavras-chave dos eixos. A pesquisa limita-se a editores portugueses. Dos
> testados, o Observador é o único com volume: o Polígrafo devolveu três verificações, todas de
> Dezembro de 2024 (teste de 28/09/2026). Mostram-se só as que o Observador classificou como
> «Errado» ou «Enganador». As que são sobre a covid-19 ficam num separador próprio. A primeira
> recolha, a 29/10/2026, foi revista à mão; as seguintes entram sem revisão.

⚠ **"A pesquisa limita-se a editores portugueses" é mais largo do que o código.** O script pesquisa
só o Observador: a lista fechada é `EDITORES_PT = ["observador.pt"]` (`11_fetch_fact_checks.py:44`,
com o filtro `reviewPublisherSiteFilter`, l.99). Proposta para essa frase:
> A pesquisa usa uma lista fechada de editores portugueses, que hoje só tem o Observador.

Testaram-se dois editores: o Polígrafo deu 0 a 18/09 (`2026-09-18.md` l.399) e 3 a 28/09
(`2026-09-28-c.md` l.68). "Dos testados" confere.

**L4, nas Limitações** (está lá: «…o único editor português que publica as verificações num
formato que a recolha automática consegue ler.»)

Antes:
> A secção de desinformação usa só os fact-checks do Observador, o único editor português que
> publica as verificações num formato que a recolha automática consegue ler. Entram as que casam
> …

Depois:
> A secção de desinformação usa só os fact-checks do Observador: dos editores portugueses
> testados, é o único com volume na Google Fact Check Tools API. Entram as que casam …

O resto da L4 fica igual.

**`CONTEXT.md` l.1325–1326**

Antes:
> Hoje a única via é a Google Fact Check Tools API, e o único editor português com ClaimReview é
> o Observador.

Depois:
> Hoje a única via é a Google Fact Check Tools API, e dos editores portugueses testados só o
> Observador tem volume: o Polígrafo deu 0 a 18/09 e 3 verificações, todas de Dezembro de 2024, a
> 28/09 (`docs/sessoes/2026-09-28-c.md`).

**`CONTEXT.md` l.1489** (a frase continua na l.1490)

Antes:
> O Polígrafo não publica ClaimReview

Depois:
> O Polígrafo: 0 verificações a 18/09 e 3, todas de Dezembro de 2024, a 28/09
> (`docs/sessoes/2026-09-28-c.md`)

Antes de gravar leio a l.1490, para a frase continuar certa.

**`scripts/11_fetch_fact_checks.py` l.12–14 e l.44** (comentários; o código não muda)

Antes:
```
       No índice, o único editor português com ClaimReview é o Observador
       (observador.pt); o Polígrafo não publica ClaimReview (testado: 0 em
       poligrafo.sapo.pt, sapo.pt, poligrafo.pt). Veredictos do Observador: Errado,
...
EDITORES_PT = ["observador.pt"]        # acrescentar quando outro editor português publicar ClaimReview
```

Depois:
```
       Dos editores portugueses testados, só o Observador (observador.pt) tem volume
       no índice. O Polígrafo deu 0 a 18/09 (poligrafo.sapo.pt, sapo.pt, poligrafo.pt)
       e 3 verificações, todas de Dezembro de 2024, a 28/09 (docs/sessoes/2026-09-28-c.md).
       Veredictos do Observador: Errado,
...
EDITORES_PT = ["observador.pt"]        # acrescentar quando outro editor português tiver volume no índice
```

**Rascunho das notas de método, l.100:** a afirmação está dentro do ponto "Desinformação", que o
§4 deste ficheiro substitui. A versão nova não a tem. Nada a acrescentar.

**`docs/sessoes/`:** não se mexe, como decidiste.

### R6. Perguntas (correcção 4)

Antes (§2.1):
> Perguntas: as pesquisas relacionadas do Google Trends de cada palavra-chave, recolhidas todas as
> segundas-feiras (pytrends). A recolha pelo Google Autocomplete está desligada desde 09/09/2026,
> porque gravava a posição da sugestão como se fosse procura; o painel das perguntas continua a
> mostrar as que foram recolhidas até 07/09/2026, sem números.

Depois, com o teu texto:
> Perguntas: vêm de duas fontes, guardadas na mesma tabela. As pesquisas relacionadas do Google
> Trends, recolhidas todas as segundas-feiras, dizem que perguntas subiram; são as que entram no
> briefing. As sugestões do Google Autocomplete dizem o que as pessoas escrevem na caixa de
> pesquisa; essa recolha está desligada desde 09/09/2026: transformava a ordem das sugestões num
> falso volume de procura e não separava Portugal do Brasil. O script foi corrigido a 16/09/2026,
> mas a recolha não voltou a ser ligada; o painel da página inicial mostra as sugestões recolhidas
> até 07/09/2026, sem números.

Verificado frase a frase:

| Afirmação | Confere? | Fonte |
|---|---|---|
| duas fontes, mesma tabela | sim | `health_questions.source`: `pytrends` 1743, `autocomplete` 3634 |
| relacionadas do Trends, todas as segundas | sim | workflow, passo 2 (`6_fetch_health_questions.py`, `related_queries`); última a 26/10 |
| são as que entram no briefing | sim | `Briefing.tsx:244` (`source = pytrends`); `archive-weekly` pelo `_shared/perguntas.ts` |
| Autocomplete desligado desde 09/09/2026 | sim | workflow l.67–89 |
| a ordem das sugestões como falso volume | sim | `relative_volume = max(10, 100 - pos*5)` (workflow l.69; `5e424e7`) |
| não separava Portugal do Brasil | sim | `gl=pt` sem efeito, respostas iguais a `gl=br` (workflow l.73–75); corrigido com `client=chrome` e `gl=PT` (`5e424e7`) |
| corrigido a 16/09/2026 | sim | `5e424e7`, 16/09/2026 |
| não voltou a ser ligada | sim | o passo 2B continua comentado |
| painel da página inicial | sim | `HealthQuestionsPanel` em `Index.tsx:337` |
| até 07/09/2026, sem números | sim | última linha `autocomplete` a 07/09; o painel mostra só a forma (`2026-10-29.md` §10) |

**Diagrama e texto `como-funciona`** (correcção 4):

| Antes | Depois |
|---|---|
| diagrama: Google Trends · semanal · pytrends | Google Trends · pesquisas e perguntas semanais (pytrends) |
| texto: GOOGLE TRENDS\|pesquisas semanais (pytrends) | GOOGLE TRENDS\|pesquisas e perguntas semanais (pytrends) |

**Pendente para o varrimento de quinta** (vai para o `CONTEXT.md`):
> - [ ] **Painel das perguntas: "São 48" e "há três meses" escritos à mão**
>   (`HealthQuestionsPanel.tsx` l.307 e l.315). Com o Autocomplete parado desde 07/09/2026,
>   verificar se ainda batem certo. Varrimento de quinta 5/11 (decisão da Marta, 01/11).

### R7. «Mais sobe», na Metodologia (correcção 5)

Antes (§2.2):
> … «Mais sobe» compara a média de cada termo nos dois últimos anos completos.

Depois, com o teu texto:
> … «Mais sobe» é, entre os termos do top 5, o que mais subiu da média anual do penúltimo ano
> completo para a do último; ficam de fora os termos com média abaixo de 5 no primeiro desses anos.

Confere com `useTrendsLote.ts:207-215`:
- `top` são os termos do top 5 (l.184);
- `u` e `p2` são as médias anuais do último e do penúltimo ano completo;
- `+p2.media >= 5`;
- a maior variação ganha.

"Ano completo" é um ano com os 12 meses no lote (l.204). Com empate no 5.º lugar, o top 5 tem 6
termos ou mais. A frase continua certa.

### R8. Notícias, nas Fontes de dados (correcções 6 e 7)

Antes (§2.1):
> Notícias: 41 feeds RSS configurados (40 endereços: o do Público entra duas vezes), lidos todas
> as segundas-feiras por uma Edge Function. … Outros (APAV, Conselho Português para a Saúde e
> Ambiente, Bial). Na última contagem, a 12/10/2026, 22 responderam e 19 não. …

Depois:
> Notícias: 41 feeds RSS configurados, lidos todas as segundas-feiras por uma Edge Function. Media
> generalista (Público, Observador, Diário de Notícias, CM Jornal, RTP, SIC Notícias, Notícias ao
> Minuto). Media de saúde e ciência (Observador Saúde, Visão Saúde, ECO Saúde, 90 Segundos de
> Ciência). Institucional (DGS, INSA, SNS, Ordem dos Médicos, SPMS, Coordenação Nacional da Saúde
> Mental). Nutrição e alimentação (Nutrimento PNPAS, Alimentação Saudável DGS, EIPAS). Dezasseis
> sociedades científicas e centros de investigação. Outros (APAV, Conselho Português para a Saúde
> e Ambiente, Bial). Os dois restantes são o «Público — Ciência», com o mesmo endereço do Público,
> e o «Observador Fact Check», ainda configurado; os fact-checks desta página não vêm dele. Na
> última contagem, a 12/10/2026, a recolha não encontrou um feed válido em 19 deles. Dos feeds
> generalistas entram só os itens que o próprio feed classifica como saúde. De todos, entram só os
> que têm uma palavra-chave dos eixos, como palavra inteira, no título ou no início do resumo.
> Nenhuma notícia é escolhida à mão.

A contagem: 7 + 4 + 6 + 3 + 16 + 3 = 39, mais os dois = 41 (`fetch-rss-feeds/index.ts:25-73`).
"Os fact-checks desta página não vêm dele" é meu (são da API). Se não o quiseres, sai.

### R9. L2, nas Limitações (correcção 7)

Antes (§2.3):
> A cobertura RSS está limitada a 41 feeds seleccionados por critério editorial e não representa a
> produção mediática portuguesa. Na última contagem, a 12/10/2026, 19 desses feeds não
> responderam. A recolha é semanal, e os jornais generalistas guardam no feed só as últimas horas:
> …

Depois, com o teu texto:
> A cobertura RSS está limitada a 41 feeds seleccionados por critério editorial e não representa a
> produção mediática portuguesa. Na última contagem, a 12/10/2026, a recolha não encontrou um feed
> válido em 19 deles. A recolha é semanal, e o Público, o CM, o Observador e a RTP guardavam no
> feed entre 1,5 e 5 horas de notícias (medido a 16/10/2026): destes quatro jornais, a recolha só
> apanha as últimas horas antes de cada segunda-feira.

⚠ **"antes de cada segunda-feira":** a recolha não corre à meia-noite de domingo para segunda. O
cron está para as 06:00 UTC de segunda, e o GitHub tem-na arrancado a meio do dia (a 19/10 criou-a
às 12:39:58; a 05/10 às 14:06; a 12/10 às 14:55; `CONTEXT.md` l.74–77). O que se apanha são as
horas antes da corrida, já na segunda. Proposta para o fim da frase:
> …destes quatro jornais, a recolha só apanha as últimas horas antes de cada corrida, à
> segunda-feira.

O resto confere: `2026-10-16.md` §3.3 ("sem feed válido encontrado") e §3.4 (CM 1,5 h, Público
1,8 h, Observador 3,7 h, RTP 5,0 h).

### R10. Frases das notícias no ecrã (correcção 8)

**Página inicial**, por baixo da nota de 22/10

Antes (§7):
> Desde 24/09/2026 entram poucas notícias: a recolha é semanal, os jornais generalistas guardam no
> feed só as últimas horas, e a 12/10/2026 19 dos 41 feeds não responderam (ver Limitações, no
> /sobre).

Depois, com o teu texto:
> Desde 24/09/2026 entram poucas notícias: dos jornais generalistas só entram as que eles próprios
> marcam como saúde, a recolha é semanal e o Público, o CM, o Observador e a RTP guardam no feed só
> as últimas horas, e a 12/10/2026 a recolha não encontrou um feed válido em 19 dos 41 feeds (ver
> Limitações, no /sobre).

Confere (`2026-10-16.md` §3.2–§3.4; `fetch-rss-feeds/index.ts:256`). O "guardam" está no presente,
e a medição é de 16/10. A L2 diz "guardavam… (medido a 16/10/2026)". No ecrã fica como escreveste,
com a data na L2, para onde a frase remete.

**`/briefing` da semana corrente, sem notícias**

Antes (§7):
> Nenhuma notícia com data nesta semana. A recolha é semanal e os jornais generalistas guardam no
> feed só as últimas horas (ver Limitações, no /sobre).

Depois:
> Nenhuma notícia com data nesta semana. Dos jornais generalistas só entram as que eles próprios
> marcam como saúde, a recolha é semanal, e o Público, o CM, o Observador e a RTP guardam no feed
> só as últimas horas (ver Limitações, no /sobre).

### R11. Pendente do "Público — Ciência" (decisão) — vai para o `CONTEXT.md`

> - [ ] **"Público — Ciência" duplicado** (`fetch-rss-feeds/index.ts:33`): o mesmo endereço do
>   Público geral (l.25), sem `geral: true`, por isso sem o filtro de categoria. `[inferência]` As
>   notícias do Público que o filtro tira à primeira entrada podem entrar pela segunda, com o nome
>   "Público — Ciência". Depois do fecho, com as notícias (decisão da Marta, 01/11).

### R12. O que se grava, quando aprovares estas partes

**`src/data/sobreContent.ts` e a `sobre_conteudo`**, pela MCP, `UPDATE … where id = … and
md5(conteudo) = <lido>`. No fim, o md5 da base tem de ser igual ao do ficheiro.
- `fontes-de-dados`: o §2.1 com R5, R6 e R8;
- `metodologia`: o §2.2 com R1 e R7;
- `limitacoes`:
  - a L2 da R9;
  - a nova A (§2.3);
  - a L4 da R5;
  - a B da R2;
  - a C e as referências da R3, **sem as partes `[por confirmar]`**, se assim o decidires;
- `como-funciona`: o §5 com a R6.

**Só no código:**
- o diagrama (§5 e R6);
- o hífen nos títulos;
- o `/mural` (§6);
- as duas frases das notícias (R10);
- o `/briefing` só com as notícias da semana e com termo, e o PDF alinhado (§7).

**Nos documentos:**
- o rascunho (§4);
- o `CONTEXT.md` (R5, R6 e R11);
- os comentários do script 11 (R5).

**Fica por gravar:**
- a nota da creatina (R4);
- as partes `[por confirmar]` da R3.

A nota e as partes `[por confirmar]` esperam pela tua confirmação do Liu.

---

## Gravado a 1/11

**Verificações a–d** (nenhuma contrariou o texto):
- **a) Myburgh:** a CrossRef pelo DOI dá Myburgh, Pieter Hermanus (P. H.); o título igual; IJERPH,
  19(22), 15396 (21/11/2022). Não se corrigiu nada.
- **b) Script 6:** só "rising" (`6_fetch_health_questions.py:181-188`). A R6 ficou como estava.
- **c) 24/09/2026:** nesse dia publicou-se e correu a `fetch-rss-feeds` com o filtro de categoria e
  a palavra inteira ("830 itens foram postos de lado pelo filtro da categoria",
  `docs/sessoes/2026-09-24.md` §9, l.324–335). O código era de 18/09 (`b6f1416`, "por publicar").
  A data e a causa batem.
- **d) Razão Jan–Fev 2022 / Nov–Dez 2021, lote `82716ee6`:** **39 termos, 1,12, 6 com ≥ 50 %**.
  Não há salto geral, e a conclusão não muda. O método reconstruído dá exactamente 41 / 1,125 / 6
  no `2d0a7be3`. Está em `docs/evidencia/2026-11-01-sobre/razao-2021-2022.md`.

**md5 por secção** (`sobre_conteudo` = `src/data/sobreContent.ts`, relidos depois do UPDATE; os
outros 7 blocos não mudaram):

| Bloco | Antes | Depois |
|---|---|---|
| `fontes-de-dados` | `733b0f311d3a3f8992ae5f0986d4b6d7` | `c9e12e5f66f4f8b005b47cb387a327f9` |
| `metodologia` | `5d49c2aa062af9f375c5186e510ecb4b` | `b231ec7ee08ddd931f0463c766ff66d3` |
| `como-funciona` | `d4b2f5f8f0d4852a9d9ec10007ea38ca` | `5305b232a2c607bc3c252167a0435cfd` |
| `limitacoes` | `171afaa8a379f5200602c091884a1e77` | `fc442fbb86b8fc9859a5af43bd6358c4` |

Cada UPDATE levou no WHERE o md5 lido e o md5 que o texto novo tinha de ter. Cada um devolveu 1
linha.

Duas escolhas minhas, ditas numa linha:
- as Referências ficaram num só item das Limitações, com as duas separadas por « — »;
- a nota da creatina aparece numa tendência com início entre 26/12/2021 e 08/01/2022.

**Commits:**
- `49fe865`: tudo, com push às 16:04:03 UTC;
- `5e5237f`: o §7 do registo, com a prova no site, também com push.

Nenhum dos dois tem linhas de atribuição. Este ficheiro não entrou em nenhum, como pediste.

**Prova no site** (bundle `index-372jupB_.js`, ~16:06–16:08; pormenor no registo, §7):
- `/sobre`, `/mural`, a página inicial e o `/briefing` mostram o que foi aprovado;
- o `/mural` tem 40 «desde 10/25» e 43 «desde 03/26», como a base.

**Correcção a um exemplo meu** (§6 acima): a «ansiedade» não é «03/26». Começa a 01/10/2025, e o
ecrã diz «10/25», como deve. Dei-a como exemplo sem a verificar.

**Testes:** `npm test` 172/172, `tsc` 0, `npm run build` sem erros.

**Pendente:**
- **Pendentes no `CONTEXT.md` que este bloco fecha, sem texto aprovado para os fechar:**
  - Metodologia e Fontes de dados (l.1318);
  - homónimos e categoria Saúde (l.1323);
  - nota dos previsíveis (l.1336);
  - o `/mural` dentro do pendente da `historical_snapshots` (l.1348–1350);
  - a secção vazia das notícias (l.1408 e seguintes).

  Proposta: riscá-los com "Feito a 01/11 (`49fe865`), `docs/sessoes/2026-11-01.md` §6". O do
  `historical_snapshots` fica aberto para o `useAxisData`, que não se mexe. Espero o teu OK.
- **Ficam para depois, por decisão tua:**
  - alertas na vista do eixo;
  - o "vezes acima" da linha do alerta (depois de 2/11);
  - "Público — Ciência";
  - "São 48" (quinta 5/11);
  - a nota do `archive-weekly` pelo domingo;
  - o arquivo das notícias (depois de 2/11).
- **A corrida de segunda 2/11** é a prova do que se publicou a 29/10 (`2026-10-29.md` §16). Este
  commit não mexe em nenhuma função.
