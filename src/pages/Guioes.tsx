import { useState, useEffect } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardFooter from "@/components/DashboardFooter";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

type GuiaoRow = {
  id: string;
  tema: string;
  subtema: string;
  pergunta: string;
  resposta: string;
  referencia_cientifica: string;
  ordem: number;
  created_at: string;
};

const FILTROS = ["TODOS", "SAÚDE MENTAL", "ALIMENTAÇÃO", "MENOPAUSA", "EMERGENTES"] as const;

const temaMap: Record<string, string> = {
  "SAÚDE MENTAL": "saude_mental",
  "ALIMENTAÇÃO": "alimentacao",
  "MENOPAUSA": "menopausa",
  "EMERGENTES": "emergentes",
};

const temaLabelMap: Record<string, string> = {
  saude_mental: "SAÚDE MENTAL",
  alimentacao: "ALIMENTAÇÃO",
  menopausa: "MENOPAUSA",
  emergentes: "EMERGENTES",
};

function exportSelectedPdf(rows: GuiaoRow[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 20;
  const pageWidth = 210 - margin * 2;
  let y = margin;
  const today = format(new Date(), "d 'de' MMMM yyyy", { locale: pt });
  const tema = rows[0]?.tema || "";

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 255);
  doc.text("REPORTAGEM VIVA", margin, y);
  y += 5;
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text(`GUIÃO DIZ QUE DISSE — ${tema} — ${today}`, margin, y);
  y += 8;

  doc.setDrawColor(0, 0, 255);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + pageWidth, y);
  y += 8;

  // Table header
  const col1 = margin;
  const col2 = margin + pageWidth * 0.4;
  const col3 = margin + pageWidth * 0.7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 255);
  doc.text("PERGUNTA", col1, y);
  doc.text("RESPOSTA SIMPLES", col2, y);
  doc.text("REFERÊNCIA", col3, y);
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, margin + pageWidth, y);
  y += 5;

  // Rows
  rows.forEach((row) => {
    if (y > 260) { doc.addPage(); y = margin; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const qLines = doc.splitTextToSize(row.pergunta, pageWidth * 0.38);
    doc.text(qLines, col1, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    const rLines = doc.splitTextToSize(row.resposta, pageWidth * 0.28);
    doc.text(rLines, col2, y);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    const refLines = doc.splitTextToSize(row.referencia_cientifica, pageWidth * 0.28);
    doc.text(refLines, col3, y);

    const maxLines = Math.max(qLines.length, rLines.length, refLines.length);
    y += maxLines * 4 + 4;

    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y - 2, margin + pageWidth, y - 2);
  });

  // Footer
  y = 285;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text(`Reportagem Viva · ${today}`, margin, y);

  doc.save(`guiao-${tema.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

const Guioes = () => {
  const [rows, setRows] = useState<GuiaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("TODOS");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("guioes")
      .select("*")
      .order("tema")
      .order("ordem");
    if (!error && data) {
      setRows(data as GuiaoRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, []);

  const filtered = filter === "TODOS" ? rows : rows.filter((r) => r.tema === filter);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < 10) { next.add(id); }
      else { toast.error("Máximo 10 perguntas seleccionadas."); }
      return next;
    });
  };

  const handleExportPdf = () => {
    const selectedRows = rows.filter((r) => selected.has(r.id));
    if (selectedRows.length === 0) return;
    exportSelectedPdf(selectedRows);
    toast.success("PDF exportado.");
  };

  // Group by tema for display
  const temaGroups = filtered.reduce<Record<string, GuiaoRow[]>>((acc, row) => {
    if (!acc[row.tema]) acc[row.tema] = [];
    acc[row.tema].push(row);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader activePage="guioes" />

      <main className="px-6 py-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h1 className="text-sm font-bold uppercase tracking-[0.15em]" style={{ color: "#0000FF" }}>
              GUIÕES DIZ QUE DISSE
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mt-1">
              NOTAS DE FUNDAMENTO
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-bold uppercase tracking-wider border-[#0000FF] text-[#0000FF] hover:bg-[#0000FF]/5 rounded-none disabled:opacity-30"
            disabled={selected.size === 0}
            onClick={handleExportPdf}
          >
            <FileText className="h-3 w-3 mr-1" /> Gerar Relatório PDF
          </Button>
        </div>

        {selected.size > 0 && (
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">
            {selected.size} pergunta{selected.size > 1 ? "s" : ""} seleccionada{selected.size > 1 ? "s" : ""} (máx. 10)
          </p>
        )}

        {/* Filters */}
        <div className="flex gap-3 mt-6 mb-6 border-b border-border pb-3">
          {FILTROS.map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); }}
              className={`text-[10px] font-bold uppercase tracking-[0.15em] pb-1 border-b-2 transition-colors ${
                filter === f ? "border-[#0000FF] text-[#0000FF]" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground">A carregar...</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma pergunta encontrada.</p>
        ) : (
          Object.entries(temaGroups).map(([tema, temaRows]) => (
            <div key={tema} className="mb-8">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "#0000FF" }}>
                {tema}
              </h2>
              <div className="border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border">
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider">Pergunta</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider">Resposta Simples</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider">Referência Científica</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {temaRows.map((row) => (
                      <TableRow key={row.id} className="border-b border-border/50">
                        <TableCell className="w-10">
                          <Checkbox
                            checked={selected.has(row.id)}
                            onCheckedChange={() => toggleSelect(row.id)}
                            className="rounded-none"
                          />
                        </TableCell>
                        <TableCell className="text-xs font-medium">{row.pergunta}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.resposta}</TableCell>
                        <TableCell className="text-xs text-muted-foreground italic">{row.referencia_cientifica}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))
        )}
      </main>

      <DashboardFooter />
    </div>
  );
};

export default Guioes;
