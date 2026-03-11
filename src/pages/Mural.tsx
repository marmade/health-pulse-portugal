import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardFooter from "@/components/DashboardFooter";

const AXIS_LABELS: Record<string, string> = {
  "saude-mental": "SAÚDE MENTAL",
  alimentacao: "ALIMENTAÇÃO",
  menopausa: "MENOPAUSA",
  emergentes: "EMERGENTES",
};

const FILTERS = [
  { id: "all", label: "TODOS" },
  { id: "saude-mental", label: "SAÚDE MENTAL" },
  { id: "alimentacao", label: "ALIMENTAÇÃO" },
  { id: "menopausa", label: "MENOPAUSA" },
  { id: "emergentes", label: "EMERGENTES" },
];

function formatViews(n: number): string {
  return n.toLocaleString("pt-PT");
}

const Mural = () => {
  const [filter, setFilter] = useState("all");

  // Fetch active keywords
  const { data: keywords } = useQuery({
    queryKey: ["mural-keywords"],
    queryFn: async () => {
      const { data } = await supabase
        .from("keywords")
        .select("id, term, axis")
        .eq("is_active", true);
      return data ?? [];
    },
  });

  // Fetch youtube views aggregated by eixo
  const { data: ytScores } = useQuery({
    queryKey: ["mural-yt-scores"],
    queryFn: async () => {
      const { data } = await supabase
        .from("youtube_trends")
        .select("eixo, views");
      if (!data || data.length === 0) return null;
      const map: Record<string, number> = {};
      for (const row of data) {
        map[row.eixo] = (map[row.eixo] || 0) + row.views;
      }
      return map;
    },
  });

  const hasScores = ytScores !== null && ytScores !== undefined;

  // Build keyword list with scores
  const items = useMemo(() => {
    if (!keywords) return [];
    return keywords
      .map((kw) => ({
        id: kw.id,
        term: kw.term,
        axis: kw.axis,
        axisLabel: AXIS_LABELS[kw.axis] || kw.axis.toUpperCase(),
        score: hasScores ? (ytScores[kw.axis] ?? 0) : 0,
      }))
      .sort((a, b) => b.score - a.score);
  }, [keywords, ytScores, hasScores]);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.axis === filter)),
    [items, filter]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader activePage={undefined} />

      <main className="px-6 py-8 max-w-[1400px] mx-auto">
        {/* Title */}
        <h1
          className="text-2xl md:text-4xl font-bold tracking-[0.03em] leading-tight uppercase"
          style={{ color: "#0000FF" }}
        >
          Mural
        </h1>

        {/* Filters */}
        <nav className="mt-6 flex items-center gap-4 flex-wrap">
          {FILTERS.map((f, i) => (
            <span key={f.id} className="flex items-center gap-4">
              <button
                onClick={() => setFilter(f.id)}
                className="text-[10px] font-medium tracking-[1.5px] uppercase transition-colors"
                style={{
                  color: filter === f.id ? "#0000FF" : "#BBBBC4",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
              {i < FILTERS.length - 1 && (
                <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>
                  ·
                </span>
              )}
            </span>
          ))}
        </nav>

        <div className="section-divider mt-4 mb-8" />

        {/* Keyword grid */}
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {filtered.map((item) => (
            <div key={item.id} className="group relative">
              <span
                className="text-lg md:text-2xl font-bold lowercase tracking-[0.04em] transition-all duration-300 cursor-default"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  opacity: 0.15,
                  color: "var(--foreground)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.color = "#0000FF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0.15";
                  e.currentTarget.style.color = "var(--foreground)";
                }}
              >
                {item.term}
              </span>
              {/* Tooltip */}
              <div
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-8 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-medium tracking-[1px] uppercase px-2 py-1"
                style={{
                  color: "#0000FF",
                  background: "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(0,0,255,0.1)",
                }}
              >
                {item.axisLabel}
                {hasScores && item.score > 0 && ` · ${formatViews(item.score)} views`}
              </div>
            </div>
          ))}
        </div>

        {!filtered.length && keywords && (
          <p className="text-sm mt-8" style={{ color: "#BBBBC4" }}>
            Sem keywords activas para este eixo.
          </p>
        )}
      </main>

      <DashboardFooter />
    </div>
  );
};

export default Mural;
