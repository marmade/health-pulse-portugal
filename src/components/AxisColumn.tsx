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
  region: string;
};

const regionLabels: Record<string, string> = {
  pt: "Portugal",
  norte: "Norte",
  centro: "Centro",
  lisboa: "Lisboa",
  sul: "Sul",
};

const AxisColumn = ({ axisId, label, keywords, allKeywords, trendData, region }: Props) => {
  const totalChange =
    keywords.reduce((sum, k) => sum + k.changePercent, 0) / keywords.length;
  const emergentCount = useMemo(
    () => allKeywords.filter((kw) => kw.isEmergent).length,
    [allKeywords]
  );
  const regionLabel = regionLabels[region] || region;

  const top5 = useMemo(
    () => [...keywords].sort((a, b) => b.currentVolume - a.currentVolume).slice(0, 5),
    [keywords]
  );

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
                  Keywords com crescimento explosivo (&gt;200% semanal) ou termos inéditos no histórico.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

      <div className="border-t border-foreground/10" />

      <TrendChart data={trendData} label={label} />

      <div className="border-t border-foreground/10" />

      <Top5Table keywords={top5} />
    </div>
  );
};

export default AxisColumn;
