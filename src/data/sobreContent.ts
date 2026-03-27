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

Google Autocomplete: perguntas de saúde detectadas automaticamente a partir das sugestões de pesquisa do Google para cada keyword monitorizada. Complementa as Related Queries do Google Trends com dúvidas formuladas em linguagem natural.

RSS Feeds: 36 fontes portuguesas com recolha contínua via Edge Function automatizada. Media generalista (RTP, Público, Observador, Jornal de Notícias, Diário de Notícias, Expresso, CM Jornal, TSF, SIC Notícias, Renascença, Notícias ao Minuto). Media especializada em saúde e ciência (Público Ciência, Observador Saúde, Visão Saúde, ECO Saúde). Institucional (DGS, INSA, SNS, Ordem dos Médicos, Ordem dos Enfermeiros, SPMS, ERS, Coord. Nacional Saúde Mental). Nutrição e alimentação (Nutrimento PNPAS, Alimentação Saudável DGS). Sociedades científicas (Sociedade Portuguesa de Reumatologia, Sociedade Portuguesa de Ginecologia, SPPneumologia, Sociedade Portuguesa de Literacia em Saúde, Sociedade Portuguesa Patologia Coluna Vertebral, Centro de Neurociências e Biologia Celular, Sociedade Portuguesa de Esclerose Múltipla, GIMM Gulbenkian). Fact-check (Polígrafo, Observador Fact Check).

YouTube: vídeos de saúde recolhidos semanalmente via script Python a partir de 45 canais portugueses curados por categoria: media generalista (RTP, SIC Notícias, TVI, Público, Observador, Diário de Notícias, Jornal de Notícias, Euronews PT), saúde institucional (DGS, Alimentação Saudável PNPAS-DGS, INSA, INFARMED, ERS, República Portuguesa, CNPS Mental), ordens e sociedades científicas (Ordem dos Médicos, Ordem dos Psicólogos, Sociedade Portuguesa de Ginecologia, Sociedade Portuguesa de Psiquiatria, Sociedade Portuguesa de Reumatologia, Sociedade Portuguesa de Cuidados Intensivos, SPPneumologia, Sociedade Portuguesa de Literacia em Saúde, Sociedade Portuguesa Patologia Coluna Vertebral, Sociedade Portuguesa de Esclerose Múltipla), hospitais e saúde privada (Trofa Saúde, CUF, Lusíadas Saúde, Unilabs Portugal, Médis, Lundbeck Portugal), ciência e academia (Academia das Ciências de Lisboa, Fundação Francisco Manuel dos Santos, Fundação Calouste Gulbenkian, Faculdade de Medicina ULisboa, FCNAUP, FCT, 90 Segundos de Ciência, ITQB NOVA, GIMM Gulbenkian, Centro de Neurociências e Biologia Celular, Portal Top Saúde), fact-check e divulgação (Despolariza, News Farma) e institucional local (Câmara Municipal de Lisboa). Dados organizados por eixo temático, com deduplicação por URL e selecção dos top 15 por número de visualizações.

DETECÇÃO ASSISTIDA

Keywords e sinais emergentes identificados automaticamente pelo sistema. Crescimento superior a 50% com volume mínimo de 10 pontos no índice Google Trends, ou termos sem histórico no ano anterior, são sinalizados como emergentes. Adicionalmente, o sistema detecta alertas de pesquisa com thresholds calibrados por período: >30% para 7 dias, >50% para 30 dias e >40% para 12 meses.

CURADORIA EDITORIAL

Debunking: verificação e categorização manual de mitos e desinformação em saúde, com validação científica. Classificação: FALSO / ENGANADOR / SEM EVIDÊNCIA / IMPRECISO.

Cobertura mediática: curadoria editorial dos artigos recolhidos via RSS com base em relevância e fundamento científico.

FONTES DE REFERÊNCIA

Entidades consultadas para validação científica e contextualização editorial: Sociedade Portuguesa de Pediatria (SPP), Sociedade Portuguesa de Reumatologia, Sociedade Portuguesa de Ginecologia, Sociedade Portuguesa de Cuidados Intensivos, SPPneumologia, Sociedade Portuguesa de Literacia em Saúde (SPLS), Sociedade Portuguesa Patologia Coluna Vertebral, Sociedade Portuguesa de Esclerose Múltipla (SPEM), Centro de Neurociências e Biologia Celular (CNC UC), GIMM Gulbenkian, Fundação Calouste Gulbenkian, Governo de Portugal — Área da Saúde, Ordem dos Enfermeiros, NewsFarma (agenda de eventos médicos), MSD Manuals (referência clínica peer-reviewed) e Comissão Nacional da Saúde Materna, da Criança e do Adolescente (CNSMCA). Estas fontes complementam os dados automáticos com informação institucional e científica verificada.

