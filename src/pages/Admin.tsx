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

const ADMIN_PASSWORD = "healthpulse2026";
const AXES = ["Saúde Mental", "Alimentação", "Menopausa", "Emergentes"];
const SOURCE_TYPES = [
  { value: "institutional", label: "🏥 INST" },
  { value: "media", label: "📰 MEDIA" },
  { value: "fact-check", label: "🔍 FC" },
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

const emptyTexto = (): Omit<TextoItem, "id"> => ({
  ordem: 0,
  categoria: "",
  titulo: "",
  lead: "",
  corpo: "",
  referencias: [],
  ativo: true,
});

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  // Keywords state
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [showKeywordForm, setShowKeywordForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState({ term: "", axis: "", is_active: true });

  // Debunking state
  const [debunking, setDebunking] = useState<DebunkingItem[]>([]);
  const [showDebunkForm, setShowDebunkForm] = useState(false);
  const [newDebunk, setNewDebunk] = useState({ title: "", term: "", source: "", classification: "FALSO", url: "" });

  // News state
  const [news, setNews] = useState<NewsItem[]>([]);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newNews, setNewNews] = useState({ title: "", url: "", outlet: "", source_type: "media", related_term: "", date: "" });

  // Textos state
  const [textos, setTextos] = useState<TextoItem[]>([]);
  const [showTextoForm, setShowTextoForm] = useState(false);
  const [editingTextoId, setEditingTextoId] = useState<string | null>(null);
  const [textoForm, setTextoForm] = useState<Omit<TextoItem, "id">>(emptyTexto());

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
    const [kw, db, nw, tx] = await Promise.all([
      supabase.from("keywords").select("id, term, axis, is_active").order("term"),
      supabase.from("debunking").select("*").order("created_at", { ascending: false }),
      supabase.from("news_items").select("*").order("date", { ascending: false }).limit(100),
      supabase.from("textos").select("*").order("ordem"),
    ]);
    if (kw.data) setKeywords(kw.data);
    if (db.data) setDebunking(db.data);
    if (nw.data) setNews(nw.data);
    if (tx.data) setTextos(tx.data.map((t: any) => ({ ...t, referencias: t.referencias || [] })));
  };

  // Keywords CRUD
  const addKeyword = async () => {
    if (!newKeyword.term || !newKeyword.axis) return;
    const { error } = await supabase.from("keywords").insert({
      term: newKeyword.term, axis: newKeyword.axis, is_active: newKeyword.is_active,
      category: newKeyword.axis, source: "manual", synonyms: [],
    });
    if (error) { toast({ title: "Erro ao guardar", variant: "destructive" }); }
    else { toast({ title: "Guardado ✓" }); setNewKeyword({ term: "", axis: "", is_active: true }); setShowKeywordForm(false); fetchAll(); }
  };

  const deleteKeyword = async (id: string) => {
    const { error } = await supabase.from("keywords").delete().eq("id", id);
    if (error) toast({ title: "Erro ao apagar", variant: "destructive" });
    else { toast({ title: "Apagado ✓" }); fetchAll(); }
    setDeleteConfirm(null);
  };

  // Debunking CRUD
  const addDebunk = async () => {
    if (!newDebunk.title || !newDebunk.term) return;
    const { error } = await supabase.from("debunking").insert({
      title: newDebunk.title, term: newDebunk.term, source: newDebunk.source,
      classification: newDebunk.classification, url: newDebunk.url,
    });
    if (error) toast({ title: "Erro ao guardar", variant: "destructive" });
    else { toast({ title: "Guardado ✓" }); setNewDebunk({ title: "", term: "", source: "", classification: "FALSO", url: "" }); setShowDebunkForm(false); fetchAll(); }
  };

  const deleteDebunk = async (id: string) => {
    const { error } = await supabase.from("debunking").delete().eq("id", id);
    if (error) toast({ title: "Erro ao apagar", variant: "destructive" });
    else { toast({ title: "Apagado ✓" }); fetchAll(); }
    setDeleteConfirm(null);
  };

  // News CRUD
  const addNews = async () => {
    if (!newNews.title || !newNews.outlet || !newNews.date) return;
    const { error } = await supabase.from("news_items").insert({
      title: newNews.title, url: newNews.url, outlet: newNews.outlet,
      source_type: newNews.source_type, related_term: newNews.related_term || "geral", date: newNews.date,
    });
    if (error) toast({ title: "Erro ao guardar", variant: "destructive" });
    else { toast({ title: "Guardado ✓" }); setNewNews({ title: "", url: "", outlet: "", source_type: "media", related_term: "", date: "" }); setShowNewsForm(false); fetchAll(); }
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
      ordem: textoForm.ordem,
      categoria: textoForm.categoria,
      titulo: textoForm.titulo,
      lead: textoForm.lead,
      corpo: textoForm.corpo,
      referencias: textoForm.referencias as any,
      ativo: textoForm.ativo,
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
          </TabsList>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Keywords ({keywords.length})</h2>
              <Button onClick={() => setShowKeywordForm(!showKeywordForm)} className="bg-primary hover:bg-primary/90" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Adicionar keyword
              </Button>
            </div>
            {showKeywordForm && (
              <div className="border border-foreground/20 p-4 mb-4 space-y-3">
                <Input placeholder="Keyword" value={newKeyword.term} onChange={(e) => setNewKeyword({ ...newKeyword, term: e.target.value })} />
                <Select value={newKeyword.axis} onValueChange={(v) => setNewKeyword({ ...newKeyword, axis: v })}>
                  <SelectTrigger><SelectValue placeholder="Tema" /></SelectTrigger>
                  <SelectContent>{AXES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch checked={newKeyword.is_active} onCheckedChange={(c) => setNewKeyword({ ...newKeyword, is_active: c })} />
                  <span className="text-sm">Ativo</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addKeyword} className="bg-primary hover:bg-primary/90" size="sm">Guardar</Button>
                  <Button onClick={() => setShowKeywordForm(false)} variant="outline" size="sm">Cancelar</Button>
                </div>
              </div>
            )}
            <div className="border border-foreground/20 max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-foreground/20">
                    <TableHead>Keyword</TableHead><TableHead>Tema</TableHead><TableHead>Ativo</TableHead><TableHead className="w-20"></TableHead>
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
                          <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "keyword", id: kw.id })}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
              <Button onClick={() => setShowDebunkForm(!showDebunkForm)} className="bg-primary hover:bg-primary/90" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Adicionar mito
              </Button>
            </div>
            {showDebunkForm && (
              <div className="border border-foreground/20 p-4 mb-4 space-y-3">
                <Input placeholder="Título do mito" value={newDebunk.title} onChange={(e) => setNewDebunk({ ...newDebunk, title: e.target.value })} />
                <Textarea placeholder="Explicação / fact-check" value={newDebunk.classification} onChange={(e) => setNewDebunk({ ...newDebunk, classification: e.target.value })} />
                <Input placeholder="Fonte (ex: DGS, 2024)" value={newDebunk.source} onChange={(e) => setNewDebunk({ ...newDebunk, source: e.target.value })} />
                <Input placeholder="URL da fonte" value={newDebunk.url} onChange={(e) => setNewDebunk({ ...newDebunk, url: e.target.value })} />
                <Select value={newDebunk.term} onValueChange={(v) => setNewDebunk({ ...newDebunk, term: v })}>
                  <SelectTrigger><SelectValue placeholder="Tema" /></SelectTrigger>
                  <SelectContent>{AXES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={addDebunk} className="bg-primary hover:bg-primary/90" size="sm">Guardar</Button>
                  <Button onClick={() => setShowDebunkForm(false)} variant="outline" size="sm">Cancelar</Button>
                </div>
              </div>
            )}
            <div className="border border-foreground/20 max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-foreground/20">
                    <TableHead>Título</TableHead><TableHead>Tema</TableHead><TableHead>Fonte</TableHead><TableHead className="w-20"></TableHead>
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
                          <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "debunk", id: item.id })}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
              <Button onClick={() => setShowNewsForm(!showNewsForm)} className="bg-primary hover:bg-primary/90" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Adicionar notícia
              </Button>
            </div>
            {showNewsForm && (
              <div className="border border-foreground/20 p-4 mb-4 space-y-3">
                <Input placeholder="Título" value={newNews.title} onChange={(e) => setNewNews({ ...newNews, title: e.target.value })} />
                <Input placeholder="URL" value={newNews.url} onChange={(e) => setNewNews({ ...newNews, url: e.target.value })} />
                <Input placeholder="Fonte (ex: Público, DGS)" value={newNews.outlet} onChange={(e) => setNewNews({ ...newNews, outlet: e.target.value })} />
                <Select value={newNews.source_type} onValueChange={(v) => setNewNews({ ...newNews, source_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>{SOURCE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={newNews.related_term} onValueChange={(v) => setNewNews({ ...newNews, related_term: v })}>
                  <SelectTrigger><SelectValue placeholder="Tema" /></SelectTrigger>
                  <SelectContent>{AXES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="date" value={newNews.date} onChange={(e) => setNewNews({ ...newNews, date: e.target.value })} />
                <div className="flex gap-2">
                  <Button onClick={addNews} className="bg-primary hover:bg-primary/90" size="sm">Guardar</Button>
                  <Button onClick={() => setShowNewsForm(false)} variant="outline" size="sm">Cancelar</Button>
                </div>
              </div>
            )}
            <div className="border border-foreground/20 max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-foreground/20">
                    <TableHead>Título</TableHead><TableHead>Fonte</TableHead><TableHead>Data</TableHead><TableHead>Tema</TableHead><TableHead className="w-20"></TableHead>
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
                          <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "news", id: item.id })}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
                  <Input
                    type="number"
                    placeholder="Ordem"
                    value={textoForm.ordem || ""}
                    onChange={(e) => setTextoForm({ ...textoForm, ordem: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    placeholder="Categoria (ex: ENQUADRAMENTO)"
                    value={textoForm.categoria}
                    onChange={(e) => setTextoForm({ ...textoForm, categoria: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Título"
                  value={textoForm.titulo}
                  onChange={(e) => setTextoForm({ ...textoForm, titulo: e.target.value })}
                />
                <Textarea
                  placeholder="Lead"
                  rows={2}
                  value={textoForm.lead}
                  onChange={(e) => setTextoForm({ ...textoForm, lead: e.target.value })}
                />
                <Textarea
                  placeholder="Corpo do texto"
                  rows={8}
                  value={textoForm.corpo}
                  onChange={(e) => setTextoForm({ ...textoForm, corpo: e.target.value })}
                />

                {/* Referências */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Referências</p>
                  {textoForm.referencias.map((ref, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Input
                        placeholder="Label"
                        value={ref.label}
                        onChange={(e) => updateReferencia(i, "label", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="URL (opcional)"
                        value={ref.url}
                        onChange={(e) => updateReferencia(i, "url", e.target.value)}
                        className="flex-1"
                      />
                      <Button size="sm" variant="ghost" onClick={() => removeReferencia(i)}>
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={addReferencia}>
                    <Plus className="w-4 h-4 mr-1" /> Adicionar referência
                  </Button>
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
                            <Button size="sm" variant="ghost" onClick={() => openTextoForm(t)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "texto", id: t.id })}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
