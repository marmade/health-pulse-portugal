import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { generateBriefingPdf } from "@/lib/briefingPdfExport";
import { getTopQuestionsPerAxis } from "@/data/healthQuestions";
import { getAxisColors } from "@/lib/axisColors";
import { toast } from "sonner";

type KeywordRow = {
  term: string;
  axis: string;
  current_volume: number;
  previous_volume: number;
  change_percent: number;
  is_emergent: boolean;
};

type NewsRow = {
  title: string;
  outlet: string;
  date: string;
  url: string;
  source_type: string;
};

type DebunkingRow = {
  term: string;
  title: string;
  classification: string;
  source: string;
  url: string;
};

type ArchivedBriefing = {
  id: string;
  week_start: string;
  week_end: string;
  week_label: string;
  top_emerging: any[];
  top_questions: any[];
  top_debunking: any[];
  top_news: any[];
  created_at: string;
};

type DizQueDisse = {
  perguntas_voxpop: string[];
  especialista_sugerido: string;
  justificacao: string;
  fonte_cientifica: string;
  fonte_url: string;
};

const axisLabels: Record<string, string> = {
  "saude-mental": "Saúde Mental",
  alimentacao: "Alimentação",
  menopausa: "Menopausa",
  emergentes: "Emergentes",
};

const sourceTypeBadge: Record<string, string> = {
  institucional: "INST",
  media: "MEDIA",
  "fact-check": "FC",
};

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });

  const fmtShort = (d: Date) =>
    d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });

  return {
    start: monday,
    end: sunday,
    label: `${fmt(monday)} — ${fmt(sunday)} ${now.getFullYear()}`,
    shortLabel: `${fmtShort(monday)} — ${fmtShort(sunday)} ${now.getFullYear()}`,
    isoStart: monday.toISOString().split("T")[0],
    isoEnd: sunday.toISOString().split("T")[0],
  };
}

function getPreviousWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) - 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmtShort = (d: Date) =>
    d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });

  return {
    isoStart: monday.toISOString().split("T")[0],
    isoEnd: sunday.toISOString().split("T")[0],
    shortLabel: `${fmtShort(monday)} — ${fmtShort(sunday)} ${monday.getFullYear()}`,
  };
}

