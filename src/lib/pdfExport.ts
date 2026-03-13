import jsPDF from "jspdf";
import type { Keyword, DebunkItem, NewsItem } from "@/data/mockData";
import type { HistoricalSnapshot } from "@/hooks/useHistoricalData";

type AxisData = {
  label: string;
  keywords: Keyword[];
  allKeywords: Keyword[];
};

export type ExportData = {
  filters: { period: string };
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


const axisOrder = ["saude-mental", "alimentacao", "menopausa", "emergentes"];

const axisLabels: Record<string, string> = {
  "saude-mental": "SAÚDE MENTAL",
  alimentacao: "ALIMENTAÇÃO",
  menopausa: "MENOPAUSA",
  emergentes: "EMERGENTES",
};

const monthLabels = ["Out 25", "Nov 25", "Dez 25", "Jan 26", "Fev 26", "Mar 26"];

const BLUE = "#0000FF";
const BLACK = "#000000";
const GREY = "#666666";
const LIGHT_GREY = "#999999";
const MARGIN = 20;

async function loadSpaceGrotesk(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      "https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.ttf"
    );
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

function registerFont(pdf: jsPDF, fontData: ArrayBuffer) {
  const binary = new Uint8Array(fontData);
  let str = "";
  for (let i = 0; i < binary.length; i++) {
    str += String.fromCharCode(binary[i]);
  }
  const base64 = btoa(str);
  pdf.addFileToVFS("SpaceGrotesk-Regular.ttf", base64);
  pdf.addFont("SpaceGrotesk-Regular.ttf", "SpaceGrotesk", "normal");
}

async function loadSpaceGroteskBold(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      "https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPb94DQ.ttf"
    );
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

function registerBoldFont(pdf: jsPDF, fontData: ArrayBuffer) {
  const binary = new Uint8Array(fontData);
  let str = "";
  for (let i = 0; i < binary.length; i++) {
    str += String.fromCharCode(binary[i]);
  }
  const base64 = btoa(str);
  pdf.addFileToVFS("SpaceGrotesk-Bold.ttf", base64);
  pdf.addFont("SpaceGrotesk-Bold.ttf", "SpaceGrotesk", "bold");
}

export async function generatePdfReport(data: ExportData): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPos = MARGIN;

  // Load and register Space Grotesk
  const [regularFont, boldFont] = await Promise.all([
    loadSpaceGrotesk(),
    loadSpaceGroteskBold(),
  ]);

  let fontFamily = "helvetica";
  if (regularFont) {
    registerFont(pdf, regularFont);
    fontFamily = "SpaceGrotesk";
  }
  if (boldFont) {
    registerBoldFont(pdf, boldFont);
  }

  const setFont = (style: "normal" | "bold", size: number) => {
    pdf.setFontSize(size);
    pdf.setFont(fontFamily, style);
  };

  const now = new Date();
  const timestamp = now.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = now.toISOString().split("T")[0];

  const addFooter = () => {
    pdf.setTextColor(LIGHT_GREY);
    setFont("normal", 6);
    const footerText = `Reportagem Viva · Gerado em ${timestamp}`;
    const footerWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 10);
  };

  const addNewPageIfNeeded = (neededSpace: number) => {
    if (yPos + neededSpace > pageHeight - MARGIN - 15) {
      addFooter();
      pdf.addPage();
      yPos = MARGIN;
      return true;
    }
    return false;
  };

  const drawSectionDivider = () => {
    pdf.setDrawColor(BLUE);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
    yPos += 8;
  };

  const drawSectionTitle = (title: string) => {
    drawSectionDivider();
    pdf.setTextColor(BLUE);
    setFont("bold", 9);
    pdf.text(title, MARGIN, yPos);
    yPos += 6;
  };

  const drawBadge = (text: string, x: number, y: number) => {
    setFont("bold", 6);
    pdf.setTextColor(BLUE);
    const textWidth = pdf.getTextWidth(text);
    const padX = 1.5;
    const padY = 1;
    const badgeW = textWidth + padX * 2;
    const badgeH = 3.5;
    pdf.setDrawColor(BLUE);
    pdf.setLineWidth(0.2);
    pdf.rect(x, y - badgeH + padY, badgeW, badgeH);
    pdf.text(text, x + padX, y - 0.3);
    return badgeW + 2;
  };

  // === HEADER ===
  pdf.setTextColor(BLUE);
  setFont("bold", 16);
  pdf.text("REPORTAGEM VIVA", MARGIN, yPos);

  // Date on right
  setFont("normal", 7);
  pdf.setTextColor(GREY);
  const dateRight = now.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  const dateW = pdf.getTextWidth(dateRight);
  pdf.text(dateRight, pageWidth - MARGIN - dateW, yPos);
  yPos += 5;

  setFont("normal", 8);
  pdf.setTextColor(GREY);
  pdf.text("Monitorização de Tendências sobre Saúde em Portugal", MARGIN, yPos);
  yPos += 8;

  // Blue separator after header
  pdf.setDrawColor(BLUE);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
  yPos += 8;

  // Filters line
  const periodLabel = periodLabels[data.filters.period] || data.filters.period;
  setFont("normal", 7);
  pdf.setTextColor(GREY);
  pdf.text(`Período: ${periodLabel}`, MARGIN, yPos);
  yPos += 10;

  // === TOP 5 PER AXIS ===
  for (const axisId of axisOrder) {
    const axis = data.axes[axisId];
    if (!axis) continue;
    addNewPageIfNeeded(45);

    drawSectionTitle(axis.label.toUpperCase());

    setFont("normal", 7.5);
    pdf.setTextColor(BLACK);

    const top5 = axis.keywords.slice(0, 5);
    for (let i = 0; i < top5.length; i++) {
      const kw = top5[i];
      const rank = String(i + 1).padStart(2, "0");
      const changeSign = kw.changePercent > 0 ? "+" : kw.changePercent < 0 ? "" : "";
      const line = `${rank}.  ${kw.term}  —  Vol. ${kw.currentVolume}  |  ${changeSign}${kw.changePercent.toFixed(1)}%`;

      pdf.setTextColor(BLACK);
      setFont("normal", 7.5);
      pdf.text(line, MARGIN + 2, yPos);

      if (kw.isEmergent) {
        const lineW = pdf.getTextWidth(line);
        drawBadge("EMERGENTE", MARGIN + 2 + lineW + 2, yPos);
      }
      yPos += 5;
    }
    yPos += 4;
  }

  // === EMERGING SIGNALS ===
  addNewPageIfNeeded(35);
  drawSectionTitle("SINAIS EMERGENTES");

  const emergentKeywords: { term: string; axis: string; change: number }[] = [];
  for (const axisId of axisOrder) {
    const axis = data.axes[axisId];
    if (!axis) continue;
    axis.allKeywords
      .filter((kw) => kw.isEmergent)
      .forEach((kw) => {
        emergentKeywords.push({ term: kw.term, axis: axis.label, change: kw.changePercent });
      });
  }

  setFont("normal", 7.5);
  pdf.setTextColor(BLACK);

  if (emergentKeywords.length === 0) {
    pdf.text("Nenhum sinal emergente detectado no período seleccionado.", MARGIN + 2, yPos);
    yPos += 6;
  } else {
    for (const em of emergentKeywords) {
      addNewPageIfNeeded(6);
      pdf.setTextColor(BLACK);
      setFont("normal", 7.5);
      pdf.text(`${em.term} (${em.axis})  —  +${em.change.toFixed(1)}%`, MARGIN + 2, yPos);
      yPos += 4.5;
    }
  }
  yPos += 6;

  // === DEBUNKING TABLE ===
  addNewPageIfNeeded(35);
  drawSectionTitle("DEBUNKING & DESINFORMAÇÃO");

  // Table header
  setFont("bold", 6.5);
  pdf.setTextColor(GREY);
  pdf.text("TERMO", MARGIN + 2, yPos);
  pdf.text("CLASSIFICAÇÃO", MARGIN + 50, yPos);
  pdf.text("FONTE", MARGIN + 95, yPos);
  yPos += 2;
  pdf.setDrawColor(GREY);
  pdf.setLineWidth(0.15);
  pdf.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
  yPos += 3;

  setFont("normal", 7);
  pdf.setTextColor(BLACK);
  for (const item of data.debunkingData) {
    addNewPageIfNeeded(6);

    pdf.setTextColor(BLACK);
    setFont("normal", 7);
    pdf.text(item.term.substring(0, 28), MARGIN + 2, yPos);

    // Classification badge
    drawBadge(item.classification.toUpperCase(), MARGIN + 50, yPos);

    pdf.setTextColor(GREY);
    setFont("normal", 6.5);
    pdf.text(item.source.substring(0, 30), MARGIN + 95, yPos);
    yPos += 5;
  }
  yPos += 6;

  // === NEWS TABLE ===
  addNewPageIfNeeded(35);
  drawSectionTitle("COBERTURA MEDIÁTICA");

  setFont("bold", 6.5);
  pdf.setTextColor(GREY);
  pdf.text("TÍTULO", MARGIN + 2, yPos);
  pdf.text("OUTLET", MARGIN + 110, yPos);
  pdf.text("DATA", MARGIN + 145, yPos);
  yPos += 2;
  pdf.setDrawColor(GREY);
  pdf.setLineWidth(0.15);
  pdf.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
  yPos += 3;

  setFont("normal", 7);
  pdf.setTextColor(BLACK);
  for (const item of data.newsData) {
    addNewPageIfNeeded(6);
    const title = item.title.length > 60 ? item.title.substring(0, 57) + "..." : item.title;
    const date = new Date(item.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });

    pdf.setTextColor(BLACK);
    setFont("normal", 7);
    pdf.text(title, MARGIN + 2, yPos);

    pdf.setTextColor(GREY);
    setFont("normal", 6.5);
    pdf.text(item.outlet, MARGIN + 110, yPos);
    pdf.text(date, MARGIN + 145, yPos);
    yPos += 4.5;
  }
  yPos += 6;

  // === HISTORICAL ANALYSIS (6 months) ===
  if (data.historicalData.length > 0) {
    addFooter();
    pdf.addPage();
    yPos = MARGIN;

    drawSectionTitle("ANÁLISE HISTÓRICA — ÚLTIMOS 6 MESES");

    const histMap: Record<string, Record<string, Record<string, number>>> = {};
    for (const snap of data.historicalData) {
      const dateKey = snap.snapshot_date.substring(0, 7);
      if (!histMap[snap.axis]) histMap[snap.axis] = {};
      if (!histMap[snap.axis][snap.keyword]) histMap[snap.axis][snap.keyword] = {};
      histMap[snap.axis][snap.keyword][dateKey] = snap.search_index;
    }

    const monthKeys = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];

    for (const axisId of axisOrder) {
      const axisHist = histMap[axisId];
      if (!axisHist) continue;

      addNewPageIfNeeded(55);

      pdf.setTextColor(BLUE);
      setFont("bold", 8);
      pdf.text(axisLabels[axisId] || axisId.toUpperCase(), MARGIN, yPos);
      yPos += 5;

      // Table header
      setFont("bold", 5.5);
      pdf.setTextColor(GREY);
      const colW = 16;
      const kwColW = 40;
      pdf.text("KEYWORD", MARGIN, yPos);
      for (let m = 0; m < monthLabels.length; m++) {
        pdf.text(monthLabels[m], MARGIN + kwColW + m * colW, yPos);
      }
      pdf.text("TEND.", MARGIN + kwColW + 6 * colW, yPos);
      yPos += 2;
      pdf.setDrawColor(GREY);
      pdf.setLineWidth(0.1);
      pdf.line(MARGIN, yPos, pageWidth - MARGIN, yPos);
      yPos += 3;

      setFont("normal", 6.5);
      pdf.setTextColor(BLACK);

      const keywords = Object.keys(axisHist);
      for (const kw of keywords) {
        addNewPageIfNeeded(5);
        const kwLabel = kw.length > 22 ? kw.substring(0, 20) + ".." : kw;
        pdf.setTextColor(BLACK);
        setFont("normal", 6.5);
        pdf.text(kwLabel, MARGIN, yPos);

        let firstVal: number | null = null;
        let lastVal: number | null = null;

        for (let m = 0; m < monthKeys.length; m++) {
          const val = axisHist[kw][monthKeys[m]];
          if (val !== undefined) {
            pdf.text(String(val), MARGIN + kwColW + m * colW, yPos);
            if (firstVal === null) firstVal = val;
            lastVal = val;
          } else {
            pdf.setTextColor(LIGHT_GREY);
            pdf.text("—", MARGIN + kwColW + m * colW, yPos);
            pdf.setTextColor(BLACK);
          }
        }

        if (firstVal !== null && lastVal !== null && firstVal > 0) {
          const pctChange = ((lastVal - firstVal) / firstVal) * 100;
          const arrow = pctChange > 10 ? "+" : pctChange < -10 ? "-" : "=";
          pdf.setTextColor(pctChange > 10 ? BLUE : BLACK);
          setFont("bold", 6.5);
          pdf.text(`${arrow}${Math.abs(pctChange).toFixed(0)}%`, MARGIN + kwColW + 6 * colW, yPos);
        }
        yPos += 3.8;
      }
      yPos += 6;
    }

    // === TOP GROWTH ===
    addNewPageIfNeeded(40);
    drawSectionTitle("TEMAS COM MAIOR CRESCIMENTO — 6 MESES");

    const growthList: { keyword: string; axis: string; growth: number; from: number; to: number }[] = [];
    for (const [axisId, kwMap] of Object.entries(histMap)) {
      for (const [kw, months] of Object.entries(kwMap)) {
        const monthKeys2 = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];
        const firstMonth = monthKeys2.find((mk) => months[mk] !== undefined);
        const lastMonth = [...monthKeys2].reverse().find((mk) => months[mk] !== undefined);
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

    setFont("normal", 7);
    pdf.setTextColor(BLACK);

    for (let i = 0; i < top10Growth.length; i++) {
      addNewPageIfNeeded(5);
      const g = top10Growth[i];
      setFont("bold", 7);
      pdf.setTextColor(BLACK);
      const rankText = `${String(i + 1).padStart(2, "0")}.  `;
      pdf.text(rankText, MARGIN + 2, yPos);

      setFont("normal", 7);
      pdf.text(`${g.keyword} (${g.axis})  —  ${g.from} → ${g.to}  |  +${g.growth.toFixed(1)}%`, MARGIN + 2 + pdf.getTextWidth(rankText), yPos);
      yPos += 5;
    }
    yPos += 6;

    // === EMERGENT SIGNALS BY MONTH ===
    addNewPageIfNeeded(40);
    drawSectionTitle("SINAIS EMERGENTES POR MÊS");

    const emergentByMonth: Record<string, HistoricalSnapshot[]> = {};
    for (const snap of data.historicalData) {
      if (!snap.is_emergent) continue;
      const mk = snap.snapshot_date.substring(0, 7);
      if (!emergentByMonth[mk]) emergentByMonth[mk] = [];
      emergentByMonth[mk].push(snap);
    }

    const monthKeys3 = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];

    for (let m = 0; m < monthKeys3.length; m++) {
      const mk = monthKeys3[m];
      const items = emergentByMonth[mk];
      addNewPageIfNeeded(10);

      pdf.setTextColor(BLUE);
      setFont("bold", 7);
      pdf.text(monthLabels[m], MARGIN + 2, yPos);
      yPos += 4;

      pdf.setTextColor(BLACK);
      setFont("normal", 7);

      if (!items || items.length === 0) {
        pdf.setTextColor(LIGHT_GREY);
        pdf.text("Nenhum sinal emergente", MARGIN + 6, yPos);
        yPos += 4;
      } else {
        for (const item of items) {
          addNewPageIfNeeded(4);
          pdf.setTextColor(BLACK);
          setFont("normal", 7);
          pdf.text(
            `${item.keyword} (${axisLabels[item.axis] || item.axis})  —  idx: ${item.search_index}`,
            MARGIN + 6,
            yPos
          );
          yPos += 4;
        }
      }
      yPos += 2;
    }
  }

  // Final footer on last page
  addFooter();

  pdf.save(`reportagem-viva-report-${dateStr}.pdf`);
}
