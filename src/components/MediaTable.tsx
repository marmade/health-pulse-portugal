import { useState, useMemo } from "react";
import type { NewsItem } from "@/data/mockData";

type Props = {
  items: NewsItem[];
};

const themes = [
  { id: "todos", label: "TODOS" },
  { id: "saude-mental", label: "SAÚDE MENTAL", terms: ["ansiedade", "burnout", "TDAH", "depressão", "stress"] },
  { id: "alimentacao", label: "ALIMENTAÇÃO", terms: ["ultraprocessados", "microplásticos", "jejum intermitente", "adoçantes"] },
  { id: "menopausa", label: "MENOPAUSA", terms: ["menopausa"] },
  { id: "emergentes", label: "EMERGENTES", terms: ["gripe aviária", "long covid", "resistência antibióticos", "H5N1"] },
];

const MediaTable = ({ items }: Props) => {
  const [activeTheme, setActiveTheme] = useState("todos");

  const filteredItems = useMemo(() => {
    if (activeTheme === "todos") return items;
    const theme = themes.find((t) => t.id === activeTheme);
    if (!theme || !theme.terms) return items;
    return items.filter((item) =>
      theme.terms.some((term) =>
        item.relatedTerm.toLowerCase().includes(term.toLowerCase())
      )
    );
  }, [items, activeTheme]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <p className="editorial-label mb-2 flex-shrink-0">Cobertura Mediática</p>
      
      {/* Theme filter */}
      <div className="flex flex-wrap gap-1 mb-3 flex-shrink-0">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTheme(t.id)}
            className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 border transition-colors ${
              activeTheme === t.id
                ? "border-foreground bg-foreground text-background"
                : "border-foreground/20 text-foreground/40 hover:text-foreground hover:border-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto flex-1 min-h-0 scrollbar-yellow space-y-0">
        {filteredItems.length === 0 ? (
          <p className="text-xs text-foreground/40 py-4">Nenhum item encontrado.</p>
        ) : (
          filteredItems.map((item, i) => (
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
                        })}
                      </span>
                    </div>
                    <p className="text-[9px] text-foreground/30 mt-0.5">
                      → {item.relatedTerm}
                    </p>
                  </div>
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

export default MediaTable;
