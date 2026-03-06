import type { DebunkItem } from "@/data/mockData";

type Props = {
  items: DebunkItem[];
};

const classificationStyle: Record<string, string> = {
  FALSO: "border-foreground bg-foreground text-background",
  ENGANADOR: "border-foreground",
  "SEM EVIDÊNCIA": "border-foreground/50 text-foreground/60",
  IMPRECISO: "border-foreground/50 text-foreground/60",
};

const DebunkingTable = ({ items }: Props) => {
  return (
    <div>
      <p className="editorial-label mb-3">Debunking & Desinformação</p>
      <div className="space-y-0">
        {items.map((item, i) => (
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
                  <p className="text-[9px] text-foreground/40 mt-1">{item.source}</p>
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
            {i < items.length - 1 && (
              <div className="border-t border-foreground/10" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebunkingTable;
