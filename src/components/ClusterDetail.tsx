import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ClusterWithMetrics } from "@/data/clusters";
import { generateClusterTrend, generateKeywordTrend } from "@/data/clusters";
import { generateKeywordTrend as genKwTrend } from "@/data/mockData";

const COLORS = [
  "hsl(240, 100%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(150, 70%, 40%)",
  "hsl(30, 90%, 50%)",
  "hsl(280, 70%, 50%)",
];

type Props = {
  cluster: ClusterWithMetrics;
  period: string;
};

const ClusterDetail = ({ cluster, period }: Props) => {
  const clusterTrend = useMemo(
    () => generateClusterTrend(cluster, period),
    [cluster, period]
  );

  // Build per-keyword chart data
  const kwChartData = useMemo(() => {
    const trends = cluster.resolvedKeywords.map((kw) => ({
      term: kw.term,
      data: genKwTrend(kw, period),
    }));
    if (trends.length === 0) return [];
    return trends[0].data.map((point, i) => {
      const merged: Record<string, unknown> = { week: point.week };
      trends.forEach((t) => {
        merged[t.term] = t.data[i]?.current ?? 0;
      });
      return merged;
    });
  }, [cluster, period]);

  return (
    <div className="border border-foreground/10 p-4 space-y-4 mb-2">
      {/* Aggregated cluster trend */}
      <div>
        <p className="editorial-label mb-2">
          Volume agregado — {cluster.cluster_name}
        </p>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={clusterTrend}>
              <XAxis
                dataKey="week"
                tick={{ fontSize: 9, fill: "hsl(240, 100%, 50%)", fontFamily: "'Space Grotesk'" }}
                axisLine={{ stroke: "hsl(240, 100%, 50%)", strokeWidth: 0.5, opacity: 0.3 }}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid hsl(240, 100%, 50%)",
                  borderRadius: 0,
                  fontSize: 11,
                  fontFamily: "'Space Grotesk'",
                }}
              />
              <Line type="monotone" dataKey="current" stroke="hsl(240, 100%, 50%)" strokeWidth={1.5} dot={false} name="2026" />
              <Line type="monotone" dataKey="previous" stroke="hsl(240, 100%, 50%)" strokeWidth={1} strokeDasharray="4 4" dot={false} opacity={0.3} name="2025" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-keyword breakdown chart */}
      {cluster.resolvedKeywords.length > 1 && (
        <div>
          <p className="editorial-label mb-2">Evolução por keyword</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={kwChartData}>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 9, fill: "hsl(240, 100%, 50%)", fontFamily: "'Space Grotesk'" }}
                  axisLine={{ stroke: "hsl(240, 100%, 50%)", strokeWidth: 0.5, opacity: 0.3 }}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid hsl(240, 100%, 50%)",
                    borderRadius: 0,
                    fontSize: 11,
                    fontFamily: "'Space Grotesk'",
                  }}
                />
                {cluster.resolvedKeywords.map((kw, i) => (
                  <Line
                    key={kw.term}
                    type="monotone"
                    dataKey={kw.term}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={1.5}
                    dot={false}
                    name={kw.term}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {cluster.resolvedKeywords.map((kw, i) => (
              <div key={kw.term} className="flex items-center gap-1.5">
                <div className="w-3 h-px" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[9px] font-semibold">{kw.term}</span>
                <span className="text-[9px] text-foreground/30">Vol. {kw.currentVolume}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keyword list */}
      <div>
        <p className="editorial-label mb-2">Keywords do cluster</p>
        <div className="space-y-0">
          {cluster.resolvedKeywords
            .sort((a, b) => b.currentVolume - a.currentVolume)
            .map((kw, i) => (
              <div key={kw.term}>
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{kw.term}</span>
                    {kw.isEmergent && <span className="tag-emergent text-[7px]">EMERGENTE</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-foreground/50">Vol. {kw.currentVolume}</span>
                    <span className={`text-[10px] font-semibold ${kw.changePercent > 0 ? "text-foreground" : "text-foreground/40"}`}>
                      {kw.changePercent > 0 ? "↑" : kw.changePercent < 0 ? "↓" : "→"} {Math.abs(kw.changePercent).toFixed(1)}%
                    </span>
                  </div>
                </div>
                {i < cluster.resolvedKeywords.length - 1 && (
                  <div className="border-t border-foreground/5" />
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ClusterDetail;
