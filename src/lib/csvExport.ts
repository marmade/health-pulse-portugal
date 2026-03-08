import Papa from "papaparse";
import type { Keyword, DebunkItem, NewsItem } from "@/data/mockData";

type AxisData = {
  label: string;
  keywords: Keyword[];
  allKeywords: Keyword[];
};

type ExportData = {
  axes: Record<string, AxisData>;
  debunkingData: DebunkItem[];
  newsData: NewsItem[];
};

export function generateCsvExport(data: ExportData): void {
  const rows: string[][] = [];

  // Section 1: Keywords
  rows.push(["=== KEYWORDS ==="]);
  rows.push(["Term", "Axis", "Category", "Volume", "Previous Volume", "Variation %", "Trend", "Last Peak", "Is Emergent"]);
  
  const axisOrder = ["saude-mental", "alimentacao", "menopausa", "emergentes"];
  for (const axisId of axisOrder) {
    const axis = data.axes[axisId];
    if (!axis) continue;
    for (const kw of axis.allKeywords) {
      rows.push([
        kw.term,
        axis.label,
        kw.category,
        String(kw.currentVolume),
        String(kw.previousVolume),
        kw.changePercent.toFixed(1),
        kw.trend,
        kw.lastPeak,
        kw.isEmergent ? "Sim" : "Não",
      ]);
    }
  }

  // Blank rows as separator
  rows.push([]);
  rows.push([]);

  // Section 2: Debunking
  rows.push(["=== DEBUNKING ==="]);
  rows.push(["Term", "Title", "Classification", "Source", "URL"]);
  for (const item of data.debunkingData) {
    rows.push([
      item.term,
      item.title,
      item.classification,
      item.source,
      item.url,
    ]);
  }

  // Blank rows as separator
  rows.push([]);
  rows.push([]);

  // Section 3: News Items
  rows.push(["=== NEWS ITEMS ==="]);
  rows.push(["Title", "Outlet", "Date", "Related Term", "URL"]);
  for (const item of data.newsData) {
    const date = new Date(item.date).toLocaleDateString("pt-PT");
    rows.push([
      item.title,
      item.outlet,
      date,
      item.relatedTerm,
      item.url,
    ]);
  }

  // Generate CSV
  const csv = Papa.unparse(rows);
  
  // Download
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.href = url;
  link.download = `health-pulse-data-${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
