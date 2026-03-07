import type { NewsItem } from "@/data/mockData";

type Props = {
  items: NewsItem[];
};

const MediaTable = ({ items }: Props) => {
  return (
    <div className="flex flex-col h-full min-h-0">
      <p className="editorial-label mb-3 flex-shrink-0">Cobertura Mediática</p>
      <div className="overflow-y-auto flex-1 min-h-0 scrollbar-yellow space-y-0">
        {items.map((item, i) => (
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
            {i < items.length - 1 && (
              <div className="border-t border-foreground/10" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaTable;
