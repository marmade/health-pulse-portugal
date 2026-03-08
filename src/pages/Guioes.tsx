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
import { CalendarIcon, ChevronDown, ChevronUp, Pencil, FileText, Plus } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";

type Guiao = {
  id: string;
  titulo: string;
  semana: string;
  tema: string;
  perguntas: string[];
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
  doc.text("GUIÃO DIZ QUE DISSE — VOX POP", margin, y);
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
  doc.text(
    `Semana de ${format(semanaDate, "d 'de' MMMM yyyy", { locale: pt })}  ·  ${guiao.tema}  ·  ${ESTADO_LABELS[guiao.estado] || guiao.estado.toUpperCase()}`,
    margin,
    y
  );
  y += 10;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, margin + pageWidth, y);
  y += 8;

  doc.setFontSize(7);
  doc.setTextColor(0, 0, 255);
  doc.setFont("helvetica", "bold");
  doc.text("PERGUNTAS", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);

  guiao.perguntas.forEach((p, i) => {
    if (y > 270) {
      doc.addPage();
      y = margin;
    }
    const lines = doc.splitTextToSize(`${i + 1}. ${p}`, pageWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 3;
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
  const [perguntasText, setPerguntasText] = useState("");
  const [estado, setEstado] = useState("rascunho");

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
          perguntas: Array.isArray(d.perguntas) ? d.perguntas : [],
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGuioes();
  }, []);

  const resetForm = () => {
    setTitulo("");
    setSemana(undefined);
    setTema("");
    setPerguntasText("");
    setEstado("rascunho");
    setEditingGuiao(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (g: Guiao) => {
    setEditingGuiao(g);
    setTitulo(g.titulo);
    setSemana(new Date(g.semana + "T00:00:00"));
    setTema(g.tema);
    setPerguntasText(g.perguntas.join("\n"));
    setEstado(g.estado);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!titulo || !semana || !tema) {
      toast.error("Preenche o título, semana e tema.");
      return;
    }
    const perguntas = perguntasText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (editingGuiao) {
      const { error } = await supabase
        .from("guioes")
        .update({
          titulo,
          semana: format(semana, "yyyy-MM-dd"),
          tema,
          perguntas,
          estado,
        })
        .eq("id", editingGuiao.id);
      if (error) {
        toast.error("Erro ao actualizar guião.");
        return;
      }
      toast.success("Guião actualizado.");
    } else {
      const { error } = await supabase.from("guioes").insert({
        titulo,
        semana: format(semana, "yyyy-MM-dd"),
        tema,
        perguntas,
        estado,
      });
      if (error) {
        toast.error("Erro ao criar guião.");
        return;
      }
      toast.success("Guião criado.");
    }
    setDialogOpen(false);
    resetForm();
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
            <p className="editorial-label mt-1">BANCO DE PERGUNTAS PARA VOX POP</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold uppercase tracking-wider border-[#0000FF] text-[#0000FF] hover:bg-[#0000FF]/5"
                onClick={openCreate}
              >
                <Plus className="h-3 w-3 mr-1" /> Novo Guião
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold uppercase tracking-[0.1em]">
                  {editingGuiao ? "Editar Guião" : "Novo Guião"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="editorial-label mb-1 block">Título</label>
                  <Input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Semana 1 — Saúde Mental"
                  />
                </div>
                <div>
                  <label className="editorial-label mb-1 block">Semana</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !semana && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {semana ? format(semana, "d 'de' MMMM yyyy", { locale: pt }) : "Seleccionar segunda-feira"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={semana}
                        onSelect={setSemana}
                        disabled={(date) => date.getDay() !== 1}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="editorial-label mb-1 block">Tema</label>
                  <Select value={tema} onValueChange={setTema}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tema" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMAS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="editorial-label mb-1 block">Perguntas (uma por linha)</label>
                  <Textarea
                    value={perguntasText}
                    onChange={(e) => setPerguntasText(e.target.value)}
                    rows={6}
                    placeholder={"Já alguma vez procurou ajuda profissional para saúde mental?\nO que faz quando se sente ansioso/a?"}
                  />
                </div>
                <div>
                  <label className="editorial-label mb-1 block">Estado</label>
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((e) => (
                        <SelectItem key={e} value={e}>{ESTADO_LABELS[e]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-[#0000FF] hover:bg-[#0000CC] text-white text-xs font-bold uppercase tracking-wider"
                  onClick={handleSubmit}
                >
                  {editingGuiao ? "Guardar Alterações" : "Criar Guião"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="section-divider my-4" />

        {/* Filters */}
        <nav className="flex items-center gap-2 mb-6 flex-wrap">
          {["TODOS", ...TEMAS].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`nav-link ${filter === t ? "nav-link-active" : ""}`}
            >
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
                        <Badge variant="outline" className={cn("rounded text-[10px] font-bold uppercase tracking-wider", temaBadgeColor(g.tema))}>
                          {g.tema}
                        </Badge>
                        <Badge variant="outline" className={cn("rounded text-[10px] font-bold uppercase tracking-wider", estadoBadgeColor(g.estado))}>
                          {ESTADO_LABELS[g.estado] || g.estado.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wide mt-1">
                        {format(semanaDate, "'Semana de' d MMM yyyy", { locale: pt })} — {g.titulo}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {g.perguntas.length} pergunta{g.perguntas.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-bold uppercase tracking-wider h-7 px-2"
                        onClick={() => setExpandedId(isExpanded ? null : g.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                        Ver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-bold uppercase tracking-wider h-7 px-2"
                        onClick={() => openEdit(g)}
                      >
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-bold uppercase tracking-wider h-7 px-2"
                        onClick={() => exportGuiaoPdf(g)}
                      >
                        <FileText className="h-3 w-3 mr-1" /> PDF
                      </Button>
                    </div>
                  </div>
                  {isExpanded && (
                    <ol className="mt-3 ml-4 space-y-1 list-decimal list-inside">
                      {g.perguntas.map((p, i) => (
                        <li key={i} className="text-xs leading-relaxed">{p}</li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <DashboardFooter />
    </div>
  );
};

export default Guioes;
