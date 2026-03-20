import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardFooter from "@/components/DashboardFooter";
import AxisColumn from "@/components/AxisColumn";
import DebunkingTable from "@/components/DebunkingTable";
import MediaTable from "@/components/MediaTable";
import SearchAlerts from "@/components/SearchAlerts";
import HealthQuestionsPanel from "@/components/HealthQuestionsPanel";
import YouTubeTrendsPanel from "@/components/YouTubeTrendsPanel";
import Filters from "@/components/Filters";
import { debunkingData as mockDebunkingData, newsData as mockNewsData } from "@/data/mockData";
import { detectAlerts } from "@/lib/detectAlerts";
import { useAxisData, useDebunkingData, useNewsData } from "@/hooks/useAxisData";
import { useLastRefreshed } from "@/hooks/useLastRefreshed";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { generateEixoPdf } from "@/lib/eixoPdfExport";

// Helpers de semana (partilhados com Briefing)
function getWeekRangeIdx() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
  return {
    isoStart: monday.toISOString().split("T")[0],
    isoEnd: sunday.toISOString().split("T")[0],
    label: `${fmt(monday)} — ${fmt(sunday)} ${now.getFullYear()}`,
  };
}
function getPrevWeekRangeIdx() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) - 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
  return {
    isoStart: monday.toISOString().split("T")[0],
    isoEnd: sunday.toISOString().split("T")[0],
    label: `${fmt(monday)} — ${fmt(sunday)} ${monday.getFullYear()}`,
  };
}

const axisOrder = ["saude-mental", "alimentacao", "menopausa", "emergentes"];

