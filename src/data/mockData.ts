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

const generateTrend = (base: number, variance: number): TrendPoint[] => {
  const weeks = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return weeks.map((w) => ({
    week: w,
    current: Math.round(base + (Math.random() - 0.3) * variance),
    previous: Math.round(base * 0.8 + (Math.random() - 0.5) * variance * 0.7),
  }));
};

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
  { term: "jejum intermitente", title: "Jejum intermitente cura diabetes? Não há evidência suficiente", classification: "ENGANADOR", source: "Polígrafo", url: "https://poligrafo.sapo.pt" },
  { term: "terapia hormonal", title: "Terapia hormonal causa cancro? Análise dos estudos recentes", classification: "IMPRECISO", source: "Health Feedback", url: "https://science.feedback.org" },
  { term: "mpox portugal", title: "Mpox transmite-se pelo ar? O que dizem os especialistas", classification: "FALSO", source: "Polígrafo", url: "https://poligrafo.sapo.pt" },
  { term: "suplementos alimentares", title: "Vitamina D previne covid-19? Falta de evidência científica", classification: "SEM EVIDÊNCIA", source: "Health Feedback", url: "https://science.feedback.org" },
  { term: "fitoterapia menopausa", title: "Plantas medicinais substituem terapia hormonal na menopausa?", classification: "ENGANADOR", source: "Polígrafo", url: "https://poligrafo.sapo.pt" },
];

export const newsData: NewsItem[] = [
  { title: "Ansiedade entre jovens portugueses atinge níveis recorde", outlet: "PÚBLICO", date: "2026-03-01", url: "https://publico.pt", relatedTerm: "ansiedade" },
  { title: "DGS emite alerta sobre casos de mpox em Lisboa", outlet: "RTP", date: "2026-03-03", url: "https://rtp.pt", relatedTerm: "mpox portugal" },
  { title: "Burnout: uma em cada três pessoas em risco", outlet: "EXPRESSO", date: "2026-02-28", url: "https://expresso.pt", relatedTerm: "burnout" },
  { title: "Menopausa precoce: o tema tabu que preocupa médicos", outlet: "JN", date: "2026-02-25", url: "https://jn.pt", relatedTerm: "menopausa precoce" },
  { title: "Resistência aos antibióticos pode causar mais mortes que cancro", outlet: "DN", date: "2026-03-04", url: "https://dn.pt", relatedTerm: "resistência antibióticos" },
  { title: "Gripe aviária: Portugal reforça vigilância em explorações avícolas", outlet: "CM JORNAL", date: "2026-03-05", url: "https://cmjornal.pt", relatedTerm: "gripe aviária H5N1" },
];
