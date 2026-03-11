import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAxisColors, getAxisFilterStyle } from "@/lib/axisColors";
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

  // Fetch latest change_percent per keyword from historical_snapshots
  const { data: changeMap } = useQuery({
    queryKey: ["mural-change-percent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("historical_snapshots")
        .select("keyword, change_percent, snapshot_date")
        .order("snapshot_date", { ascending: false });
      if (!data) return {};
      const map: Record<string, number> = {};
      for (const row of data) {
        if (!(row.keyword in map)) {
          map[row.keyword] = Number(row.change_percent);
        }
      }
      return map;
    },
  });

  const hasScores = ytScores !== null && ytScores !== undefined;

  const items = useMemo(() => {
    if (!keywords) return [];
    return keywords
      .map((kw) => ({
        id: kw.id,
        term: kw.term,
        axis: kw.axis,
        axisLabel: AXIS_LABELS[kw.axis] || kw.axis.toUpperCase(),
        score: hasScores ? (ytScores[kw.axis] ?? 0) : 0,
        changePercent: changeMap?.[kw.term] ?? null,
      }))
      .sort((a, b) => b.score - a.score);
  }, [keywords, ytScores, hasScores, changeMap]);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.axis === filter)),
    [items, filter]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader activePage={undefined} />

      <main className="px-6 py-8 max-w-[1400px] mx-auto">
        <h1
          className="text-2xl md:text-4xl font-bold tracking-[0.03em] leading-tight"
          style={{ color: "#0000FF" }}
        >
          Mural
        </h1>

        {/* Filters */}
        <nav className="mt-6 flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => {
            const isActive = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 transition-colors border-none"
                style={
                  isActive
                    ? { background: getAxisFilterStyle(f.id).bg, color: getAxisFilterStyle(f.id).text }
                    : { background: "transparent", color: "rgba(0,0,255,0.3)" }
                }
              >
                {f.label}
              </button>
            );
          })}
        </nav>

        <div className="section-divider mt-4 mb-8" />

        {/* Keyword grid */}
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {filtered.map((item) => {
            const axisColors = getAxisColors(item.axis);
            return (
              <div key={item.id} className="group relative">
                <span
                  className="text-lg md:text-2xl font-bold lowercase tracking-[0.02em] transition-all duration-300 cursor-default"
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
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-10 whitespace-nowrap invisible group-hover:visible flex items-center gap-1.5 px-2 py-1"
                  style={{
                    backgroundColor: axisColors.bg,
                    color: "#0000FF",
                    isolation: "auto",
                  }}
                >
                  <span className="text-[8px] font-bold uppercase tracking-wider">
                    {item.axisLabel}
                  </span>
                  {hasScores && item.score > 0 && (
                    <span className="text-[8px] font-medium" style={{ color: "#0000FF" }}>
                      {formatViews(item.score)} views
                    </span>
                  )}
                  {item.changePercent !== null && item.changePercent !== 0 && (
                    <span
                      className="text-[8px] font-bold"
                      style={{ color: item.changePercent > 0 ? "#00A67E" : "#E53E3E" }}
                    >
                      {item.changePercent > 0 ? "↑" : "↓"} {Math.abs(item.changePercent).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!filtered.length && keywords && (
          <p className="text-sm mt-8" style={{ color: "#BBBBC4" }}>
            Sem keywords activas para este eixo.
          </p>
        )}
      </main>

      <DashboardFooter hideExport />
    </div>
  );
};

export default Mural;
