import { useState, useMemo } from "react";
import type { DebunkItem } from "@/data/mockData";
import { getAxisFilterStyle } from "@/lib/axisColors";

type Props = {
  items: DebunkItem[];
};

const classificationStyle: Record<string, string> = {
  FALSO: "border-foreground bg-foreground text-background",
  ENGANADOR: "border-foreground",
  "SEM EVIDÊNCIA": "border-foreground/50 text-foreground/60",
  IMPRECISO: "border-foreground/50 text-foreground/60",
};

const classifications = ["TODOS", "FALSO", "ENGANADOR", "SEM EVIDÊNCIA", "IMPRECISO"];

const DebunkingTable = ({ items }: Props) => {
  const [activeFilter, setActiveFilter] = useState("TODOS");

  const filteredItems = useMemo(() => {
    if (activeFilter === "TODOS") return items;
    return items.filter((item) => item.classification === activeFilter);
  }, [items, activeFilter]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-foreground/50 mb-1.5 flex-shrink-0">Fact-Check & Desinformação</p>
      
      {/* Classification filter */}
      <div className="flex flex-wrap gap-0.5 mb-2 flex-shrink-0">
        {classifications.map((c) => (
          <button
            key={c}
            onClick={() => setActiveFilter(c)}
            className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 transition-colors border-none"
            style={
              activeFilter === c
                ? { background: getAxisFilterStyle(c).bg, color: getAxisFilterStyle(c).text }
                : { background: "transparent", color: "rgba(0,0,255,0.3)" }
            }
          >
            {c}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto flex-1 min-h-0 scrollbar-yellow space-y-0">
        {filteredItems.length === 0 ? (
          <p className="text-[10px] text-foreground/40 py-3">Nenhum item encontrado.</p>
        ) : (
          filteredItems.map((item, i) => (
            <div key={i}>
              <div className="py-1.5">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-semibold text-foreground/40 uppercase tracking-wider mb-0.5">
                      {item.term}
                    </p>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-medium hover:underline leading-tight block"
                    >
                      {item.title}
                    </a>
                    <p className="text-[8px] text-foreground/40 mt-0.5">{item.source}</p>
                  </div>
                  <span
                    className={`text-[7px] font-bold uppercase tracking-wider border px-1 py-0.5 shrink-0 mt-0.5 ${
                      classificationStyle[item.classification] || ""
                    }`}
                  >
                    {item.classification}
                  </span>
                </div>
              </div>
              {i < filteredItems.length - 1 && (
                <div className="border-t border-foreground/10" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebunkingTable;
