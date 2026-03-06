import type { Keyword } from "@/data/mockData";
import TrendChart from "./TrendChart";
import Top5Table from "./Top5Table";
import { useGoogleTrends } from "@/hooks/useGoogleTrends";

type Props = {
  axisId: string;
  label: string;
  keywords: Keyword[];
};

const AxisColumn = ({ axisId, label, keywords }: Props) => {
  const { trendData: trend, isLive, isLoading } = useGoogleTrends(axisId as any);
  const totalChange =
    keywords.reduce((sum, k) => sum + k.changePercent, 0) / keywords.length;
  const emergentCount = keywords.filter((k) => k.isEmergent).length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-[0.15em]">{label}</h2>
        <div className="flex items-center gap-4 mt-2">
          <div>
            <p className="editorial-label">Var. média</p>
            <p className={`text-lg font-bold ${totalChange > 0 ? "" : "opacity-50"}`}>
              {totalChange > 0 ? "+" : ""}
              {totalChange.toFixed(1)}%
            </p>
          </div>
          {emergentCount > 0 && (
            <div>
              <p className="editorial-label">Sinais</p>
              <p className="text-lg font-bold">{emergentCount}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-foreground/10" />

      <TrendChart data={trend} label={label} />

      <div className="border-t border-foreground/10" />

      <Top5Table keywords={keywords} />
    </div>
  );
};

export default AxisColumn;
