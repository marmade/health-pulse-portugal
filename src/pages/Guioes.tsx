import React, { useState, useEffect } from "react";
import EditorialHeader from "@/components/EditorialHeader";
import DashboardFooter from "@/components/DashboardFooter";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { FileText, CalendarIcon, Sparkles, Save, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  source: "banco" | "ia";
  approved?: boolean;
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

// Curated URL map per tema + fonte (approved sources get precise URLs)
const URL_MAP: Record<string, Record<string, string>> = {
  "saude-mental": {
    "DGS": "https://www.dgs.pt/saude-mental.aspx",
    "SNS24": "https://www.sns24.gov.pt/tema/saude-mental/",
    "OMS": "https://www.who.int/news-room/fact-sheets/detail/mental-disorders",
    "CUF": "https://www.cuf.pt/saude-a-z/perturbacoes-do-comportamento",
    "INSA": "https://repositorio.insa.pt/home",
    "ORDEM DOS PSICÓLOGOS": "https://www.ordemdospsicologos.pt",
    "SAÚDE MENTAL PT": "https://saudementalpt.com/saude-mental/",
  },
  "alimentacao": {
    "DGS": "https://www.dgs.pt/promocao-da-saude/alimentacao-saudavel.aspx",
    "SNS24": "https://www.sns24.gov.pt/tema/alimentacao/",
    "OMS": "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
    "CUF": "https://www.cuf.pt/saude-a-z",
    "INSA": "https://www.insa.min-saude.pt/category/areas-de-atuacao/alimentacao-e-nutricao/",
    "INFARMED": "https://www.infarmed.pt",
    "LUZ SAÚDE": "https://www.luzsaude.pt/pt/hospital-da-luz/",
  },
  "menopausa": {
    "DGS": "https://www.dgs.pt/saude-a-ao-z/menopausa.aspx",
    "SNS24": "https://www.sns24.gov.pt/tema/saude-da-mulher/menopausa/",
    "OMS": "https://www.who.int/news-room/fact-sheets/detail/menopause",
    "CUF": "https://www.cuf.pt/saude-a-z/menopausa",
    "LUZ SAÚDE": "https://www.luzsaude.pt/pt/hospital-da-luz/",
  },
  "emergentes": {
    "DGS": "https://www.dgs.pt/doencas-infecciosas.aspx",
    "ECDC": "https://www.ecdc.europa.eu/en/threats-and-outbreaks",
    "OMS": "https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance",
    "INSA": "https://www.insa.min-saude.pt/category/areas-de-atuacao/doencas-infecciosas/",
    "SNS24": "https://www.sns24.gov.pt",
  },
};

// Global sources (not tema-specific)
const GLOBAL_SOURCES: Record<string, string> = {
  "PUBMED": "https://pubmed.ncbi.nlm.nih.gov/",
  "NIMH": "https://www.nimh.nih.gov",
};

// Aliases: map common variations to canonical keys
const SOURCE_ALIASES: Record<string, string> = {
  "WHO": "OMS",
  "WORLD HEALTH": "OMS",
  "ORGANIZAÇÃO MUNDIAL": "OMS",
  "DIREÇÃO-GERAL": "DGS",
  "DIRECÇÃO-GERAL": "DGS",
  "DIREÇÃO GERAL": "DGS",
  "PSICÓLOGOS": "ORDEM DOS PSICÓLOGOS",
  "ORDEM DOS PSICOLOGOS": "ORDEM DOS PSICÓLOGOS",
  "LUZ SAUDE": "LUZ SAÚDE",
  "HOSPITAL DA LUZ": "LUZ SAÚDE",
  "SAUDEMENTALPT": "SAÚDE MENTAL PT",
  "SAUDEMENTAL.PT": "SAÚDE MENTAL PT",
  "SMPT": "SAÚDE MENTAL PT",
  "SAUDE MENTAL PT": "SAÚDE MENTAL PT",
  "SNS": "SNS24",
};

// Parse a reference fragment and return its URL
function getFragmentUrl(tema: string, fragment: string): string | null {
  const upper = fragment.toUpperCase().trim();
  const temaMap = URL_MAP[tema] || {};

  // Check for PubMed with ID
  const pubmedMatch = fragment.match(/PubMed\s*(\d+)/i);
  if (pubmedMatch) {
    return `https://pubmed.ncbi.nlm.nih.gov/${pubmedMatch[1]}/`;
  }

  // Check global sources
  for (const [key, url] of Object.entries(GLOBAL_SOURCES)) {
    if (upper.includes(key)) return url;
  }

  // Direct match against tema map keys
  const directMatch = Object.keys(temaMap).find((k) => upper.includes(k));
  if (directMatch) return temaMap[directMatch];

  // Alias match
  const aliasMatch = Object.entries(SOURCE_ALIASES).find(([alias]) => upper.includes(alias));
  if (aliasMatch) {
    const canonical = aliasMatch[1];
    if (temaMap[canonical]) return temaMap[canonical];
  }

  return null;
}

// Type for parsed reference fragments
type RefFragment = { text: string; url: string | null };

// Parse referencia_cientifica into fragments with URLs
function parseReference(tema: string, refText: string): RefFragment[] {
  if (!refText) return [];
  
  // Split by · (middle dot), — (em dash), , (comma), ; (semicolon)
  const parts = refText.split(/[·—,;]/).map(s => s.trim()).filter(s => s.length > 0);
  
  return parts.map(part => ({
    text: part,
    url: getFragmentUrl(tema, part),
  }));
}

// Resolve a reference name to a curated URL for a given tema (legacy, for AI refs)
// Returns { url, approved } — approved=true means it matched the curated map
function resolveReference(tema: string, refNome: string, originalUrl: string): { url: string; approved: boolean } {
  const temaMap = URL_MAP[tema];
  if (!temaMap || !refNome) return { url: originalUrl, approved: false };

  const upper = refNome.toUpperCase();

  // Direct match against map keys
  const directMatch = Object.keys(temaMap).find((k) => upper.includes(k));
  if (directMatch) return { url: temaMap[directMatch], approved: true };

  // Alias match
  const aliasMatch = Object.entries(SOURCE_ALIASES).find(([alias]) => upper.includes(alias));
  if (aliasMatch) {
    const canonical = aliasMatch[1];
    if (temaMap[canonical]) return { url: temaMap[canonical], approved: true };
  }

  // Not in curated map — keep original URL, mark as not approved
  return { url: originalUrl, approved: false };
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

  // Keywords
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);

  const semanaStr = format(selectedDate, "yyyy-MM-dd");
  const semanaLabel = `${format(selectedDate, "dd/MM")} — ${format(addDays(selectedDate, 6), "dd/MM/yyyy")}`;

  // Fetch data on mount and week change
  useEffect(() => {
    const fetchAll = async () => {
      const [kwRes, guiaoRes] = await Promise.all([
        supabase.from("keywords").select("term, axis, current_volume, change_percent").eq("is_active", true),
        supabase.from("guioes_semanais").select("*").eq("semana", semanaStr),
      ]);
      if (kwRes.data) setKeywords(kwRes.data as KeywordRow[]);
      if (guiaoRes.data) setGuioesSemanais(guiaoRes.data as GuiaoSemanal[]);
    };
    fetchAll();
  }, [semanaStr]);

  // Get current tema's guiao
  const currentGuiao = guioesSemanais.find((g) => g.tema === activeTema);
  const currentPerguntas: Pergunta[] = currentGuiao?.perguntas || [];

  // Generate 5+5 guião: 5 from banco base + 5 from Perplexity
  const handleGenerate = async (temaValue: string) => {
    const temaObj = TEMAS.find((t) => t.value === temaValue);
    if (!temaObj) return;

    setGenerating(temaValue);
    try {
      // 1. Fetch 5 random banco base questions for this tema
      const { data: bancoData } = await supabase
        .from("guioes")
        .select("pergunta, resposta, referencia_cientifica, referencia_url")
        .ilike("tema", temaObj.db)
        .limit(50);

      // Shuffle and take 5
      const shuffled = (bancoData || []).sort(() => Math.random() - 0.5).slice(0, 5);
      const bancoPerguntas: Pergunta[] = shuffled.map((r: any) => {
        const refText = r.referencia_cientifica || "";
        return {
          pergunta: r.pergunta || "",
          resposta_simples: r.resposta || "",
          referencia_nome: refText,
          // If referencia_url is set in DB, use directly; otherwise parseReference handles it during render
          referencia_url: r.referencia_url || "",
          source: "banco" as const,
        };
      });

      // 2. Call Perplexity for 5 AI questions
      const temaKeywords = keywords
        .filter((k) => k.axis === temaValue)
        .sort((a, b) => b.change_percent - a.change_percent)
        .slice(0, 10);

      const { data, error } = await supabase.functions.invoke("generate-guiao-questions", {
        body: { tema: temaObj.label, keywords: temaKeywords },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const aiPerguntas: Pergunta[] = (data.perguntas || []).slice(0, 5).map((p: any) => {
        const refNome = p.referencia_nome || "";
        // Use Perplexity citation URL directly; if missing, fallback to URL_MAP by reference name
        const citationUrl = p.referencia_url || "";
        const fallback = citationUrl ? { url: citationUrl, approved: true } : resolveReference(temaValue, refNome, "");
        return {
          pergunta: p.pergunta || "",
          resposta_simples: p.resposta_simples || "",
          referencia_nome: refNome,
          referencia_url: fallback.url,
          source: "ia" as const,
          approved: fallback.approved,
        };
      });

      const allPerguntas = [...bancoPerguntas, ...aiPerguntas];

      // Upsert in local state
      setGuioesSemanais((prev) => {
        const existing = prev.find((g) => g.tema === temaValue);
        if (existing) {
          return prev.map((g) =>
            g.tema === temaValue ? { ...g, perguntas: allPerguntas, gerado_por_ia: true } : g
          );
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            semana: semanaStr,
            tema: temaValue,
            perguntas: allPerguntas,
            estado: "gravado",
            gerado_por_ia: true,
            created_at: new Date().toISOString(),
          },
        ];
      });

      setActiveTema(temaValue);
      toast.success(`Guião gerado: ${bancoPerguntas.length} do banco + ${aiPerguntas.length} por IA`);
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
    <div className="min-h-screen text-foreground" style={{ backgroundColor: "#F2FCFA" }}>
      <EditorialHeader />

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
                {currentPerguntas.map((p, i) => {
                  const isAI = p.source === "ia";
                  const isUnverified = isAI && p.approved === false;
                  const rowNum = String(i + 1).padStart(2, "0");

                  // For banco base refs, parse multiple sources
                  const bancoRefs = !isAI && p.referencia_nome
                    ? parseReference(activeTema, p.referencia_nome)
                    : [];

                  return (
                    <TableRow key={i} className="border-b border-border/50">
                      <TableCell className="text-[10px] font-bold text-muted-foreground">
                        {isAI ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  <span className="text-pink-400 mr-1">•</span>{rowNum}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="text-xs">
                                {isUnverified
                                  ? "Fonte não verificada — confirmar antes de usar"
                                  : "Gerado por IA — verificar antes de usar"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          rowNum
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{renderCell(i, "pergunta", p.pergunta)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {renderCell(i, "resposta_simples", p.resposta_simples)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {!isAI ? (
                          // Banco base: if direct referencia_url set, use it; else parse fragments
                          p.referencia_url ? (
                            <a
                              href={p.referencia_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0000FF] underline italic text-xs hover:opacity-70"
                            >
                              {p.referencia_nome || "Ver fonte"}
                            </a>
                          ) : bancoRefs.length > 0 ? (
                            <span className="italic">
                              {bancoRefs.map((frag, fi) => (
                                <span key={fi}>
                                  {fi > 0 && <span className="text-muted-foreground mx-1">·</span>}
                                  {frag.url ? (
                                    <a
                                      href={frag.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#0000FF] underline hover:opacity-70"
                                    >
                                      {frag.text}
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground">{frag.text}</span>
                                  )}
                                </span>
                              ))}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              {p.referencia_nome || <span className="opacity-30">—</span>}
                            </span>
                          )
                        ) : editCell?.idx === i && editCell?.field === "referencia_nome" ? (
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
                  );
                })}
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
      </main>

      <DashboardFooter />
    </div>
  );
};

export default Guioes;
