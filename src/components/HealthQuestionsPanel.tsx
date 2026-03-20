import { useState } from "react";
import type { DebunkItem, NewsItem } from "@/data/mockData";
import {
  type HealthQuestion,
  getRelatedNews,
  getRelatedDebunks,
} from "@/data/healthQuestions";
import { getAxisColors } from "@/lib/axisColors";
import { useHealthQuestions } from "@/hooks/useHealthQuestions";

type Props = {
  debunkingData: DebunkItem[];
  newsData: NewsItem[];
  axis?: string;
  axisLabel?: string;
};

const HealthQuestionsPanel = ({ debunkingData, newsData, axis, axisLabel }: Props) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const isOverview = !axis || axis === "all";
  const { questions, isLoading } = useHealthQuestions(axis);
  const top15 = isOverview ? questions : questions.slice(0, 15);
  const title = axis && axisLabel
    ? `Perguntas sobre ${axisLabel}`
    : "Perguntas de Saúde em Crescimento";

  const toggle = (q: string) => setExpanded((prev) => (prev === q ? null : q));

  return (
    <div className="py-5 flex flex-col h-full min-h-0 max-h-[500px]">
      <div className="flex items-center gap-3 mb-1 flex-shrink-0">
        <span className="inline-block w-1.5 h-1.5 bg-foreground rounded-full" />
        <p className="text-xs font-bold uppercase tracking-[0.15em]">
          {title}
        </p>
      </div>
      <p className="text-[9px] text-foreground/40 mb-4 ml-[18px] flex-shrink-0">
        Dúvidas reais da população detetadas nos motores de pesquisa
      </p>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="overflow-y-auto flex-1 min-h-0 scrollbar-yellow">
          <div className="space-y-0">
            {top15.map((q, i) => {
              const isExpanded = expanded === q.question;
              const relatedNews = getRelatedNews(q, newsData);
              const relatedDebunks = getRelatedDebunks(q, debunkingData);

              return (
                <div key={q.question}>
                  <button
                    onClick={() => toggle(q.question)}
                    className="w-full text-left py-2.5 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold leading-snug">
                          {q.question}?
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                            style={{ backgroundColor: getAxisColors(q.axis).bg, color: getAxisColors(q.axis).text }}
                          >
                            {q.axisLabel}
                          </span>
                          <span className="text-[9px] text-foreground/40">
                            {q.cluster}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {q.growthPercent != null && (
                          <p className="text-sm font-bold">
                            +{q.growthPercent}% ↑
                          </p>
                        )}
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <div className="w-12 h-1 bg-foreground/10 overflow-hidden">
                            <div
                              className="h-full bg-foreground/60 transition-all"
                              style={{ width: `${q.relativeVolume}%` }}
                            />
                          </div>
                          <span className="text-[8px] text-foreground/40">
                            {q.relativeVolume}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-foreground/30 group-hover:text-foreground transition-colors shrink-0 mt-0.5">
                        {isExpanded ? "−" : "+"}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="pb-4 pl-0">
                      <div className="border border-foreground/10 p-4 space-y-3">
                        <div>
                          <p className="editorial-label mb-1">Cluster associado</p>
                          <p className="text-xs font-bold">{q.cluster}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {q.relatedTerms.map((t) => (
                              <span
                                key={t}
                                className="text-[9px] px-1.5 py-0.5 border border-foreground/15 text-foreground/60"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {relatedNews.length > 0 && (
                          <div>
                            <p className="editorial-label mb-1">Notícias relacionadas</p>
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

                        {relatedDebunks.length > 0 && (
                          <div>
                            <p className="editorial-label mb-1">Fact-checks</p>
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

                        {relatedNews.length === 0 && relatedDebunks.length === 0 && (
                          <p className="text-[10px] text-foreground/30">
                            Sem notícias ou fact-checks associados.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {i < top15.length - 1 && (
                    <div className="border-t border-foreground/10" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthQuestionsPanel;
