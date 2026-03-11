import { useState, useMemo } from "react";
import type { NewsItem } from "@/data/mockData";

type Props = {
  items: NewsItem[];
  lastFetchTimestamp?: string | null;
};

const themes = [
  { id: "todos", label: "TODOS" },
  { id: "saude-mental", label: "SAÚDE MENTAL", terms: ["ansiedade", "burnout", "TDAH", "depressão", "stress"] },
  { id: "alimentacao", label: "ALIMENTAÇÃO", terms: ["ultraprocessados", "microplásticos", "jejum intermitente", "adoçantes"] },
  { id: "menopausa", label: "MENOPAUSA", terms: ["menopausa"] },
  { id: "emergentes", label: "EMERGENTES", terms: ["gripe aviária", "long covid", "resistência antibióticos", "H5N1"] },
];

const sourceTypes = [
  { id: "todos", label: "TODOS" },
  { id: "media", label: "MEDIA" },
  { id: "institucional", label: "INSTITUCIONAL" },
  { id: "factcheck", label: "FACT-CHECK" },
];

const sourceTypeBadge = (type?: string) => {
  switch (type) {
    case "institucional":
      return (
        <span className="text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 bg-primary text-primary-foreground">
          INST
        </span>
      );
    case "factcheck":
      return (
        <span className="text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 border border-dashed border-primary text-primary">
          FC
        </span>
      );
    default:
      return (
        <span className="text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 border border-primary text-primary">
          MEDIA
        </span>
      );
  }
};

const MediaTable = ({ items, lastFetchTimestamp }: Props) => {
  const [activeTheme, setActiveTheme] = useState("todos");
  const [activeSourceType, setActiveSourceType] = useState("todos");

  const filteredItems = useMemo(() => {
    let result = items;

    if (activeTheme !== "todos") {
      const theme = themes.find((t) => t.id === activeTheme);
      if (theme?.terms) {
        result = result.filter((item) =>
          theme.terms!.some((term) =>
            item.relatedTerm.toLowerCase().includes(term.toLowerCase())
          )
        );
      }
    }

    if (activeSourceType !== "todos") {
      result = result.filter((item) => (item as any).sourceType === activeSourceType);
    }

    return result;
  }, [items, activeTheme, activeSourceType]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-1.5 mb-1.5 flex-shrink-0">
        <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-foreground/50">Cobertura Mediática</p>
        {lastFetchTimestamp && (
          <span className="text-[6px] font-bold uppercase tracking-wider px-1 py-0.5 bg-primary/10 text-primary border border-primary/20">
            Auto-actualizado {new Date(lastFetchTimestamp).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
      
      {/* Theme filter */}
      <div className="flex flex-wrap gap-0.5 mb-1 flex-shrink-0">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTheme(t.id)}
            className="text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 border transition-colors"
            style={
              activeTheme === t.id
                ? { background: getAxisFilterStyle(t.id).bg, borderColor: getAxisFilterStyle(t.id).border, color: getAxisFilterStyle(t.id).text }
                : { background: "transparent", borderColor: "rgba(0,0,255,0.2)", color: "rgba(0,0,255,0.4)" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Source type filter */}
      <div className="flex flex-wrap gap-0.5 mb-2 flex-shrink-0">
        {sourceTypes.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSourceType(t.id)}
            className={`text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 border transition-colors ${
              activeSourceType === t.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary/20 text-primary/40 hover:text-primary hover:border-primary"
            }`}
          >
            {t.label}
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
                <div className="flex items-start gap-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      {sourceTypeBadge((item as any).sourceType)}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-medium hover:underline leading-tight"
                      >
                        {item.title}
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-foreground/60">
                        {item.outlet}
                      </span>
                      <span className="text-[8px] text-foreground/30">
                        {new Date(item.date).toLocaleDateString("pt-PT", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-[8px] text-foreground/30 mt-0.5">
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
