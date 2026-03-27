import type { Keyword, TrendPoint } from "./mockData";
import { buildKeywordTrend } from "@/lib/buildTrend";

export type Cluster = {
  cluster_name: string;
  axis: string;
  keywords_associadas: string[]; // terms that belong to this cluster
  categoria: string;
  fonte: string;
};

export type ClusterWithMetrics = Cluster & {
  aggregatedVolume: number;
  previousAggregatedVolume: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
  lastPeak: string;
  isEmergent: boolean;
  resolvedKeywords: Keyword[];
};

/** Cluster definitions — each groups semantically related keywords */
export const clusterDefinitions: Cluster[] = [
  // SAÚDE MENTAL
  { cluster_name: "Ansiedade", axis: "saude-mental", keywords_associadas: ["ansiedade", "pânico"], categoria: "Perturbações", fonte: "saudementalpt.com" },
  { cluster_name: "Depressão e Humor", axis: "saude-mental", keywords_associadas: ["depressão", "solidão"], categoria: "Perturbações", fonte: "saudementalpt.com" },
  { cluster_name: "Esgotamento Profissional", axis: "saude-mental", keywords_associadas: ["burnout"], categoria: "Trabalho", fonte: "saudementalpt.com" },
  { cluster_name: "Sono", axis: "saude-mental", keywords_associadas: ["insónia"], categoria: "Sono", fonte: "saudementalpt.com" },
  { cluster_name: "Trauma e Autolesão", axis: "saude-mental", keywords_associadas: ["PTSD", "automutilação"], categoria: "Comportamento", fonte: "sns24.gov.pt" },
  { cluster_name: "Neurodivergência", axis: "saude-mental", keywords_associadas: ["TDAH adulto"], categoria: "Perturbações", fonte: "saudementalpt.com" },
  { cluster_name: "Acesso a Tratamento", axis: "saude-mental", keywords_associadas: ["terapia online"], categoria: "Tratamento", fonte: "sns24.gov.pt" },

  // ALIMENTAÇÃO
  { cluster_name: "Dietas Populares", axis: "alimentacao", keywords_associadas: ["dieta mediterrânica", "jejum intermitente", "dieta cetogénica"], categoria: "Dietas", fonte: "nutrimento.pt" },
  { cluster_name: "Alimentação Vegetal", axis: "alimentacao", keywords_associadas: ["alimentação plant-based"], categoria: "Dietas", fonte: "nutrimento.pt" },
  { cluster_name: "Alergias e Intolerâncias", axis: "alimentacao", keywords_associadas: ["intolerância ao glúten", "alergias alimentares"], categoria: "Alergias", fonte: "alimentacaosaudavel.dgs.pt" },
  { cluster_name: "Obesidade Infantil", axis: "alimentacao", keywords_associadas: ["obesidade infantil"], categoria: "Pediatria", fonte: "nutrimento.pt" },
  { cluster_name: "Suplementação", axis: "alimentacao", keywords_associadas: ["suplementos alimentares"], categoria: "Suplementos", fonte: "alimentacaosaudavel.dgs.pt" },
  { cluster_name: "Ultraprocessados e Açúcar", axis: "alimentacao", keywords_associadas: ["ultraprocessados", "açúcar e saúde"], categoria: "Nutrição", fonte: "nutrimento.pt" },

  // MENOPAUSA
  { cluster_name: "Sintomas da Menopausa", axis: "menopausa", keywords_associadas: ["menopausa sintomas", "suores noturnos", "secura vaginal"], categoria: "Sintomas", fonte: "sns24.gov.pt" },
  { cluster_name: "Tratamento Hormonal", axis: "menopausa", keywords_associadas: ["terapia hormonal", "fitoterapia menopausa"], categoria: "Tratamento", fonte: "msdmanuals.com" },
  { cluster_name: "Complicações", axis: "menopausa", keywords_associadas: ["osteoporose", "peso na menopausa"], categoria: "Complicações", fonte: "sns24.gov.pt" },
  { cluster_name: "Menopausa Precoce", axis: "menopausa", keywords_associadas: ["menopausa precoce"], categoria: "Diagnóstico", fonte: "sponcologia.pt" },
  { cluster_name: "Sexualidade e Menopausa", axis: "menopausa", keywords_associadas: ["libido menopausa", "menopausa masculina"], categoria: "Sintomas", fonte: "msdmanuals.com" },

  // EMERGENTES
  { cluster_name: "Mpox", axis: "emergentes", keywords_associadas: ["mpox portugal"], categoria: "Doenças infecciosas", fonte: "dgs.pt" },
  { cluster_name: "Gripe Aviária", axis: "emergentes", keywords_associadas: ["gripe aviária H5N1"], categoria: "Doenças infecciosas", fonte: "dgs.pt" },
  { cluster_name: "Resistência Antimicrobiana", axis: "emergentes", keywords_associadas: ["resistência antibióticos", "bactérias carnívoras"], categoria: "Saúde pública", fonte: "sns.gov.pt" },
  { cluster_name: "Pós-Covid", axis: "emergentes", keywords_associadas: ["long covid"], categoria: "Doenças infecciosas", fonte: "dgs.pt" },
  { cluster_name: "Ambiente e Saúde", axis: "emergentes", keywords_associadas: ["poluição e saúde", "microplásticos sangue"], categoria: "Ambiente", fonte: "dgs.pt" },
  { cluster_name: "Doenças Tropicais", axis: "emergentes", keywords_associadas: ["dengue europa", "vírus nipah"], categoria: "Doenças infecciosas", fonte: "dgs.pt" },
  { cluster_name: "Surtos Vacinais", axis: "emergentes", keywords_associadas: ["sarampo surto"], categoria: "Doenças infecciosas", fonte: "dgs.pt" },
];

