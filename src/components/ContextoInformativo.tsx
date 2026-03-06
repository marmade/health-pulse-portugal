import { useState, useMemo } from "react";
import type { DebunkItem, NewsItem } from "@/data/mockData";

type Props = {
  debunkingData: DebunkItem[];
  newsData: NewsItem[];
  selectedKeyword: string | null;
};

const classificationStyle: Record<string, string> = {
  FALSO: "border-foreground bg-foreground text-background",
  ENGANADOR: "border-foreground",
  "SEM EVIDÊNCIA": "border-foreground/50 text-foreground/60",
  IMPRECISO: "border-foreground/50 text-foreground/60",
};

const ContextoInformativo = ({ debunkingData, newsData, selectedKeyword }: Props) => {
  const [activeTab, setActiveTab] = useState<"factcheck" | "media">("factcheck");

  const filteredDebunks = useMemo(() => {
    if (!selectedKeyword) return debunkingData;
    return debunkingData.filter(
      (d) => d.term.toLowerCase() === selectedKeyword.toLowerCase()
    );
  }, [debunkingData, selectedKeyword]);

  const filteredNews = useMemo(() => {
    const items = selectedKeyword
      ? newsData.filter(
          (n) => n.relatedTerm.toLowerCase() === selectedKeyword.toLowerCase()
        )
      : newsData;
    // Sort by date descending (proximity to peak)
    return [...items].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [newsData, selectedKeyword]);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.15em]">
          Contexto Informativo
        </p>
        {selectedKeyword && (
          <span className="text-[9px] font-bold uppercase tracking-wider border border-foreground px-2 py-0.5">
            {selectedKeyword}
          </span>
        )}
      </div>

      {/* Tab toggle */}
      <div className="flex gap-0 border border-foreground/20 mb-4">
        <button
          onClick={() => setActiveTab("factcheck")}
          className={`flex-1 text-[10px] font-bold uppercase tracking-[0.15em] py-2 transition-colors ${
            activeTab === "factcheck"
              ? "bg-foreground text-primary-foreground"
              : "text-foreground/40 hover:text-foreground"
          }`}
        >
          Fact-Check ({filteredDebunks.length})
        </button>
        <button
          onClick={() => setActiveTab("media")}
          className={`flex-1 text-[10px] font-bold uppercase tracking-[0.15em] py-2 transition-colors ${
            activeTab === "media"
              ? "bg-foreground text-primary-foreground"
              : "text-foreground/40 hover:text-foreground"
          }`}
        >
          Cobertura ({filteredNews.length})
        </button>
      </div>

      {/* Fact-Check sub-table */}
      {activeTab === "factcheck" && (
        <div className="space-y-0">
          {filteredDebunks.length === 0 ? (
            <p className="text-[10px] text-foreground/30 py-4">
              {selectedKeyword
                ? `Sem fact-checks para "${selectedKeyword}".`
                : "Sem fact-checks disponíveis."}
            </p>
          ) : (
            filteredDebunks.map((item, i) => (
              <div key={i}>
                <div className="py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-0.5">
                        {item.term}
                      </p>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium hover:underline leading-tight block"
                      >
                        {item.title}
                      </a>
                      <p className="text-[9px] text-foreground/40 mt-1">
                        {item.source}
                      </p>
                    </div>
                    <span
                      className={`text-[8px] font-bold uppercase tracking-wider border px-1.5 py-0.5 shrink-0 mt-0.5 ${
                        classificationStyle[item.classification] || ""
                      }`}
                    >
                      {item.classification}
                    </span>
                  </div>
                </div>
                {i < filteredDebunks.length - 1 && (
                  <div className="border-t border-foreground/10" />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Media sub-table */}
      {activeTab === "media" && (
        <div className="space-y-0">
          {filteredNews.length === 0 ? (
            <p className="text-[10px] text-foreground/30 py-4">
              {selectedKeyword
                ? `Sem notícias para "${selectedKeyword}".`
                : "Sem notícias disponíveis."}
            </p>
          ) : (
            filteredNews.map((item, i) => (
              <div key={i}>
                <div className="py-2.5">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium hover:underline leading-tight block"
                      >
                        {item.title}
                      </a>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/60">
                          {item.outlet}
                        </span>
                        <span className="text-[9px] text-foreground/30">
                          {new Date(item.date).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-[9px] text-foreground/30 mt-0.5">
                        → {item.relatedTerm}
                      </p>
                    </div>
                  </div>
                </div>
                {i < filteredNews.length - 1 && (
                  <div className="border-t border-foreground/10" />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ContextoInformativo;
