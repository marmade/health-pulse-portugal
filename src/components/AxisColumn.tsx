import { useMemo } from "react";
import type { Keyword, TrendPoint } from "@/data/mockData";
import TrendChart from "./TrendChart";
import Top5Table from "./Top5Table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type Props = {
  axisId: string;
  label: string;
  keywords: Keyword[];
  allKeywords: Keyword[];
  trendData: TrendPoint[];
  period: string;
  archive?: any[];
  hideChart?: boolean;
  hideKeywords?: boolean;
};

const AxisColumn = ({ axisId, label, keywords, allKeywords, trendData, period, archive = [], hideChart, hideKeywords }: Props) => {
  const totalChange = allKeywords.length > 0
    ? allKeywords.reduce((sum, k) => sum + k.changePercent, 0) / allKeywords.length
    : 0;
  const emergentCount = useMemo(
    () => allKeywords.filter((kw) => kw.isEmergent).length,
    [allKeywords]
  );

  const top5 = useMemo(
    () => [...keywords].sort((a, b) => b.currentVolume - a.currentVolume).slice(0, 5),
    [keywords]
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.15em]" style={{ color: "#0000FF" }}>
          {label}
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
                  Keywords com crescimento superior a 50% e volume mínimo de 10 pontos no índice Google Trends.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {!hideChart && (
        <>
          <div className="border-t border-foreground/10" />
          <TrendChart data={trendData} label={label} period={period} />
        </>
      )}

      {!hideKeywords && (
        <>
          <div className="border-t border-foreground/10" />
          <Top5Table keywords={top5} />
        </>
      )}

      {/* Arquivo semanal */}
      {archive.length > 0 && (
        <div className="mt-6 pt-4 border-t border-foreground/10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 opacity-60">
            Arquivo
          </p>
          <div className="space-y-0">
            {archive.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between py-2 border-b border-foreground/10 last:border-0">
                <span className="text-xs font-medium">{entry.week_label}</span>
                <button
                  onClick={() => (window as any)._downloadEixoPdf && (window as any)._downloadEixoPdf(entry)}
                  className="text-[9px] font-bold uppercase tracking-[0.15em] border px-2 py-1 transition-colors"
                  style={{ borderColor: "#0000FF", color: "#0000FF" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#0000FF"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#0000FF"; }}
                >
                  PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AxisColumn;
