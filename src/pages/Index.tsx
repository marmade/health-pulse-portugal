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
import { detectAlerts } from "@/lib/detectAlerts";
import { useAxisData, useDebunkingData, useNewsData } from "@/hooks/useAxisData";
import { useLastRefreshed } from "@/hooks/useLastRefreshed";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { generateEixoPdf } from "@/lib/eixoPdfExport";

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

  // Use only real DB data — no mock fallback
  const debunkingData = dbDebunkingData;
  const newsData = dbNewsData;

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
    let result = newsData;

    // Filter by period
    const now = new Date();
    if (filters.period === "7d") {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
      result = result.filter((n: any) => new Date(n.date) >= cutoff);
    } else if (filters.period === "30d") {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 30);
      result = result.filter((n: any) => new Date(n.date) >= cutoff);
    }
    // 12m — show all

    // Filter by axis
    if (axisTerms) {
      result = result.filter((n: any) => axisTerms.has((n.relatedTerm || "").toLowerCase()));
    }

    return result;
  }, [newsData, axisTerms, filters.period]);

  // Registar função de download PDF de eixo no window (chamada pelo AxisColumn)
  useEffect(() => {
    (window as any)._downloadEixoPdf = (entry: any) => generateEixoPdf(entry);
    return () => { delete (window as any)._downloadEixoPdf; };
  }, []);

  // Load archives for the active axis (created by the weekly workflow)
  useEffect(() => {
    if (activeAxis !== "all") {
      (supabase.from as any)("eixos_archive")
        .select("*")
        .eq("axis", activeAxis)
        .order("week_start", { ascending: false })
        .then(({ data }: any) => {
          if (data) setEixosArchives((prev: any) => ({ ...prev, [activeAxis]: data }));
        });
    }
  }, [activeAxis]);

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

  // Urgency ranking: score each axis by combined signals
  const urgencyRanking = useMemo(() => {
    if (!filteredData) return [];
    return axisOrder
      .map((axisId) => {
        const axis = filteredData[axisId];
        if (!axis) return null;
        const allKw = axis.allKeywords;
        const avgChange = allKw.length > 0
          ? allKw.reduce((s, k) => s + k.changePercent, 0) / allKw.length
          : 0;
        const emergentCount = allKw.filter((k) => k.isEmergent).length;
        const alertCount = alerts.filter((a) => a.axisLabel === axis.label).length;
        // Score: weighted sum — alerts and emergent signals matter most
        const score = avgChange + (emergentCount * 30) + (alertCount * 20);
        return { axisId, label: axis.label, avgChange, emergentCount, alertCount, score };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score) as {
        axisId: string; label: string; avgChange: number;
        emergentCount: number; alertCount: number; score: number;
      }[];
  }, [filteredData, alerts]);

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
          Erro ao carregar dados: {error}
        </div>
      )}

      {/* Filters */}
      <div className="px-6 py-2 overflow-x-auto">
        <Filters filters={filters} onFilterChange={setFilters} />
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
                axis={activeAxis}
                axisLabel={filteredData[activeAxis]?.label}
              />
              <SearchAlerts
                alerts={axisAlerts}
                period={filters.period}
                debunkingData={filteredDebunkingData}
                newsData={filteredNewsData}
                historicalData={historicalData}
              />
            </div>

            {/* Linha 3: YouTube deste eixo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <YouTubeTrendsPanel axis={activeAxis} />
            </div>
          </div>
        ) : (
          /* Overview */
          <>
          {/* Urgency ranking */}
          {urgencyRanking.length > 0 && (
            <div className="mb-8">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-foreground/50 mb-3">
                Prioridade de comunicação esta semana
              </p>
              <div className="flex flex-wrap gap-3">
                {urgencyRanking.map((axis, i) => (
                  <button
                    key={axis.axisId}
                    onClick={() => setActiveAxis(axis.axisId)}
                    className="flex items-center gap-2 px-3 py-2 border transition-colors hover:bg-foreground/5"
                    style={{
                      borderColor: i === 0 ? "#0000FF" : "rgba(0,0,255,0.15)",
                      borderWidth: i === 0 ? 2 : 1,
                    }}
                  >
                    <span className="text-[9px] font-bold text-foreground/30">
                      {i + 1}.
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: i === 0 ? "#0000FF" : undefined }}>
                      {axis.label}
                    </span>
                    <span className={`text-[10px] font-semibold ${axis.avgChange > 0 ? "" : "opacity-40"}`}>
                      {axis.avgChange > 0 ? "+" : ""}{axis.avgChange.toFixed(0)}%
                    </span>
                    {axis.alertCount > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                        <span className="text-[8px] font-bold">{axis.alertCount}</span>
                      </span>
                    )}
                    {axis.emergentCount > 0 && (
                      <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 bg-foreground text-background">
                        {axis.emergentCount} sinal{axis.emergentCount > 1 ? "is" : ""}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

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
          </>
        )}

        {/* Alerts + Health Questions + YouTube Trends */}
        {activeAxis === 'all' && (
          <div className="mt-10">
            {alerts.length > 0 && (
              <>
                <div className="section-divider mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SearchAlerts
                    alerts={alerts}
                    period={filters.period}
                    debunkingData={debunkingData}
                    newsData={newsData}
                    historicalData={historicalData}
                  />
                  <YouTubeTrendsPanel axis={activeAxis} />
                </div>
              </>
            )}
            <div className="section-divider mb-6 mt-10" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <HealthQuestionsPanel />
              </div>
              {alerts.length === 0 && <YouTubeTrendsPanel axis={activeAxis} />}
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
