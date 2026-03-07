import { useState, useMemo } from "react";
import type { Keyword, TrendPoint } from "@/data/mockData";
import { resolveClusterMetrics } from "@/data/clusters";
import TrendChart from "./TrendChart";
import ClusterRanking from "./ClusterRanking";
import ClusterDetail from "./ClusterDetail";
import KeywordCompare from "./KeywordCompare";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type Props = {
  axisId: string;
  label: string;
  keywords: Keyword[];
  allKeywords: Keyword[];
  trendData: TrendPoint[];
  period: string;
  region: string;
};

const regionLabels: Record<string, string> = {
  pt: "Portugal",
  norte: "Norte",
  centro: "Centro",
  lisboa: "Lisboa",
  sul: "Sul",
};

const AxisColumn = ({ axisId, label, keywords, allKeywords, trendData, region, period }: Props) => {
  const [mode, setMode] = useState<"clusters" | "compare">("clusters");
  const [compareTerms, setCompareTerms] = useState<string[]>([]);
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  const clusters = useMemo(
    () => resolveClusterMetrics(allKeywords, axisId),
    [allKeywords, axisId]
  );

  const totalChange =
    keywords.reduce((sum, k) => sum + k.changePercent, 0) / keywords.length;
  const emergentCount = clusters.filter((c) => c.isEmergent).length;
  const regionLabel = regionLabels[region] || region;

  const handleToggleTerm = (term: string) => {
    setCompareTerms((prev) =>
      prev.includes(term)
        ? prev.filter((t) => t !== term)
        : prev.length < 5
        ? [...prev, term]
        : prev
    );
  };

  const handleClusterClick = (clusterName: string) => {
    setExpandedCluster((prev) => (prev === clusterName ? null : clusterName));
  };

  const expandedClusterData = clusters.find((c) => c.cluster_name === expandedCluster);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-[0.15em]">
          {label}
          {region !== "pt" && (
            <span className="ml-2 text-[9px] font-medium normal-case opacity-50">
              ({regionLabel})
            </span>
          )}
        </h2>
        <div className="flex items-center gap-4 mt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <p className="editorial-label">Var. média</p>
                  <p className={`text-lg font-bold ${totalChange > 0 ? "" : "opacity-50"}`}>
                    {totalChange > 0 ? "+" : ""}
                    {totalChange.toFixed(1)}%
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px] text-xs leading-relaxed">
                Média da variação percentual de todas as keywords deste eixo face ao período anterior.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {emergentCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <p className="editorial-label">Sinais</p>
                    <p className="text-lg font-bold">{emergentCount}</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px] text-xs leading-relaxed">
                  Clusters com keywords de crescimento explosivo (&gt;200% semanal) ou termos inéditos no histórico.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-0 border border-foreground/20">
        <button
          onClick={() => setMode("clusters")}
          className={`flex-1 text-[10px] font-bold uppercase tracking-[0.15em] py-2 transition-colors ${
            mode === "clusters"
              ? "bg-foreground text-primary-foreground"
              : "text-foreground/40 hover:text-foreground"
          }`}
        >
          Clusters
        </button>
        <button
          onClick={() => setMode("compare")}
          className={`flex-1 text-[10px] font-bold uppercase tracking-[0.15em] py-2 transition-colors ${
            mode === "compare"
              ? "bg-foreground text-primary-foreground"
              : "text-foreground/40 hover:text-foreground"
          }`}
        >
          Comparar{compareTerms.length > 0 ? ` (${compareTerms.length})` : ""}
        </button>
      </div>

      <div className="border-t border-foreground/10" />

      {mode === "clusters" ? (
        <>
          <TrendChart data={trendData} label={label} />
          <div className="border-t border-foreground/10" />
          <ClusterRanking
            clusters={clusters}
            onClusterClick={handleClusterClick}
            expandedCluster={expandedCluster}
          />
          {expandedClusterData && (
            <ClusterDetail cluster={expandedClusterData} period={period} />
          )}
        </>
      ) : (
        <KeywordCompare
          allKeywords={allKeywords}
          selectedTerms={compareTerms}
          onToggleTerm={handleToggleTerm}
          period={period}
        />
      )}
    </div>
  );
};

export default AxisColumn;
