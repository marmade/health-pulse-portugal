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
