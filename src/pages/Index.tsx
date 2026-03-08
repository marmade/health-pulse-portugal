import { useState, useMemo } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardFooter from "@/components/DashboardFooter";
import AxisColumn from "@/components/AxisColumn";
import DebunkingTable from "@/components/DebunkingTable";
import MediaTable from "@/components/MediaTable";
import SearchAlerts from "@/components/SearchAlerts";
import HealthQuestionsPanel from "@/components/HealthQuestionsPanel";
import Filters from "@/components/Filters";
import { debunkingData as mockDebunkingData, newsData as mockNewsData } from "@/data/mockData";
import { detectAlerts } from "@/lib/detectAlerts";
import { useAxisData, useDebunkingData, useNewsData } from "@/hooks/useAxisData";

const axisOrder = ["saude-mental", "alimentacao", "menopausa", "emergentes"];

const Index = () => {
  const [activeAxis, setActiveAxis] = useState("all");
  const [filters, setFilters] = useState({ period: "12m", region: "pt" });

  const { data: filteredData, isLoading, error, isFromDb } = useAxisData(filters.period, filters.region);
  const { data: dbDebunkingData } = useDebunkingData();
  const { data: dbNewsData, lastFetchTimestamp } = useNewsData();

  // Use DB data or fallback to mock
  const debunkingData = dbDebunkingData.length > 0 ? dbDebunkingData : mockDebunkingData;
  const newsData = dbNewsData.length > 0 ? dbNewsData : mockNewsData;

  const alerts = useMemo(
    () => filteredData ? detectAlerts(filteredData, filters.period, filters.region) : [],
    [filteredData, filters.period, filters.region]
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
      <DashboardHeader activeAxis={activeAxis} onAxisChange={setActiveAxis} />

      {/* Data source indicator */}
      {error && (
        <div className="px-6 py-2 bg-muted text-muted-foreground text-xs">
          A usar dados de demonstração (erro: {error})
        </div>
      )}

      {/* Filters */}
      <div className="px-6 py-3 overflow-x-auto">
        <Filters onFilterChange={setFilters} />
      </div>

      {/* Main grid */}
      <main className="flex-1 px-6 py-6">
        {activeAxis !== "all" ? (
          /* Single axis + contextual questions column */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {visibleAxes.map((axisId) => {
              const axis = filteredData[axisId];
              return (
                <AxisColumn
                  key={`${axisId}-${filters.period}-${filters.region}`}
                  axisId={axisId}
                  label={axis.label}
                  keywords={axis.keywords}
                  allKeywords={axis.allKeywords}
                  trendData={axis.trend}
                  period={filters.period}
                  region={filters.region}
                />
              );
            })}
            <HealthQuestionsPanel
              debunkingData={debunkingData}
              newsData={newsData}
              axis={activeAxis}
              axisLabel={filteredData[activeAxis]?.label}
            />
          </div>
        ) : (
          /* Overview: 4 axis columns */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {visibleAxes.map((axisId) => {
              const axis = filteredData[axisId];
              return (
                <AxisColumn
                  key={`${axisId}-${filters.period}-${filters.region}`}
                  axisId={axisId}
                  label={axis.label}
                  keywords={axis.keywords}
                  allKeywords={axis.allKeywords}
                  trendData={axis.trend}
                  period={filters.period}
                  region={filters.region}
                />
              );
            })}
          </div>
        )}

        {/* Alerts + Health Questions side by side */}
        <div className="mt-10">
          <div className="section-divider mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SearchAlerts
              alerts={alerts}
              period={filters.period}
              debunkingData={debunkingData}
              newsData={newsData}
            />
            <HealthQuestionsPanel debunkingData={debunkingData} newsData={newsData} />
          </div>
        </div>

        {/* Side tables */}
        <div className="mt-10">
          <div className="section-divider mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:h-[500px]">
            <DebunkingTable items={debunkingData} />
            <MediaTable items={newsData} lastFetchTimestamp={lastFetchTimestamp} />
          </div>
        </div>
      </main>

      <DashboardFooter
        filters={filters}
        axes={filteredData}
        debunkingData={debunkingData}
        newsData={newsData}
      />
    </div>
  );
};

export default Index;
