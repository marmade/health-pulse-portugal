import { useState } from "react";
import type { Keyword, TrendPoint } from "@/data/mockData";
import TrendChart from "./TrendChart";
import Top5Table from "./Top5Table";
import KeywordCompare from "./KeywordCompare";

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

const AxisColumn = ({ label, keywords, allKeywords, trendData, region, period }: Props) => {
  const [mode, setMode] = useState<"ranking" | "compare">("ranking");
  const [compareTerms, setCompareTerms] = useState<string[]>([]);

  const totalChange =
    keywords.reduce((sum, k) => sum + k.changePercent, 0) / keywords.length;
  const emergentCount = keywords.filter((k) => k.isEmergent).length;
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

  const handleKeywordClick = (term: string) => {
    handleToggleTerm(term);
    if (mode === "ranking") setMode("compare");
  };

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

      {/* Mode toggle */}
      <div className="flex gap-0 border border-foreground/20">
        <button
          onClick={() => setMode("ranking")}
          className={`flex-1 text-[10px] font-bold uppercase tracking-[0.15em] py-2 transition-colors ${
            mode === "ranking"
              ? "bg-foreground text-primary-foreground"
              : "text-foreground/40 hover:text-foreground"
          }`}
        >
          Top 5
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

      {mode === "ranking" ? (
        <>
          <TrendChart data={trendData} label={label} />
          <div className="border-t border-foreground/10" />
          <Top5Table
            keywords={keywords}
            onKeywordClick={handleKeywordClick}
            selectedTerms={compareTerms}
          />
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
