export type HealthQuestion = {
  question: string;
  growthPercent: number;
  relativeVolume: number; // 0–100
  axis: string;
  axisLabel: string;
  cluster: string;
  relatedTerms: string[];
};