ARQUIVO SEMANAL

Todas as segundas-feiras, o workflow de actualização arquiva automaticamente os dados da semana anterior: top keywords, perguntas em crescimento, debunking, notícias e YouTube por eixo temático. Os arquivos ficam acessíveis no Briefing e em cada eixo, com possibilidade de exportação em PDF.`,
  },
  metodologia: {
    titulo: "Metodologia",
    conteudo: `SINAIS EMERGENTES

Crescimento semanal superior a 50% com volume mínimo de 10 pontos no índice Google Trends. Termos sem volume anterior relevante (volume anterior inferior a 5 pontos) são classificados como verdadeiramente emergentes (sinais novos). Termos com histórico mas com crescimento forte são classificados como picos.

ALERTAS DE PESQUISA

O sistema detecta alertas com thresholds adaptados ao período seleccionado: crescimento superior a 30% nos últimos 7 dias (sinais rápidos), 50% nos últimos 30 dias (aceleração sustentada) e 40% nos últimos 12 meses (mudanças estruturais). Keywords sinalizadas como emergentes são automaticamente incluídas nos alertas.

DEBUNKING

Categorizado em: FALSO / ENGANADOR / SEM EVIDÊNCIA / IMPRECISO. Processo de curadoria manual, com validação por fontes científicas.

O ÍNDICE GOOGLE TRENDS

O índice varia entre 0 e 100 — não representa o número absoluto de pesquisas, mas o interesse relativo de um termo numa região e período. O valor 100 corresponde ao pico máximo de interesse no período analisado. As percentagens de crescimento (+X%) comparam o volume do período actual com o período anterior equivalente, calculadas a partir dos snapshots históricos semanais.

GRÁFICOS DE TENDÊNCIA

Os gráficos de eixo utilizam média ponderada pelo volume — keywords com maior interesse de pesquisa têm mais peso na curva do eixo. Isto garante que variações em temas de elevada relevância pública (como ansiedade ou menopausa) dominem a visualização face a temas de nicho.

GERAÇÃO DE GUIÕES

Os dados recolhidos pelo sistema alimentam um prompt estruturado enviado ao Perplexity Sonar, um modelo de linguagem com acesso a fontes verificadas em tempo real. O output é um guião com 10 perguntas por tema, com citações a fontes científicas e jornalísticas. Esta etapa é assistida por IA e sujeita a revisão editorial. Periodicidade: semanal, às segundas-feiras.`,
  },
  "como-funciona": {
    titulo: "Como funciona",
    conteudo:
      "GOOGLE TRENDS|pesquisas semanais (pytrends)\nGOOGLE AUTOCOMPLETE|perguntas em linguagem natural\nRSS FEEDS|36 fontes portuguesas\nYOUTUBE|45 canais curados\nSUPABASE|base de dados + keywords\nEDGE FUNCTIONS|automação semanal\nARQUIVO SEMANAL|snapshots + PDFs por eixo\nPERPLEXITY SONAR|geração com citações\nGUIÃO|10 perguntas por tema",
  },
  limitacoes: {
    titulo: "Limitações",
    conteudo:
      "O índice Google Trends não representa volumes absolutos de pesquisa, apenas interesse relativo. Não é possível comparar valores entre temas diferentes.\nA cobertura RSS está limitada a 36 fontes seleccionadas por critério editorial. Não representa a totalidade da produção mediática portuguesa.\nO debunking é um processo de curadoria manual, sujeito à leitura e julgamento da autora, com validação por fontes científicas.\nO threshold de detecção de sinais emergentes (crescimento superior a 50% com volume mínimo de 10 pontos) é um valor operacional, não um critério cientificamente validado. Os thresholds de alertas (30–50%) são calibrados para o contexto português e podem necessitar de ajuste.\nOs gráficos de tendência dependem da acumulação semanal de snapshots históricos. Nos primeiros meses de operação, os períodos sem dados aparecem vazios.\nA detecção de sazonalidade não está implementada — variações sazonais esperadas (como o aumento de pesquisas sobre depressão no inverno) não são distinguidas de picos anormais.",
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
