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

  // Active keywords (current state)
  const { data: activeKeywords } = useQuery({
    queryKey: ["mural-active-keywords"],
    queryFn: async () => {
      const { data } = await supabase
        .from("keywords")
        .select("id, term, axis, current_volume, change_percent, is_active")
        .eq("is_active", true);
      return data ?? [];
    },
  });

  // Historical snapshots — all keywords that ever appeared
  const { data: snapshots } = useQuery({
    queryKey: ["mural-snapshots"],
    queryFn: async () => {
      const { data } = await supabase
        .from("historical_snapshots")
        .select("keyword, axis, search_index, snapshot_date")
        .order("snapshot_date", { ascending: false });
      return data ?? [];
    },
  });

  // YouTube scores by axis
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

  // Build accumulated keyword list from snapshots + active keywords
  const items = useMemo(() => {
    const activeSet = new Set((activeKeywords || []).map((k) => k.term));
    const activeMap = new Map((activeKeywords || []).map((k) => [k.term, k]));

    // Aggregate snapshots per keyword: latest axis, average search_index, first/last seen
    const kwMap = new Map<string, {
      term: string;
      axis: string;
      avgIndex: number;
      latestIndex: number;
      firstSeen: string;
      lastSeen: string;
      snapshotCount: number;
      isActive: boolean;
      changePercent: number | null;
    }>();

    for (const s of (snapshots || [])) {
      const existing = kwMap.get(s.keyword);
      if (!existing) {
        kwMap.set(s.keyword, {
          term: s.keyword,
          axis: s.axis,
          avgIndex: s.search_index,
          latestIndex: s.search_index,
          firstSeen: s.snapshot_date,
          lastSeen: s.snapshot_date,
          snapshotCount: 1,
          isActive: activeSet.has(s.keyword),
          changePercent: activeMap.get(s.keyword)?.change_percent ?? null,
        });
      } else {
        existing.avgIndex = (existing.avgIndex * existing.snapshotCount + s.search_index) / (existing.snapshotCount + 1);
        existing.snapshotCount++;
        // snapshots ordered desc, so first encountered = latest
        if (s.snapshot_date < existing.firstSeen) existing.firstSeen = s.snapshot_date;
      }
    }

    // Add active keywords that might not have snapshots yet
    for (const kw of (activeKeywords || [])) {
      if (!kwMap.has(kw.term)) {
        kwMap.set(kw.term, {
          term: kw.term,
          axis: kw.axis,
          avgIndex: kw.current_volume,
          latestIndex: kw.current_volume,
          firstSeen: new Date().toISOString().split("T")[0],
          lastSeen: new Date().toISOString().split("T")[0],
          snapshotCount: 0,
          isActive: true,
          changePercent: kw.change_percent != null ? Number(kw.change_percent) : null,
        });
      }
    }

    return Array.from(kwMap.values())
      .map((kw) => ({
        ...kw,
        axisLabel: AXIS_LABELS[kw.axis] || kw.axis.toUpperCase(),
        ytScore: hasScores ? (ytScores[kw.axis] ?? 0) : 0,
      }))
      .sort((a, b) => {
        // Active first, then by latest search index
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return b.latestIndex - a.latestIndex;
      });
  }, [activeKeywords, snapshots, ytScores, hasScores]);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.axis === filter)),
    [items, filter]
  );

  const totalKeywords = items.length;
  const activeCount = items.filter((i) => i.isActive).length;
  const historicalCount = totalKeywords - activeCount;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader activePage="mural" />

      <main className="px-6 py-8 max-w-[1400px] mx-auto">
        <h1
          className="text-2xl md:text-4xl font-bold tracking-[0.03em] leading-tight"
          style={{ color: "#0000FF" }}
        >
          Mural
        </h1>
        <p className="text-xs opacity-50 mt-2">
          {totalKeywords} palavras monitorizadas · {activeCount} activas · {historicalCount} históricas
        </p>

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

        {/* Keyword cloud */}
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {filtered.map((item) => {
            const axisColors = getAxisColors(item.axis);
            // Active keywords: higher opacity. Historical: faded.
            const baseOpacity = item.isActive ? 0.18 : 0.08;
            const hoverOpacity = item.isActive ? 1 : 0.5;
            // Size: scale by average search index (min 14px, max 32px)
            const maxIdx = Math.max(...filtered.map((i) => i.latestIndex), 1);
            const fontSize = 14 + (item.latestIndex / maxIdx) * 18;

            return (
              <div key={item.term} className="group relative">
                <span
                  className="font-bold lowercase tracking-[0.02em] transition-all duration-300 cursor-default"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: `${fontSize}px`,
                    opacity: baseOpacity,
                    color: "var(--foreground)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = String(hoverOpacity);
                    e.currentTarget.style.color = "#0000FF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = String(baseOpacity);
                    e.currentTarget.style.color = "var(--foreground)";
                  }}
                >
                  {item.term}
                </span>
                {/* Tooltip */}
                <div
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-3 whitespace-nowrap invisible group-hover:visible flex items-center gap-1.5 px-2 py-1 z-10"
                  style={{
                    backgroundColor: axisColors.bg,
                    color: "#0000FF",
                  }}
                >
                  <span className="text-[8px] font-bold uppercase tracking-wider">
                    {item.axisLabel}
                  </span>
                  {!item.isActive && (
                    <span className="text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 border border-current opacity-60">
                      Histórica
                    </span>
                  )}
                  {hasScores && item.ytScore > 0 && (
                    <span className="text-[8px] font-medium" style={{ color: "#0000FF" }}>
                      {formatViews(item.ytScore)} views
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
                  <span className="text-[7px] opacity-50">
                    desde {new Date(item.firstSeen).toLocaleDateString("pt-PT", { month: "short", year: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {!filtered.length && activeKeywords && (
          <p className="text-sm mt-8" style={{ color: "#BBBBC4" }}>
            Sem keywords para este eixo.
          </p>
        )}
      </main>

      <DashboardFooter hideExport />
    </div>
  );
};

export default Mural;
