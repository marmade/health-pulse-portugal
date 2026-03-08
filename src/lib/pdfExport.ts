import jsPDF from "jspdf";
import type { Keyword, DebunkItem, NewsItem } from "@/data/mockData";
import type { HistoricalSnapshot } from "@/hooks/useHistoricalData";

type AxisData = {
  label: string;
  keywords: Keyword[];
  allKeywords: Keyword[];
};

export type ExportData = {
  filters: { period: string; region: string };
  axes: Record<string, AxisData>;
  debunkingData: DebunkItem[];
  newsData: NewsItem[];
  historicalData: HistoricalSnapshot[];
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

const axisOrder = ["saude-mental", "alimentacao", "menopausa", "emergentes"];

const axisLabels: Record<string, string> = {
  "saude-mental": "SAÚDE MENTAL",
  alimentacao: "ALIMENTAÇÃO",
  menopausa: "MENOPAUSA",
  emergentes: "EMERGENTES",
};

const monthLabels = ["Out 25", "Nov 25", "Dez 25", "Jan 26", "Fev 26", "Mar 26"];
const monthDates = ["2025-10-01", "2025-11-01", "2025-12-01", "2026-01-01", "2026-02-01", "2026-03-01"];

export async function generatePdfReport(data: ExportData): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;
  const blue = "#0000FF";

  const addNewPageIfNeeded = (neededSpace: number) => {
    if (yPos + neededSpace > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // === HEADER ===
  pdf.setFontSize(18);
  pdf.setTextColor(blue);
  pdf.setFont("helvetica", "bold");
  pdf.text("HEALTH PULSE PORTUGAL", margin, yPos);
  yPos += 7;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("Relatório de Tendências", margin, yPos);
  yPos += 10;

  const now = new Date();
  const timestamp = now.toLocaleString("pt-PT", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  pdf.setFontSize(8);
  pdf.setTextColor("#666666");
  pdf.text(`Gerado em: ${timestamp}`, margin, yPos);
  yPos += 6;

  const periodLabel = periodLabels[data.filters.period] || data.filters.period;
  const regionLabel = regionLabels[data.filters.region] || data.filters.region;
  pdf.text(`Período: ${periodLabel} | Região: ${regionLabel}`, margin, yPos);
  yPos += 12;

  pdf.setDrawColor(blue);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // === TOP 5 PER AXIS ===
  for (const axisId of axisOrder) {
    const axis = data.axes[axisId];
    if (!axis) continue;
    addNewPageIfNeeded(50);

    pdf.setFontSize(12);
    pdf.setTextColor(blue);
    pdf.setFont("helvetica", "bold");
    pdf.text(axis.label.toUpperCase(), margin, yPos);
    yPos += 6;

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor("#000000");

    const top5 = axis.keywords.slice(0, 5);
    for (let i = 0; i < top5.length; i++) {
      const kw = top5[i];
      const rank = String(i + 1).padStart(2, "0");
      const changeSign = kw.changePercent > 0 ? "↑" : kw.changePercent < 0 ? "↓" : "→";
      const emergentTag = kw.isEmergent ? " [EMERGENTE]" : "";
      pdf.text(`${rank}. ${kw.term} — Vol. ${kw.currentVolume} | ${changeSign} ${Math.abs(kw.changePercent).toFixed(1)}%${emergentTag}`, margin + 2, yPos);
      yPos += 4;
    }
    yPos += 6;
  }

  // === EMERGING SIGNALS ===
  addNewPageIfNeeded(40);
  pdf.setDrawColor(blue);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;
  pdf.setFontSize(12);
  pdf.setTextColor(blue);
  pdf.setFont("helvetica", "bold");
  pdf.text("SINAIS EMERGENTES", margin, yPos);
  yPos += 6;

  const emergentKeywords: { term: string; axis: string; change: number }[] = [];
  for (const axisId of axisOrder) {
    const axis = data.axes[axisId];
    if (!axis) continue;
    axis.allKeywords.filter((kw) => kw.isEmergent).forEach((kw) => {
      emergentKeywords.push({ term: kw.term, axis: axis.label, change: kw.changePercent });
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

  // === DEBUNKING TABLE ===
  addNewPageIfNeeded(40);
  pdf.setDrawColor(blue);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;
  pdf.setFontSize(12);
  pdf.setTextColor(blue);
  pdf.setFont("helvetica", "bold");
  pdf.text("DEBUNKING & DESINFORMAÇÃO", margin, yPos);
  yPos += 6;

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

  // === NEWS TABLE ===
  addNewPageIfNeeded(40);
  pdf.setDrawColor(blue);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;
  pdf.setFontSize(12);
  pdf.setTextColor(blue);
  pdf.setFont("helvetica", "bold");
  pdf.text("COBERTURA MEDIÁTICA", margin, yPos);
  yPos += 6;

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
    const date = new Date(item.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
    pdf.text(title, margin + 2, yPos);
    pdf.text(item.outlet, margin + 100, yPos);
    pdf.text(date, margin + 140, yPos);
    yPos += 4;
  }
  yPos += 6;

  // === HISTORICAL ANALYSIS (6 months) ===
  if (data.historicalData.length > 0) {
    pdf.addPage();
    yPos = margin;

    pdf.setFontSize(14);
    pdf.setTextColor(blue);
    pdf.setFont("helvetica", "bold");
    pdf.text("ANÁLISE HISTÓRICA — Últimos 6 meses", margin, yPos);
    yPos += 10;

    // Build lookup: axis -> keyword -> month -> search_index
    const histMap: Record<string, Record<string, Record<string, number>>> = {};
    for (const snap of data.historicalData) {
      const dateKey = snap.snapshot_date.substring(0, 7); // YYYY-MM
      if (!histMap[snap.axis]) histMap[snap.axis] = {};
      if (!histMap[snap.axis][snap.keyword]) histMap[snap.axis][snap.keyword] = {};
      histMap[snap.axis][snap.keyword][dateKey] = snap.search_index;
    }

    const monthKeys = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];

    for (const axisId of axisOrder) {
      const axisHist = histMap[axisId];
      if (!axisHist) continue;

      addNewPageIfNeeded(60);
      pdf.setFontSize(10);
      pdf.setTextColor(blue);
      pdf.setFont("helvetica", "bold");
      pdf.text(axisLabels[axisId] || axisId.toUpperCase(), margin, yPos);
      yPos += 5;

      // Table header
      pdf.setFontSize(6);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor("#666666");
      const colW = 18;
      const kwColW = 38;
      pdf.text("Keyword", margin, yPos);
      for (let m = 0; m < monthLabels.length; m++) {
        pdf.text(monthLabels[m], margin + kwColW + m * colW, yPos);
      }
      pdf.text("Tend.", margin + kwColW + 6 * colW, yPos);
      yPos += 4;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor("#000000");

      const keywords = Object.keys(axisHist);
      for (const kw of keywords) {
        addNewPageIfNeeded(5);
        const kwLabel = kw.length > 20 ? kw.substring(0, 18) + ".." : kw;
        pdf.text(kwLabel, margin, yPos);

        let firstVal: number | null = null;
        let lastVal: number | null = null;

        for (let m = 0; m < monthKeys.length; m++) {
          const val = axisHist[kw][monthKeys[m]];
          if (val !== undefined) {
            pdf.text(String(val), margin + kwColW + m * colW, yPos);
            if (firstVal === null) firstVal = val;
            lastVal = val;
          } else {
            pdf.text("—", margin + kwColW + m * colW, yPos);
          }
        }

        // Trend arrow
        if (firstVal !== null && lastVal !== null && firstVal > 0) {
          const pctChange = ((lastVal - firstVal) / firstVal) * 100;
          const arrow = pctChange > 10 ? "↑" : pctChange < -10 ? "↓" : "→";
          pdf.text(`${arrow} ${Math.abs(pctChange).toFixed(0)}%`, margin + kwColW + 6 * colW, yPos);
        }
        yPos += 3.5;
      }
      yPos += 6;
    }

    // === TOP GROWTH over 6 months ===
    addNewPageIfNeeded(40);
    pdf.setDrawColor(blue);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    pdf.setFontSize(11);
    pdf.setTextColor(blue);
    pdf.setFont("helvetica", "bold");
    pdf.text("TEMAS COM MAIOR CRESCIMENTO NOS ÚLTIMOS 6 MESES", margin, yPos);
    yPos += 6;

    // Calculate growth for all keywords
    const growthList: { keyword: string; axis: string; growth: number; from: number; to: number }[] = [];
    for (const [axisId, kwMap] of Object.entries(histMap)) {
      for (const [kw, months] of Object.entries(kwMap)) {
        const firstMonth = monthKeys.find((mk) => months[mk] !== undefined);
        const lastMonth = [...monthKeys].reverse().find((mk) => months[mk] !== undefined);
        if (firstMonth && lastMonth && firstMonth !== lastMonth) {
          const from = months[firstMonth];
          const to = months[lastMonth];
          if (from > 0) {
            growthList.push({
              keyword: kw,
              axis: axisLabels[axisId] || axisId,
              growth: ((to - from) / from) * 100,
              from,
              to,
            });
          }
        }
      }
    }

    growthList.sort((a, b) => b.growth - a.growth);
    const top10Growth = growthList.slice(0, 10);

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor("#000000");

    for (let i = 0; i < top10Growth.length; i++) {
      addNewPageIfNeeded(5);
      const g = top10Growth[i];
      pdf.text(
        `${String(i + 1).padStart(2, "0")}. ${g.keyword} (${g.axis}) — ${g.from} → ${g.to} | ↑ ${g.growth.toFixed(1)}%`,
        margin + 2,
        yPos
      );
      yPos += 4;
    }
    yPos += 6;

    // === EMERGENT SIGNALS BY MONTH ===
    addNewPageIfNeeded(40);
    pdf.setDrawColor(blue);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    pdf.setFontSize(11);
    pdf.setTextColor(blue);
    pdf.setFont("helvetica", "bold");
    pdf.text("SINAIS EMERGENTES DETECTADOS POR MÊS", margin, yPos);
    yPos += 6;

    // Group emergent snapshots by month
    const emergentByMonth: Record<string, HistoricalSnapshot[]> = {};
    for (const snap of data.historicalData) {
      if (!snap.is_emergent) continue;
      const mk = snap.snapshot_date.substring(0, 7);
      if (!emergentByMonth[mk]) emergentByMonth[mk] = [];
      emergentByMonth[mk].push(snap);
    }

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor("#000000");

    for (let m = 0; m < monthKeys.length; m++) {
      const mk = monthKeys[m];
      const items = emergentByMonth[mk];
      addNewPageIfNeeded(8);

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(blue);
      pdf.text(monthLabels[m], margin + 2, yPos);
      yPos += 4;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor("#000000");

      if (!items || items.length === 0) {
        pdf.text("Nenhum sinal emergente", margin + 6, yPos);
        yPos += 4;
      } else {
        for (const item of items) {
          addNewPageIfNeeded(4);
          pdf.text(
            `• ${item.keyword} (${axisLabels[item.axis] || item.axis}) — idx: ${item.search_index}`,
            margin + 6,
            yPos
          );
          yPos += 3.5;
        }
      }
      yPos += 2;
    }
  }

  // === FOOTER ===
  yPos = pageHeight - 10;
  pdf.setFontSize(7);
  pdf.setTextColor("#999999");
  pdf.text("Health Pulse Portugal © 2026 — Dados: Google Trends / Google Analytics", margin, yPos);

  const dateStr = now.toISOString().split("T")[0];
  pdf.save(`health-pulse-report-${dateStr}.pdf`);
}
