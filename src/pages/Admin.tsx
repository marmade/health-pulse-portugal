import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus, Check, X, LogOut, Pencil } from "lucide-react";
import { fallbackSobreContent, SOBRE_BLOCKS } from "@/data/sobreContent";
import BenchmarkAdminTab from "@/components/BenchmarkAdminTab";

const normalizeToAxis = (term: string): string => {
  const valid = ["saude-mental", "alimentacao", "menopausa", "emergentes"];
  if (valid.includes(term)) return term;
  const t = term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (t.includes("saude") || t.includes("mental") || t.includes("ansied") || t.includes("depres") || t.includes("psic") || t.includes("stress") || t.includes("burnout") || t.includes("suicid") || t.includes("insoni") || t.includes("automutil") || t.includes("tdah") || t.includes("terapia")) return "saude-mental";
  if (t.includes("aliment") || t.includes("dieta") || t.includes("nutri") || t.includes("obesid") || t.includes("peso") || t.includes("ultraprocess") || t.includes("jejum")) return "alimentacao";
  if (t.includes("menopaus") || t.includes("climater") || t.includes("hormon")) return "menopausa";
  if (t.includes("emergent")) return "emergentes";
  return "";
};

const ADMIN_PASSWORD = "healthpulse2026";
const AXES = [
  { value: "saude-mental", label: "Saúde Mental" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "menopausa", label: "Menopausa" },
  { value: "emergentes", label: "Emergentes" },
];
const TEMAS_GUIOES = [
  { value: "saude-mental", label: "SAÚDE MENTAL" },
  { value: "alimentacao", label: "ALIMENTAÇÃO" },
  { value: "menopausa", label: "MENOPAUSA" },
  { value: "emergentes", label: "EMERGENTES" },
];
const SOURCE_TYPES = [
  { value: "institutional", label: "INST" },
  { value: "media", label: "MEDIA" },
  { value: "fact-check", label: "FC" },
];

type Keyword = {
  id: string;
  term: string;
  axis: string;
  is_active: boolean;
};

type DebunkingItem = {
  id: string;
  title: string;
  term: string;
  source: string;
  classification: string;
  url: string;
};

type NewsItem = {
  id: string;
  title: string;
  outlet: string;
  date: string;
  related_term: string;
  source_type: string;
  url: string;
};

type Referencia = { label: string; url: string };

type TextoItem = {
  id: string;
  ordem: number;
  categoria: string;
  titulo: string;
  lead: string;
  corpo: string;
  referencias: Referencia[];
  ativo: boolean;
};

type GuiaoRow = {
  id: string;
  tema: string;
  subtema: string;
  pergunta: string;
  resposta: string;
  referencia_cientifica: string;
  ordem: number;
};

type PopupItem = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
};

type SobreItem = {
  id: string;
  titulo: string;
  conteudo: string;
};

type BookmarkItem = {
  id: string;
  url: string;
  titulo: string;
  fonte: string;
  categoria: string;
  notas: string | null;
  ordem: number;
};

const BOOKMARK_CATEGORIAS = [
  { value: "desinformacao", label: "Desinformação" },
  { value: "igualdade_social", label: "Elevador Social" },
  { value: "cuidados_saude_primarios", label: "Cuidados de Saúde Primários" },
  { value: "dunning_kruger", label: "Saber que não sabe" },
];

const emptyTexto = (): Omit<TextoItem, "id"> => ({
  ordem: 0,
  categoria: "",
  titulo: "",
  lead: "",
  corpo: "",
  referencias: [],
  ativo: true,
});

const emptyGuiao = (): Omit<GuiaoRow, "id"> => ({
  tema: "",
  subtema: "",
  pergunta: "",
  resposta: "",
  referencia_cientifica: "",
  ordem: 0,
});

// ── Revisão de Pares Admin ────────────────────────────────────────────
const EIXOS_RP = [
  { axis: 'saude-mental', label: 'Saude Mental', color: '#0000FF', bg: 'rgba(0,255,200,0.12)' },
  { axis: 'alimentacao',  label: 'Alimentacao',  color: '#0000FF', bg: 'rgba(255,230,0,0.2)' },
  { axis: 'menopausa',    label: 'Menopausa',    color: '#0000FF', bg: 'rgba(255,0,150,0.12)' },
  { axis: 'emergentes',   label: 'Emergentes',   color: '#0000FF', bg: 'rgba(0,0,255,0.08)' },
];

type RPEntry = {
  id?: string; axis: string; axis_label: string;
  nome_a: string; especialidade_a: string; telefone_a: string; email_a: string; link_a: string;
  nome_b: string; especialidade_b: string; telefone_b: string; email_b: string; link_b: string;
  sumario: string;
};

const emptyRP = (axis: string, label: string): RPEntry => ({
  axis, axis_label: label,
  nome_a: '', especialidade_a: '', telefone_a: '', email_a: '', link_a: '',
  nome_b: '', especialidade_b: '', telefone_b: '', email_b: '', link_b: '',
  sumario: '',
});

