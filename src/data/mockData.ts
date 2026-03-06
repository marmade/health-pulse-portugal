export type Keyword = {
  term: string;
  synonyms: string[];
  category: string;
  axis: string;
  source: string;
  currentVolume: number;
  previousVolume: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
  lastPeak: string;
  isEmergent?: boolean;
};

export type TrendPoint = {
  week: string;
  current: number;
  previous: number;
};

export type DebunkItem = {
  term: string;
  title: string;
  classification: "FALSO" | "ENGANADOR" | "SEM EVIDÊNCIA" | "IMPRECISO";
  source: string;
  url: string;
};

export type NewsItem = {
  title: string;
  outlet: string;
  date: string;
  url: string;
  relatedTerm: string;
};

const generateTrend = (base: number, variance: number, period: string = "12m"): TrendPoint[] => {
  const configs: Record<string, { labels: string[]; count: number }> = {
    "7d": { labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"], count: 7 },
    "30d": { labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"], count: 4 },
    "12m": { labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"], count: 12 },
  };
  const config = configs[period] || configs["12m"];
  return config.labels.map((w) => ({
    week: w,
    current: Math.round(base + (Math.random() - 0.3) * variance),
    previous: Math.round(base * 0.8 + (Math.random() - 0.5) * variance * 0.7),
  }));
};

// Region multipliers simulate regional variation
const regionMultipliers: Record<string, Record<string, number>> = {
  pt: { "saude-mental": 1, alimentacao: 1, menopausa: 1, emergentes: 1 },
  norte: { "saude-mental": 0.85, alimentacao: 1.1, menopausa: 0.9, emergentes: 0.7 },
  centro: { "saude-mental": 0.75, alimentacao: 0.95, menopausa: 1.05, emergentes: 0.6 },
  lisboa: { "saude-mental": 1.2, alimentacao: 0.9, menopausa: 1.1, emergentes: 1.3 },
  sul: { "saude-mental": 0.7, alimentacao: 1.15, menopausa: 0.85, emergentes: 0.5 },
};

export function getFilteredAxisData(period: string, region: string) {
  const filtered: Record<string, { label: string; keywords: Keyword[]; trend: TrendPoint[] }> = {};
  const mult = regionMultipliers[region] || regionMultipliers.pt;

  for (const [axisId, axis] of Object.entries(axisData)) {
    const m = mult[axisId] ?? 1;
    const keywords = axis.keywords.map((kw) => ({
      ...kw,
      currentVolume: Math.round(kw.currentVolume * m),
      previousVolume: Math.round(kw.previousVolume * m),
      changePercent: +(kw.changePercent * (0.8 + m * 0.2)).toFixed(1),
    }));
    const baseVol = Math.round(keywords.reduce((s, k) => s + k.currentVolume, 0) / keywords.length);
    filtered[axisId] = {
      label: axis.label,
      keywords,
      trend: generateTrend(baseVol, baseVol * 0.4, period),
    };
  }
  return filtered;
}

export const axisData: Record<string, { label: string; keywords: Keyword[]; trend: TrendPoint[] }> = {
  "saude-mental": {
    label: "SAÚDE MENTAL",
    keywords: [
      { term: "ansiedade", synonyms: ["stress", "perturbação de ansiedade"], category: "Perturbações", axis: "saude-mental", source: "saudementalpt.com", currentVolume: 89, previousVolume: 72, changePercent: 23.6, trend: "up", lastPeak: "Mar 2026" },
      { term: "depressão", synonyms: ["tristeza crónica"], category: "Perturbações", axis: "saude-mental", source: "saudementalpt.com", currentVolume: 76, previousVolume: 68, changePercent: 11.8, trend: "up", lastPeak: "Jan 2026" },
      { term: "burnout", synonyms: ["esgotamento profissional"], category: "Trabalho", axis: "saude-mental", source: "saudementalpt.com", currentVolume: 65, previousVolume: 41, changePercent: 58.5, trend: "up", lastPeak: "Fev 2026" },
      { term: "insónia", synonyms: ["perturbação do sono"], category: "Sono", axis: "saude-mental", source: "saudementalpt.com", currentVolume: 54, previousVolume: 52, changePercent: 3.8, trend: "stable", lastPeak: "Nov 2025" },
      { term: "pânico", synonyms: ["ataque de pânico"], category: "Perturbações", axis: "saude-mental", source: "saudementalpt.com", currentVolume: 48, previousVolume: 35, changePercent: 37.1, trend: "up", lastPeak: "Mar 2026" },
    ],
    trend: generateTrend(65, 30),
  },
  alimentacao: {
    label: "ALIMENTAÇÃO",
    keywords: [
      { term: "dieta mediterrânica", synonyms: ["alimentação mediterrânica"], category: "Dietas", axis: "alimentacao", source: "nutrimento.pt", currentVolume: 82, previousVolume: 75, changePercent: 9.3, trend: "up", lastPeak: "Jan 2026" },
      { term: "jejum intermitente", synonyms: ["intermittent fasting"], category: "Dietas", axis: "alimentacao", source: "alimentacaosaudavel.dgs.pt", currentVolume: 71, previousVolume: 63, changePercent: 12.7, trend: "up", lastPeak: "Fev 2026" },
      { term: "intolerância ao glúten", synonyms: ["doença celíaca", "gluten free"], category: "Alergias", axis: "alimentacao", source: "alimentacaosaudavel.dgs.pt", currentVolume: 58, previousVolume: 55, changePercent: 5.5, trend: "stable", lastPeak: "Out 2025" },
      { term: "obesidade infantil", synonyms: ["excesso de peso crianças"], category: "Pediatria", axis: "alimentacao", source: "nutrimento.pt", currentVolume: 47, previousVolume: 39, changePercent: 20.5, trend: "up", lastPeak: "Mar 2026" },
      { term: "suplementos alimentares", synonyms: ["vitaminas", "suplementação"], category: "Suplementos", axis: "alimentacao", source: "alimentacaosaudavel.dgs.pt", currentVolume: 44, previousVolume: 50, changePercent: -12.0, trend: "down", lastPeak: "Dez 2025" },
    ],
    trend: generateTrend(55, 25),
  },
  menopausa: {
    label: "MENOPAUSA",
    keywords: [
      { term: "menopausa sintomas", synonyms: ["climatério", "afrontamentos"], category: "Sintomas", axis: "menopausa", source: "sns24.gov.pt", currentVolume: 74, previousVolume: 58, changePercent: 27.6, trend: "up", lastPeak: "Mar 2026" },
      { term: "terapia hormonal", synonyms: ["THS", "reposição hormonal"], category: "Tratamento", axis: "menopausa", source: "msdmanuals.com", currentVolume: 62, previousVolume: 48, changePercent: 29.2, trend: "up", lastPeak: "Fev 2026" },
      { term: "osteoporose", synonyms: ["perda óssea"], category: "Complicações", axis: "menopausa", source: "sns24.gov.pt", currentVolume: 51, previousVolume: 49, changePercent: 4.1, trend: "stable", lastPeak: "Jan 2026" },
      { term: "menopausa precoce", synonyms: ["insuficiência ovárica prematura"], category: "Diagnóstico", axis: "menopausa", source: "sponcologia.pt", currentVolume: 43, previousVolume: 28, changePercent: 53.6, trend: "up", lastPeak: "Mar 2026", isEmergent: true },
      { term: "fitoterapia menopausa", synonyms: ["remédios naturais menopausa"], category: "Alternativas", axis: "menopausa", source: "sns24.gov.pt", currentVolume: 38, previousVolume: 31, changePercent: 22.6, trend: "up", lastPeak: "Fev 2026" },
    ],
    trend: generateTrend(50, 20),
  },
  emergentes: {
    label: "EMERGENTES",
    keywords: [
      { term: "mpox portugal", synonyms: ["varíola dos macacos"], category: "Doenças infecciosas", axis: "emergentes", source: "dgs.pt", currentVolume: 91, previousVolume: 12, changePercent: 658.3, trend: "up", lastPeak: "Mar 2026", isEmergent: true },
      { term: "gripe aviária H5N1", synonyms: ["influenza aviária"], category: "Doenças infecciosas", axis: "emergentes", source: "dgs.pt", currentVolume: 67, previousVolume: 8, changePercent: 737.5, trend: "up", lastPeak: "Mar 2026", isEmergent: true },
      { term: "resistência antibióticos", synonyms: ["superbactérias", "AMR"], category: "Saúde pública", axis: "emergentes", source: "sns.gov.pt", currentVolume: 55, previousVolume: 22, changePercent: 150.0, trend: "up", lastPeak: "Fev 2026" },
      { term: "long covid", synonyms: ["covid longa", "pós-covid"], category: "Doenças infecciosas", axis: "emergentes", source: "dgs.pt", currentVolume: 49, previousVolume: 61, changePercent: -19.7, trend: "down", lastPeak: "Set 2025" },
      { term: "poluição e saúde", synonyms: ["qualidade do ar"], category: "Ambiente", axis: "emergentes", source: "dgs.pt", currentVolume: 42, previousVolume: 15, changePercent: 180.0, trend: "up", lastPeak: "Mar 2026", isEmergent: true },
    ],
    trend: generateTrend(45, 35),
  },
};

export const debunkingData: DebunkItem[] = [
  { term: "jejum intermitente", title: "Jejum, água com limão e hidratos de carbono: sete mitos e verdades sobre nutrição", classification: "ENGANADOR", source: "Polígrafo", url: "https://poligrafo.sapo.pt/saude/jejum-agua-com-limao-e-hidratos-de-carbono-sete-mitos-e-verdades-sobre-nutricao/" },
  { term: "terapia hormonal", title: "Terapia hormonal causa cancro? Análise dos estudos recentes", classification: "IMPRECISO", source: "Health Feedback", url: "https://science.feedback.org/review/dozens-of-clinical-trials-ongoing-to-investigate-whether-vitamin-d-prevents-covid-19-no-firm-evidence-yet/" },
  { term: "mpox portugal", title: "Mpox só se transmite através de contacto sexual? Fact-check", classification: "FALSO", source: "Observador", url: "https://observador.pt/factchecks/fact-check-mpox-so-se-transmite-atraves-de-contacto-sexual/" },
  { term: "suplementos alimentares", title: "Vitamina D previne covid-19? Falta de evidência científica", classification: "SEM EVIDÊNCIA", source: "Science Feedback", url: "https://science.feedback.org/review/dozens-of-clinical-trials-ongoing-to-investigate-whether-vitamin-d-prevents-covid-19-no-firm-evidence-yet/" },
  { term: "fitoterapia menopausa", title: "Está provado que beber sumo de maracujá emagrece?", classification: "ENGANADOR", source: "Polígrafo", url: "https://poligrafo.sapo.pt/fact-check/esta-provado-que-beber-sumo-de-maracuja-emagrece/" },
];

export const newsData: NewsItem[] = [
  { title: "Ansiedade afeta um terço da população em Portugal", outlet: "PÚBLICO", date: "2025-04-04", url: "https://www.publico.pt/2025/04/04/sociedade/noticia/ansiedade-afecta-terco-populacao-portugal-mulheres-idosos-deempregados-sao-afectados-2128541", relatedTerm: "ansiedade" },
  { title: "Aumentam os casos de Mpox: Portugal com 40 novas infeções", outlet: "RTP", date: "2025-03-03", url: "https://www.rtp.pt/noticias/pais/aumentam-os-casos-de-mpox-portugal-com-40-novas-infecoes-nos-ultimos-dois-meses_n1709145", relatedTerm: "mpox portugal" },
  { title: "Burnout: a epidemia global do século XXI chegou aos portugueses", outlet: "EXPRESSO", date: "2024-07-30", url: "https://expresso.pt/longevidade/2024-07-30-video-burnout-a-epidemia-global-do-seculo-xxi-chegou-aos-locais-de-trabalho-dos-portugueses-75d034b1", relatedTerm: "burnout" },
  { title: "Menopausa precoce antes dos 40 aumenta risco cardiovascular em 70%", outlet: "JN", date: "2025-02-25", url: "https://www.jn.pt/delas/artigo/menopausa-precoce-antes-dos-40-anos-aumenta-o-risco-cardiovascular-em-70/18048896", relatedTerm: "menopausa precoce" },
  { title: "Resistência a antibióticos: mais de 39 milhões de mortes até 2050", outlet: "DN", date: "2024-09-16", url: "https://www.dn.pt/ciencia/estudo-estima-mais-de-39-milhoes-de-mortes-ate-2050-por-infecoes-resistentes-a-antibioticos", relatedTerm: "resistência antibióticos" },
  { title: "Gripe das aves volta a ser detetada em Torres Vedras", outlet: "CM JORNAL", date: "2025-03-05", url: "https://www.cmjornal.pt/sociedade/detalhe/gripe-das-aves-volta-a-ser-detetada-em-torres-vedras", relatedTerm: "gripe aviária H5N1" },
];
