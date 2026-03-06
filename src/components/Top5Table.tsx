import type { Keyword } from "@/data/mockData";

type Props = {
  keywords: Keyword[];
  onKeywordClick?: (term: string) => void;
  selectedTerms?: string[];
  selectedContextKeyword?: string | null;
};

const Top5Table = ({ keywords, onKeywordClick, selectedTerms = [], selectedContextKeyword }: Props) => {
  return (
    <div>
      <p className="editorial-label mb-3">Top 5 — Palavras mais pesquisadas</p>
      <div className="space-y-0">
        {keywords.map((kw, i) => {
          const isSelected = selectedTerms.includes(kw.term);
          const isContextActive = selectedContextKeyword === kw.term;
          return (
            <div key={kw.term}>
              <div
                className={`flex items-start gap-3 py-2.5 ${
                  onKeywordClick ? "cursor-pointer hover:bg-foreground/5 -mx-2 px-2 transition-colors" : ""
                } ${isSelected ? "bg-foreground/5 -mx-2 px-2" : ""} ${isContextActive ? "border-l-2 border-foreground -mx-2 px-2 bg-foreground/[0.03]" : ""}`}
                onClick={() => onKeywordClick?.(kw.term)}
              >
                <span className="text-[10px] font-bold text-foreground/30 mt-0.5 w-3 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">{kw.term}</span>
                    {kw.isEmergent && (
                      <span className="tag-emergent">SINAL EMERGENTE</span>
                    )}
                    {isSelected && (
                      <span className="text-[8px] font-bold uppercase tracking-wider text-foreground/40">
                        ✓ comparar
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-foreground/50">
                      Vol. {kw.currentVolume}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${
                        kw.changePercent > 0 ? "text-foreground" : "text-foreground/40"
                      }`}
                    >
                      {kw.changePercent > 0 ? "↑" : kw.changePercent < 0 ? "↓" : "→"}{" "}
                      {Math.abs(kw.changePercent).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-foreground/30">
                      Pico: {kw.lastPeak}
                    </span>
                  </div>
                </div>
              </div>
              {i < keywords.length - 1 && (
                <div className="border-t border-foreground/10" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Top5Table;
