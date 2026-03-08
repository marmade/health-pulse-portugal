import type { Keyword } from "@/data/mockData";

type Props = {
  keywords: Keyword[];
};

const Top5Table = ({ keywords }: Props) => {
  return (
    <div>
      <p className="editorial-label mb-3">Top 5 — Keywords</p>
      <div className="space-y-0">
        {keywords.map((kw, i) => {
          return (
            <div key={kw.term}>
              <div className="flex items-start gap-3 py-2.5">
                <span className="text-[10px] font-bold text-foreground/30 mt-0.5 w-3 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">{kw.term}</span>
                    {kw.isEmergent && (
                      <span className="tag-emergent">SINAL EMERGENTE</span>
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
