import { useState, useMemo } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardFooter from "@/components/DashboardFooter";
import AxisColumn from "@/components/AxisColumn";
import ContextoInformativo from "@/components/ContextoInformativo";
import SearchAlerts from "@/components/SearchAlerts";
import Filters from "@/components/Filters";
import { debunkingData, newsData, getFilteredAxisData } from "@/data/mockData";
import { detectAlerts } from "@/lib/detectAlerts";

const axisOrder = ["saude-mental", "alimentacao", "menopausa", "emergentes"];

const Index = () => {
  const [activeAxis, setActiveAxis] = useState("all");
  const [filters, setFilters] = useState({ period: "12m", region: "pt" });
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  const filteredData = useMemo(
    () => getFilteredAxisData(filters.period, filters.region),
    [filters.period, filters.region]
  );

  const alerts = useMemo(
    () => detectAlerts(filteredData, filters.period, filters.region),
    [filteredData, filters.period, filters.region]
  );

  const visibleAxes =
    activeAxis === "all"
      ? axisOrder
      : axisOrder.filter((a) => a === activeAxis);

  const handleKeywordSelect = (term: string) => {
    setSelectedKeyword((prev) => (prev === term ? null : term));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <DashboardHeader activeAxis={activeAxis} onAxisChange={setActiveAxis} />

      {/* Filters */}
      <div className="px-6 py-3 overflow-x-auto">
        <Filters onFilterChange={setFilters} />
      </div>
      {/* Alerts */}
      {alerts.length > 0 && (
        <>
          <SearchAlerts
            alerts={alerts}
            period={filters.period}
            debunkingData={debunkingData}
            newsData={newsData}
          />
          <div className="section-divider" />
        </>
      )}

      {/* Main grid */}
      <main className="flex-1 px-6 py-6">
        <div
          className={`grid gap-8 ${
            visibleAxes.length === 1
              ? "grid-cols-1 max-w-2xl"
              : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
          }`}
        >
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
                onKeywordSelect={handleKeywordSelect}
                selectedContextKeyword={selectedKeyword}
              />
            );
          })}
        </div>

        {/* Contexto Informativo */}
        <div className="mt-10">
          <div className="section-divider mb-6" />
          <div className="max-w-3xl">
            <ContextoInformativo
              debunkingData={debunkingData}
              newsData={newsData}
              selectedKeyword={selectedKeyword}
            />
          </div>
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
};

export default Index;