/** Resolve clusters with metrics from filtered keyword data */
export function resolveClusterMetrics(
  allKeywords: Keyword[],
  axis: string
): ClusterWithMetrics[] {
  const axisClusters = clusterDefinitions.filter((c) => c.axis === axis);
  const kwMap = new Map(allKeywords.map((kw) => [kw.term, kw]));

  return axisClusters.map((cluster) => {
    const resolved = cluster.keywords_associadas
      .map((t) => kwMap.get(t))
      .filter(Boolean) as Keyword[];

    const aggregatedVolume = resolved.reduce((s, kw) => s + kw.currentVolume, 0);
    const previousAggregatedVolume = resolved.reduce((s, kw) => s + kw.previousVolume, 0);
    const changePercent = previousAggregatedVolume > 0
      ? +((aggregatedVolume - previousAggregatedVolume) / previousAggregatedVolume * 100).toFixed(1)
      : 0;

    const trend: "up" | "down" | "stable" = changePercent > 10 ? "up" : changePercent < -10 ? "down" : "stable";
    const lastPeak = resolved.reduce((latest, kw) => kw.lastPeak > latest ? kw.lastPeak : latest, "");
    const isEmergent = resolved.some((kw) => kw.isEmergent);

    return {
      ...cluster,
      aggregatedVolume,
      previousAggregatedVolume,
      changePercent,
      trend,
      lastPeak,
      isEmergent,
      resolvedKeywords: resolved,
    };
  });
}

/** Generate aggregated trend data for a cluster from real historical snapshots */
export function generateClusterTrend(
  cluster: ClusterWithMetrics,
  period: string,
  historicalData: any[] = [],
): TrendPoint[] {
  if (cluster.resolvedKeywords.length === 0) return [];

  const allTrends = cluster.resolvedKeywords.map((kw) =>
    buildKeywordTrend(historicalData, kw.term, period)
  );

  if (allTrends[0].length === 0) return [];

  return allTrends[0].map((point, i) => ({
    week: point.week,
    current: allTrends.reduce((s, t) => s + (t[i]?.current ?? 0), 0),
    previous: allTrends.reduce((s, t) => s + (t[i]?.previous ?? 0), 0),
  }));
}
