import { useState, useEffect } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardFooter from "@/components/DashboardFooter";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { FileText, CalendarIcon, Sparkles, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import jsPDF from "jspdf";

// ── Types ──────────────────────────────────────────────
type Pergunta = {
  pergunta: string;
  resposta_simples: string;
  referencia_nome: string;
  referencia_url: string;
};

type GuiaoSemanal = {
  id: string;
  semana: string;
  tema: string;
  perguntas: Pergunta[];
  estado: string;
  gerado_por_ia: boolean;
  created_at: string;
};

type BancoRow = {
  id: string;
  tema: string;
  subtema: string;
  pergunta: string;
  resposta: string;
  referencia_cientifica: string;
  ordem: number;
};

type KeywordRow = {
  term: string;
  axis: string;
  current_volume: number;
  change_percent: number;
};

// ── Constants ──────────────────────────────────────────
const TEMAS = [
  { value: "saude-mental", label: "SAÚDE MENTAL", db: "saude_mental" },
  { value: "alimentacao", label: "ALIMENTAÇÃO", db: "alimentacao" },
  { value: "menopausa", label: "MENOPAUSA", db: "menopausa" },
  { value: "emergentes", label: "EMERGENTES", db: "emergentes" },
];

const BANCO_FILTROS = ["TODOS", "SAÚDE MENTAL", "ALIMENTAÇÃO", "MENOPAUSA", "EMERGENTES"] as const;
const bancoTemaMap: Record<string, string> = {
  "SAÚDE MENTAL": "saude_mental",
  "ALIMENTAÇÃO": "alimentacao",
  "MENOPAUSA": "menopausa",
  "EMERGENTES": "emergentes",
};
const bancoLabelMap: Record<string, string> = {
  saude_mental: "SAÚDE MENTAL",
  alimentacao: "ALIMENTAÇÃO",
  menopausa: "MENOPAUSA",
  emergentes: "EMERGENTES",
};
// Known source URL map for banco base references
const KNOWN_SOURCES: Record<string, string> = {
  "OMS": "https://www.who.int",
  "WHO": "https://www.who.int",
  "DGS": "https://www.dgs.pt",
  "SNS24": "https://www.sns24.gov.pt",
  "INSA": "https://repositorio.insa.pt/home",
  "INFARMED": "https://www.infarmed.pt",
  "ECDC": "https://www.ecdc.europa.eu",
  "ORDEM DOS PSICÓLOGOS": "https://www.ordemdospsicologos.pt",
  "ORDEM DOS MÉDICOS": "https://www.ordemdosmedicos.pt",
};

function ReferenceLinks({ text }: { text: string }) {
  if (!text) return <span className="opacity-30">—</span>;

  // Split by · or ; separators
  const parts = text.split(/[·;]/).map((s) => s.trim()).filter(Boolean);

  return (
    <span className="flex flex-wrap gap-x-2 gap-y-0.5">
      {parts.map((part, i) => {
        // Check for PubMed with number
        const pubmedMatch = part.match(/PubMed\s*(\d+)/i);
        if (pubmedMatch) {
          return (
            <a key={i} href={`https://pubmed.ncbi.nlm.nih.gov/${pubmedMatch[1]}`} target="_blank" rel="noopener noreferrer" className="text-[#0000FF] underline hover:opacity-70">
              {part}
            </a>
          );
        }
        // Check known sources
        const upper = part.toUpperCase();
        const matchedKey = Object.keys(KNOWN_SOURCES).find((k) => upper.includes(k));
        if (matchedKey) {
          return (
            <a key={i} href={KNOWN_SOURCES[matchedKey]} target="_blank" rel="noopener noreferrer" className="text-[#0000FF] underline hover:opacity-70">
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

// ── PDF Export ─────────────────────────────────────────
function exportGuiaoPdf(tema: string, semana: string, perguntas: Pergunta[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 20;
  const pageWidth = 210 - margin * 2;
  let y = margin;
  const today = format(new Date(), "d 'de' MMMM yyyy", { locale: pt });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 255);
  doc.text("REPORTAGEM VIVA", margin, y);
  y += 5;
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text(`GUIÃO DIZ QUE DISSE — ${tema} — Semana de ${semana} — ${today}`, margin, y);
  y += 8;
  doc.setDrawColor(0, 0, 255);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + pageWidth, y);
  y += 8;

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

  perguntas.forEach((row) => {
    if (y > 260) { doc.addPage(); y = margin; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const qLines = doc.splitTextToSize(row.pergunta, pageWidth * 0.38);
    doc.text(qLines, col1, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    const rLines = doc.splitTextToSize(row.resposta_simples, pageWidth * 0.28);
    doc.text(rLines, col2, y);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    const refLines = doc.splitTextToSize(row.referencia_nome, pageWidth * 0.28);
    doc.text(refLines, col3, y);

    const maxLines = Math.max(qLines.length, rLines.length, refLines.length);
    y += maxLines * 4 + 4;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y - 2, margin + pageWidth, y - 2);
  });

  y = 285;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text(`Reportagem Viva · ${today}`, margin, y);

  doc.save(`guiao-${tema.toLowerCase().replace(/\s+/g, "-")}-${semana}.pdf`);
}

// ── Component ─────────────────────────────────────────
const Guioes = () => {
  // Week selector
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    return startOfWeek(now, { weekStartsOn: 1 });
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Generated questions per tema
  const [guioesSemanais, setGuioesSemanais] = useState<GuiaoSemanal[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTema, setActiveTema] = useState(TEMAS[0].value);

  // Editing state
  const [editCell, setEditCell] = useState<{ idx: number; field: keyof Pergunta } | null>(null);
  const [editValue, setEditValue] = useState("");

  // Banco base
  const [bancoRows, setBancoRows] = useState<BancoRow[]>([]);
  const [bancoFilter, setBancoFilter] = useState("TODOS");
  const [bancoLoading, setBancoLoading] = useState(true);

  // Keywords
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);

  const semanaStr = format(selectedDate, "yyyy-MM-dd");
  const semanaLabel = `${format(selectedDate, "dd/MM")} — ${format(addDays(selectedDate, 6), "dd/MM/yyyy")}`;

  // Fetch data on mount and week change
  useEffect(() => {
    const fetchAll = async () => {
      const [kwRes, bancoRes, guiaoRes] = await Promise.all([
        supabase.from("keywords").select("term, axis, current_volume, change_percent").eq("is_active", true),
        supabase.from("guioes").select("*").order("tema").order("ordem"),
        supabase.from("guioes_semanais").select("*").eq("semana", semanaStr),
      ]);
      if (kwRes.data) setKeywords(kwRes.data as KeywordRow[]);
      if (bancoRes.data) setBancoRows(bancoRes.data as BancoRow[]);
      if (guiaoRes.data) setGuioesSemanais(guiaoRes.data as GuiaoSemanal[]);
      setBancoLoading(false);
    };
    fetchAll();
  }, [semanaStr]);

  // Get current tema's guiao
  const currentGuiao = guioesSemanais.find((g) => g.tema === activeTema);
  const currentPerguntas: Pergunta[] = currentGuiao?.perguntas || [];

  // Generate questions via AI
  const handleGenerate = async (temaValue: string) => {
    const temaObj = TEMAS.find((t) => t.value === temaValue);
    if (!temaObj) return;

    setGenerating(temaValue);
    try {
      const temaKeywords = keywords
        .filter((k) => k.axis === temaValue)
        .sort((a, b) => b.change_percent - a.change_percent)
        .slice(0, 10);

      const { data, error } = await supabase.functions.invoke("generate-guiao-questions", {
        body: { tema: temaObj.label, keywords: temaKeywords },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const perguntas: Pergunta[] = (data.perguntas || []).map((p: any) => ({
        pergunta: p.pergunta || "",
        resposta_simples: p.resposta_simples || "",
        referencia_nome: p.referencia_nome || "",
        referencia_url: p.referencia_url || "",
      }));

      // Upsert in local state
      setGuioesSemanais((prev) => {
        const existing = prev.find((g) => g.tema === temaValue);
        if (existing) {
          return prev.map((g) =>
            g.tema === temaValue ? { ...g, perguntas, gerado_por_ia: true } : g
          );
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            semana: semanaStr,
            tema: temaValue,
            perguntas,
            estado: "gravado",
            gerado_por_ia: true,
            created_at: new Date().toISOString(),
          },
        ];
      });

      setActiveTema(temaValue);
      toast.success(`${perguntas.length} perguntas geradas para ${temaObj.label}`);
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar perguntas");
    }
    setGenerating(null);
  };

  // Edit cell
  const startEdit = (idx: number, field: keyof Pergunta, value: string) => {
    setEditCell({ idx, field });
    setEditValue(value);
  };

  const commitEdit = () => {
    if (!editCell) return;
    setGuioesSemanais((prev) =>
      prev.map((g) => {
        if (g.tema !== activeTema) return g;
        const updated = [...g.perguntas];
        updated[editCell.idx] = { ...updated[editCell.idx], [editCell.field]: editValue };
        return { ...g, perguntas: updated };
      })
    );
    setEditCell(null);
  };

  // Save to Supabase
  const handleSave = async () => {
    const guiao = guioesSemanais.find((g) => g.tema === activeTema);
    if (!guiao || guiao.perguntas.length === 0) return;

    setSaving(true);
    try {
      // Check if exists in DB
      const { data: existing } = await supabase
        .from("guioes_semanais")
        .select("id")
        .eq("semana", semanaStr)
        .eq("tema", activeTema)
        .maybeSingle();

      const payload = {
        semana: semanaStr,
        tema: activeTema,
        perguntas: guiao.perguntas as any,
        estado: "gravado",
        gerado_por_ia: guiao.gerado_por_ia,
      };

      if (existing) {
        await supabase.from("guioes_semanais").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("guioes_semanais").insert(payload);
      }

      setGuioesSemanais((prev) =>
        prev.map((g) => (g.tema === activeTema ? { ...g, estado: "gravado" } : g))
      );
      toast.success("Guião guardado com sucesso");
    } catch {
      toast.error("Erro ao guardar");
    }
    setSaving(false);
  };

  // Add banco question to current guião
  const addFromBanco = (row: BancoRow) => {
    const newPergunta: Pergunta = {
      pergunta: row.pergunta,
      resposta_simples: row.resposta,
      referencia_nome: row.referencia_cientifica,
      referencia_url: "",
    };

    setGuioesSemanais((prev) => {
      const existing = prev.find((g) => g.tema === activeTema);
      if (existing) {
        return prev.map((g) =>
          g.tema === activeTema
            ? { ...g, perguntas: [...g.perguntas, newPergunta] }
            : g
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          semana: semanaStr,
          tema: activeTema,
          perguntas: [newPergunta],
          estado: "gravado",
          gerado_por_ia: false,
          created_at: new Date().toISOString(),
        },
      ];
    });
    toast.success("Pergunta adicionada ao guião");
  };

  // Banco filtering
  const filteredBanco =
    bancoFilter === "TODOS"
      ? bancoRows
      : bancoRows.filter((r) => r.tema === bancoTemaMap[bancoFilter]);

  const bancoGroups = filteredBanco.reduce<Record<string, BancoRow[]>>((acc, row) => {
    if (!acc[row.tema]) acc[row.tema] = [];
    acc[row.tema].push(row);
    return acc;
  }, {});

  // PDF
  const handleExportPdf = () => {
    if (currentPerguntas.length === 0) return;
    const temaObj = TEMAS.find((t) => t.value === activeTema);
    exportGuiaoPdf(temaObj?.label || activeTema, semanaStr, currentPerguntas);
    toast.success("PDF exportado");
  };

  // Editable cell renderer
  const renderCell = (idx: number, field: keyof Pergunta, value: string, isRef = false) => {
    const isEditing = editCell?.idx === idx && editCell?.field === field;
    if (isEditing) {
      return (
        <textarea
          autoFocus
          className="w-full bg-transparent border border-[#0000FF]/30 p-1 text-xs resize-none focus:outline-none focus:border-[#0000FF]"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === "Escape") setEditCell(null); }}
          rows={3}
        />
      );
    }
    return (
      <span
        className={cn("cursor-pointer hover:bg-muted/50 block p-1 -m-1", isRef && "italic")}
        onClick={() => startEdit(idx, field, value)}
        title="Clica para editar"
      >
        {value || <span className="opacity-30">—</span>}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader activePage="guioes" />

      <main className="px-6 py-8 max-w-6xl mx-auto">
        {/* ── Header ───────────────────────────────────── */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h1
              className="text-sm font-bold uppercase tracking-[0.15em]"
              style={{ color: "#0000FF" }}
            >
              GUIÕES DIZ QUE DISSE
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mt-1">
              GERADOR SEMANAL DE PERGUNTAS
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold uppercase tracking-wider border-[#0000FF] text-[#0000FF] hover:bg-[#0000FF]/5 rounded-none disabled:opacity-30"
              disabled={currentPerguntas.length === 0}
              onClick={handleExportPdf}
            >
              <FileText className="h-3 w-3 mr-1" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold uppercase tracking-wider border-[#0000FF] text-[#0000FF] hover:bg-[#0000FF]/5 rounded-none disabled:opacity-30"
              disabled={currentPerguntas.length === 0 || saving}
              onClick={handleSave}
            >
              {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              Guardar
            </Button>
          </div>
        </div>

        {/* ── Week Selector ────────────────────────────── */}
        <div className="flex items-center gap-4 mt-6 mb-6 border-b border-border pb-4">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="text-xs font-bold uppercase tracking-wider rounded-none border-foreground/20"
              >
                <CalendarIcon className="h-3 w-3 mr-2" />
                Semana: {semanaLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  if (d) {
                    setSelectedDate(startOfWeek(d, { weekStartsOn: 1 }));
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

        </div>

        {/* ── Tema Tabs + Generate ──────────────────────── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {TEMAS.map((t) => {
            const hasGuiao = guioesSemanais.some((g) => g.tema === t.value && g.perguntas.length > 0);
            return (
              <div key={t.value} className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTema(t.value)}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-[0.15em] pb-1 border-b-2 transition-colors",
                    activeTema === t.value
                      ? "border-[#0000FF] text-[#0000FF]"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                  {hasGuiao && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-[#0000FF]" />}
                </button>
              </div>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            className="text-[10px] font-bold uppercase tracking-wider border-[#0000FF] text-[#0000FF] hover:bg-[#0000FF] hover:text-white rounded-none ml-auto disabled:opacity-30"
            disabled={generating !== null}
            onClick={() => handleGenerate(activeTema)}
          >
            {generating === activeTema ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            {generating === activeTema ? "A consultar fontes..." : "Gerar perguntas da semana"}
          </Button>
        </div>

        {/* ── Generated Questions Table ─────────────────── */}
        {currentPerguntas.length > 0 ? (
          <div className="border border-border mb-10">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider w-[5%]">#</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider w-[35%]">Pergunta</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider w-[30%]">Resposta Simples</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider w-[30%]">Referência Científica</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPerguntas.map((p, i) => (
                  <TableRow key={i} className="border-b border-border/50">
                    <TableCell className="text-[10px] font-bold text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </TableCell>
                    <TableCell className="text-xs">{renderCell(i, "pergunta", p.pergunta)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {renderCell(i, "resposta_simples", p.resposta_simples)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {editCell?.idx === i && editCell?.field === "referencia_nome" ? (
                        renderCell(i, "referencia_nome", p.referencia_nome, true)
                      ) : p.referencia_url ? (
                        <a
                          href={p.referencia_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0000FF] underline italic text-xs hover:opacity-70"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p.referencia_nome || "Ver fonte"}
                        </a>
                      ) : (
                        <span
                          className="cursor-pointer hover:bg-muted/50 block p-1 -m-1 italic text-muted-foreground"
                          onClick={() => startEdit(i, "referencia_nome", p.referencia_nome)}
                        >
                          {p.referencia_nome || <span className="opacity-30">—</span>}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border border-dashed border-foreground/20 p-10 text-center mb-10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Clica em "Gerar perguntas da semana" para criar o guião de{" "}
              {TEMAS.find((t) => t.value === activeTema)?.label}
            </p>
          </div>
        )}

        {/* ── Banco Base ────────────────────────────────── */}
        <div className="section-divider mb-8" />

        <div className="flex items-start justify-between mb-1">
          <div>
            <h2
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: "#0000FF" }}
            >
              BANCO BASE
            </h2>
            <p className="text-[10px] text-muted-foreground mt-1">
              Perguntas permanentes — clica "+" para adicionar ao guião semanal
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-4 mb-4 border-b border-border pb-3">
          {BANCO_FILTROS.map((f) => (
            <button
              key={f}
              onClick={() => setBancoFilter(f)}
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.15em] pb-1 border-b-2 transition-colors",
                bancoFilter === f
                  ? "border-[#0000FF] text-[#0000FF]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {bancoLoading ? (
          <p className="text-xs text-muted-foreground">A carregar...</p>
        ) : Object.keys(bancoGroups).length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma pergunta no banco base.</p>
        ) : (
          Object.entries(bancoGroups).map(([tema, rows]) => (
            <div key={tema} className="mb-8">
              <h3
                className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3"
                style={{ color: "#0000FF" }}
              >
                {bancoLabelMap[tema] || tema}
              </h3>
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
                    {rows.map((row) => (
                      <TableRow key={row.id} className="border-b border-border/50">
                        <TableCell className="w-10">
                          <button
                            onClick={() => addFromBanco(row)}
                            className="text-[10px] font-bold text-[#0000FF] hover:bg-[#0000FF]/10 w-6 h-6 flex items-center justify-center border border-[#0000FF]/30"
                            title="Adicionar ao guião semanal"
                          >
                            +
                          </button>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{row.pergunta}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.resposta}</TableCell>
                        <TableCell className="text-xs text-muted-foreground italic">
                          <ReferenceLinks text={row.referencia_cientifica} />
                        </TableCell>
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
