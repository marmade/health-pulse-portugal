export const fallbackSobreContent: Record<string, { titulo: string; conteudo: string }> = {
  "o-que-e": {
    titulo: "O que é",
    conteudo:
      "O Reportagem Viva é um dashboard pessoal de monitorização de tendências de saúde em Portugal. Cruza o comportamento de pesquisa online com cobertura mediática e sinais de desinformação — para informar a produção de conteúdos de comunicação científica.",
  },
  "o-que-e-rv": {
    titulo: "Reportagem Viva",
    conteudo:
      "Uma plataforma de monitorização de narrativas de saúde em Portugal. Agrega dados de pesquisa online, cobertura mediática e sinais de desinformação para gerar insights sobre o que preocupa, o que circula e o que distorce a informação de saúde, em tempo real.",
  },
  "o-que-e-dqd": {
    titulo: "Diz que Disse",
    conteudo:
      "Um projecto de comunicação estratégica de ciências da saúde. Os seus temas, formatos e prioridades editoriais são informados pelo que o Reportagem Viva detecta, transformando dados de monitorização em conteúdo útil para o público.",
  },
  "para-que-serve": {
    titulo: "Para que serve",
    conteudo:
      "Identificar os temas de saúde mais pesquisados em Portugal\nDetectar sinais emergentes antes de chegarem aos media\nCruzar picos de pesquisa com desinformação e facto-verificação\nInformar a escolha de temas para comunicação em saúde",
  },
  "eixos-intro": {
    titulo: "Os 4 eixos — introdução",
    conteudo:
      "Os três eixos temáticos (Saúde Mental, Alimentação e Menopausa) foram definidos para identificar e monitorizar as narrativas sobre saúde de forma a estabelecer um plano em concordância com as datas comemorativas estabelecidas no calendário das ciências da saúde. Esta escolha permite pensar de forma cirúrgica na produção de conteúdos e campanhas de sensibilização, que criem uma amostra representativa de uma comunicação estratégica. O quarto eixo, Emergentes, serve um propósito distinto: monitorização contínua de sinais novos, alimentada pela curiosidade editorial e pela eventual necessidade de cruzar temas em surgimento com os eixos principais.",
  },
  "os-4-eixos": {
    titulo: "Os 4 eixos",
    conteudo:
      "SAÚDE MENTAL|Ansiedade, burnout, TDAH e bem-estar\nALIMENTAÇÃO|Nutrição, dietas e comportamentos alimentares\nMENOPAUSA|Saúde feminina e hormonal\nEMERGENTES|Novos temas e alertas de saúde pública",
  },
  "fontes-de-dados": {
    titulo: "Fontes de dados",
    conteudo: `RECOLHA AUTOMÁTICA

Google Trends: as 100 palavras-chave activas são pedidas uma vez por semana, ao domingo, por um script Python (pytrends) corrido à mão. Cada pedido devolve cinco anos de valores semanais, para Portugal e na categoria Saúde do Google. Os termos de cada eixo são pedidos em grupos de quatro com um termo comum, a âncora do eixo, e postos todos na régua dessa âncora. Cada recolha fica guardada como um lote, e o site lê sempre de um lote só.

Perguntas: vêm de duas fontes, guardadas na mesma tabela. As pesquisas relacionadas do Google Trends, recolhidas todas as segundas-feiras, dizem que perguntas subiram; são as que entram no briefing. As sugestões do Google Autocomplete dizem o que as pessoas escrevem na caixa de pesquisa; essa recolha está desligada desde 09/09/2026: transformava a ordem das sugestões num falso volume de procura e não separava Portugal do Brasil. O script foi corrigido a 16/09/2026, mas a recolha não voltou a ser ligada; o painel da página inicial mostra as sugestões recolhidas até 07/09/2026, sem números.

Notícias: 41 feeds RSS configurados, lidos todas as segundas-feiras por uma Edge Function. Media generalista (Público, Observador, Diário de Notícias, CM Jornal, RTP, SIC Notícias, Notícias ao Minuto). Media de saúde e ciência (Observador Saúde, Visão Saúde, ECO Saúde, 90 Segundos de Ciência). Institucional (DGS, INSA, SNS, Ordem dos Médicos, SPMS, Coordenação Nacional da Saúde Mental). Nutrição e alimentação (Nutrimento PNPAS, Alimentação Saudável DGS, EIPAS). Dezasseis sociedades científicas e centros de investigação. Outros (APAV, Conselho Português para a Saúde e Ambiente, Bial). Os dois restantes são o «Público — Ciência», com o mesmo endereço do Público, e o «Observador Fact Check», ainda configurado; os fact-checks desta página não vêm dele. Na última contagem, a 12/10/2026, a recolha não encontrou um feed válido em 19 deles. Dos feeds generalistas entram só os itens que o próprio feed classifica como saúde. De todos, entram só os que têm uma palavra-chave dos eixos, como palavra inteira, no título ou no início do resumo. Nenhuma notícia é escolhida à mão.

YouTube: 56 canais configurados, lidos todas as segundas-feiras por um script Python: media, autoridades de saúde, ordens e sociedades científicas, hospitais e seguros, ciência e academia, associações, canais internacionais, fact-check e literacia, autarquias. Um vídeo entra quando o título tem uma palavra-chave dos eixos, como palavra inteira, e não tem termos de desporto ou de política. Guardam-se os 30 com mais visualizações, com peso a mais para os mais recentes.

Fact-checks: as verificações do Observador dos últimos 60 dias, lidas todas as segundas-feiras na Google Fact Check Tools API. Entra uma verificação quando tem uma palavra-chave dos eixos ou um termo da lista de cada área (por exemplo «vacina», «açúcar», «saúde mental», «contraceção»), como palavra inteira, no texto verificado, no título ou no endereço. A lista foi escrita a 10/11/2026 a partir das verificações que a regra anterior deixava de fora, e testada em dois anos de verificações do Observador. A recolha usa uma lista fechada de editores portugueses, que hoje só tem o Observador. O Polígrafo não está nesta API: as páginas dele não têm a marcação que o Google indexa. Mostram-se só as que o Observador classificou como «Errado» ou «Enganador», com o nome do jornal ao lado. As que são sobre a covid-19 ficam num separador próprio. A primeira recolha, a 29/10/2026, foi revista à mão; as seguintes entram sem revisão.

ALERTAS

Os alertas calculam-se a cada recolha de domingo, termo a termo, sobre as séries do lote. A regra está na Metodologia.

FONTES DE REFERÊNCIA

Entidades consultadas para validação científica e contextualização editorial: Sociedade Portuguesa de Pediatria (SPP), Sociedade Portuguesa de Reumatologia, Sociedade Portuguesa de Ginecologia, Sociedade Portuguesa de Cuidados Intensivos, SPPneumologia, Sociedade Portuguesa de Literacia em Saúde (SPLS), Sociedade Portuguesa Patologia Coluna Vertebral, Sociedade Portuguesa de Esclerose Múltipla (SPEM), Centro de Neurociências e Biologia Celular (CNC UC), GIMM Gulbenkian, Fundação Calouste Gulbenkian, Governo de Portugal — Área da Saúde, Ordem dos Enfermeiros, NewsFarma (agenda de eventos médicos), MSD Manuals (referência clínica peer-reviewed) e Comissão Nacional da Saúde Materna, da Criança e do Adolescente (CNSMCA). Estas fontes complementam os dados automáticos com informação institucional e científica verificada.

ARQUIVO SEMANAL

Todas as segundas-feiras, o arquivo grava a semana anterior: por eixo, os termos mais procurados, as perguntas, os fact-checks, as notícias e os vídeos; no briefing, também os sinais emergentes. Os arquivos ficam no Briefing e na vista de cada eixo, com exportação em PDF.`,
  },
  metodologia: {
    titulo: "Metodologia",
    conteudo: `ALERTAS

Um alerta diz que um termo foi mais procurado numa semana do que costuma ser. O valor normal é a mediana das oito semanas anteriores. Há alerta de subida quando o valor da semana é pelo menos 1,5 vezes o valor normal e a diferença entre os dois é pelo menos o triplo da oscilação habitual do termo, medida nas mesmas oito semanas pelo desvio absoluto mediano. Só pode ter alerta de subida um termo com procura em pelo menos 6 dessas 8 semanas. Um aparecimento é um termo sem procura regular que chega a 20 e a pelo menos o dobro do máximo do último ano. A subida que a época do ano costuma trazer conta como sazonal, e não como alerta. Enquanto a subida dura, o valor normal fica o de antes de ela começar; ao fim de meio ano, o alerta passa a tendência e o valor normal passa a ser o novo nível. O 1,5 não sai de uma fórmula: foi escolhido depois de testar a regra em cinco anos de dados. A semana em curso não conta.

SINAIS EMERGENTES

No briefing, os sinais emergentes são os alertas da semana, em partes: os novos, os em curso, as tendências, os termos a observar (subiram sem chegar ao limite de alerta) e os previsíveis para o mês (termos que subiram no mesmo mês em pelo menos dois dos anos anteriores).

FACT-CHECKS

O veredicto é o do Observador, guardado tal como vem. Mostram-se só «Errado» e «Enganador»; os outros ficam na base, e nenhum é renomeado.

O ÍNDICE GOOGLE TRENDS

Em cada pedido, o Google Trends dá valores de 0 a 100: 100 é a semana de maior procura nesse pedido. Os valores são relativos e não são números de pesquisas. O site põe os termos de cada eixo na régua da âncora do eixo, por isso os valores podem passar de 100, e só se comparam dentro do mesmo eixo.

GRÁFICOS DE TENDÊNCIA

O gráfico de cada eixo é a média mensal dos termos do seu top 5, no ano corrente e no anterior. A variação compara os dois anos nos meses que ambos têm. «Mais sobe» é, entre os termos do top 5, o que mais subiu da média anual do penúltimo ano completo para a do último; ficam de fora os termos com média abaixo de 5 no primeiro desses anos.

GERAÇÃO DE GUIÕES

Todas as segundas-feiras, o sistema gera um guião de perguntas por eixo: 5 perguntas do banco base e 5 geradas por IA a partir do top 5 medido da semana. A IA é o Perplexity Sonar, com a pesquisa limitada a 17 domínios: MSD Manuals (edição portuguesa), Acta Médica Portuguesa, Revista Portuguesa de Medicina Geral e Familiar, SciELO Portugal, Cochrane Library, DGS, SNS 24, SNS, Ministério da Saúde, INFARMED, Ordem dos Médicos, Ordem dos Psicólogos, Nutrimento, Sociedade Portuguesa de Ginecologia, OMS e ECDC. Para cada pergunta, gera uma resposta simples (para o cidadão) e um contexto científico (para quem prepara a entrevista), com as fontes que devolve. É uma etapa assistida por IA: as respostas e as fontes têm de ser revistas antes de serem usadas.`,
  },
  "como-funciona": {
    titulo: "Como funciona",
    conteudo:
      "GOOGLE TRENDS|pesquisas e perguntas semanais (pytrends)\nFACT-CHECKS|Observador, semanal\nRSS FEEDS|41 feeds\nYOUTUBE|56 canais\nSUPABASE|base de dados + keywords\nEDGE FUNCTIONS|automação semanal\nARQUIVO SEMANAL|briefing e PDFs por eixo\nPERPLEXITY SONAR|17 domínios aprovados\nGUIÃO|5 do banco + 5 da IA, por tema",
  },
  limitacoes: {
    titulo: "Limitações",
    conteudo:
      "O índice Google Trends não representa volumes absolutos de pesquisa, apenas interesse relativo. Os valores só se comparam dentro do mesmo eixo: os termos de um eixo estão na mesma escala, os de eixos diferentes não.\nOs valores do Google Trends são os da categoria Saúde, que é o que o Google entende por saúde, por regras que não publica. A categoria não separa homónimos (a «depressão» também sobe com as tempestades) e esconde termos que o Google arruma noutra categoria (o «psicólogo» dá 0 com ela). A regra dos alertas também não distingue homónimos. Nas notícias, a «depressão» meteorológica sai por uma regra própria.\nA cobertura RSS está limitada a 41 feeds seleccionados por critério editorial e não representa a produção mediática portuguesa. Na última contagem, a 12/10/2026, a recolha não encontrou um feed válido em 19 deles. A recolha é semanal, e o Público, o CM, o Observador e a RTP guardavam no feed entre 1,5 e 5 horas de notícias (medido a 16/10/2026): destes quatro jornais, a recolha só apanha as últimas horas antes de cada corrida, à segunda-feira.\nA monitorização YouTube abrange 56 canais curados manualmente. Vídeos relevantes publicados em canais não incluídos na lista não são detectados pelo sistema.\nA secção de desinformação usa só os fact-checks do Observador: dos editores portugueses testados, é o único com verificações recentes na Google Fact Check Tools API. Entram as que casam com as palavras-chave dos eixos ou com a lista de termos de cada área. Uma verificação que fale do tema por outras palavras fica de fora, e uma que use a palavra noutro sentido pode entrar: essas marcam-se à mão como contexto e saem do ecrã. A primeira recolha foi revista à mão; as seguintes entram automaticamente. As 36 entradas registadas à mão continuam por verificar e não aparecem.\nOs limites dos alertas (subida, aparecimento e sazonal) foram fixados depois de testar a regra em cinco anos de dados. Não são um critério validado cientificamente. Como a regra foi afinada nesses dados, só as semanas seguintes a põem à prova.\nA sazonalidade só se desconta quando há anos anteriores para comparar. No primeiro ano, uma subida própria da época conta como alerta: o «cancro da mama» deu alerta em Outubro de 2022 e foi sazonal em 2023, 2024 e 2025.\nOs previsíveis do briefing só contam as semanas em que o termo já se mexeu: aquelas em que a diferença para o valor normal chegou a pelo menos o dobro da sua oscilação habitual. Um termo que sobe pouco, mas todos os anos no mesmo mês, não aparece.\nA tendência de subida da «creatina» começa a 02/01/2022, a primeira semana inteira de 2022. O Google Trends, que é o que esta recolha usa, assinala no gráfico uma nota nessa data: «Aplicámos uma melhoria ao nosso sistema de recolha de dados desde 01/01/22» (vista a 01/11/2026). Na Google Health Trends API, uma mudança aplicada em Julho de 2022, com efeito nos dados a partir de 1 de Janeiro de 2022, tornou incomparáveis os dados de antes e de depois dessa data (Myburgh, 2022). Nos nossos dados não há um salto geral nessa data: de Novembro–Dezembro de 2021 para Janeiro–Fevereiro de 2022, a razão mediana nos 39 termos com dados é de 1,12, e só 6 subiram 50 % ou mais. Isso não prova que a creatina não tenha sido afectada. A partir da recolha de 3/1/2027, a janela de cinco anos deixa de incluir 2021: cada lote novo fica todo medido depois da mudança, e os lotes anteriores continuam a atravessá-la.\nA geração de guiões por IA (Perplexity Sonar) pode produzir respostas com imprecisões ou fontes incorrectas (alucinação). Todas as perguntas, respostas e referências geradas por IA estão marcadas no ecrã e têm de ser verificadas antes de serem usadas: o sistema não as revê.\nReferências: Myburgh, P. H. (2022). Infodemiologists Beware: Recent Changes to the Google Health Trends API Result in Incomparable Data as of 1 January 2022. International Journal of Environmental Research and Public Health, 19(22), 15396. doi:10.3390/ijerph192215396. — Google Trends, nota no gráfico «Interesse ao longo do tempo» (Portugal, últimos 5 anos), vista a 01/11/2026.",
  },
  agradecimentos: {
    titulo: "Agradecimentos",
    conteudo: `Um agradecimento aos professores do primeiro ano do Mestrado em Comunicação de Ciência da FCSH-UNL, pelo seu papel fundamental na transmissão do pensamento crítico, científico e da ética colaborativa:

Ana Sanchez; António Gomes da Costa; António Granado; Joana Lobo Antunes; Luís Veríssimo; Matilde Gonçalves`,
  },
};

export const SOBRE_BLOCKS = [
  { id: "o-que-e", label: "O QUE É" },
  { id: "o-que-e-rv", label: "O QUE É — REPORTAGEM VIVA" },
  { id: "o-que-e-dqd", label: "O QUE É — DIZ QUE DISSE" },
  { id: "para-que-serve", label: "PARA QUE SERVE" },
  { id: "eixos-intro", label: "EIXOS — INTRODUÇÃO" },
  { id: "os-4-eixos", label: "OS 4 EIXOS" },
  { id: "fontes-de-dados", label: "FONTES DE DADOS" },
  { id: "metodologia", label: "METODOLOGIA" },
  { id: "como-funciona", label: "COMO FUNCIONA" },
  { id: "limitacoes", label: "LIMITAÇÕES" },
  { id: "agradecimentos", label: "AGRADECIMENTOS" },
] as const;
