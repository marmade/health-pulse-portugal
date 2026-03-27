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
                        <div className="flex items-center gap-1 justify-end">
                          <div className="w-14 h-1.5 bg-foreground/10 overflow-hidden rounded-sm">
                            <div
                              className="h-full transition-all rounded-sm"
                              style={{ width: `${q.relativeVolume}%`, backgroundColor: 'hsl(var(--foreground) / 0.6)' }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-foreground/70">
                            {q.relativeVolume}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-foreground/30 group-hover:text-foreground transition-colors shrink-0 mt-0.5">
                        {isExpanded ? "−" : "+"}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (() => {
                    const relatedQuestions = questions
                      .filter((rq) => rq.cluster === q.cluster && rq.question !== q.question)
                      .sort((a, b) => b.relativeVolume - a.relativeVolume)
                      .slice(0, 3);

                    return relatedQuestions.length > 0 ? (
                      <div className="pb-4 pl-0">
                        <div className="border border-foreground/10 p-4">
                          <p className="editorial-label mb-2">Pesquisas relacionadas</p>
                          {relatedQuestions.map((rq) => (
                            <p
                              key={rq.question}
                              className="text-[10px] text-foreground/50 leading-relaxed mb-1"
                            >
                              {rq.question}?
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

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
