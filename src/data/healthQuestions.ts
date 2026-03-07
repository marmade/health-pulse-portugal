import type { DebunkItem, NewsItem } from "./mockData";

export type HealthQuestion = {
  question: string;
  growthPercent: number;
  relativeVolume: number; // 0–100
  axis: string;
  axisLabel: string;
  cluster: string;
  relatedTerms: string[];
};

const questionPrefixes = ["como", "o que", "é normal", "porque", "quais são", "sintomas de", "posso"];

/** Simulated health questions detected from search patterns */
export const healthQuestions: HealthQuestion[] = [
  // Saúde Mental
  { question: "é normal ter ansiedade todos os dias", growthPercent: 187, relativeVolume: 82, axis: "saude-mental", axisLabel: "Saúde Mental", cluster: "Ansiedade", relatedTerms: ["ansiedade", "pânico"] },
  { question: "o que fazer numa crise de pânico", growthPercent: 165, relativeVolume: 74, axis: "saude-mental", axisLabel: "Saúde Mental", cluster: "Ansiedade", relatedTerms: ["pânico", "ansiedade"] },
  { question: "como saber se tenho burnout", growthPercent: 210, relativeVolume: 68, axis: "saude-mental", axisLabel: "Saúde Mental", cluster: "Esgotamento Profissional", relatedTerms: ["burnout"] },
  { question: "sintomas de depressão em jovens", growthPercent: 143, relativeVolume: 61, axis: "saude-mental", axisLabel: "Saúde Mental", cluster: "Depressão e Humor", relatedTerms: ["depressão", "solidão"] },
  { question: "posso ter TDAH e não saber", growthPercent: 320, relativeVolume: 55, axis: "saude-mental", axisLabel: "Saúde Mental", cluster: "Neurodivergência", relatedTerms: ["TDAH adulto"] },
  { question: "como funciona a terapia online", growthPercent: 128, relativeVolume: 48, axis: "saude-mental", axisLabel: "Saúde Mental", cluster: "Acesso a Tratamento", relatedTerms: ["terapia online"] },

  // Alimentação
  { question: "o que são alimentos ultraprocessados", growthPercent: 275, relativeVolume: 71, axis: "alimentacao", axisLabel: "Alimentação", cluster: "Ultraprocessados e Açúcar", relatedTerms: ["ultraprocessados", "açúcar e saúde"] },
  { question: "como fazer jejum intermitente de forma segura", growthPercent: 156, relativeVolume: 78, axis: "alimentacao", axisLabel: "Alimentação", cluster: "Dietas Populares", relatedTerms: ["jejum intermitente"] },
  { question: "quais são os sintomas de intolerância ao glúten", growthPercent: 132, relativeVolume: 64, axis: "alimentacao", axisLabel: "Alimentação", cluster: "Alergias e Intolerâncias", relatedTerms: ["intolerância ao glúten", "alergias alimentares"] },
  { question: "posso substituir proteína animal por vegetal", growthPercent: 198, relativeVolume: 52, axis: "alimentacao", axisLabel: "Alimentação", cluster: "Alimentação Vegetal", relatedTerms: ["alimentação plant-based"] },

  // Menopausa
  { question: "como saber se estou na menopausa", growthPercent: 245, relativeVolume: 85, axis: "menopausa", axisLabel: "Menopausa", cluster: "Sintomas da Menopausa", relatedTerms: ["menopausa sintomas", "suores noturnos"] },
  { question: "é normal ter menopausa antes dos 40", growthPercent: 310, relativeVolume: 59, axis: "menopausa", axisLabel: "Menopausa", cluster: "Menopausa Precoce", relatedTerms: ["menopausa precoce"] },
  { question: "quais são os riscos da terapia hormonal", growthPercent: 178, relativeVolume: 66, axis: "menopausa", axisLabel: "Menopausa", cluster: "Tratamento Hormonal", relatedTerms: ["terapia hormonal", "fitoterapia menopausa"] },
  { question: "porque é que engordo na menopausa", growthPercent: 152, relativeVolume: 73, axis: "menopausa", axisLabel: "Menopausa", cluster: "Complicações", relatedTerms: ["peso na menopausa", "osteoporose"] },

  // Emergentes
  { question: "o que é a gripe aviária e como se transmite", growthPercent: 480, relativeVolume: 77, axis: "emergentes", axisLabel: "Emergentes", cluster: "Gripe Aviária", relatedTerms: ["gripe aviária H5N1"] },
  { question: "posso apanhar dengue em Portugal", growthPercent: 390, relativeVolume: 62, axis: "emergentes", axisLabel: "Emergentes", cluster: "Doenças Tropicais", relatedTerms: ["dengue europa"] },
  { question: "como saber se tenho long covid", growthPercent: 125, relativeVolume: 58, axis: "emergentes", axisLabel: "Emergentes", cluster: "Pós-Covid", relatedTerms: ["long covid"] },
  { question: "o que são microplásticos no sangue", growthPercent: 345, relativeVolume: 49, axis: "emergentes", axisLabel: "Emergentes", cluster: "Ambiente e Saúde", relatedTerms: ["microplásticos sangue", "poluição e saúde"] },
];

/** Get questions sorted by growth, optionally filtered by axis */
export function getHealthQuestions(axis?: string): HealthQuestion[] {
  const filtered = axis && axis !== "all"
    ? healthQuestions.filter((q) => q.axis === axis)
    : healthQuestions;
  return [...filtered].sort((a, b) => b.growthPercent - a.growthPercent);
}

/** Find related news for a question */
export function getRelatedNews(question: HealthQuestion, newsData: NewsItem[]): NewsItem[] {
  return newsData.filter((n) =>
    question.relatedTerms.includes(n.relatedTerm)
  );
}

/** Find related fact-checks for a question */
export function getRelatedDebunks(question: HealthQuestion, debunkingData: DebunkItem[]): DebunkItem[] {
  return debunkingData.filter((d) =>
    question.relatedTerms.includes(d.term)
  );
}