const RevisaoPareAdmin = () => {
  const [dados, setDados] = useState<Record<string, RPEntry>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (supabase.from as any)('revisao_pares').select('*').then(({ data }: any) => {
      if (!data) return;
      const map: Record<string, RPEntry> = {};
      data.forEach((d: any) => { map[d.axis] = d; });
      setDados(map);
    });
  }, []);

  const update = (axis: string, field: string, value: string) =>
    setDados(prev => ({ ...prev, [axis]: { ...(prev[axis] || emptyRP(axis, axis)), [field]: value } }));

  const save = async (axis: string) => {
    setSaving(axis);
    const entry = dados[axis] || emptyRP(axis, EIXOS_RP.find(e => e.axis === axis)?.label || axis);
    const { error } = entry?.id
      ? await (supabase.from as any)('revisao_pares').update({ ...entry, updated_at: new Date().toISOString() }).eq('id', entry.id)
      : await (supabase.from as any)('revisao_pares').insert(entry);
    setSaving(null);
    if (error) toast({ title: 'Erro ao guardar', description: error.message, variant: 'destructive' });
    else toast({ title: 'Guardado', description: axis + ' actualizado' });
  };

  const rpField = (axis: string, key: keyof RPEntry, placeholder: string, multiline = false) => {
    const val = String((dados[axis] || emptyRP(axis, axis))[key] || '');
    return multiline ? (
      <textarea rows={3} className="w-full text-xs border border-foreground/20 px-2 py-1.5 bg-background resize-none" placeholder={placeholder} value={val} onChange={e => update(axis, key, e.target.value)} />
    ) : (
      <input className="w-full text-xs border border-foreground/20 px-2 py-1.5 bg-background" placeholder={placeholder} value={val} onChange={e => update(axis, key, e.target.value)} />
    );
  };

  return (
    <div className="space-y-8 py-4">
      {EIXOS_RP.map(({ axis, label, color, bg }) => (
        <div key={axis} className="border border-foreground/10" style={{ borderLeftColor: color, borderLeftWidth: 3, backgroundColor: bg }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color }}>{label}</p>
            <button onClick={() => save(axis)} disabled={saving === axis} className="text-[9px] font-bold uppercase tracking-[0.15em] border px-3 py-1.5 transition-colors" style={{ borderColor: color, color: saving === axis ? '#999' : color }}>
              {saving === axis ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-foreground/10">
            <div className="p-4 space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color }}>Perfil A</p>
              {rpField(axis, 'nome_a', 'Nome completo')}
              {rpField(axis, 'especialidade_a', 'Especialidade / Cargo')}
              {rpField(axis, 'telefone_a', 'Telefone')}
              {rpField(axis, 'email_a', 'Email')}
              {rpField(axis, 'link_a', 'Link profissional (URL)')}
            </div>
            <div className="p-4 space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color }}>Perfil B</p>
              {rpField(axis, 'nome_b', 'Nome completo')}
              {rpField(axis, 'especialidade_b', 'Especialidade / Cargo')}
              {rpField(axis, 'telefone_b', 'Telefone')}
              {rpField(axis, 'email_b', 'Email')}
              {rpField(axis, 'link_b', 'Link profissional (URL)')}
            </div>
          </div>
          <div className="px-4 py-3 border-t border-foreground/10">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-2 opacity-50">Sumario do Eixo</p>
            {rpField(axis, 'sumario', 'Texto de sumario...', true)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  // Keywords state
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [showKeywordForm, setShowKeywordForm] = useState(false);
  const [editingKeywordId, setEditingKeywordId] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState({ term: "", axis: "", is_active: true });

  // Debunking state
  const [debunking, setDebunking] = useState<DebunkingItem[]>([]);
  const [showDebunkForm, setShowDebunkForm] = useState(false);
  const [editingDebunkId, setEditingDebunkId] = useState<string | null>(null);
  const [newDebunk, setNewDebunk] = useState({ title: "", term: "", source: "", classification: "FALSO", url: "" });

  // News state
  const [news, setNews] = useState<NewsItem[]>([]);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [editingNewsOriginalTerm, setEditingNewsOriginalTerm] = useState<string>("");
  const [newNews, setNewNews] = useState({ title: "", url: "", outlet: "", source_type: "media", related_term: "", date: "" });

  // Textos state
  const [textos, setTextos] = useState<TextoItem[]>([]);
  const [showTextoForm, setShowTextoForm] = useState(false);
  const [editingTextoId, setEditingTextoId] = useState<string | null>(null);
  const [textoForm, setTextoForm] = useState<Omit<TextoItem, "id">>(emptyTexto());

  // Guioes state
  const [guioes, setGuioes] = useState<GuiaoRow[]>([]);
  const [showGuiaoForm, setShowGuiaoForm] = useState(false);
  const [editingGuiaoId, setEditingGuiaoId] = useState<string | null>(null);
  const [guiaoForm, setGuiaoForm] = useState<Omit<GuiaoRow, "id">>(emptyGuiao());
  const [guiaoFilter, setGuiaoFilter] = useState("TODOS");

  // Popups state
  const [popups, setPopups] = useState<PopupItem[]>([]);
  const [editingPopupId, setEditingPopupId] = useState<string | null>(null);
  const [popupForm, setPopupForm] = useState({ eyebrow: "", title: "", text: "" });

  // Sobre state
  const [sobreItems, setSobreItems] = useState<SobreItem[]>([]);
  const [editingSobreId, setEditingSobreId] = useState<string | null>(null);
  const [sobreForm, setSobreForm] = useState({ titulo: "", conteudo: "" });

  // Bookmarks state
  const [bookmarksList, setBookmarksList] = useState<BookmarkItem[]>([]);
  const [showBookmarkForm, setShowBookmarkForm] = useState(false);
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [bookmarkForm, setBookmarkForm] = useState({ url: "", titulo: "", fonte: "", categoria: "", notas: "", ordem: 0 });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string } | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_auth");
    if (saved === "true") setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchAll();
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_auth");
    setPassword("");
  };

  const fetchAll = async () => {
    const [kw, db, nw, tx, gu, pp, sb, bk] = await Promise.all([
      supabase.from("keywords").select("id, term, axis, is_active").order("term"),
      supabase.from("debunking").select("*").order("created_at", { ascending: false }),
      supabase.from("news_items").select("*").order("date", { ascending: false }).limit(100),
      supabase.from("textos").select("*").order("ordem"),
      supabase.from("guioes").select("*").order("tema").order("ordem"),
      supabase.from("plataforma_popups").select("*"),
      supabase.from("sobre_conteudo").select("*"),
      supabase.from("bookmarks").select("*").order("ordem"),
    ]);
    if (kw.data) setKeywords(kw.data);
    if (db.data) setDebunking(db.data);
    if (nw.data) setNews(nw.data);
    if (tx.data) setTextos(tx.data.map((t: any) => ({ ...t, referencias: t.referencias || [] })));
    if (gu.data) setGuioes(gu.data as GuiaoRow[]);
    if (pp.data) setPopups(pp.data as PopupItem[]);
    if (sb.data) setSobreItems(sb.data as SobreItem[]);
    if (bk.data) setBookmarksList(bk.data as BookmarkItem[]);
  };

  // Bookmarks CRUD
  const openBookmarkForm = (item?: BookmarkItem) => {
    if (item) {
      setEditingBookmarkId(item.id);
      setBookmarkForm({ url: item.url, titulo: item.titulo, fonte: item.fonte, categoria: item.categoria, notas: item.notas || "", ordem: item.ordem });
    } else {
      setEditingBookmarkId(null);
      setBookmarkForm({ url: "", titulo: "", fonte: "", categoria: "", notas: "", ordem: 0 });
    }
    setShowBookmarkForm(true);
  };

  const saveBookmark = async () => {
    if (!bookmarkForm.titulo || !bookmarkForm.url) return;
    const payload = { url: bookmarkForm.url, titulo: bookmarkForm.titulo, fonte: bookmarkForm.fonte, categoria: bookmarkForm.categoria, notas: bookmarkForm.notas || null, ordem: bookmarkForm.ordem };
    const { error } = editingBookmarkId
      ? await supabase.from("bookmarks").update(payload).eq("id", editingBookmarkId)
      : await supabase.from("bookmarks").insert(payload);
    if (error) { toast({ title: "Erro ao guardar", variant: "destructive" }); }
    else { toast({ title: "Guardado ✓" }); setShowBookmarkForm(false); setEditingBookmarkId(null); setBookmarkForm({ url: "", titulo: "", fonte: "", categoria: "", notas: "", ordem: 0 }); fetchAll(); }
  };

  const deleteBookmark = async (id: string) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (error) toast({ title: "Erro ao apagar", variant: "destructive" });
    else { toast({ title: "Apagado ✓" }); fetchAll(); }
    setDeleteConfirm(null);
  };

  // Keywords CRUD
  const openKeywordForm = (kw?: Keyword) => {
    if (kw) {
      setEditingKeywordId(kw.id);
      setNewKeyword({ term: kw.term, axis: kw.axis, is_active: kw.is_active });
    } else {
      setEditingKeywordId(null);
      setNewKeyword({ term: "", axis: "", is_active: true });
    }
    setShowKeywordForm(true);
  };

  const saveKeyword = async () => {
    if (!newKeyword.term || !newKeyword.axis) return;
    const { error } = editingKeywordId
      ? await supabase.from("keywords").update({ term: newKeyword.term, axis: newKeyword.axis, is_active: newKeyword.is_active }).eq("id", editingKeywordId)
      : await supabase.from("keywords").insert({ term: newKeyword.term, axis: newKeyword.axis, is_active: newKeyword.is_active, category: newKeyword.axis, source: "manual", synonyms: [] });
    if (error) { toast({ title: "Erro ao guardar", variant: "destructive" }); }
    else { toast({ title: "Guardado ✓" }); setNewKeyword({ term: "", axis: "", is_active: true }); setShowKeywordForm(false); setEditingKeywordId(null); fetchAll(); }
  };

  const deleteKeyword = async (id: string) => {
    const { error } = await supabase.from("keywords").delete().eq("id", id);
    if (error) toast({ title: "Erro ao apagar", variant: "destructive" });
    else { toast({ title: "Apagado ✓" }); fetchAll(); }
    setDeleteConfirm(null);
  };

  // Debunking CRUD
  const openDebunkForm = (item?: DebunkingItem) => {
    if (item) {
      setEditingDebunkId(item.id);
      setNewDebunk({ title: item.title, term: item.term, source: item.source, classification: item.classification, url: item.url });
    } else {
      setEditingDebunkId(null);
      setNewDebunk({ title: "", term: "", source: "", classification: "FALSO", url: "" });
    }
    setShowDebunkForm(true);
  };

  const saveDebunk = async () => {
    if (!newDebunk.title || !newDebunk.term) return;
    const payload = { title: newDebunk.title, term: newDebunk.term, source: newDebunk.source, classification: newDebunk.classification, url: newDebunk.url };
    const { error } = editingDebunkId
      ? await supabase.from("debunking").update(payload).eq("id", editingDebunkId)
      : await supabase.from("debunking").insert(payload);
    if (error) toast({ title: "Erro ao guardar", variant: "destructive" });
    else { toast({ title: "Guardado ✓" }); setNewDebunk({ title: "", term: "", source: "", classification: "FALSO", url: "" }); setShowDebunkForm(false); setEditingDebunkId(null); fetchAll(); }
  };

  const deleteDebunk = async (id: string) => {
    const { error } = await supabase.from("debunking").delete().eq("id", id);
    if (error) toast({ title: "Erro ao apagar", variant: "destructive" });
    else { toast({ title: "Apagado ✓" }); fetchAll(); }
    setDeleteConfirm(null);
  };

  // News CRUD
  const openNewsForm = (item?: NewsItem) => {
    if (item) {
      setEditingNewsId(item.id);
      setEditingNewsOriginalTerm(item.related_term);
      setNewNews({ title: item.title, url: item.url, outlet: item.outlet, source_type: item.source_type, related_term: normalizeToAxis(item.related_term), date: item.date });
    } else {
      setEditingNewsId(null);
      setEditingNewsOriginalTerm("");
      setNewNews({ title: "", url: "", outlet: "", source_type: "media", related_term: "", date: "" });
    }
    setShowNewsForm(true);
  };

  const saveNews = async () => {
    if (!newNews.title || !newNews.outlet || !newNews.date) return;
    const payload = { title: newNews.title, url: newNews.url, outlet: newNews.outlet, source_type: newNews.source_type, related_term: newNews.related_term || "geral", date: newNews.date };
    const { error } = editingNewsId
      ? await supabase.from("news_items").update(payload).eq("id", editingNewsId)
      : await supabase.from("news_items").insert(payload);
    if (error) toast({ title: "Erro ao guardar", variant: "destructive" });
    else { toast({ title: "Guardado ✓" }); setNewNews({ title: "", url: "", outlet: "", source_type: "media", related_term: "", date: "" }); setShowNewsForm(false); setEditingNewsId(null); setEditingNewsOriginalTerm(""); fetchAll(); }
  };

  const deleteNews = async (id: string) => {
    const { error } = await supabase.from("news_items").delete().eq("id", id);
    if (error) toast({ title: "Erro ao apagar", variant: "destructive" });
    else { toast({ title: "Apagado ✓" }); fetchAll(); }
    setDeleteConfirm(null);
  };

  // Textos CRUD
  const openTextoForm = (texto?: TextoItem) => {
    if (texto) {
      setEditingTextoId(texto.id);
      setTextoForm({ ordem: texto.ordem, categoria: texto.categoria, titulo: texto.titulo, lead: texto.lead, corpo: texto.corpo, referencias: texto.referencias, ativo: texto.ativo });
    } else {
      setEditingTextoId(null);
      setTextoForm(emptyTexto());
    }
    setShowTextoForm(true);
  };

  const saveTexto = async () => {
    if (!textoForm.titulo || !textoForm.categoria) return;
    const payload = {
      ordem: textoForm.ordem, categoria: textoForm.categoria, titulo: textoForm.titulo,
      lead: textoForm.lead, corpo: textoForm.corpo, referencias: textoForm.referencias as any, ativo: textoForm.ativo,
    };
    const { error } = editingTextoId
      ? await supabase.from("textos").update(payload).eq("id", editingTextoId)
      : await supabase.from("textos").insert(payload);
    if (error) toast({ title: "Erro ao guardar", variant: "destructive" });
    else { toast({ title: "Guardado ✓" }); setShowTextoForm(false); setEditingTextoId(null); setTextoForm(emptyTexto()); fetchAll(); }
  };

  const deleteTexto = async (id: string) => {
    const { error } = await supabase.from("textos").delete().eq("id", id);
    if (error) toast({ title: "Erro ao apagar", variant: "destructive" });
    else { toast({ title: "Apagado ✓" }); fetchAll(); }
    setDeleteConfirm(null);
  };

  const addReferencia = () => {
    setTextoForm({ ...textoForm, referencias: [...textoForm.referencias, { label: "", url: "" }] });
  };

  const updateReferencia = (index: number, field: "label" | "url", value: string) => {
    const refs = [...textoForm.referencias];
    refs[index] = { ...refs[index], [field]: value };
    setTextoForm({ ...textoForm, referencias: refs });
  };

  const removeReferencia = (index: number) => {
    setTextoForm({ ...textoForm, referencias: textoForm.referencias.filter((_, i) => i !== index) });
  };

  // Guioes CRUD
  const openGuiaoForm = (g?: GuiaoRow) => {
    if (g) {
      setEditingGuiaoId(g.id);
      setGuiaoForm({ tema: g.tema, subtema: g.subtema, pergunta: g.pergunta, resposta: g.resposta, referencia_cientifica: g.referencia_cientifica, ordem: g.ordem });
    } else {
      setEditingGuiaoId(null);
      setGuiaoForm(emptyGuiao());
    }
    setShowGuiaoForm(true);
  };

  const saveGuiao = async () => {
    if (!guiaoForm.tema || !guiaoForm.pergunta) return;
    const payload = {
      tema: guiaoForm.tema, subtema: guiaoForm.subtema, pergunta: guiaoForm.pergunta,
      resposta: guiaoForm.resposta, referencia_cientifica: guiaoForm.referencia_cientifica, ordem: guiaoForm.ordem,
    };
    const { error } = editingGuiaoId
      ? await supabase.from("guioes").update(payload).eq("id", editingGuiaoId)
      : await supabase.from("guioes").insert(payload);
    if (error) toast({ title: "Erro ao guardar", variant: "destructive" });
    else { toast({ title: "Guardado ✓" }); setShowGuiaoForm(false); setEditingGuiaoId(null); setGuiaoForm(emptyGuiao()); fetchAll(); }
  };

  const deleteGuiao = async (id: string) => {
    const { error } = await supabase.from("guioes").delete().eq("id", id);
    if (error) toast({ title: "Erro ao apagar", variant: "destructive" });
    else { toast({ title: "Apagado ✓" }); fetchAll(); }
    setDeleteConfirm(null);
  };

  // Popups CRUD
  const openPopupForm = (p: PopupItem) => {
    setEditingPopupId(p.id);
    setPopupForm({ eyebrow: p.eyebrow, title: p.title, text: p.text });
  };

  const savePopup = async () => {
    if (!editingPopupId) return;
    const { error } = await supabase.from("plataforma_popups").update({
      eyebrow: popupForm.eyebrow, title: popupForm.title, text: popupForm.text,
    }).eq("id", editingPopupId);
    if (error) toast({ title: "Erro ao guardar", variant: "destructive" });
    else { toast({ title: "Guardado ✓" }); setEditingPopupId(null); setPopupForm({ eyebrow: "", title: "", text: "" }); fetchAll(); }
  };

  // Sobre CRUD
  const openSobreForm = (item: SobreItem) => {
    const fallback = fallbackSobreContent[item.id] || { titulo: item.titulo, conteudo: item.conteudo };
    setEditingSobreId(item.id);
    setSobreForm({
      titulo: item.titulo || fallback.titulo,
      conteudo: item.conteudo || fallback.conteudo,
    });
  };

  const saveSobre = async () => {
    if (!editingSobreId) return;
    const existing = sobreItems.find((s) => s.id === editingSobreId);
    const payload = { id: editingSobreId, titulo: sobreForm.titulo, conteudo: sobreForm.conteudo };
    const { error } = existing
      ? await supabase.from("sobre_conteudo").update({ titulo: sobreForm.titulo, conteudo: sobreForm.conteudo }).eq("id", editingSobreId)
      : await supabase.from("sobre_conteudo").insert(payload);
    if (error) toast({ title: "Erro ao guardar", variant: "destructive" });
    else { toast({ title: "Guardado ✓" }); setEditingSobreId(null); setSobreForm({ titulo: "", conteudo: "" }); fetchAll(); }
  };

  const filteredGuioes = guiaoFilter === "TODOS" ? guioes : guioes.filter((g) => g.tema === guiaoFilter);

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans">
        <div className="w-full max-w-sm p-8">
          <h1 className="text-2xl font-bold text-[hsl(240,100%,50%)] mb-2 tracking-tight">REPORTAGEM VIVA</h1>
          <p className="text-sm text-muted-foreground mb-8">Admin</p>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className={`border-foreground/30 focus:border-foreground ${passwordError ? "border-red-500" : ""}`}
            />
            {passwordError && <p className="text-sm text-red-500">Password incorrecta</p>}
            <Button onClick={handleLogin} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Entrar</Button>
          </div>
        </div>
      </div>
    );
  }

  const tabTriggerClass = "rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground px-4 py-2";

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="border-b border-foreground/20 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">REPORTAGEM VIVA</h1>
          <p className="text-sm text-muted-foreground">Admin</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="border-foreground/30 text-foreground hover:bg-foreground/5">
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </Button>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        <Tabs defaultValue="keywords" className="w-full">
          <TabsList className="mb-6 bg-transparent border-b border-foreground/20 rounded-none w-full justify-start p-0 h-auto">
            <TabsTrigger value="keywords" className={tabTriggerClass}>KEYWORDS</TabsTrigger>
            <TabsTrigger value="debunking" className={tabTriggerClass}>DEBUNKING</TabsTrigger>
            <TabsTrigger value="news" className={tabTriggerClass}>NOTÍCIAS</TabsTrigger>
            <TabsTrigger value="textos" className={tabTriggerClass}>TEXTOS</TabsTrigger>
            <TabsTrigger value="guioes" className={tabTriggerClass}>GUIÕES</TabsTrigger>
            <TabsTrigger value="popups" className={tabTriggerClass}>PLATAFORMA</TabsTrigger>
            <TabsTrigger value="sobre" className={tabTriggerClass}>SOBRE</TabsTrigger>
            <TabsTrigger value="bookmarks" className={tabTriggerClass}>BOOKMARKS</TabsTrigger>
            <TabsTrigger value="benchmark" className={tabTriggerClass}>BENCHMARK</TabsTrigger>
              <TabsTrigger value="revisao-pares" className={tabTriggerClass}>REVISAO PARES</TabsTrigger>
          </TabsList>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Keywords ({keywords.length})</h2>
              <Button onClick={() => openKeywordForm()} className="bg-primary hover:bg-primary/90" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Adicionar keyword
              </Button>
            </div>
            {showKeywordForm && (
              <div className="border border-foreground/20 p-4 mb-4 space-y-3">
                {editingKeywordId && <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">A editar keyword</p>}
                <Input placeholder="Keyword" value={newKeyword.term} onChange={(e) => setNewKeyword({ ...newKeyword, term: e.target.value })} />
                <Select value={newKeyword.axis} onValueChange={(v) => setNewKeyword({ ...newKeyword, axis: v })}>
                  <SelectTrigger><SelectValue placeholder="Tema" /></SelectTrigger>
                  <SelectContent>{AXES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch checked={newKeyword.is_active} onCheckedChange={(c) => setNewKeyword({ ...newKeyword, is_active: c })} />
                  <span className="text-sm">Ativo</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveKeyword} className="bg-primary hover:bg-primary/90" size="sm">Guardar</Button>
                  <Button onClick={() => { setShowKeywordForm(false); setEditingKeywordId(null); setNewKeyword({ term: "", axis: "", is_active: true }); }} variant="outline" size="sm">Cancelar</Button>
                </div>
              </div>
            )}
            <div className="border border-foreground/20 max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-foreground/20">
                    <TableHead>Keyword</TableHead><TableHead>Tema</TableHead><TableHead>Ativo</TableHead><TableHead className="w-28"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.map((kw) => (
                    <TableRow key={kw.id} className="border-b border-foreground/10">
                      <TableCell className="font-medium">{kw.term}</TableCell>
                      <TableCell>{kw.axis}</TableCell>
                      <TableCell>{kw.is_active ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-500" />}</TableCell>
                      <TableCell>
                        {deleteConfirm?.type === "keyword" && deleteConfirm.id === kw.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="destructive" onClick={() => deleteKeyword(kw.id)}>Sim</Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>Não</Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openKeywordForm(kw)}><Pencil className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "keyword", id: kw.id })}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Debunking Tab */}
          <TabsContent value="debunking" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Debunking ({debunking.length})</h2>
              <Button onClick={() => openDebunkForm()} className="bg-primary hover:bg-primary/90" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Adicionar mito
              </Button>
            </div>
            {showDebunkForm && (
              <div className="border border-foreground/20 p-4 mb-4 space-y-3">
                {editingDebunkId && <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">A editar mito</p>}
                <Input placeholder="Título do mito" value={newDebunk.title} onChange={(e) => setNewDebunk({ ...newDebunk, title: e.target.value })} />
                <Textarea placeholder="Classificação (ex: FALSO, ENGANADOR)" value={newDebunk.classification} onChange={(e) => setNewDebunk({ ...newDebunk, classification: e.target.value })} />
                <Input placeholder="Fonte (ex: DGS, 2024)" value={newDebunk.source} onChange={(e) => setNewDebunk({ ...newDebunk, source: e.target.value })} />
                <Input placeholder="URL da fonte" value={newDebunk.url} onChange={(e) => setNewDebunk({ ...newDebunk, url: e.target.value })} />
                <Input placeholder="Termo relacionado" value={newDebunk.term} onChange={(e) => setNewDebunk({ ...newDebunk, term: e.target.value })} />
                <div className="flex gap-2">
                  <Button onClick={saveDebunk} className="bg-primary hover:bg-primary/90" size="sm">Guardar</Button>
                  <Button onClick={() => { setShowDebunkForm(false); setEditingDebunkId(null); setNewDebunk({ title: "", term: "", source: "", classification: "FALSO", url: "" }); }} variant="outline" size="sm">Cancelar</Button>
                </div>
              </div>
            )}
            <div className="border border-foreground/20 max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-foreground/20">
                    <TableHead>Título</TableHead><TableHead>Tema</TableHead><TableHead>Fonte</TableHead><TableHead className="w-28"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debunking.map((item) => (
                    <TableRow key={item.id} className="border-b border-foreground/10">
                      <TableCell className="font-medium max-w-xs truncate">{item.title}</TableCell>
                      <TableCell>{item.term}</TableCell>
                      <TableCell>{item.source}</TableCell>
                      <TableCell>
                        {deleteConfirm?.type === "debunk" && deleteConfirm.id === item.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="destructive" onClick={() => deleteDebunk(item.id)}>Sim</Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>Não</Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openDebunkForm(item)}><Pencil className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "debunk", id: item.id })}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Notícias ({news.length})</h2>
              <Button onClick={() => openNewsForm()} className="bg-primary hover:bg-primary/90" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Adicionar notícia
              </Button>
            </div>
            {showNewsForm && (
              <div className="border border-foreground/20 p-4 mb-4 space-y-3">
                {editingNewsId && <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">A editar notícia</p>}
                <Input placeholder="Título" value={newNews.title} onChange={(e) => setNewNews({ ...newNews, title: e.target.value })} />
                <Input placeholder="URL" value={newNews.url} onChange={(e) => setNewNews({ ...newNews, url: e.target.value })} />
                <Input placeholder="Fonte (ex: Público, DGS)" value={newNews.outlet} onChange={(e) => setNewNews({ ...newNews, outlet: e.target.value })} />
                <Select value={newNews.source_type} onValueChange={(v) => setNewNews({ ...newNews, source_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>{SOURCE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={newNews.related_term} onValueChange={(v) => setNewNews({ ...newNews, related_term: v })}>
                  <SelectTrigger><SelectValue placeholder="Tema" /></SelectTrigger>
                  <SelectContent>{AXES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
                {editingNewsId && editingNewsOriginalTerm && !["saude-mental","alimentacao","menopausa","emergentes"].includes(editingNewsOriginalTerm) && (
                  <p className="text-[10px] text-muted-foreground">Termo original: <span className="font-mono">{editingNewsOriginalTerm}</span></p>
                )}
                <Input type="date" value={newNews.date} onChange={(e) => setNewNews({ ...newNews, date: e.target.value })} />
                <div className="flex gap-2">
                  <Button onClick={saveNews} className="bg-primary hover:bg-primary/90" size="sm">Guardar</Button>
                  <Button onClick={() => { setShowNewsForm(false); setEditingNewsId(null); setEditingNewsOriginalTerm(""); setNewNews({ title: "", url: "", outlet: "", source_type: "media", related_term: "", date: "" }); }} variant="outline" size="sm">Cancelar</Button>
                </div>
              </div>
            )}
            <div className="border border-foreground/20 max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-foreground/20">
                    <TableHead>Título</TableHead><TableHead>Fonte</TableHead><TableHead>Data</TableHead><TableHead>Tema</TableHead><TableHead className="w-28"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {news.map((item) => (
                    <TableRow key={item.id} className="border-b border-foreground/10">
                      <TableCell className="font-medium max-w-xs truncate">{item.title}</TableCell>
                      <TableCell>{item.outlet}</TableCell>
                      <TableCell>{new Date(item.date).toLocaleDateString("pt-PT")}</TableCell>
                      <TableCell>{item.related_term}</TableCell>
                      <TableCell>
                        {deleteConfirm?.type === "news" && deleteConfirm.id === item.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="destructive" onClick={() => deleteNews(item.id)}>Sim</Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>Não</Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openNewsForm(item)}><Pencil className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "news", id: item.id })}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Textos Tab */}
          <TabsContent value="textos" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Textos ({textos.length})</h2>
              <Button onClick={() => openTextoForm()} className="bg-primary hover:bg-primary/90" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Adicionar texto
              </Button>
            </div>

            {showTextoForm && (
              <div className="border border-foreground/20 p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Ordem" value={textoForm.ordem || ""} onChange={(e) => setTextoForm({ ...textoForm, ordem: parseInt(e.target.value) || 0 })} />
                  <Input placeholder="Categoria (ex: ENQUADRAMENTO)" value={textoForm.categoria} onChange={(e) => setTextoForm({ ...textoForm, categoria: e.target.value })} />
                </div>
                <Input placeholder="Título" value={textoForm.titulo} onChange={(e) => setTextoForm({ ...textoForm, titulo: e.target.value })} />
                <Textarea placeholder="Lead" rows={2} value={textoForm.lead} onChange={(e) => setTextoForm({ ...textoForm, lead: e.target.value })} />
                <Textarea placeholder="Corpo do texto" rows={8} value={textoForm.corpo} onChange={(e) => setTextoForm({ ...textoForm, corpo: e.target.value })} />
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Referências</p>
                  {textoForm.referencias.map((ref, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Input placeholder="Label" value={ref.label} onChange={(e) => updateReferencia(i, "label", e.target.value)} className="flex-1" />
                      <Input placeholder="URL (opcional)" value={ref.url} onChange={(e) => updateReferencia(i, "url", e.target.value)} className="flex-1" />
                      <Button size="sm" variant="ghost" onClick={() => removeReferencia(i)}><X className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={addReferencia}><Plus className="w-4 h-4 mr-1" /> Adicionar referência</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={textoForm.ativo} onCheckedChange={(c) => setTextoForm({ ...textoForm, ativo: c })} />
                  <span className="text-sm">Ativo</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveTexto} className="bg-primary hover:bg-primary/90" size="sm">Guardar</Button>
                  <Button onClick={() => { setShowTextoForm(false); setEditingTextoId(null); setTextoForm(emptyTexto()); }} variant="outline" size="sm">Cancelar</Button>
                </div>
              </div>
            )}

            <div className="border border-foreground/20 max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-foreground/20">
                    <TableHead className="w-16">Ordem</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="w-28"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {textos.map((t) => (
                    <TableRow key={t.id} className="border-b border-foreground/10">
                      <TableCell>{t.ordem}</TableCell>
                      <TableCell className="font-medium">{t.titulo}</TableCell>
                      <TableCell>{t.categoria}</TableCell>
                      <TableCell>{t.ativo ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-500" />}</TableCell>
                      <TableCell>
                        {deleteConfirm?.type === "texto" && deleteConfirm.id === t.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="destructive" onClick={() => deleteTexto(t.id)}>Sim</Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>Não</Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openTextoForm(t)}><Pencil className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "texto", id: t.id })}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Guiões Tab */}
          <TabsContent value="guioes" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Guiões ({guioes.length})</h2>
              <Button onClick={() => openGuiaoForm()} className="bg-primary hover:bg-primary/90" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Nova Pergunta
              </Button>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-4">
              {[{ value: "TODOS", label: "TODOS" }, ...TEMAS_GUIOES].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setGuiaoFilter(f.value)}
                  className={`text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-1 border transition-colors ${
                    guiaoFilter === f.value ? "border-foreground text-foreground" : "border-foreground/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {showGuiaoForm && (
              <div className="border border-foreground/20 p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Select value={guiaoForm.tema} onValueChange={(v) => setGuiaoForm({ ...guiaoForm, tema: v })}>
                    <SelectTrigger><SelectValue placeholder="Tema" /></SelectTrigger>
                    <SelectContent>{TEMAS_GUIOES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Sub-tema" value={guiaoForm.subtema} onChange={(e) => setGuiaoForm({ ...guiaoForm, subtema: e.target.value })} />
                </div>
                <Textarea placeholder="Pergunta" rows={2} value={guiaoForm.pergunta} onChange={(e) => setGuiaoForm({ ...guiaoForm, pergunta: e.target.value })} />
                <Textarea placeholder="Resposta simples" rows={2} value={guiaoForm.resposta} onChange={(e) => setGuiaoForm({ ...guiaoForm, resposta: e.target.value })} />
                <Textarea placeholder="Referência científica" rows={2} value={guiaoForm.referencia_cientifica} onChange={(e) => setGuiaoForm({ ...guiaoForm, referencia_cientifica: e.target.value })} />
                <Input type="number" placeholder="Ordem" value={guiaoForm.ordem || ""} onChange={(e) => setGuiaoForm({ ...guiaoForm, ordem: parseInt(e.target.value) || 0 })} />
                <div className="flex gap-2">
                  <Button onClick={saveGuiao} className="bg-primary hover:bg-primary/90" size="sm">Guardar</Button>
                  <Button onClick={() => { setShowGuiaoForm(false); setEditingGuiaoId(null); setGuiaoForm(emptyGuiao()); }} variant="outline" size="sm">Cancelar</Button>
                </div>
              </div>
            )}

            <div className="border border-foreground/20 max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-foreground/20">
                    <TableHead>Tema</TableHead>
                    <TableHead>Sub-tema</TableHead>
                    <TableHead>Pergunta</TableHead>
                    <TableHead>Resposta</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead className="w-28"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGuioes.map((g) => (
                    <TableRow key={g.id} className="border-b border-foreground/10">
                      <TableCell className="text-xs">{g.tema}</TableCell>
                      <TableCell className="text-xs">{g.subtema}</TableCell>
                      <TableCell className="text-xs font-medium max-w-xs">{g.pergunta}</TableCell>
                      <TableCell className="text-xs max-w-xs">{g.resposta}</TableCell>
                      <TableCell className="text-xs max-w-xs italic">{g.referencia_cientifica}</TableCell>
                      <TableCell>
                        {deleteConfirm?.type === "guiao" && deleteConfirm.id === g.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="destructive" onClick={() => deleteGuiao(g.id)}>Sim</Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>Não</Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openGuiaoForm(g)}><Pencil className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "guiao", id: g.id })}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Plataforma Popups Tab */}
          <TabsContent value="popups" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Pop-ups da Plataforma ({popups.length})</h2>
            </div>

            {editingPopupId && (
              <div className="border border-foreground/20 p-4 mb-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">A editar: {editingPopupId}</p>
                <Input placeholder="Eyebrow (ex: Parceiros Institucionais)" value={popupForm.eyebrow} onChange={(e) => setPopupForm({ ...popupForm, eyebrow: e.target.value })} />
                <Input placeholder="Título" value={popupForm.title} onChange={(e) => setPopupForm({ ...popupForm, title: e.target.value })} />
                <Textarea placeholder="Texto descritivo" rows={4} value={popupForm.text} onChange={(e) => setPopupForm({ ...popupForm, text: e.target.value })} />
                <div className="flex gap-2">
                  <Button onClick={savePopup} className="bg-primary hover:bg-primary/90" size="sm">Guardar</Button>
                  <Button onClick={() => { setEditingPopupId(null); setPopupForm({ eyebrow: "", title: "", text: "" }); }} variant="outline" size="sm">Cancelar</Button>
                </div>
              </div>
            )}

            <div className="border border-foreground/20 max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-foreground/20">
                    <TableHead className="w-24">ID</TableHead>
                    <TableHead>Eyebrow</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead className="max-w-xs">Texto</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {popups.map((p) => (
                    <TableRow key={p.id} className="border-b border-foreground/10">
                      <TableCell className="text-xs font-mono">{p.id}</TableCell>
                      <TableCell className="text-xs">{p.eyebrow}</TableCell>
                      <TableCell className="text-xs font-medium">{p.title}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{p.text}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => openPopupForm(p)}><Pencil className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Sobre Tab */}
          <TabsContent value="sobre" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Conteúdo da página Sobre ({sobreItems.length} blocos guardados)</h2>
            </div>

            {editingSobreId && (
              <div className="border border-foreground/20 p-4 mb-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">A editar: {SOBRE_BLOCKS.find(b => b.id === editingSobreId)?.label || editingSobreId}</p>
                <Input placeholder="Título da secção" value={sobreForm.titulo} onChange={(e) => setSobreForm({ ...sobreForm, titulo: e.target.value })} />
                <Textarea placeholder="Conteúdo (texto livre, usar &#10; para nova linha)" rows={10} value={sobreForm.conteudo} onChange={(e) => setSobreForm({ ...sobreForm, conteudo: e.target.value })} />
                <p className="text-[10px] text-muted-foreground">
                  Dica: Para "OS 4 EIXOS" e "COMO FUNCIONA", use o formato TÍTULO|descrição por linha. Para "PARA QUE SERVE", uma frase por linha.
                </p>
                <div className="flex gap-2">
                  <Button onClick={saveSobre} className="bg-primary hover:bg-primary/90" size="sm">Guardar</Button>
                  <Button onClick={() => { setEditingSobreId(null); setSobreForm({ titulo: "", conteudo: "" }); }} variant="outline" size="sm">Cancelar</Button>
                </div>
              </div>
            )}

            <div className="border border-foreground/20">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-foreground/20">
                    <TableHead className="w-40">Bloco</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Conteúdo (preview)</TableHead>
                    <TableHead className="w-24">Estado</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SOBRE_BLOCKS.map((block) => {
                    const saved = sobreItems.find((s) => s.id === block.id);
                    return (
                      <TableRow key={block.id} className="border-b border-foreground/10">
                        <TableCell className="text-xs font-bold">{block.label}</TableCell>
                        <TableCell className="text-xs">{saved?.titulo || "—"}</TableCell>
                        <TableCell className="text-xs max-w-xs truncate">{saved?.conteudo?.slice(0, 80) || "— (fallback)"}</TableCell>
                        <TableCell className="text-xs">
                          {saved ? <span className="text-green-600 font-medium">Guardado</span> : <span className="text-muted-foreground">Fallback</span>}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              openSobreForm(
                                saved || {
                                  id: block.id,
                                  titulo: fallbackSobreContent[block.id]?.titulo || block.label,
                                  conteudo: fallbackSobreContent[block.id]?.conteudo || "",
                                }
                              )
                            }
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Bookmarks Tab */}
          <TabsContent value="bookmarks" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Bookmarks ({bookmarksList.length})</h2>
              <Button onClick={() => openBookmarkForm()} className="bg-primary hover:bg-primary/90" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Adicionar bookmark
              </Button>
            </div>
            {showBookmarkForm && (
              <div className="border border-foreground/20 p-4 mb-4 space-y-3">
                {editingBookmarkId && <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">A editar bookmark</p>}
                <Input placeholder="Título" value={bookmarkForm.titulo} onChange={(e) => setBookmarkForm({ ...bookmarkForm, titulo: e.target.value })} />
                <Input placeholder="URL" value={bookmarkForm.url} onChange={(e) => setBookmarkForm({ ...bookmarkForm, url: e.target.value })} />
                <Input placeholder="Fonte (ex: Pordata, Público)" value={bookmarkForm.fonte} onChange={(e) => setBookmarkForm({ ...bookmarkForm, fonte: e.target.value })} />
                <Select value={bookmarkForm.categoria} onValueChange={(v) => setBookmarkForm({ ...bookmarkForm, categoria: v })}>
                  <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>{BOOKMARK_CATEGORIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
                <Textarea placeholder="Notas (opcional)" value={bookmarkForm.notas} onChange={(e) => setBookmarkForm({ ...bookmarkForm, notas: e.target.value })} rows={2} />
                <Input placeholder="Ordem" type="number" value={bookmarkForm.ordem} onChange={(e) => setBookmarkForm({ ...bookmarkForm, ordem: parseInt(e.target.value) || 0 })} />
                <div className="flex gap-2">
                  <Button onClick={saveBookmark} className="bg-primary hover:bg-primary/90" size="sm">Guardar</Button>
                  <Button onClick={() => { setShowBookmarkForm(false); setEditingBookmarkId(null); setBookmarkForm({ url: "", titulo: "", fonte: "", categoria: "", notas: "", ordem: 0 }); }} variant="outline" size="sm">Cancelar</Button>
                </div>
              </div>
            )}
            <div className="border border-foreground/20 max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-foreground/20">
                    <TableHead>Título</TableHead><TableHead>Fonte</TableHead><TableHead>Categoria</TableHead><TableHead className="w-28"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookmarksList.map((bk) => (
                    <TableRow key={bk.id} className="border-b border-foreground/10">
                      <TableCell className="font-medium text-sm">{bk.titulo}</TableCell>
                      <TableCell className="text-xs">{bk.fonte}</TableCell>
                      <TableCell className="text-xs">{BOOKMARK_CATEGORIAS.find(c => c.value === bk.categoria)?.label || bk.categoria}</TableCell>
                      <TableCell>
                        {deleteConfirm?.type === "bookmark" && deleteConfirm.id === bk.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="destructive" onClick={() => deleteBookmark(bk.id)}>Sim</Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>Não</Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openBookmarkForm(bk)}><Pencil className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "bookmark", id: bk.id })}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Benchmark Tab */}
          <TabsContent value="benchmark" className="mt-0">
            <BenchmarkAdminTab />
          </TabsContent>
          <TabsContent value="revisao-pares" className="mt-0">
            <RevisaoPareAdmin />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
