import type { ClusterWithMetrics } from "@/data/clusters";

type Props = {
  clusters: ClusterWithMetrics[];
  onClusterClick?: (clusterName: string) => void;
  expandedCluster?: string | null;
};

const ClusterRanking = ({ clusters, onClusterClick, expandedCluster }: Props) => {
  const top5 = [...clusters]
    .sort((a, b) => b.aggregatedVolume - a.aggregatedVolume)
    .slice(0, 5);

  return (
    <div>
      <p className="editorial-label mb-3">Top 5 — Clusters temáticos</p>
      <div className="space-y-0">
        {top5.map((cluster, i) => {
          const isExpanded = expandedCluster === cluster.cluster_name;
          return (
            <div key={cluster.cluster_name}>
              <div
                className={`flex items-start gap-3 py-2.5 cursor-pointer hover:bg-foreground/5 -mx-2 px-2 transition-colors ${
                  isExpanded ? "bg-foreground/5" : ""
                }`}
                onClick={() => onClusterClick?.(cluster.cluster_name)}
              >
                <span className="text-[10px] font-bold text-foreground/30 mt-0.5 w-3 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">
                      {cluster.cluster_name}
                    </span>
                    {cluster.isEmergent && (
                      <span className="tag-emergent">SINAL EMERGENTE</span>
                    )}
                    <span className="text-[8px] font-medium text-foreground/30 uppercase tracking-wider">
                      {cluster.resolvedKeywords.length} termos
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-foreground/50">
                      Vol. {cluster.aggregatedVolume}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${
                        cluster.changePercent > 0 ? "text-foreground" : "text-foreground/40"
                      }`}
                    >
                      {cluster.changePercent > 0 ? "↑" : cluster.changePercent < 0 ? "↓" : "→"}{" "}
                      {Math.abs(cluster.changePercent).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-foreground/30">
                      Pico: {cluster.lastPeak}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-foreground/30 mt-1 shrink-0">
                  {isExpanded ? "−" : "+"}
                </span>
              </div>
              {i < top5.length - 1 && !isExpanded && (
                <div className="border-t border-foreground/10" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClusterRanking;
