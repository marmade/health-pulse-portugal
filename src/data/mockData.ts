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
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed (0=Jan, 2=Mar)
  const currentDayOfWeek = now.getDay(); // 0=Sun, 6=Sat

  const configs: Record<string, { labels: string[]; count: number }> = {
    "7d": { labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"], count: 7 },
    "30d": { labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"], count: 4 },
    "12m": { labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"], count: 12 },
  };
  const config = configs[period] || configs["12m"];
  return config.labels.map((w, i) => {
    const previous = Math.round(base * 0.8 + (Math.random() - 0.5) * variance * 0.7);

    // For 12m: hide future months (current year data only up to current month)
    if (period === "12m" && i > currentMonth) {
      return { week: w, current: undefined as unknown as number, previous };
    }
    // For 7d: hide future days
    if (period === "7d") {
      const dayMap = [1, 2, 3, 4, 5, 6, 0]; // Seg=1(Mon)..Dom=0(Sun)
      if (dayMap[i] > currentDayOfWeek && dayMap[i] !== 0) {
        return { week: w, current: undefined as unknown as number, previous };
      }
    }

    return {
      week: w,
      current: Math.round(base + (Math.random() - 0.3) * variance),
      previous,
    };
  });
};

// Per-keyword region multipliers — different keywords are more popular in different regions
const kwRegionMult: Record<string, Record<string, number>> = {
  // saude-mental
  ansiedade: { pt: 1, norte: 0.8, centro: 0.7, lisboa: 1.3, sul: 0.6 },
  depressão: { pt: 1, norte: 0.9, centro: 0.85, lisboa: 1.1, sul: 0.75 },
  burnout: { pt: 1, norte: 0.6, centro: 0.5, lisboa: 1.4, sul: 0.55 },
  insónia: { pt: 1, norte: 1.1, centro: 1.0, lisboa: 0.9, sul: 1.2 },
  pânico: { pt: 1, norte: 0.7, centro: 0.65, lisboa: 1.2, sul: 0.6 },
  "PTSD": { pt: 1, norte: 0.5, centro: 0.4, lisboa: 1.5, sul: 0.45 },
  "automutilação": { pt: 1, norte: 1.1, centro: 0.9, lisboa: 1.0, sul: 0.8 },
  "solidão": { pt: 1, norte: 1.2, centro: 1.3, lisboa: 0.7, sul: 1.4 },
  "TDAH adulto": { pt: 1, norte: 0.6, centro: 0.5, lisboa: 1.6, sul: 0.4 },
  "terapia online": { pt: 1, norte: 0.9, centro: 0.8, lisboa: 1.3, sul: 0.7 },
  // alimentacao
  "dieta mediterrânica": { pt: 1, norte: 0.9, centro: 1.0, lisboa: 0.85, sul: 1.3 },
  "jejum intermitente": { pt: 1, norte: 0.7, centro: 0.6, lisboa: 1.4, sul: 0.65 },
  "intolerância ao glúten": { pt: 1, norte: 0.8, centro: 0.9, lisboa: 1.1, sul: 0.85 },
  "obesidade infantil": { pt: 1, norte: 1.1, centro: 1.0, lisboa: 0.9, sul: 1.05 },
  "suplementos alimentares": { pt: 1, norte: 0.75, centro: 0.7, lisboa: 1.3, sul: 0.6 },
  "alimentação plant-based": { pt: 1, norte: 0.5, centro: 0.45, lisboa: 1.6, sul: 0.5 },
  "açúcar e saúde": { pt: 1, norte: 1.0, centro: 1.1, lisboa: 0.9, sul: 1.15 },
  "alergias alimentares": { pt: 1, norte: 1.1, centro: 1.05, lisboa: 0.95, sul: 0.9 },
  "ultraprocessados": { pt: 1, norte: 0.6, centro: 0.55, lisboa: 1.5, sul: 0.5 },
  "dieta cetogénica": { pt: 1, norte: 0.65, centro: 0.6, lisboa: 1.4, sul: 0.55 },
  // menopausa
  "menopausa sintomas": { pt: 1, norte: 0.9, centro: 1.0, lisboa: 1.1, sul: 0.85 },
  "terapia hormonal": { pt: 1, norte: 0.7, centro: 0.75, lisboa: 1.3, sul: 0.65 },
  "osteoporose": { pt: 1, norte: 1.1, centro: 1.15, lisboa: 0.85, sul: 1.2 },
  "menopausa precoce": { pt: 1, norte: 0.8, centro: 0.75, lisboa: 1.2, sul: 0.7 },
  "fitoterapia menopausa": { pt: 1, norte: 1.2, centro: 1.1, lisboa: 0.7, sul: 1.3 },
  "secura vaginal": { pt: 1, norte: 0.85, centro: 0.9, lisboa: 1.1, sul: 0.8 },
  "peso na menopausa": { pt: 1, norte: 1.0, centro: 1.05, lisboa: 0.95, sul: 1.1 },
  "libido menopausa": { pt: 1, norte: 0.6, centro: 0.55, lisboa: 1.5, sul: 0.5 },
  "menopausa masculina": { pt: 1, norte: 0.5, centro: 0.45, lisboa: 1.4, sul: 0.4 },
  "suores noturnos": { pt: 1, norte: 1.15, centro: 1.1, lisboa: 0.8, sul: 1.2 },
  // emergentes
  "mpox portugal": { pt: 1, norte: 0.6, centro: 0.5, lisboa: 1.5, sul: 0.4 },
  "gripe aviária H5N1": { pt: 1, norte: 1.2, centro: 1.1, lisboa: 0.8, sul: 0.9 },
  "resistência antibióticos": { pt: 1, norte: 0.9, centro: 0.85, lisboa: 1.1, sul: 0.8 },
  "long covid": { pt: 1, norte: 1.0, centro: 1.05, lisboa: 0.95, sul: 1.1 },
  "poluição e saúde": { pt: 1, norte: 0.7, centro: 0.65, lisboa: 1.4, sul: 0.6 },
  "dengue europa": { pt: 1, norte: 0.3, centro: 0.35, lisboa: 1.3, sul: 1.5 },
  "sarampo surto": { pt: 1, norte: 1.1, centro: 1.0, lisboa: 0.9, sul: 0.8 },
  "microplásticos sangue": { pt: 1, norte: 0.8, centro: 0.75, lisboa: 1.2, sul: 0.7 },
  "vírus nipah": { pt: 1, norte: 0.5, centro: 0.45, lisboa: 1.4, sul: 0.4 },
  "bactérias carnívoras": { pt: 1, norte: 0.4, centro: 0.35, lisboa: 1.0, sul: 1.6 },
};

// Per-keyword period multipliers — some keywords spike in short term
const kwPeriodMult: Record<string, Record<string, number>> = {
  burnout: { "7d": 1.5, "30d": 1.2, "12m": 1 },
  pânico: { "7d": 1.8, "30d": 1.3, "12m": 1 },
  "PTSD": { "7d": 0.6, "30d": 0.8, "12m": 1 },
  "solidão": { "7d": 0.5, "30d": 0.7, "12m": 1 },
  "TDAH adulto": { "7d": 1.4, "30d": 1.1, "12m": 1 },
  "terapia online": { "7d": 1.6, "30d": 1.3, "12m": 1 },
  "automutilação": { "7d": 1.3, "30d": 1.1, "12m": 1 },
  "jejum intermitente": { "7d": 1.7, "30d": 1.4, "12m": 1 },
  "alimentação plant-based": { "7d": 1.5, "30d": 1.2, "12m": 1 },
  "ultraprocessados": { "7d": 1.8, "30d": 1.3, "12m": 1 },
  "dieta cetogénica": { "7d": 1.6, "30d": 1.2, "12m": 1 },
  "menopausa precoce": { "7d": 1.4, "30d": 1.1, "12m": 1 },
  "libido menopausa": { "7d": 1.3, "30d": 1.1, "12m": 1 },
  "menopausa masculina": { "7d": 1.9, "30d": 1.3, "12m": 1 },
  "mpox portugal": { "7d": 2.0, "30d": 1.5, "12m": 1 },
  "dengue europa": { "7d": 2.2, "30d": 1.6, "12m": 1 },
  "vírus nipah": { "7d": 2.5, "30d": 1.4, "12m": 1 },
  "bactérias carnívoras": { "7d": 2.0, "30d": 1.5, "12m": 1 },
  "microplásticos sangue": { "7d": 1.6, "30d": 1.2, "12m": 1 },
  "sarampo surto": { "7d": 1.8, "30d": 1.3, "12m": 1 },
};

export function getFilteredAxisData(period: string, region: string) {
  const filtered: Record<string, { label: string; keywords: Keyword[]; allKeywords: Keyword[]; trend: TrendPoint[] }> = {};

  for (const [axisId, axis] of Object.entries(axisData)) {
    const keywords = axis.keywords.map((kw) => {
      const rm = kwRegionMult[kw.term]?.[region] ?? 1;
      const pm = kwPeriodMult[kw.term]?.[period] ?? 1;
      const m = rm * pm;
      return {
        ...kw,
        currentVolume: Math.round(kw.currentVolume * m),
        previousVolume: Math.round(kw.previousVolume * rm),
        changePercent: +(((kw.currentVolume * m - kw.previousVolume * rm) / (kw.previousVolume * rm)) * 100).toFixed(1),
        trend: (m > 1.2 ? "up" : m < 0.8 ? "down" : kw.trend) as "up" | "down" | "stable",
      };
    });

    const sorted = [...keywords].sort((a, b) => b.currentVolume - a.currentVolume);
    const top5 = sorted.slice(0, 5);

    const baseVol = Math.round(top5.reduce((s, k) => s + k.currentVolume, 0) / top5.length);
    filtered[axisId] = {
      label: axis.label,
      keywords: top5,
      allKeywords: sorted,
      trend: generateTrend(baseVol, baseVol * 0.4, period),
    };
  }
  return filtered;
}

export function generateKeywordTrend(keyword: Keyword, period: string): TrendPoint[] {
  return generateTrend(keyword.currentVolume, keyword.currentVolume * 0.35, period);
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
      { term: "PTSD", synonyms: ["stress pós-traumático"], category: "Perturbações", axis: "saude-mental", source: "saudementalpt.com", currentVolume: 42, previousVolume: 38, changePercent: 10.5, trend: "up", lastPeak: "Dez 2025" },
      { term: "automutilação", synonyms: ["autolesão"], category: "Comportamento", axis: "saude-mental", source: "sns24.gov.pt", currentVolume: 39, previousVolume: 30, changePercent: 30.0, trend: "up", lastPeak: "Fev 2026" },
      { term: "solidão", synonyms: ["isolamento social"], category: "Social", axis: "saude-mental", source: "saudementalpt.com", currentVolume: 36, previousVolume: 33, changePercent: 9.1, trend: "stable", lastPeak: "Out 2025" },
      { term: "TDAH adulto", synonyms: ["défice de atenção adultos"], category: "Perturbações", axis: "saude-mental", source: "saudementalpt.com", currentVolume: 33, previousVolume: 18, changePercent: 83.3, trend: "up", lastPeak: "Mar 2026", isEmergent: true },
      { term: "terapia online", synonyms: ["psicologia online", "teleconsulta psicologia"], category: "Tratamento", axis: "saude-mental", source: "sns24.gov.pt", currentVolume: 30, previousVolume: 22, changePercent: 36.4, trend: "up", lastPeak: "Jan 2026" },
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
      { term: "alimentação plant-based", synonyms: ["dieta vegetal", "plant based"], category: "Dietas", axis: "alimentacao", source: "nutrimento.pt", currentVolume: 40, previousVolume: 25, changePercent: 60.0, trend: "up", lastPeak: "Mar 2026", isEmergent: true },
      { term: "açúcar e saúde", synonyms: ["redução de açúcar"], category: "Nutrição", axis: "alimentacao", source: "alimentacaosaudavel.dgs.pt", currentVolume: 37, previousVolume: 34, changePercent: 8.8, trend: "stable", lastPeak: "Nov 2025" },
      { term: "alergias alimentares", synonyms: ["alergia alimentar crianças"], category: "Alergias", axis: "alimentacao", source: "alimentacaosaudavel.dgs.pt", currentVolume: 35, previousVolume: 32, changePercent: 9.4, trend: "up", lastPeak: "Fev 2026" },
      { term: "ultraprocessados", synonyms: ["alimentos ultraprocessados", "comida processada"], category: "Nutrição", axis: "alimentacao", source: "nutrimento.pt", currentVolume: 32, previousVolume: 15, changePercent: 113.3, trend: "up", lastPeak: "Mar 2026", isEmergent: true },
      { term: "dieta cetogénica", synonyms: ["keto diet", "dieta keto"], category: "Dietas", axis: "alimentacao", source: "alimentacaosaudavel.dgs.pt", currentVolume: 29, previousVolume: 35, changePercent: -17.1, trend: "down", lastPeak: "Set 2025" },
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
      { term: "secura vaginal", synonyms: ["atrofia vaginal"], category: "Sintomas", axis: "menopausa", source: "sns24.gov.pt", currentVolume: 35, previousVolume: 30, changePercent: 16.7, trend: "up", lastPeak: "Jan 2026" },
      { term: "peso na menopausa", synonyms: ["engordar menopausa"], category: "Sintomas", axis: "menopausa", source: "sns24.gov.pt", currentVolume: 33, previousVolume: 29, changePercent: 13.8, trend: "up", lastPeak: "Fev 2026" },
      { term: "libido menopausa", synonyms: ["desejo sexual menopausa"], category: "Sintomas", axis: "menopausa", source: "msdmanuals.com", currentVolume: 28, previousVolume: 22, changePercent: 27.3, trend: "up", lastPeak: "Mar 2026" },
      { term: "menopausa masculina", synonyms: ["andropausa", "défice de testosterona"], category: "Diagnóstico", axis: "menopausa", source: "msdmanuals.com", currentVolume: 22, previousVolume: 10, changePercent: 120.0, trend: "up", lastPeak: "Mar 2026", isEmergent: true },
      { term: "suores noturnos", synonyms: ["transpiração noturna"], category: "Sintomas", axis: "menopausa", source: "sns24.gov.pt", currentVolume: 31, previousVolume: 28, changePercent: 10.7, trend: "stable", lastPeak: "Dez 2025" },
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
      { term: "dengue europa", synonyms: ["dengue portugal"], category: "Doenças infecciosas", axis: "emergentes", source: "dgs.pt", currentVolume: 38, previousVolume: 5, changePercent: 660.0, trend: "up", lastPeak: "Mar 2026", isEmergent: true },
      { term: "sarampo surto", synonyms: ["surto de sarampo"], category: "Doenças infecciosas", axis: "emergentes", source: "dgs.pt", currentVolume: 35, previousVolume: 18, changePercent: 94.4, trend: "up", lastPeak: "Fev 2026" },
      { term: "microplásticos sangue", synonyms: ["microplásticos corpo humano"], category: "Ambiente", axis: "emergentes", source: "dgs.pt", currentVolume: 30, previousVolume: 8, changePercent: 275.0, trend: "up", lastPeak: "Mar 2026", isEmergent: true },
      { term: "vírus nipah", synonyms: ["nipah virus"], category: "Doenças infecciosas", axis: "emergentes", source: "dgs.pt", currentVolume: 25, previousVolume: 3, changePercent: 733.3, trend: "up", lastPeak: "Mar 2026", isEmergent: true },
      { term: "bactérias carnívoras", synonyms: ["fasceíte necrosante"], category: "Doenças infecciosas", axis: "emergentes", source: "dgs.pt", currentVolume: 20, previousVolume: 4, changePercent: 400.0, trend: "up", lastPeak: "Fev 2026", isEmergent: true },
    ],
    trend: generateTrend(45, 35),
  },
};
export const debunkingData: DebunkItem[] = [
  { term: "jejum intermitente", title: "Jejum, água com limão e hidratos de carbono: sete mitos e verdades sobre nutrição", classification: "ENGANADOR", source: "Polígrafo", url: "https://poligrafo.sapo.pt/saude/jejum-agua-com-limao-e-hidratos-de-carbono-sete-mitos-e-verdades-sobre-nutricao/" },
  { term: "terapia hormonal", title: "Terapia hormonal causa cancro? Análise dos estudos recentes", classification: "IMPRECISO", source: "Health Feedback", url: "https://healthfeedback.org/claimreview/studies-show-mixed-results-on-breast-cancer-risk-from-hormone-therapy/" },
  { term: "mpox portugal", title: "Mpox só se transmite através de contacto sexual? Fact-check", classification: "FALSO", source: "Observador", url: "https://observador.pt/factchecks/fact-check-mpox-so-se-transmite-atraves-de-contacto-sexual/" },
  { term: "suplementos alimentares", title: "Vitamina D previne covid-19? Falta de evidência científica", classification: "SEM EVIDÊNCIA", source: "Polígrafo", url: "https://poligrafo.sapo.pt/fact-check/suplementos-alimentares-o-que-a-ciencia-diz/" },
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