const Briefing = () => {
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [debunking, setDebunking] = useState<DebunkingRow[]>([]);
  const [healthQuestionsData, setHealthQuestionsData] = useState<{question: string; growth_percent: number; relative_volume: number; axis: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedAt] = useState(new Date());
  const [exporting, setExporting] = useState(false);
  const [archives, setArchives] = useState<ArchivedBriefing[]>([]);
  const [expandedArchive, setExpandedArchive] = useState<string | null>(null);
  const [dizQueDisse, setDizQueDisse] = useState<DizQueDisse | null>(null);
  const [dizQueDisseLoading, setDizQueDisseLoading] = useState(false);
  const [dizQueDisseError, setDizQueDisseError] = useState(false);

  const week = getWeekRange();

  useEffect(() => {
    const fetchData = async () => {
      const [kwRes, newsRes, debunkRes, archiveRes, hqRes] = await Promise.all([
        supabase.from("keywords").select("*").eq("is_active", true),
        supabase.from("news_items").select("*").order("date", { ascending: false }).limit(3),
        supabase.from("debunking").select("*").order("created_at", { ascending: false }).limit(1),
        supabase.from("briefings_archive").select("*").order("week_start", { ascending: false }),
        supabase.from("health_questions").select("question, growth_percent, relative_volume, axis").order("growth_percent", { ascending: false }).limit(5),
      ]);

      if (kwRes.data) setKeywords(kwRes.data as KeywordRow[]);
      if (newsRes.data) setNews(newsRes.data as NewsRow[]);
      if (debunkRes.data) setDebunking(debunkRes.data as DebunkingRow[]);
      if (archiveRes.data) setArchives(archiveRes.data as ArchivedBriefing[]);
      if (hqRes.data && hqRes.data.length > 0) setHealthQuestionsData(hqRes.data as {question: string; growth_percent: number; relative_volume: number; axis: string}[]);
      setLoading(false);

      // Auto-archive previous week silently
      autoArchivePreviousWeek(
        kwRes.data as KeywordRow[] || [],
        newsRes.data as NewsRow[] || [],
        debunkRes.data as DebunkingRow[] || [],
        archiveRes.data as ArchivedBriefing[] || [],
      );
    };
    fetchData();
  }, []);

  // Fetch Diz Que Disse when keywords are loaded
  useEffect(() => {
    if (keywords.length === 0) return;

    const emergent = keywords.filter((k) => k.is_emergent);
    const topGrowing = [...keywords].sort((a, b) => b.change_percent - a.change_percent);
    const topKeyword = emergent.length > 0
      ? emergent.sort((a, b) => b.change_percent - a.change_percent)[0]
      : topGrowing[0];

    if (!topKeyword) return;

    const fetchDizQueDisse = async () => {
      setDizQueDisseLoading(true);
      setDizQueDisseError(false);
      try {
        const { data, error } = await supabase.functions.invoke("generate-diz-que-disse", {
          body: { keyword: topKeyword.term },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setDizQueDisse(data as DizQueDisse);
      } catch (e) {
        console.error("Diz Que Disse error:", e);
        setDizQueDisseError(true);
      }
      setDizQueDisseLoading(false);
    };
    fetchDizQueDisse();
  }, [keywords]);

  const autoArchivePreviousWeek = async (
    kw: KeywordRow[],
    nws: NewsRow[],
    dbk: DebunkingRow[],
    existingArchives: ArchivedBriefing[],
  ) => {
    const prev = getPreviousWeekRange();
    const alreadyArchived = existingArchives.some((a) => a.week_start === prev.isoStart);
    if (alreadyArchived) return;

    const emergentKw = kw.filter((k) => k.is_emergent);
    const topQuestions = getTopQuestionsPerAxis(2).slice(0, 5);

    try {
      await supabase.from("briefings_archive").insert({
        week_start: prev.isoStart,
        week_end: prev.isoEnd,
        week_label: prev.shortLabel,
        top_emerging: emergentKw.slice(0, 5).map((k) => ({
          term: k.term,
          axis: k.axis,
          change_percent: k.change_percent,
        })),
        top_questions: topQuestions.map((q) => ({
          term: q.question,
          current_volume: q.relativeVolume,
        })),
        top_debunking: dbk.slice(0, 5).map((d) => ({
          term: d.term,
          title: d.title,
          classification: d.classification,
          source: d.source,
        })),
        top_news: nws.slice(0, 5).map((n) => ({
          title: n.title,
          outlet: n.outlet,
          date: n.date,
          source_type: n.source_type,
        })),
      });

      // Refresh archives silently
      const { data } = await supabase
        .from("briefings_archive")
        .select("*")
        .order("week_start", { ascending: false });
      if (data) setArchives(data as ArchivedBriefing[]);
    } catch (e) {
      console.error("Auto-archive error:", e);
    }
  };

  // Derived data
  const topGrowing = [...keywords]
    .sort((a, b) => b.change_percent - a.change_percent)
    .slice(0, 3);

  const emergent = keywords.filter((k) => k.is_emergent);

  const topVolume = healthQuestionsData.length > 0
    ? healthQuestionsData.map((q) => ({ term: q.question, current_volume: q.growth_percent }))
    : getTopQuestionsPerAxis(2).slice(0, 5).map((q) => ({ term: q.question, current_volume: q.relativeVolume }));

  const topEmergent = emergent.length > 0
    ? emergent.sort((a, b) => b.change_percent - a.change_percent)[0]
    : topGrowing[0];

  // PDF export
  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await generateBriefingPdf({
        weekLabel: week.label,
        generatedAt,
        topGrowing,
        emergent,
        topVolume,
        news,
        debunking,
        topEmergent,
        dizQueDisse,
      });
      toast.success("PDF exportado com sucesso");
    } catch {
      toast.error("Erro ao exportar PDF");
    }
    setExporting(false);
  };

  // Export archived briefing as PDF
  const handleArchivePdf = async (archive: ArchivedBriefing) => {
    await generateBriefingPdf({
      weekLabel: archive.week_label,
      generatedAt: new Date(archive.created_at),
      topGrowing: (archive.top_emerging || []).map((e: any) => ({
        ...e,
        current_volume: 0,
      })),
      emergent: archive.top_emerging || [],
      topVolume: archive.top_questions || [],
      news: (archive.top_news || []).map((n: any) => ({ ...n, url: "" })),
      debunking: (archive.top_debunking || []).map((d: any) => ({ ...d, url: "" })),
      topEmergent: archive.top_emerging?.[0] || null,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-foreground border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-xs uppercase tracking-wider opacity-60">A gerar briefing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader activePage="briefing" />

      {/* Header */}
      <section className="px-6 py-12 md:py-16">
        <p className="editorial-label mb-2">Briefing Semanal</p>
        <h1 className="text-2xl md:text-4xl font-bold tracking-[0.03em] leading-tight">
          Briefing Semanal
        </h1>
        <p className="text-xs font-medium tracking-wide uppercase mt-2 opacity-60">
          {week.label}
        </p>
        <p className="text-sm mt-3 opacity-80">
          O que está a acontecer esta semana em Portugal
        </p>

        {/* Action buttons — only Export PDF */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="text-[10px] font-bold uppercase tracking-[0.15em] border px-4 py-2 hover:bg-foreground hover:text-background transition-colors disabled:opacity-40"
            style={{ borderColor: "#0000FF", color: "#0000FF" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#0000FF";
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#0000FF";
            }}
          >
            {exporting ? "A exportar..." : "Exportar PDF"}
          </button>
        </div>
      </section>

      <div className="section-divider" />

      {/* SECTION 1 — O que está a subir */}
      <section className="px-6 py-10">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
          O que está a subir
        </h2>
        <div className="space-y-4 max-w-2xl">
          {topGrowing.map((kw, i) => (
            <div key={kw.term} className="flex items-baseline justify-between border-b border-foreground/10 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-semibold ml-3">{kw.term}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-50 ml-3">
                  {axisLabels[kw.axis] || kw.axis}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold">
                  +{Number(kw.change_percent).toFixed(0)}%
                </span>
                <span className="text-xs opacity-50 ml-2">
                  vol. {kw.current_volume}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* SECTION 2 — Sinal de alerta */}
      <section className="px-6 py-10">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
          Sinal de alerta
        </h2>
        {emergent.length === 0 ? (
          <p className="text-sm opacity-60">Nenhum sinal emergente esta semana.</p>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {emergent.map((kw) => {
              const c = getAxisColors(kw.axis);
              return (
              <div key={kw.term} className="flex items-center gap-3">
                <span className="tag-emergent">Emergente</span>
                <span className="text-sm font-semibold">{kw.term}</span>
                <span
                  className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                  style={{ backgroundColor: c.bg, color: c.text }}
                >
                  {axisLabels[kw.axis] || kw.axis}
                </span>
                <span className="text-xs font-bold ml-auto">
                  +{Number(kw.change_percent).toFixed(0)}%
                </span>
              </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="section-divider" />

      {/* SECTION 3 — Perguntas mais pesquisadas */}
      <section className="px-6 py-10">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
          Perguntas mais pesquisadas
        </h2>
        <p className="text-xs opacity-50 mb-6">As principais dúvidas dos portugueses</p>
        <div className="space-y-3 max-w-2xl">
          {topVolume.map((kw, i) => (
            <div key={kw.term} className="flex items-baseline justify-between border-b border-foreground/10 pb-3">
              <div>
                <span className="text-xs font-bold tabular-nums opacity-40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium ml-3">{kw.term}</span>
              </div>
              <span className="text-xs font-bold tabular-nums">
                +{kw.current_volume}%
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* SECTION 4 — O que os media dizem */}
      <section className="px-6 py-10">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
          O que os media dizem
        </h2>
        <div className="space-y-4 max-w-2xl">
          {news.map((item, i) => (
            <div key={i} className="border-b border-foreground/10 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider border border-foreground/30 px-1.5 py-0.5">
                  {sourceTypeBadge[item.source_type] || "MEDIA"}
                </span>
                <span className="text-[10px] uppercase tracking-wider opacity-50">
                  {item.outlet}
                </span>
                <span className="text-[10px] opacity-40 ml-auto">
                  {new Date(item.date).toLocaleDateString("pt-PT", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:opacity-70 transition-opacity"
              >
                {item.title}
              </a>
            </div>
          ))}
          {news.length === 0 && (
            <p className="text-sm opacity-60">Sem notícias esta semana.</p>
          )}
        </div>
      </section>

      <div className="section-divider" />

      {/* SECTION 5 — Mito da semana */}
      <section className="px-6 py-10">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
          Mito da semana
        </h2>
        {debunking.length > 0 ? (
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="tag-emergent">
                {debunking[0].classification}
              </span>
              <span className="text-[10px] uppercase tracking-wider opacity-50">
                {debunking[0].source}
              </span>
            </div>
            <p className="text-sm font-semibold mb-2">{debunking[0].title}</p>
            <p className="text-xs opacity-60 leading-relaxed">
              Tema relacionado: <span className="font-semibold">{debunking[0].term}</span>
            </p>
            <a
              href={debunking[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-wider font-bold mt-3 inline-block hover:opacity-70 transition-opacity"
            >
              Ver verificação →
            </a>
          </div>
        ) : (
          <p className="text-sm opacity-60">Sem mito registado esta semana.</p>
        )}
      </section>

      <div className="section-divider" />

      {/* SECTION 6 — Sugestão de conteúdo */}
      <section className="px-6 py-10">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
          Sugestão de conteúdo
        </h2>
        {topEmergent ? (
          <div className="max-w-2xl space-y-10">
            {/* Intro line */}
            <div className="border border-foreground/20 p-6">
              <p className="text-xs leading-relaxed">
                Esta semana vale a pena falar sobre{" "}
                <span className="font-bold">{topEmergent.term}</span> —{" "}
                {topEmergent.is_emergent
                  ? `sinal emergente com crescimento de +${Number(topEmergent.change_percent).toFixed(0)}%, sem histórico significativo no período anterior.`
                  : `crescimento de +${Number(topEmergent.change_percent).toFixed(0)}% no volume de pesquisa esta semana, indicando interesse crescente dos portugueses neste tema.`}
              </p>
            </div>

            {/* Perplexity-powered content — stacked layout */}
            {dizQueDisseLoading ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                <p className="text-xs opacity-60">A gerar sugestão...</p>
              </div>
            ) : dizQueDisse ? (
              <div className="space-y-10">
                {/* Perguntas VoxPop */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 pb-2 border-b border-primary/20 mb-4">
                    Perguntas VoxPop
                  </p>
                  <ol className="space-y-2">
                    {dizQueDisse.perguntas_voxpop.map((q, i) => (
                      <li key={i} className="text-xs leading-relaxed text-primary">
                        <span className="text-[10px] font-bold tabular-nums opacity-40 mr-2">{i + 1}.</span>
                        {q}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Revisão de Pares */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 pb-2 border-b border-primary/20 mb-4">
                    Revisão de Pares
                  </p>
                  <div className="border-l-2 pl-4" style={{ borderColor: "#0000FF" }}>
                    <p className="text-xs font-medium text-primary mb-2">{dizQueDisse.especialista_sugerido}</p>
                    <p className="text-xs font-normal leading-relaxed text-primary mb-2">{dizQueDisse.justificacao}</p>
                    {dizQueDisse.fonte_cientifica && (
                      <p className="text-[10px] text-primary/50">
                        Fonte:{" "}
                        {dizQueDisse.fonte_url ? (
                          <a
                            href={dizQueDisse.fonte_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:opacity-70"
                          >
                            {dizQueDisse.fonte_cientifica}
                          </a>
                        ) : (
                          dizQueDisse.fonte_cientifica
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-xs opacity-60">Sem sugestões esta semana.</p>
        )}
      </section>

      <div className="section-divider" />

      {/* ARCHIVE SECTION */}
      <section className="px-6 py-10">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
          Arquivo
        </h2>
        {archives.length === 0 ? (
          <p className="text-sm opacity-60">Nenhum briefing arquivado.</p>
        ) : (
          <div className="space-y-0 max-w-2xl">
            {archives.map((archive) => {
              const isExpanded = expandedArchive === archive.id;
              return (
                <div key={archive.id}>
                  <div className="flex items-center justify-between py-3 border-b border-foreground/10">
                    <span className="text-sm font-semibold">{archive.week_label}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedArchive(isExpanded ? null : archive.id)}
                        className="text-[9px] font-bold uppercase tracking-[0.15em] border px-3 py-1.5 transition-colors"
                        style={{ borderColor: "#0000FF", color: "#0000FF" }}
                      >
                        {isExpanded ? "Fechar" : "Ver"}
                      </button>
                      <button
                        onClick={() => handleArchivePdf(archive)}
                        className="text-[9px] font-bold uppercase tracking-[0.15em] border px-3 py-1.5 transition-colors"
                        style={{ borderColor: "#0000FF", color: "#0000FF" }}
                      >
                        PDF
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="py-6 pl-4 border-l-2 ml-2 mb-4" style={{ borderColor: "#0000FF" }}>
                      {/* Emerging */}
                      {archive.top_emerging?.length > 0 && (
                        <div className="mb-5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#0000FF" }}>
                            Sinais emergentes
                          </p>
                          {archive.top_emerging.map((e: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 mb-2">
                              <span className="tag-emergent">Emergente</span>
                              <span className="text-sm font-semibold">{e.term}</span>
                              <span className="text-[10px] uppercase tracking-wider opacity-50">
                                {axisLabels[e.axis] || e.axis}
                              </span>
                              <span className="text-xs font-bold ml-auto">
                                +{Number(e.change_percent).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Questions */}
                      {archive.top_questions?.length > 0 && (
                        <div className="mb-5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#0000FF" }}>
                            Perguntas mais pesquisadas
                          </p>
                          {archive.top_questions.map((q: any, i: number) => (
                            <div key={i} className="flex items-baseline justify-between mb-2">
                              <span className="text-sm">{q.term}</span>
                              <span className="text-xs font-bold tabular-nums">{q.current_volume}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* News */}
                      {archive.top_news?.length > 0 && (
                        <div className="mb-5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#0000FF" }}>
                            Media
                          </p>
                          {archive.top_news.map((n: any, i: number) => (
                            <div key={i} className="mb-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider border border-foreground/30 px-1.5 py-0.5 mr-2">
                                {sourceTypeBadge[n.source_type] || "MEDIA"}
                              </span>
                              <span className="text-sm">{n.title}</span>
                              <span className="text-[10px] opacity-50 ml-2">{n.outlet}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Debunking */}
                      {archive.top_debunking?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#0000FF" }}>
                            Debunking
                          </p>
                          {archive.top_debunking.map((d: any, i: number) => (
                            <div key={i} className="mb-2">
                              <span className="tag-emergent mr-2">{d.classification}</span>
                              <span className="text-sm">{d.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="section-divider" />

      {/* Footer */}
      <footer className="px-6 py-8">
        <p className="text-[10px] uppercase tracking-[0.15em] opacity-40">
          Gerado automaticamente a partir dos dados do Reportagem Viva ·{" "}
          {generatedAt.toLocaleDateString("pt-PT", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}{" "}
          {generatedAt.toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </footer>
    </div>
  );
};

export default Briefing;
