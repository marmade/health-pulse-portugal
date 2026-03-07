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
  { question: "como lidar com insónia causada por stress", growthPercent: 195, relativeVolume: 70, axis: "saude-mental", axisLabel: "Saúde Mental", cluster: "Ansiedade", relatedTerms: ["ansiedade"] },
  { question: "o que é dissociação emocional", growthPercent: 260, relativeVolume: 42, axis: "saude-mental", axisLabel: "Saúde Mental", cluster: "Depressão e Humor", relatedTerms: ["depressão"] },
  { question: "porque é que choro sem motivo", growthPercent: 175, relativeVolume: 63, axis: "saude-mental", axisLabel: "Saúde Mental", cluster: "Depressão e Humor", relatedTerms: ["depressão", "solidão"] },
  { question: "como ajudar alguém com pensamentos suicidas", growthPercent: 290, relativeVolume: 51, axis: "saude-mental", axisLabel: "Saúde Mental", cluster: "Depressão e Humor", relatedTerms: ["depressão"] },
  { question: "qual a diferença entre psicólogo e psiquiatra", growthPercent: 110, relativeVolume: 77, axis: "saude-mental", axisLabel: "Saúde Mental", cluster: "Acesso a Tratamento", relatedTerms: ["terapia online"] },
  { question: "meditação ajuda na ansiedade", growthPercent: 145, relativeVolume: 56, axis: "saude-mental", axisLabel: "Saúde Mental", cluster: "Ansiedade", relatedTerms: ["ansiedade"] },

  // Alimentação
  { question: "o que são alimentos ultraprocessados", growthPercent: 275, relativeVolume: 71, axis: "alimentacao", axisLabel: "Alimentação", cluster: "Ultraprocessados e Açúcar", relatedTerms: ["ultraprocessados", "açúcar e saúde"] },
  { question: "como fazer jejum intermitente de forma segura", growthPercent: 156, relativeVolume: 78, axis: "alimentacao", axisLabel: "Alimentação", cluster: "Dietas Populares", relatedTerms: ["jejum intermitente"] },
  { question: "quais são os sintomas de intolerância ao glúten", growthPercent: 132, relativeVolume: 64, axis: "alimentacao", axisLabel: "Alimentação", cluster: "Alergias e Intolerâncias", relatedTerms: ["intolerância ao glúten", "alergias alimentares"] },
  { question: "posso substituir proteína animal por vegetal", growthPercent: 198, relativeVolume: 52, axis: "alimentacao", axisLabel: "Alimentação", cluster: "Alimentação Vegetal", relatedTerms: ["alimentação plant-based"] },
  { question: "o açúcar causa inflamação no corpo", growthPercent: 230, relativeVolume: 66, axis: "alimentacao", axisLabel: "Alimentação", cluster: "Ultraprocessados e Açúcar", relatedTerms: ["açúcar e saúde"] },
  { question: "como ler rótulos de alimentos corretamente", growthPercent: 140, relativeVolume: 58, axis: "alimentacao", axisLabel: "Alimentação", cluster: "Ultraprocessados e Açúcar", relatedTerms: ["ultraprocessados"] },
  { question: "é seguro tomar suplementos de vitamina D", growthPercent: 185, relativeVolume: 72, axis: "alimentacao", axisLabel: "Alimentação", cluster: "Suplementação", relatedTerms: ["jejum intermitente"] },
  { question: "o que é a dieta mediterrânica", growthPercent: 120, relativeVolume: 80, axis: "alimentacao", axisLabel: "Alimentação", cluster: "Dietas Populares", relatedTerms: ["jejum intermitente"] },
  { question: "quais os riscos de comer muita carne vermelha", growthPercent: 165, relativeVolume: 55, axis: "alimentacao", axisLabel: "Alimentação", cluster: "Alimentação Vegetal", relatedTerms: ["alimentação plant-based"] },
  { question: "como saber se tenho défice de ferro", growthPercent: 210, relativeVolume: 62, axis: "alimentacao", axisLabel: "Alimentação", cluster: "Suplementação", relatedTerms: ["alergias alimentares"] },
  { question: "probióticos ajudam na digestão", growthPercent: 155, relativeVolume: 49, axis: "alimentacao", axisLabel: "Alimentação", cluster: "Suplementação", relatedTerms: ["jejum intermitente"] },
  { question: "é verdade que o leite faz mal", growthPercent: 245, relativeVolume: 68, axis: "alimentacao", axisLabel: "Alimentação", cluster: "Alergias e Intolerâncias", relatedTerms: ["intolerância ao glúten"] },

  // Menopausa
  { question: "como saber se estou na menopausa", growthPercent: 245, relativeVolume: 85, axis: "menopausa", axisLabel: "Menopausa", cluster: "Sintomas da Menopausa", relatedTerms: ["menopausa sintomas", "suores noturnos"] },
  { question: "é normal ter menopausa antes dos 40", growthPercent: 310, relativeVolume: 59, axis: "menopausa", axisLabel: "Menopausa", cluster: "Menopausa Precoce", relatedTerms: ["menopausa precoce"] },
  { question: "quais são os riscos da terapia hormonal", growthPercent: 178, relativeVolume: 66, axis: "menopausa", axisLabel: "Menopausa", cluster: "Tratamento Hormonal", relatedTerms: ["terapia hormonal", "fitoterapia menopausa"] },
  { question: "porque é que engordo na menopausa", growthPercent: 152, relativeVolume: 73, axis: "menopausa", axisLabel: "Menopausa", cluster: "Complicações", relatedTerms: ["peso na menopausa", "osteoporose"] },
  { question: "como aliviar os suores noturnos", growthPercent: 220, relativeVolume: 78, axis: "menopausa", axisLabel: "Menopausa", cluster: "Sintomas da Menopausa", relatedTerms: ["suores noturnos", "menopausa sintomas"] },
  { question: "a menopausa afeta a saúde mental", growthPercent: 280, relativeVolume: 54, axis: "menopausa", axisLabel: "Menopausa", cluster: "Sintomas da Menopausa", relatedTerms: ["menopausa sintomas"] },
  { question: "posso engravidar na perimenopausa", growthPercent: 190, relativeVolume: 61, axis: "menopausa", axisLabel: "Menopausa", cluster: "Menopausa Precoce", relatedTerms: ["menopausa precoce"] },
  { question: "exercício físico ajuda na menopausa", growthPercent: 135, relativeVolume: 69, axis: "menopausa", axisLabel: "Menopausa", cluster: "Tratamento Hormonal", relatedTerms: ["fitoterapia menopausa"] },
  { question: "menopausa causa queda de cabelo", growthPercent: 265, relativeVolume: 47, axis: "menopausa", axisLabel: "Menopausa", cluster: "Complicações", relatedTerms: ["osteoporose"] },
  { question: "o que é a perimenopausa e quanto dura", growthPercent: 200, relativeVolume: 75, axis: "menopausa", axisLabel: "Menopausa", cluster: "Sintomas da Menopausa", relatedTerms: ["menopausa sintomas"] },
  { question: "secura vaginal na menopausa tem tratamento", growthPercent: 170, relativeVolume: 44, axis: "menopausa", axisLabel: "Menopausa", cluster: "Tratamento Hormonal", relatedTerms: ["terapia hormonal"] },

  // Emergentes
  { question: "o que é a gripe aviária e como se transmite", growthPercent: 480, relativeVolume: 77, axis: "emergentes", axisLabel: "Emergentes", cluster: "Gripe Aviária", relatedTerms: ["gripe aviária H5N1"] },
  { question: "posso apanhar dengue em Portugal", growthPercent: 390, relativeVolume: 62, axis: "emergentes", axisLabel: "Emergentes", cluster: "Doenças Tropicais", relatedTerms: ["dengue europa"] },
  { question: "como saber se tenho long covid", growthPercent: 125, relativeVolume: 58, axis: "emergentes", axisLabel: "Emergentes", cluster: "Pós-Covid", relatedTerms: ["long covid"] },
  { question: "o que são microplásticos no sangue", growthPercent: 345, relativeVolume: 49, axis: "emergentes", axisLabel: "Emergentes", cluster: "Ambiente e Saúde", relatedTerms: ["microplásticos sangue", "poluição e saúde"] },
  { question: "a gripe aviária pode passar para humanos", growthPercent: 420, relativeVolume: 71, axis: "emergentes", axisLabel: "Emergentes", cluster: "Gripe Aviária", relatedTerms: ["gripe aviária H5N1"] },
  { question: "há vacina para a dengue em Portugal", growthPercent: 350, relativeVolume: 55, axis: "emergentes", axisLabel: "Emergentes", cluster: "Doenças Tropicais", relatedTerms: ["dengue europa"] },
  { question: "quais são os sintomas de long covid", growthPercent: 160, relativeVolume: 65, axis: "emergentes", axisLabel: "Emergentes", cluster: "Pós-Covid", relatedTerms: ["long covid"] },
  { question: "a poluição do ar causa cancro", growthPercent: 285, relativeVolume: 52, axis: "emergentes", axisLabel: "Emergentes", cluster: "Ambiente e Saúde", relatedTerms: ["poluição e saúde"] },
  { question: "é seguro comer frango com gripe aviária", growthPercent: 510, relativeVolume: 68, axis: "emergentes", axisLabel: "Emergentes", cluster: "Gripe Aviária", relatedTerms: ["gripe aviária H5N1"] },
  { question: "o que são bactérias resistentes a antibióticos", growthPercent: 240, relativeVolume: 46, axis: "emergentes", axisLabel: "Emergentes", cluster: "Ambiente e Saúde", relatedTerms: ["poluição e saúde"] },
  { question: "pode haver nova pandemia em 2025", growthPercent: 380, relativeVolume: 60, axis: "emergentes", axisLabel: "Emergentes", cluster: "Gripe Aviária", relatedTerms: ["gripe aviária H5N1"] },
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
