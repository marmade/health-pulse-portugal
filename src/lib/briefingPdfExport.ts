import jsPDF from "jspdf";

const BLUE = "#0000FF";
const BLACK = "#000000";
const GREY = "#666666";
const MARGIN = 20;

type BriefingPdfData = {
  weekLabel: string;
  generatedAt: Date;
  topGrowing: { term: string; axis: string; change_percent: number; current_volume: number }[];
  emergent: { term: string; axis: string; change_percent: number }[];
  topVolume: { term: string; current_volume: number }[];
  news: { title: string; outlet: string; date: string; source_type: string }[];
  debunking: { term: string; title: string; classification: string; source: string }[];
  topEmergent?: { term: string; change_percent: number; is_emergent: boolean } | null;
  dizQueDisse?: { perguntas_voxpop: string[]; especialista_sugerido: string; justificacao: string; fonte_cientifica: string; fonte_url: string } | null;
};

const axisLabels: Record<string, string> = {
  "saude-mental": "Saúde Mental",
  alimentacao: "Alimentação",
  menopausa: "Menopausa",
  emergentes: "Emergentes",
};

async function loadFont(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

function registerFontFile(pdf: jsPDF, data: ArrayBuffer, filename: string, style: string) {
  const bin = new Uint8Array(data);
  let str = "";
  for (let i = 0; i < bin.length; i++) str += String.fromCharCode(bin[i]);
  pdf.addFileToVFS(filename, btoa(str));
  pdf.addFont(filename, "SpaceGrotesk", style);
}

export async function generateBriefingPdf(data: BriefingPdfData): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let y = MARGIN;

  const [regular, bold] = await Promise.all([
    loadFont("https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.ttf"),
    loadFont("https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPb94DQ.ttf"),
  ]);

  let fontFamily = "helvetica";
  if (regular) {
    registerFontFile(pdf, regular, "SpaceGrotesk-Regular.ttf", "normal");
    fontFamily = "SpaceGrotesk";
  }
  if (bold) {
    registerFontFile(pdf, bold, "SpaceGrotesk-Bold.ttf", "bold");
  }

  const setFont = (style: "normal" | "bold", size: number) => {
    pdf.setFontSize(size);
    pdf.setFont(fontFamily, style);
  };

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

  const addFooter = () => {
    pdf.setDrawColor(GREY);
    pdf.line(MARGIN, pageHeight - 12, pageWidth - MARGIN, pageHeight - 12);
    setFont("normal", 7);
    pdf.setTextColor(GREY);
    pdf.text(
      `Reportagem Viva · Gerado em ${fmtDate(data.generatedAt)}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  };

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      addFooter();
      pdf.addPage();
      y = MARGIN;
    }
  };

  const sectionTitle = (title: string) => {
    checkPage(15);
    setFont("bold", 8);
    pdf.setTextColor(BLUE);
    pdf.text(title.toUpperCase(), MARGIN, y);
    y += 3;
    pdf.setDrawColor(BLUE);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, y, pageWidth - MARGIN, y);
    y += 6;
  };

  // HEADER
  setFont("bold", 14);
  pdf.setTextColor(BLUE);
  pdf.text("REPORTAGEM VIVA", MARGIN, y);
  setFont("normal", 8);
  pdf.setTextColor(GREY);
  pdf.text(fmtDate(data.generatedAt), pageWidth - MARGIN, y, { align: "right" });
  y += 5;
  setFont("bold", 10);
  pdf.setTextColor(BLUE);
  pdf.text("BRIEFING SEMANAL", MARGIN, y);
  y += 4;
  setFont("normal", 8);
  pdf.setTextColor(GREY);
  pdf.text(data.weekLabel, MARGIN, y);
  y += 3;
  pdf.setDrawColor(BLUE);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 10;

  // SECTION 1 — O que está a subir
  sectionTitle("O que está a subir");
  data.topGrowing.forEach((kw, i) => {
    checkPage(8);
    setFont("bold", 9);
    pdf.setTextColor(BLACK);
    pdf.text(`${String(i + 1).padStart(2, "0")}  ${kw.term}`, MARGIN, y);
    setFont("normal", 8);
    pdf.setTextColor(GREY);
    pdf.text(axisLabels[kw.axis] || kw.axis, MARGIN + 80, y);
    setFont("bold", 9);
    pdf.setTextColor(BLACK);
    pdf.text(`+${Number(kw.change_percent).toFixed(0)}%`, pageWidth - MARGIN - 20, y, { align: "right" });
    setFont("normal", 8);
    pdf.setTextColor(GREY);
    pdf.text(`vol. ${kw.current_volume}`, pageWidth - MARGIN, y, { align: "right" });
    y += 6;
  });
  y += 4;

  // SECTION 2 — Sinal de alerta
  sectionTitle("Sinal de alerta");
  if (data.emergent.length === 0) {
    setFont("normal", 9);
    pdf.setTextColor(GREY);
    pdf.text("Nenhum sinal emergente esta semana.", MARGIN, y);
    y += 6;
  } else {
    data.emergent.forEach((kw) => {
      checkPage(8);
      // Badge
      setFont("bold", 7);
      pdf.setTextColor(BLUE);
      pdf.setDrawColor(BLUE);
      pdf.setLineWidth(0.3);
      pdf.rect(MARGIN, y - 3, 22, 5);
      pdf.text("EMERGENTE", MARGIN + 1.5, y);
      setFont("normal", 9);
      pdf.setTextColor(BLACK);
      pdf.text(kw.term, MARGIN + 26, y);
      setFont("bold", 9);
      pdf.text(`+${Number(kw.change_percent).toFixed(0)}%`, pageWidth - MARGIN, y, { align: "right" });
      y += 7;
    });
  }
  y += 4;

  // SECTION 3 — Perguntas mais pesquisadas
  sectionTitle("Perguntas mais pesquisadas");
  data.topVolume.forEach((kw, i) => {
    checkPage(7);
    setFont("normal", 8);
    pdf.setTextColor(GREY);
    pdf.text(String(i + 1).padStart(2, "0"), MARGIN, y);
    setFont("normal", 9);
    pdf.setTextColor(BLACK);
    pdf.text(kw.term, MARGIN + 10, y);
    setFont("bold", 9);
    pdf.text(String(kw.current_volume), pageWidth - MARGIN, y, { align: "right" });
    y += 6;
  });
  y += 4;

  // SECTION 4 — Cobertura mediática
  sectionTitle("O que os media dizem");
  if (data.news.length === 0) {
    setFont("normal", 9);
    pdf.setTextColor(GREY);
    pdf.text("Sem notícias esta semana.", MARGIN, y);
    y += 6;
  } else {
    data.news.forEach((item) => {
      checkPage(12);
      setFont("bold", 7);
      pdf.setTextColor(BLUE);
      pdf.setDrawColor(BLUE);
      pdf.setLineWidth(0.3);
      const badge = item.source_type === "institucional" ? "INST" : item.source_type === "fact-check" ? "FC" : "MEDIA";
      const bw = pdf.getTextWidth(badge) + 3;
      pdf.rect(MARGIN, y - 3, bw, 5);
      pdf.text(badge, MARGIN + 1.5, y);
      setFont("normal", 8);
      pdf.setTextColor(GREY);
      pdf.text(`${item.outlet}  ·  ${new Date(item.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}`, MARGIN + bw + 3, y);
      y += 5;
      setFont("normal", 9);
      pdf.setTextColor(BLACK);
      const lines = pdf.splitTextToSize(item.title, pageWidth - 2 * MARGIN);
      pdf.text(lines, MARGIN, y);
      y += lines.length * 4 + 4;
    });
  }
  y += 4;

  // SECTION 5 — Debunking
  sectionTitle("Mito da semana");
  if (data.debunking.length === 0) {
    setFont("normal", 9);
    pdf.setTextColor(GREY);
    pdf.text("Sem verificações esta semana.", MARGIN, y);
    y += 6;
  } else {
    const d = data.debunking[0];
    checkPage(15);
    setFont("bold", 7);
    pdf.setTextColor(BLUE);
    pdf.setDrawColor(BLUE);
    const cw = pdf.getTextWidth(d.classification.toUpperCase()) + 3;
    pdf.rect(MARGIN, y - 3, cw, 5);
    pdf.text(d.classification.toUpperCase(), MARGIN + 1.5, y);
    setFont("normal", 8);
    pdf.setTextColor(GREY);
    pdf.text(d.source, MARGIN + cw + 3, y);
    y += 5;
    setFont("normal", 9);
    pdf.setTextColor(BLACK);
    const lines = pdf.splitTextToSize(d.title, pageWidth - 2 * MARGIN);
    pdf.text(lines, MARGIN, y);
    y += lines.length * 4 + 3;
    setFont("normal", 8);
    pdf.setTextColor(GREY);
    pdf.text(`Tema: ${d.term}`, MARGIN, y);
    y += 6;
  }
  y += 4;

  // SECTION 6 — Sugestão
  if (data.topEmergent) {
    sectionTitle("Sugestão de conteúdo");
    checkPage(15);
    setFont("normal", 9);
    pdf.setTextColor(BLACK);
    const suggestion = data.topEmergent.is_emergent
      ? `Esta semana vale a pena falar sobre ${data.topEmergent.term} — sinal emergente com crescimento de +${Number(data.topEmergent.change_percent).toFixed(0)}%.`
      : `Esta semana vale a pena falar sobre ${data.topEmergent.term} — crescimento de +${Number(data.topEmergent.change_percent).toFixed(0)}% no volume de pesquisa.`;
    const lines = pdf.splitTextToSize(suggestion, pageWidth - 2 * MARGIN);
    pdf.text(lines, MARGIN, y);
    y += lines.length * 4 + 4;
  }

  // SECTION 7 — Perguntas VoxPop
  if (data.dizQueDisse?.perguntas_voxpop?.length) {
    sectionTitle("Perguntas VoxPop");
    data.dizQueDisse.perguntas_voxpop.forEach((q, i) => {
      checkPage(8);
      setFont("normal", 8);
      pdf.setTextColor(GREY);
      pdf.text(`${i + 1}.`, MARGIN, y);
      setFont("normal", 9);
      pdf.setTextColor(BLACK);
      const qLines = pdf.splitTextToSize(q, pageWidth - 2 * MARGIN - 10);
      pdf.text(qLines, MARGIN + 8, y);
      y += qLines.length * 4 + 3;
    });
    y += 4;
  }

  // SECTION 8 — Revisão de Pares
  if (data.dizQueDisse?.especialista_sugerido) {
    sectionTitle("Revisão de Pares");
    checkPage(20);
    setFont("bold", 9);
    pdf.setTextColor(BLACK);
    pdf.text(data.dizQueDisse.especialista_sugerido, MARGIN, y);
    y += 5;
    setFont("normal", 9);
    pdf.setTextColor(BLACK);
    const justLines = pdf.splitTextToSize(data.dizQueDisse.justificacao, pageWidth - 2 * MARGIN);
    pdf.text(justLines, MARGIN, y);
    y += justLines.length * 4 + 3;
    if (data.dizQueDisse.fonte_cientifica) {
      setFont("normal", 8);
      pdf.setTextColor(GREY);
      pdf.text(`Fonte: ${data.dizQueDisse.fonte_cientifica}`, MARGIN, y);
      y += 6;
    }
    y += 4;
  }

  addFooter();
  pdf.save(`briefing-semanal-${data.weekLabel.replace(/\s/g, "-")}.pdf`);
}
