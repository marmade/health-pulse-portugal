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

Google Trends: dados de pesquisa recolhidos semanalmente via script Python (pytrends), com actualização do dashboard às segundas-feiras. Inclui volume de pesquisa por keyword e Related Queries — as perguntas reais dos portugueses em crescimento. Valores reflectem o índice de interesse relativo em Portugal no período de 12 meses.

RSS Feeds: 16 fontes portuguesas com recolha contínua em tempo real via Edge Function automatizada. Inclui media (RTP, Público, Observador, JN, DN, Expresso, CM Jornal, TSF, SIC Notícias), institucional (DGS, Ordem dos Médicos, INSA, SNS, Coord. Nacional Saúde Mental — saudemental.min-saude.pt) e fact-check (Polígrafo, Observador Fact-Check).

YouTube: vídeos de saúde recolhidos semanalmente via script Python a partir de 36 canais portugueses curados por categoria: media generalista (RTP, SIC, TVI, Público, Observador, JN, DN, Euronews PT), saúde institucional (DGS, INSA, INFARMED, ERS, República Portuguesa, CNPS Mental), ordens e sociedades científicas (Ordem dos Médicos, Ordem dos Psicólogos, SPG, SPPSM), hospitais e seguros (CUF, Lusíadas, Trofa Saúde, Unilabs, Médis), ciência e academia (Gulbenkian, FCT, Faculdade de Medicina ULisboa, ITQB NOVA, 90 Segundos de Ciência) e fact-check (Despolariza, News Farma). Dados organizados por eixo temático, com deduplicação por URL e selecção dos top 15 por número de visualizações.

DETECÇÃO ASSISTIDA

Keywords e sinais emergentes identificados automaticamente pelo sistema. Crescimento superior a 200% ou termos sem histórico no ano anterior são sinalizados como emergentes.

CURADORIA EDITORIAL

Debunking: verificação e categorização manual de mitos e desinformação em saúde, com validação científica. Classificação: FALSO / ENGANADOR / SEM EVIDÊNCIA / IMPRECISO.

Cobertura mediática: curadoria editorial dos artigos recolhidos via RSS com base em relevância e fundamento científico.`,
  },
  metodologia: {
    titulo: "Metodologia",
    conteudo: `SINAIS EMERGENTES

Crescimento semanal superior a 200% ou termos sem histórico no ano anterior.

Debunking categorizado em: FALSO / ENGANADOR / SEM EVIDÊNCIA / IMPRECISO

O ÍNDICE GOOGLE TRENDS

O índice varia entre 0 e 100 — não representa o número absoluto de pesquisas, mas o interesse relativo de um termo numa região e período. O valor 100 corresponde ao pico máximo de interesse no período analisado. As percentagens de crescimento (+X%) comparam o volume da semana actual com a média das semanas anteriores do mesmo período.

GERAÇÃO DE GUIÕES

Geração de guiões: os dados recolhidos pelo sistema alimentam um prompt estruturado enviado ao Perplexity Sonar, um modelo de linguagem com acesso a fontes verificadas em tempo real. O output é um guião com 10 perguntas por tema, com citações a fontes científicas e jornalísticas. Esta etapa é assistida por IA e sujeita a revisão editorial. Periodicidade: semanal, às segundas-feiras.`,
  },
  "como-funciona": {
    titulo: "Como funciona",
    conteudo:
      "GOOGLE TRENDS|pesquisas em tempo real\nRSS FEEDS|15 feeds portugueses\nSUPABASE|base de dados + keywords\nEDGE FUNCTIONS|automação diária\nPERPLEXITY SONAR|geração com citações\nGUIÃO|10 perguntas por tema",
  },
  limitacoes: {
    titulo: "Limitações",
    conteudo:
      "O índice Google Trends não representa volumes absolutos de pesquisa, apenas interesse relativo. Não é possível comparar valores entre temas diferentes.\nA cobertura RSS está limitada a 15 fontes seleccionadas por critério editorial. Não representa a totalidade da produção mediática portuguesa.\nO debunking é um processo de curadoria manual, sujeito à leitura e julgamento da autora, com validação por fontes científicas.\nO threshold de detecção de sinais emergentes (crescimento superior a 200%) é um valor operacional, não um critério cientificamente validado.",
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
