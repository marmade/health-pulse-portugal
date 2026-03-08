import jsPDF from "jspdf";
import type { Keyword, DebunkItem, NewsItem } from "@/data/mockData";

type AxisData = {
  label: string;
  keywords: Keyword[];
  allKeywords: Keyword[];
};

type ExportData = {
  filters: { period: string; region: string };
  axes: Record<string, AxisData>;
  debunkingData: DebunkItem[];
  newsData: NewsItem[];
};

const periodLabels: Record<string, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "12m": "Últimos 12 meses",
};

const regionLabels: Record<string, string> = {
  pt: "Portugal",
  norte: "Norte",
  centro: "Centro",
  lisboa: "Lisboa",
  sul: "Sul",
};

export async function generatePdfReport(data: ExportData): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  const blue = "#0000FF";

  // Helper functions
  const addNewPageIfNeeded = (neededSpace: number) => {
    if (yPos + neededSpace > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Header
  pdf.setFontSize(18);
  pdf.setTextColor(blue);
  pdf.setFont("helvetica", "bold");
  pdf.text("HEALTH PULSE PORTUGAL", margin, yPos);
  yPos += 7;
  
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("Relatório de Tendências", margin, yPos);
  yPos += 10;

  // Timestamp
  const now = new Date();
  const timestamp = now.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  pdf.setFontSize(8);
  pdf.setTextColor("#666666");
  pdf.text(`Gerado em: ${timestamp}`, margin, yPos);
  yPos += 6;

  // Filters
  const periodLabel = periodLabels[data.filters.period] || data.filters.period;
  const regionLabel = regionLabels[data.filters.region] || data.filters.region;
  pdf.text(`Período: ${periodLabel} | Região: ${regionLabel}`, margin, yPos);
  yPos += 12;

  // Divider
  pdf.setDrawColor(blue);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Axes with Top 5 keywords
  const axisOrder = ["saude-mental", "alimentacao", "menopausa", "emergentes"];
  
  for (const axisId of axisOrder) {
    const axis = data.axes[axisId];
    if (!axis) continue;

    addNewPageIfNeeded(50);

    // Axis header
    pdf.setFontSize(12);
    pdf.setTextColor(blue);
    pdf.setFont("helvetica", "bold");
    pdf.text(axis.label.toUpperCase(), margin, yPos);
    yPos += 6;

    // Top 5 keywords
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor("#000000");

    const top5 = axis.keywords.slice(0, 5);
    for (let i = 0; i < top5.length; i++) {
      const kw = top5[i];
      const rank = String(i + 1).padStart(2, "0");
      const changeSign = kw.changePercent > 0 ? "↑" : kw.changePercent < 0 ? "↓" : "→";
      const emergentTag = kw.isEmergent ? " [EMERGENTE]" : "";
      
      pdf.text(
        `${rank}. ${kw.term} — Vol. ${kw.currentVolume} | ${changeSign} ${Math.abs(kw.changePercent).toFixed(1)}%${emergentTag}`,
        margin + 2,
        yPos
      );
      yPos += 4;
    }
    yPos += 6;
  }

  // Emerging signals section
  addNewPageIfNeeded(40);
  pdf.setDrawColor(blue);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  pdf.setFontSize(12);
  pdf.setTextColor(blue);
  pdf.setFont("helvetica", "bold");
  pdf.text("SINAIS EMERGENTES", margin, yPos);
  yPos += 6;

  // Collect all emergent keywords
  const emergentKeywords: { term: string; axis: string; change: number }[] = [];
  for (const axisId of axisOrder) {
    const axis = data.axes[axisId];
    if (!axis) continue;
    axis.allKeywords
      .filter((kw) => kw.isEmergent)
      .forEach((kw) => {
        emergentKeywords.push({
          term: kw.term,
          axis: axis.label,
          change: kw.changePercent,
        });
      });
  }

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor("#000000");

  if (emergentKeywords.length === 0) {
    pdf.text("Nenhum sinal emergente detectado no período seleccionado.", margin + 2, yPos);
    yPos += 6;
  } else {
    for (const em of emergentKeywords) {
      addNewPageIfNeeded(6);
      pdf.text(`• ${em.term} (${em.axis}) — ↑ ${em.change.toFixed(1)}%`, margin + 2, yPos);
      yPos += 4;
    }
  }
  yPos += 6;

  // Debunking table
  addNewPageIfNeeded(40);
  pdf.setDrawColor(blue);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  pdf.setFontSize(12);
  pdf.setTextColor(blue);
  pdf.setFont("helvetica", "bold");
  pdf.text("DEBUNKING & DESINFORMAÇÃO", margin, yPos);
  yPos += 6;

  // Table headers
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor("#666666");
  pdf.text("TERMO", margin + 2, yPos);
  pdf.text("CLASSIFICAÇÃO", margin + 45, yPos);
  pdf.text("FONTE", margin + 90, yPos);
  yPos += 4;

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor("#000000");

  for (const item of data.debunkingData) {
    addNewPageIfNeeded(6);
    pdf.text(item.term.substring(0, 25), margin + 2, yPos);
    pdf.text(item.classification, margin + 45, yPos);
    pdf.text(item.source.substring(0, 30), margin + 90, yPos);
    yPos += 4;
  }
  yPos += 6;

  // News items table
  addNewPageIfNeeded(40);
  pdf.setDrawColor(blue);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  pdf.setFontSize(12);
  pdf.setTextColor(blue);
  pdf.setFont("helvetica", "bold");
  pdf.text("COBERTURA MEDIÁTICA", margin, yPos);
  yPos += 6;

  // Table headers
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor("#666666");
  pdf.text("TÍTULO", margin + 2, yPos);
  pdf.text("OUTLET", margin + 100, yPos);
  pdf.text("DATA", margin + 140, yPos);
  yPos += 4;

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor("#000000");

  for (const item of data.newsData) {
    addNewPageIfNeeded(6);
    const title = item.title.length > 55 ? item.title.substring(0, 52) + "..." : item.title;
    const date = new Date(item.date).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
    });
    pdf.text(title, margin + 2, yPos);
    pdf.text(item.outlet, margin + 100, yPos);
    pdf.text(date, margin + 140, yPos);
    yPos += 4;
  }

  // Footer on last page
  yPos = pageHeight - 10;
  pdf.setFontSize(7);
  pdf.setTextColor("#999999");
  pdf.text("Health Pulse Portugal © 2026 — Dados: Google Trends / Google Analytics", margin, yPos);

  // Save
  const dateStr = now.toISOString().split("T")[0];
  pdf.save(`health-pulse-report-${dateStr}.pdf`);
}
