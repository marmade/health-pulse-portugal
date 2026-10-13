import jsPDF from "jspdf";

const BLUE = "#0000FF";
const BLACK = "#0a0a0a";
const GREY = "#888888";
const MARGIN = 20;
const LINE_H = 6;

const AXIS_LABELS: Record<string, string> = {
  "saude-mental": "Saúde Mental",
  alimentacao: "Alimentação",
  menopausa: "Menopausa",
  emergentes: "Emergentes",
};

export async function generateEixoPdf(entry: {
  axis: string;
  axis_label: string;
  week_label: string;
  top_keywords?: any[];
  nota_medicao?: string | null;
  top_questions?: any[];
  top_debunking?: any[];
  top_news?: any[];
  top_youtube?: any[];
  created_at?: string;
}) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let y = MARGIN;

  const checkPage = (needed = 10) => {
    if (y + needed > pageHeight - MARGIN) {
      pdf.addPage();
      y = MARGIN;
    }
  };

  const sectionHeader = (title: string) => {
    checkPage(12);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(BLUE);
    pdf.text(title.toUpperCase(), MARGIN, y);
    y += 4;
    pdf.setDrawColor(BLUE);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, y, pageWidth - MARGIN, y);
    y += 5;
    pdf.setTextColor(BLACK);
  };

  const row = (label: string, value: string, highlight = false) => {
    checkPage(8);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", highlight ? "bold" : "normal");
    pdf.setTextColor(BLACK);
    pdf.text(label, MARGIN, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(GREY);
    const lines = pdf.splitTextToSize(value, pageWidth - MARGIN * 2 - 40);
    pdf.text(lines, MARGIN + 40, y);
    y += lines.length * LINE_H;
  };

  const addFooter = () => {
    const total = (pdf as any).internal.pages.length - 1;
    for (let i = 1; i <= total; i++) {
      pdf.setPage(i);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(GREY);
      pdf.text("Reportagem Viva · Diz que Disse", MARGIN, pageHeight - 10);
      pdf.text(`${i} / ${total}`, pageWidth - MARGIN, pageHeight - 10, { align: "right" });
    }
  };

  // ── HEADER ──────────────────────────────────────────────────────
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(BLUE);
  pdf.text("REPORTAGEM VIVA", MARGIN, y);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(GREY);
  pdf.text("EIXO — " + (AXIS_LABELS[entry.axis] || entry.axis_label).toUpperCase(), MARGIN, y + 5);
  pdf.text(entry.week_label, pageWidth - MARGIN, y, { align: "right" });
  y += 14;
  pdf.setDrawColor(BLUE);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 8;

  // ── TOP KEYWORDS ─────────────────────────────────────────────────
  // Três formatos gravados, e cada arquivo fica com o seu:
  //   · até 21/09/2026: {term, change_percent, current_volume} — mostra-se a subida;
  //   · de 28/09/2026: {term, valor, posicao} — o valor da semana na régua do eixo. Até
  //     13/10/2026 o PDF lia aqui `change_percent`, que não existe, e saía sem número;
  //   · de 19/10/2026: o mesmo, top 10, com `valor_eixo` e empates na mesma posição.
  // O número à esquerda é a `posicao` gravada (partilhada nos empates); sem ela, a ordem.
  const novoFormato = (entry.top_keywords || []).some((k: any) => k.valor != null);
  if (entry.top_keywords && entry.top_keywords.length > 0) {
    sectionHeader(novoFormato ? "Top keywords — valor da semana, na régua do eixo" : "Top Keywords");
    entry.top_keywords.forEach((k: any, i: number) => {
      checkPage(7);
      const num = String(k.posicao ?? i + 1).padStart(2, "0");
      const change = k.valor != null
        ? Number(k.valor).toLocaleString("pt-PT", { maximumFractionDigits: 1 })
        : k.change_percent != null ? `${Number(k.change_percent) > 0 ? "+" : ""}${Number(k.change_percent).toFixed(0)}%` : "";
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(BLACK);
      pdf.text(`${num}  ${k.term}`, MARGIN, y);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(GREY);
      pdf.text(change, pageWidth - MARGIN, y, { align: "right" });
      y += LINE_H;
    });
    y += 4;
  }
  // A razão de uma semana vazia, ou dos termos activos que ficaram sem número.
  if (entry.nota_medicao) {
    if (!(entry.top_keywords && entry.top_keywords.length > 0)) sectionHeader("Top keywords");
    checkPage(8);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(GREY);
    const linhas = pdf.splitTextToSize(`Nota: ${entry.nota_medicao}.`, pageWidth - MARGIN * 2);
    pdf.text(linhas, MARGIN, y);
    y += linhas.length * 4 + 4;
    pdf.setTextColor(BLACK);
  }

  // ── PERGUNTAS ─────────────────────────────────────────────────────
  if (entry.top_questions && entry.top_questions.length > 0) {
    sectionHeader("Perguntas em Crescimento");
    entry.top_questions.forEach((q: any, i: number) => {
      checkPage(7);
      const num = String(i + 1).padStart(2, "0");
      // 9999 é o tecto do script 6, não "novo". Desde 28/09/2026 o arquivo marca-o
      // (e o breakout) com fora_de_escala e sem número; os arquivos antigos têm o 9999.
      const growth = q.fora_de_escala || q.growth_percent >= 9999 ? "FORA DE ESCALA" : q.growth_percent != null ? `+${Number(q.growth_percent).toFixed(0)}%` : "";
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(BLACK);
      const lines = pdf.splitTextToSize(`${num}  ${q.question || q.term}`, pageWidth - MARGIN * 2 - 20);
      pdf.text(lines, MARGIN, y);
      pdf.setTextColor(GREY);
      pdf.text(growth, pageWidth - MARGIN, y, { align: "right" });
      y += lines.length * LINE_H;
    });
    y += 4;
  }

  // ── DEBUNKING ─────────────────────────────────────────────────────
  if (entry.top_debunking && entry.top_debunking.length > 0) {
    sectionHeader("Debunking & Desinformação");
    entry.top_debunking.forEach((d: any) => {
      checkPage(10);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(BLUE);
      pdf.text(d.classification?.toUpperCase() || "", MARGIN, y);
      y += 4;
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(BLACK);
      const lines = pdf.splitTextToSize(d.title, pageWidth - MARGIN * 2);
      pdf.text(lines, MARGIN, y);
      y += lines.length * LINE_H + 2;
    });
    y += 2;
  }

  // ── NOTÍCIAS ─────────────────────────────────────────────────────
  if (entry.top_news && entry.top_news.length > 0) {
    sectionHeader("Cobertura Mediática");
    entry.top_news.forEach((n: any) => {
      checkPage(10);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(GREY);
      pdf.text((n.outlet || "").toUpperCase() + "  " + (n.date ? n.date.substring(0, 10) : ""), MARGIN, y);
      y += 4;
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(BLACK);
      const lines = pdf.splitTextToSize(n.title, pageWidth - MARGIN * 2);
      pdf.text(lines, MARGIN, y);
      y += lines.length * LINE_H + 2;
    });
  }

  addFooter();

  const axisSlug = entry.axis.replace(/[^a-z0-9]/gi, "-");
  const weekSlug = entry.week_label.replace(/[^0-9]/g, "-").replace(/-+/g, "-");
  pdf.save(`eixo-${axisSlug}-${weekSlug}.pdf`);
}
