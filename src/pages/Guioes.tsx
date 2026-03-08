import { useState, useEffect } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardFooter from "@/components/DashboardFooter";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarIcon, ChevronDown, ChevronUp, Pencil, FileText, Plus, Sparkles, X, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";

type Pergunta = {
  pergunta: string;
  resposta: string;
  referencia: string;
};

type Guiao = {
  id: string;
  titulo: string;
  semana: string;
  tema: string;
  subtema: string;
  perguntas: Pergunta[];
  estado: string;
  created_at: string;
};

const TEMAS = ["SAÚDE MENTAL", "ALIMENTAÇÃO", "MENOPAUSA", "EMERGENTES"] as const;
const ESTADOS = ["rascunho", "aprovado", "gravado"] as const;
const ESTADO_LABELS: Record<string, string> = {
  rascunho: "RASCUNHO",
  aprovado: "APROVADO",
  gravado: "GRAVADO",
};

const SUBTEMAS: Record<string, string[]> = {
  "SAÚDE MENTAL": ["Ansiedade", "Depressão", "Burnout", "Sono e insónia", "Saúde mental nos jovens", "Estigma da doença mental", "Acesso a psicólogos no SNS", "Automedicação com ansiolíticos"],
  "ALIMENTAÇÃO": ["Dietas da moda", "Suplementos alimentares", "Alimentação infantil", "Ultra-processados", "Rotulagem alimentar", "Açúcar oculto", "Alimentação e cancro", "Vegetarianismo e veganismo"],
  "MENOPAUSA": ["Sintomas e diagnóstico", "Terapia hormonal", "Menopausa precoce", "Saúde óssea", "Saúde cardiovascular", "Bem-estar emocional", "Menopausa no trabalho", "Mitos sobre menopausa"],
  "EMERGENTES": ["Ozempic e emagrecimento", "Long COVID", "Resistência a antibióticos", "Saúde digital", "Desinformação em saúde", "Poluição e saúde", "Alergias alimentares", "Saúde oral"],
};

const temaBadgeColor = (tema: string) => {
  switch (tema) {
    case "SAÚDE MENTAL": return "bg-[#0000FF]/10 text-[#0000FF] border-[#0000FF]/20";
    case "ALIMENTAÇÃO": return "bg-[#0000FF]/20 text-[#0000FF] border-[#0000FF]/30";
    case "MENOPAUSA": return "bg-[#0000FF]/30 text-[#0000FF] border-[#0000FF]/40";
    case "EMERGENTES": return "bg-[#0000FF]/5 text-[#0000FF] border-[#0000FF]/15";
    default: return "bg-muted text-foreground border-border";
  }
};

const estadoBadgeColor = (estado: string) => {
  switch (estado) {
    case "rascunho": return "bg-muted text-muted-foreground border-border";
    case "aprovado": return "bg-[#0000FF]/10 text-[#0000FF] border-[#0000FF]/20";
    case "gravado": return "bg-[#0000FF] text-white border-[#0000FF]";
    default: return "bg-muted text-foreground border-border";
  }
};

const emptyPergunta = (): Pergunta => ({ pergunta: "", resposta: "", referencia: "" });

function normalizePergunta(p: any): Pergunta {
  if (typeof p === "string") return { pergunta: p, resposta: "", referencia: "" };
  return { pergunta: p?.pergunta || "", resposta: p?.resposta || "", referencia: p?.referencia || "" };
}

