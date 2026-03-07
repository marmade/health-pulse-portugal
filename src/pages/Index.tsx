import { useState, useMemo } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardFooter from "@/components/DashboardFooter";
import AxisColumn from "@/components/AxisColumn";
import DebunkingTable from "@/components/DebunkingTable";
import MediaTable from "@/components/MediaTable";
import SearchAlerts from "@/components/SearchAlerts";
import HealthQuestionsPanel from "@/components/HealthQuestionsPanel";
import Filters from "@/components/Filters";
import { debunkingData, newsData, getFilteredAxisData } from "@/data/mockData";
import { detectAlerts } from "@/lib/detectAlerts";

const axisOrder = ["saude-mental", "alimentacao", "menopausa", "emergentes"];

const Index = () => {
  const [activeAxis, setActiveAxis] = useState("all");
  const [filters, setFilters] = useState({ period: "12m", region: "pt" });

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

      {/* Health Questions */}
      <HealthQuestionsPanel debunkingData={debunkingData} newsData={newsData} />
      <div className="section-divider" />


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
              />
            );
          })}
        </div>

        {/* Side tables */}
        <div className="mt-10">
          <div className="section-divider mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DebunkingTable items={debunkingData} />
            <MediaTable items={newsData} />
          </div>
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
};

export default Index;
