export type HealthQuestion = {
  question: string;
  growthPercent: number;
  relativeVolume: number; // 0–100
  axis: string;
  axisLabel: string;
  cluster: string;
  relatedTerms: string[];
  // as quase iguais juntas (29/10/2026): as outras formas da mesma dúvida, por baixo
  variantes?: { question: string; growthPercent: number | null }[];
};