function exportGuiaoPdf(guiao: Guiao) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 20;
  const pageWidth = 210 - margin * 2;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 255);
  doc.text("REPORTAGEM VIVA", margin, y);
  y += 6;

  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text("GUIÃO DIZ QUE DISSE — NOTAS DE FUNDAMENTO", margin, y);
  y += 10;

  doc.setDrawColor(0, 0, 255);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + pageWidth, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(guiao.titulo.toUpperCase(), margin, y);
  y += 7;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const semanaDate = new Date(guiao.semana + "T00:00:00");
  const meta = [
    `Semana de ${format(semanaDate, "d 'de' MMMM yyyy", { locale: pt })}`,
    guiao.tema,
    guiao.subtema,
    ESTADO_LABELS[guiao.estado] || guiao.estado.toUpperCase(),
  ].filter(Boolean).join("  ·  ");
  doc.text(meta, margin, y);
  y += 10;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, margin + pageWidth, y);
  y += 8;

  doc.setFontSize(7);
  doc.setTextColor(0, 0, 255);
  doc.setFont("helvetica", "bold");
  doc.text("PERGUNTAS", margin, y);
  y += 6;

  guiao.perguntas.forEach((p, i) => {
    if (y > 255) { doc.addPage(); y = margin; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const qLines = doc.splitTextToSize(`${i + 1}. ${p.pergunta}`, pageWidth);
    doc.text(qLines, margin, y);
    y += qLines.length * 4.5 + 2;

    if (p.resposta) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const aLines = doc.splitTextToSize(`R: ${p.resposta}`, pageWidth - 4);
      doc.text(aLines, margin + 4, y);
      y += aLines.length * 4 + 1;
    }
    if (p.referencia) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      const rLines = doc.splitTextToSize(`Ref: ${p.referencia}`, pageWidth - 4);
      doc.text(rLines, margin + 4, y);
      y += rLines.length * 3.5 + 1;
    }
    y += 3;
  });

  doc.save(`guiao-${guiao.semana}-${guiao.tema.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

const Guioes = () => {
  const [guioes, setGuioes] = useState<Guiao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("TODOS");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGuiao, setEditingGuiao] = useState<Guiao | null>(null);

  // Form state
  const [titulo, setTitulo] = useState("");
  const [semana, setSemana] = useState<Date | undefined>();
  const [tema, setTema] = useState("");
  const [subtema, setSubtema] = useState("");
  const [perguntas, setPerguntas] = useState<Pergunta[]>([emptyPergunta()]);
  const [estado, setEstado] = useState("rascunho");

  // AI modal state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTema, setAiTema] = useState("");
  const [aiSubtema, setAiSubtema] = useState("");
  const [aiContexto, setAiContexto] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPerguntas, setAiPerguntas] = useState<string[]>([]);
  const [aiGenerated, setAiGenerated] = useState(false);

  const fetchGuioes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("guioes")
      .select("*")
      .order("semana", { ascending: false });
    if (!error && data) {
      setGuioes(
        data.map((d: any) => ({
          ...d,
          subtema: d.subtema || "",
          perguntas: Array.isArray(d.perguntas) ? d.perguntas.map(normalizePergunta) : [],
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => { fetchGuioes(); }, []);

  const resetForm = () => {
    setTitulo("");
    setSemana(undefined);
    setTema("");
    setSubtema("");
    setPerguntas([emptyPergunta()]);
    setEstado("rascunho");
    setEditingGuiao(null);
  };

  const resetAiModal = () => {
    setAiTema("");
    setAiSubtema("");
    setAiContexto("");
    setAiPerguntas([]);
    setAiGenerated(false);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (g: Guiao) => {
    setEditingGuiao(g);
    setTitulo(g.titulo);
    setSemana(new Date(g.semana + "T00:00:00"));
    setTema(g.tema);
    setSubtema(g.subtema);
    setPerguntas(g.perguntas.length > 0 ? g.perguntas : [emptyPergunta()]);
    setEstado(g.estado);
    setDialogOpen(true);
  };

  const updatePergunta = (index: number, field: keyof Pergunta, value: string) => {
    setPerguntas((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const removePergunta = (index: number) => {
    setPerguntas((prev) => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index));
  };

  const addPergunta = () => setPerguntas((prev) => [...prev, emptyPergunta()]);

  const handleSubmit = async () => {
    if (!titulo || !semana || !tema) {
      toast.error("Preenche o título, semana e tema.");
      return;
    }
    const validPerguntas = perguntas.filter((p) => p.pergunta.trim());

    const payload = {
      titulo,
      semana: format(semana, "yyyy-MM-dd"),
      tema,
      subtema,
      perguntas: validPerguntas as any,
      estado,
    };

    if (editingGuiao) {
      const { error } = await supabase.from("guioes").update(payload).eq("id", editingGuiao.id);
      if (error) { toast.error("Erro ao actualizar guião."); return; }
      toast.success("Guião actualizado.");
    } else {
      const { error } = await supabase.from("guioes").insert(payload);
      if (error) { toast.error("Erro ao criar guião."); return; }
      toast.success("Guião criado.");
    }
    setDialogOpen(false);
    resetForm();
    fetchGuioes();
  };

  // AI generation
  const handleAiGenerate = async () => {
    if (!aiTema || !aiSubtema) { toast.error("Selecciona tema e sub-tema."); return; }
    setAiLoading(true);
    setAiPerguntas([]);
    setAiGenerated(false);
    try {
      const { data, error } = await supabase.functions.invoke("generate-guiao-questions", {
        body: { tema: aiTema, subtema: aiSubtema, contexto: aiContexto },
      });
      if (error || data?.error) { toast.error(data?.error || "Erro ao gerar perguntas."); setAiLoading(false); return; }
      const result = data?.perguntas || [];
      if (result.length === 0) { toast.error("Nenhuma pergunta gerada."); }
      else { setAiPerguntas(result); setAiGenerated(true); }
    } catch { toast.error("Erro de comunicação com a IA."); }
    setAiLoading(false);
  };

  const handleAiSave = async () => {
    const valid = aiPerguntas.map((p) => p.trim()).filter(Boolean);
    if (valid.length === 0) { toast.error("Adiciona pelo menos uma pergunta."); return; }
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    const { error } = await supabase.from("guioes").insert({
      titulo: `${aiSubtema} — Gerado por IA`,
      semana: format(nextMonday, "yyyy-MM-dd"),
      tema: aiTema,
      subtema: aiSubtema,
      perguntas: valid.map((p) => ({ pergunta: p, resposta: "", referencia: "" })) as any,
      estado: "rascunho",
    });
    if (error) { toast.error("Erro ao guardar guião."); return; }
    toast.success("Guião guardado como rascunho.");
    setAiModalOpen(false);
    resetAiModal();
    fetchGuioes();
  };

  const filtered = filter === "TODOS" ? guioes : guioes.filter((g) => g.tema === filter);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader activePage="guioes" />

      <main className="px-6 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h1 className="text-sm font-bold uppercase tracking-[0.15em]" style={{ color: "#0000FF" }}>
              GUIÕES DIZ QUE DISSE
            </h1>
            <p className="editorial-label mt-1">NOTAS DE FUNDAMENTO</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold uppercase tracking-wider border-[#0000FF] text-[#0000FF] hover:bg-[#0000FF]/5 rounded-none"
              onClick={() => { resetAiModal(); setAiModalOpen(true); }}
            >
              <Sparkles className="h-3 w-3 mr-1" /> Gerar com IA
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold uppercase tracking-wider border-[#0000FF] text-[#0000FF] hover:bg-[#0000FF]/5 rounded-none"
                  onClick={openCreate}
                >
                  <Plus className="h-3 w-3 mr-1" /> Novo Guião
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl rounded-none border-[#0000FF] shadow-none max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-sm font-bold uppercase tracking-[0.1em]">
                    {editingGuiao ? "Editar Guião" : "Novo Guião"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <label className="editorial-label mb-1 block">Título</label>
                    <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Semana 1 — Saúde Mental" className="rounded-none" />
                  </div>
                  <div>
                    <label className="editorial-label mb-1 block">Semana</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-none", !semana && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {semana ? format(semana, "d 'de' MMMM yyyy", { locale: pt }) : "Seleccionar segunda-feira"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={semana} onSelect={setSemana} disabled={(date) => date.getDay() !== 1} className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="editorial-label mb-1 block">Tema</label>
                      <Select value={tema} onValueChange={setTema}>
                        <SelectTrigger className="rounded-none"><SelectValue placeholder="Seleccionar tema" /></SelectTrigger>
                        <SelectContent>{TEMAS.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="editorial-label mb-1 block">Sub-tema</label>
                      <Input value={subtema} onChange={(e) => setSubtema(e.target.value)} placeholder="Ex: Ansiedade nos jovens" className="rounded-none" />
                    </div>
                  </div>

                  {/* Perguntas */}
                  <div>
                    <label className="editorial-label mb-2 block">Perguntas</label>
                    <div className="space-y-3">
                      {perguntas.map((p, i) => (
                        <div key={i} className="border border-border p-3 space-y-2 relative">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pergunta {i + 1}</span>
                            {perguntas.length > 1 && (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removePergunta(i)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <Input value={p.pergunta} onChange={(e) => updatePergunta(i, "pergunta", e.target.value)} placeholder="Pergunta" className="rounded-none text-xs" />
                          <Input value={p.resposta} onChange={(e) => updatePergunta(i, "resposta", e.target.value)} placeholder="Resposta simples" className="rounded-none text-xs" />
                          <Input value={p.referencia} onChange={(e) => updatePergunta(i, "referencia", e.target.value)} placeholder="Referência (fonte, URL, etc.)" className="rounded-none text-xs" />
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-wider mt-2" onClick={addPergunta}>
                      <Plus className="h-3 w-3 mr-1" /> Adicionar pergunta
                    </Button>
                  </div>

                  <div>
                    <label className="editorial-label mb-1 block">Estado</label>
                    <Select value={estado} onValueChange={setEstado}>
                      <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                      <SelectContent>{ESTADOS.map((e) => (<SelectItem key={e} value={e}>{ESTADO_LABELS[e]}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full bg-[#0000FF] hover:bg-[#0000CC] text-white text-xs font-bold uppercase tracking-wider rounded-none" onClick={handleSubmit}>
                    {editingGuiao ? "Guardar Alterações" : "Criar Guião"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="section-divider my-4" />

        {/* Filters */}
        <nav className="flex items-center gap-2 mb-6 flex-wrap">
          {["TODOS", ...TEMAS].map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={`nav-link ${filter === t ? "nav-link-active" : ""}`}>
              {t}
            </button>
          ))}
        </nav>

        {/* List */}
        {loading ? (
          <p className="editorial-label">A carregar...</p>
        ) : filtered.length === 0 ? (
          <p className="editorial-label">Nenhum guião encontrado.</p>
        ) : (
          <div className="space-y-0">
            {filtered.map((g) => {
              const isExpanded = expandedId === g.id;
              const semanaDate = new Date(g.semana + "T00:00:00");
              return (
                <div key={g.id} className="border-b border-border py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={cn("rounded-none text-[10px] font-bold uppercase tracking-wider", temaBadgeColor(g.tema))}>
                          {g.tema}
                        </Badge>
                        <Badge variant="outline" className={cn("rounded-none text-[10px] font-bold uppercase tracking-wider", estadoBadgeColor(g.estado))}>
                          {ESTADO_LABELS[g.estado] || g.estado.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wide mt-1">
                        {format(semanaDate, "'Semana de' d MMM yyyy", { locale: pt })} — {g.titulo}
                      </p>
                      {g.subtema && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{g.subtema}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {g.perguntas.length} pergunta{g.perguntas.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-wider h-7 px-2" onClick={() => setExpandedId(isExpanded ? null : g.id)}>
                        {isExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                        Ver
                      </Button>
                      <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-wider h-7 px-2" onClick={() => openEdit(g)}>
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-wider h-7 px-2" onClick={() => exportGuiaoPdf(g)}>
                        <FileText className="h-3 w-3 mr-1" /> PDF
                      </Button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 ml-4 space-y-3">
                      {g.perguntas.map((p, i) => (
                        <div key={i} className="border-l-2 border-[#0000FF]/20 pl-3">
                          <p className="text-xs font-bold">{i + 1}. {p.pergunta}</p>
                          {p.resposta && <p className="text-xs text-muted-foreground mt-0.5">R: {p.resposta}</p>}
                          {p.referencia && <p className="text-[10px] text-muted-foreground/60 mt-0.5 italic">Ref: {p.referencia}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* AI Generation Modal */}
      <Dialog open={aiModalOpen} onOpenChange={(open) => { setAiModalOpen(open); if (!open) resetAiModal(); }}>
        <DialogContent className="sm:max-w-lg border-[#0000FF] shadow-none rounded-none">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-[0.1em] flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: "#0000FF" }} />
              Gerar Perguntas com IA
            </DialogTitle>
          </DialogHeader>

          {!aiGenerated ? (
            <div className="space-y-4 mt-2">
              <div>
                <label className="editorial-label mb-1 block">Tema</label>
                <Select value={aiTema} onValueChange={(v) => { setAiTema(v); setAiSubtema(""); }}>
                  <SelectTrigger className="rounded-none"><SelectValue placeholder="Seleccionar tema" /></SelectTrigger>
                  <SelectContent>{TEMAS.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="editorial-label mb-1 block">Sub-tema</label>
                <Select value={aiSubtema} onValueChange={setAiSubtema} disabled={!aiTema}>
                  <SelectTrigger className="rounded-none"><SelectValue placeholder={aiTema ? "Seleccionar sub-tema" : "Selecciona primeiro o tema"} /></SelectTrigger>
                  <SelectContent>{(SUBTEMAS[aiTema] || []).map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="editorial-label mb-1 block">Contexto adicional (opcional)</label>
                <Textarea value={aiContexto} onChange={(e) => setAiContexto(e.target.value)} rows={3} placeholder="Ex: Foco em jovens universitários, zona urbana..." className="rounded-none" />
              </div>
              <Button className="w-full bg-[#0000FF] hover:bg-[#0000CC] text-white text-xs font-bold uppercase tracking-wider rounded-none" onClick={handleAiGenerate} disabled={aiLoading || !aiTema || !aiSubtema}>
                {aiLoading ? (<><Loader2 className="h-3 w-3 mr-2 animate-spin" />A gerar perguntas...</>) : "Gerar"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={cn("rounded-none text-[10px] font-bold uppercase tracking-wider", temaBadgeColor(aiTema))}>{aiTema}</Badge>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[10px] text-muted-foreground">{aiSubtema}</span>
              </div>
              <div className="space-y-2">
                {aiPerguntas.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground mt-2.5 w-4 shrink-0">{i + 1}.</span>
                    <Input value={p} onChange={(e) => setAiPerguntas((prev) => prev.map((x, j) => j === i ? e.target.value : x))} className="text-xs rounded-none" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setAiPerguntas((prev) => prev.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-wider" onClick={() => setAiPerguntas((prev) => [...prev, ""])}>
                <Plus className="h-3 w-3 mr-1" /> Adicionar pergunta
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs font-bold uppercase tracking-wider border-[#0000FF] text-[#0000FF] hover:bg-[#0000FF]/5 rounded-none" onClick={() => setAiGenerated(false)}>
                  Voltar
                </Button>
                <Button className="flex-1 bg-[#0000FF] hover:bg-[#0000CC] text-white text-xs font-bold uppercase tracking-wider rounded-none" onClick={handleAiSave}>
                  Guardar como Rascunho
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DashboardFooter />
    </div>
  );
};

export default Guioes;
