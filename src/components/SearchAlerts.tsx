import { useState } from "react";
import type { Keyword, TrendPoint, DebunkItem, NewsItem } from "@/data/mockData";
import { generateKeywordTrend } from "@/data/mockData";
import TrendChart from "./TrendChart";

export type SearchAlert = {
  keyword: Keyword;
  growthPercent: number;
  peakDate: string;
  axisLabel: string;
  region: string;
};

const regionLabels: Record<string, string> = {
  pt: "Portugal",
  norte: "Norte",
  centro: "Centro",
  lisboa: "Lisboa",
  sul: "Sul",
};

type Props = {
  alerts: SearchAlert[];
  period: string;
  debunkingData: DebunkItem[];
  newsData: NewsItem[];
};

const SearchAlerts = ({ alerts, period, debunkingData, newsData }: Props) => {
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  if (alerts.length === 0) return null;

  const top10 = alerts.slice(0, 10);

  const handleClick = (term: string) => {
    setExpandedTerm((prev) => (prev === term ? null : term));
  };

  return (
    <div className="py-5 flex flex-col h-full min-h-0">
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <span className="inline-block w-2 h-2 bg-destructive rounded-full animate-pulse" />
        <p className="text-xs font-bold uppercase tracking-[0.15em]">
          Alertas de Pesquisa
        </p>
        <span className="text-[9px] font-medium text-foreground/40 uppercase tracking-wider">
          {top10.length} pico{top10.length !== 1 ? "s" : ""} detetado{top10.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0 scrollbar-yellow space-y-0">
        {top10.map((alert, i) => {
          const isExpanded = expandedTerm === alert.keyword.term;
          const relatedNews = newsData.filter(
            (n) => n.relatedTerm === alert.keyword.term
          );
          const relatedDebunks = debunkingData.filter(
            (d) => d.term === alert.keyword.term
          );

          return (
            <div key={alert.keyword.term}>
              <button
                onClick={() => handleClick(alert.keyword.term)}
                className="w-full text-left py-2.5 group"
              >
                <div className="flex items-center gap-4">
                  {/* Keyword + axis */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">
                        {alert.keyword.term}
                      </span>
                      <span className="tag-emergent">PICO</span>
                    </div>
                    <p className="text-[9px] text-foreground/40 mt-0.5">
                      {alert.axisLabel} · {regionLabels[alert.region] || alert.region}
                    </p>
                  </div>

                  {/* Growth */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">
                      +{alert.growthPercent.toFixed(0)}%
                    </p>
                    <p className="text-[9px] text-foreground/40">
                      {alert.peakDate}
                    </p>
                  </div>

                  {/* Expand indicator */}
                  <span className="text-[10px] text-foreground/30 group-hover:text-foreground transition-colors shrink-0">
                    {isExpanded ? "−" : "+"}
                  </span>
                </div>
              </button>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div className="pb-4 pl-0">
                  <div className="border border-foreground/10 p-4 space-y-4">
                    {/* Trend chart */}
                    <div>
                      <p className="editorial-label mb-2">Evolução</p>
                      <TrendChart
                        data={generateKeywordTrend(alert.keyword, period)}
                        label={alert.keyword.term}
                      />
                    </div>

                    {/* Related news */}
                    {relatedNews.length > 0 && (
                      <div>
                        <p className="editorial-label mb-2">Notícias relacionadas</p>
                        {relatedNews.map((n, j) => (
                          <a
                            key={j}
                            href={n.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs font-medium hover:underline leading-tight mb-1"
                          >
                            {n.title}
                            <span className="text-[9px] text-foreground/40 ml-2">
                              {n.outlet}
                            </span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Related fact-checks */}
                    {relatedDebunks.length > 0 && (
                      <div>
                        <p className="editorial-label mb-2">Fact-checks</p>
                        {relatedDebunks.map((d, j) => (
                          <a
                            key={j}
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs font-medium hover:underline leading-tight mb-1"
                          >
                            {d.title}
                            <span className="text-[9px] text-foreground/40 ml-2">
                              {d.classification}
                            </span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* No related content */}
                    {relatedNews.length === 0 && relatedDebunks.length === 0 && (
                      <p className="text-[10px] text-foreground/30">
                        Sem notícias ou fact-checks associados.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {i < top10.length - 1 && (
                <div className="border-t border-foreground/10" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchAlerts;
