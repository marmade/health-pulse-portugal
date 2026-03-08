import { useState } from "react";
import { Loader2 } from "lucide-react";
import { generatePdfReport } from "@/lib/pdfExport";
import { generateCsvExport } from "@/lib/csvExport";
import type { Keyword, DebunkItem, NewsItem } from "@/data/mockData";

type AxisData = {
  label: string;
  keywords: Keyword[];
  allKeywords: Keyword[];
};

type Props = {
  filters?: { period: string; region: string };
  axes?: Record<string, AxisData>;
  debunkingData?: DebunkItem[];
  newsData?: NewsItem[];
};

const DashboardFooter = ({ filters, axes, debunkingData, newsData }: Props) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const handleExportPdf = async () => {
    if (!filters || !axes || !debunkingData || !newsData) {
      console.warn("Export data not available");
      return;
    }

    setIsExportingPdf(true);
    try {
      await generatePdfReport({
        filters,
        axes,
        debunkingData,
        newsData,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCsv = async () => {
    if (!axes || !debunkingData || !newsData) {
      console.warn("Export data not available");
      return;
    }

    setIsExportingCsv(true);
    try {
      generateCsvExport({
        axes,
        debunkingData,
        newsData,
      });
    } catch (error) {
      console.error("Error generating CSV:", error);
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <footer className="w-full mt-auto">
      <div className="section-divider" />
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <p className="editorial-label">Data Sources</p>
          <p className="text-[10px] font-medium mt-0.5 text-foreground/60">
            Google Trends / Google Analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={isExportingCsv || !axes}
            className="text-[10px] font-bold uppercase tracking-[0.15em] border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExportingCsv && <Loader2 className="h-3 w-3 animate-spin" />}
            {isExportingCsv ? "A gerar..." : "Exportar CSV"}
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf || !axes}
            className="text-[10px] font-bold uppercase tracking-[0.15em] border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExportingPdf && <Loader2 className="h-3 w-3 animate-spin" />}
            {isExportingPdf ? "A gerar..." : "Exportar Report PDF"}
          </button>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;