const Index = () => {
  const [activeAxis, setActiveAxis] = useState("all");
  const [eixosArchives, setEixosArchives] = useState<Record<string, any[]>>({});
  const [filters, setFilters] = useState({ period: "12m" });

  const { data: filteredData, isLoading, error, isFromDb } = useAxisData(filters.period);
  const { data: dbDebunkingData } = useDebunkingData();
  const { data: dbNewsData, lastFetchTimestamp } = useNewsData();
  const lastRefreshed = useLastRefreshed();
  const { data: historicalData } = useHistoricalData(filters.period);

  // Use DB data or fallback to mock
  const debunkingData = dbDebunkingData.length > 0 ? dbDebunkingData : mockDebunkingData;
  const newsData = dbNewsData.length > 0 ? dbNewsData : mockNewsData;

  // Filtrar debunking e notícias pelo eixo activo
  const axisTerms = useMemo(() => {
    if (activeAxis === "all") return null;
    const kws = (filteredData[activeAxis]?.allKeywords || filteredData[activeAxis]?.keywords || []).map((k: any) => k.term.toLowerCase());
    return new Set(kws);
  }, [filteredData, activeAxis]);

  const filteredDebunkingData = useMemo(() => {
    if (!axisTerms) return debunkingData;
    return debunkingData.filter((d: any) => axisTerms.has((d.term || "").toLowerCase()));
  }, [debunkingData, axisTerms]);

  const filteredNewsData = useMemo(() => {
    if (!axisTerms) return newsData;
    return newsData.filter((n: any) => axisTerms.has((n.related_term || "").toLowerCase()));
  }, [newsData, axisTerms]);

  // Auto-arquivo por eixo — grava silenciosamente a semana anterior quando o eixo é aberto
  const autoArchiveEixo = async (axis: string) => {
    if (axis === "all") return;
    const prev = getPrevWeekRangeIdx();
    // Verificar se já existe
    const { data: existing } = await (supabase.from as any)("eixos_archive")
      .select("id")
      .eq("axis", axis)
      .eq("week_start", prev.isoStart)
      .maybeSingle();
    if (existing) return;

    const axisData = filteredData[axis];
    if (!axisData) return;

    const axisLabels: Record<string, string> = {
      "saude-mental": "Saúde Mental",
      alimentacao: "Alimentação",
      menopausa: "Menopausa",
      emergentes: "Emergentes",
    };

    const topKeywords = (axisData.keywords || [])
      .sort((a: any, b: any) => b.changePercent - a.changePercent)
      .slice(0, 5)
      .map((k: any) => ({ term: k.term, change_percent: k.changePercent, current_volume: k.currentVolume }));

    const topDebunking = filteredDebunkingData
      .slice(0, 3)
      .map((d: any) => ({ term: d.term, title: d.title, classification: d.classification }));

    const topNews = filteredNewsData
      .slice(0, 3)
      .map((n: any) => ({ title: n.title, outlet: n.outlet, date: n.date, source_type: n.source_type }));

    try {
      const { data: inserted } = await (supabase.from as any)("eixos_archive").insert({
        axis,
        axis_label: axisLabels[axis] || axis,
        week_start: prev.isoStart,
        week_end: prev.isoEnd,
        week_label: prev.label,
        top_keywords: topKeywords,
        top_questions: [],
        top_debunking: topDebunking,
        top_news: topNews,
        top_youtube: [],
      }).select("id").single();

      // Refresh archives for this axis
      const { data: archives } = await (supabase.from as any)("eixos_archive")
        .select("*")
        .eq("axis", axis)
        .order("week_start", { ascending: false });
      if (archives) setEixosArchives(prev => ({ ...prev, [axis]: archives }));
    } catch (e) {
      console.error("autoArchiveEixo error:", e);
    }
  };

  // Registar função de download PDF de eixo no window (chamada pelo AxisColumn)
  useEffect(() => {
    (window as any)._downloadEixoPdf = (entry: any) => generateEixoPdf(entry);
    return () => { delete (window as any)._downloadEixoPdf; };
  }, []);

  // Trigger auto-arquivo quando muda de eixo
  useEffect(() => {
    if (activeAxis !== "all" && Object.keys(filteredData).length > 0) {
      autoArchiveEixo(activeAxis);
      // Carregar arquivo existente para este eixo
      (supabase.from as any)("eixos_archive")
        .select("*")
        .eq("axis", activeAxis)
        .order("week_start", { ascending: false })
        .then(({ data }) => {
          if (data) setEixosArchives(prev => ({ ...prev, [activeAxis]: data }));
        });
    }
  }, [activeAxis, isLoading]);

  const alerts = useMemo(
    () => filteredData ? detectAlerts(filteredData, filters.period) : [],
    [filteredData, filters.period]
  );

  const axisAlerts = useMemo(
    () =>
      activeAxis === 'all'
        ? alerts
        : alerts.filter((a) => a.axisLabel === filteredData[activeAxis]?.label),
    [alerts, activeAxis, filteredData]
  );

  const visibleAxes =
    activeAxis === "all"
      ? axisOrder
      : axisOrder.filter((a) => a === activeAxis);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <DashboardHeader activeAxis={activeAxis} onAxisChange={setActiveAxis} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-foreground border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-xs uppercase tracking-wider opacity-60">A carregar dados...</p>
          </div>
        </div>
        <DashboardFooter />
      </div>
    );
  }

  // If no data at all
  if (!filteredData) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <DashboardHeader activeAxis={activeAxis} onAxisChange={setActiveAxis} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs uppercase tracking-wider opacity-60">Sem dados disponíveis</p>
        </div>
        <DashboardFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <DashboardHeader activeAxis={activeAxis} onAxisChange={setActiveAxis} lastRefreshed={lastRefreshed} />

      {/* Data source indicator */}
      {error && (
        <div className="px-6 py-2 bg-muted text-muted-foreground text-xs">
          A usar dados de demonstração (erro: {error})
        </div>
      )}

      {/* Filters */}
      <div className="px-6 py-2 overflow-x-auto">
        <Filters filters={filters} onFilterChange={setFilters} historicalCount={historicalData.length} />
      </div>

      {/* Main grid */}
      <main className="flex-1 px-6 py-6">
        {activeAxis !== "all" ? (
          <div className="flex flex-col gap-8">
            {/* Linha 1: gráfico esquerda, keywords direita */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {visibleAxes.map((axisId) => {
                const axis = filteredData[axisId];
                return (
                  <AxisColumn
                    key={`${axisId}-${filters.period}-chart`}
                    axisId={axisId}
                    label={axis.label}
                    keywords={axis.keywords}
                    allKeywords={axis.allKeywords}
                    trendData={axis.trend}
                    period={filters.period}
                    archive={eixosArchives[axisId] || []}
                    hideKeywords
                  />
                );
              })}
              {visibleAxes.map((axisId) => {
                const axis = filteredData[axisId];
                return (
                  <AxisColumn
                    key={`${axisId}-${filters.period}-keywords`}
                    axisId={axisId}
                    label={axis.label}
                    keywords={axis.keywords}
                    allKeywords={axis.allKeywords}
                    trendData={axis.trend}
                    period={filters.period}
                    hideChart
                  />
                );
              })}
            </div>

            {/* Linha 2: perguntas esquerda, alertas direita */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <HealthQuestionsPanel
                debunkingData={debunkingData}
                newsData={newsData}
                axis={activeAxis}
                axisLabel={filteredData[activeAxis]?.label}
              />
              <SearchAlerts
                alerts={axisAlerts}
                period={filters.period}
                debunkingData={filteredDebunkingData}
                newsData={filteredNewsData}
              />
            </div>
          </div>
        ) : (
          /* Overview: 4 axis columns */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {visibleAxes.map((axisId) => {
              const axis = filteredData[axisId];
              return (
                <AxisColumn
                  key={`${axisId}-${filters.period}`}
                  axisId={axisId}
                  label={axis.label}
                  keywords={axis.keywords}
                  allKeywords={axis.allKeywords}
                  trendData={axis.trend}
                  period={filters.period}
                />
              );
            })}
          </div>
        )}

        {/* Health Questions + YouTube Trends side by side */}
        {activeAxis === 'all' && (
          <div className="mt-10">
            <div className="section-divider mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HealthQuestionsPanel debunkingData={debunkingData} newsData={newsData} />
              <YouTubeTrendsPanel axis={activeAxis} />
            </div>
          </div>
        )}

        {/* Side tables */}
        <div className="mt-10">
          <div className="section-divider mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:h-[420px]">
            <DebunkingTable items={filteredDebunkingData} />
            <MediaTable items={filteredNewsData} lastFetchTimestamp={lastFetchTimestamp} activeTheme={activeAxis !== "all" ? activeAxis : undefined} />
          </div>
        </div>
      </main>

      <DashboardFooter
        filters={filters}
        axes={filteredData}
        debunkingData={debunkingData}
        newsData={newsData}
        historicalData={historicalData}
      />
    </div>
  );
};

export default Index;
