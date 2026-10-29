import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { generateBriefingPdf } from "@/lib/briefingPdfExport";
import { semMeteorologicas } from "@/lib/noticias";
import { partesDosSinais, type ParteSinais } from "@/lib/sinaisEmergentes";
import { useSinaisDaSemana } from "@/hooks/useSinaisDaSemana";
import { intervaloDaSemana } from "../../supabase/functions/_shared/emergentes";
import {
  dataDaVerificacao, partesDaSemana, partesDosFactChecks, type PartesFactChecks,
} from "@/lib/factchecksBriefing";
import {
  fraseDaSubida, fraseDasVariantes, gruposDaRecolha, gruposDoArquivo, type GrupoPerguntas,
} from "@/lib/perguntasBriefing";
// Health questions are fetched from Supabase — no hardcoded fallback
import { getAxisColors } from "@/lib/axisColors";
import { toast } from "sonner";

type KeywordRow = {
  term: string;
  axis: string;
  current_volume: number;
  change_percent: number;
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
  explicacao: string | null;
  classification: string;
  source: string;
  url: string;
  data_publicacao: string | null;
  eixo: string | null;
  covid: boolean;
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
  // Desde 28/09/2026: a razão de cada secção vazia. Os arquivos anteriores têm {}.
  notas?: Record<string, string>;
  created_at: string;
};

// Uma secção do arquivo que ficou vazia mostra-se com a razão, em vez de desaparecer.
const SeccaoVazia = ({ titulo, nota }: { titulo: string; nota?: string }) =>
  nota ? (
    <div className="mb-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "#0000FF" }}>
        {titulo}
      </p>
      <p className="text-xs opacity-60">Vazio: {nota}.</p>
    </div>
  ) : null;

// Os "Sinais emergentes" em quatro partes (decisão da Marta, 28/10/2026). Só os novos levam a
// etiqueta "Emergente". Uma parte vazia diz-o na sua frase: a secção nunca sai em branco.
const SinaisEmergentes = ({ partes, semTitulo }: { partes: ParteSinais[]; semTitulo?: boolean }) => (
  <div className="mb-5">
    {!semTitulo && (
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#0000FF" }}>
        Sinais emergentes
      </p>
    )}
    {partes.map((p) => (
      <div key={p.chave} className="mb-3">
        <p className="text-[9px] font-bold uppercase tracking-wider mb-1 opacity-70">{p.titulo}</p>
        {p.ressalva && p.itens.length > 0 && <p className="text-[10px] opacity-60 mb-1">{p.ressalva}</p>}
        {p.itens.length === 0 && <p className="text-xs opacity-60">{p.nota}</p>}
        {p.itens.map((e, i) => (
          <div key={i} className="flex items-baseline flex-wrap gap-x-3 gap-y-1 mb-1.5">
            {p.chave === "novo" && <span className="tag-emergent">Emergente</span>}
            <span className="text-sm font-semibold">{e.term}</span>
            <span
              className="inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
              style={{ backgroundColor: getAxisColors(e.axis).bg, color: getAxisColors(e.axis).text }}
            >
              {axisLabels[e.axis] || e.axis}
            </span>
            <span className="text-xs opacity-70">{e.frase}</span>
          </div>
        ))}
      </div>
    ))}
  </div>
);

// Os fact-checks em duas partes (decisão da Marta, 29/10/2026): "Desta semana" e as 5
// "Anteriores", cada uma com data e veredicto. Ao lado da afirmação, o título da verificação:
// a afirmação sozinha às vezes não diz o que foi verificado.
const FactChecks = ({ titulo, partes }: { titulo: string; partes: PartesFactChecks }) => (
  <div className="mb-5">
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#0000FF" }}>
      {titulo}
    </p>
    {([["Desta semana", partes.destaSemana], ["Anteriores", partes.anteriores]] as const).map(([nome, parte]) => (
      <div key={nome} className="mb-4">
        <p className="text-[9px] font-bold uppercase tracking-wider mb-2 opacity-70">{nome}</p>
        {parte.itens.length === 0 && <p className="text-xs opacity-60">{parte.nota}</p>}
        {parte.itens.map((d, i) => (
          <div key={i} className="mb-3 border-b border-foreground/10 pb-3">
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-1">
              <span className="tag-emergent">{d.classification}</span>
              <span className="text-[10px] opacity-60">{dataDaVerificacao(d.date)}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-50">{d.source}</span>
            </div>
            <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:opacity-70 transition-opacity">
              {d.title}
            </a>
            {d.explicacao && <p className="text-xs opacity-70 mt-1">Verificação: {d.explicacao}</p>}
            <p className="text-[10px] opacity-50 mt-1">Tema: {d.term}</p>
          </div>
        ))}
      </div>
    ))}
  </div>
);

// As perguntas por eixo (decisões da Marta, 29/10/2026): 5 lugares em cada, as empatadas no
// mesmo lugar, e as quase iguais juntas — a da frente e, por baixo, as variantes.
const PerguntasPorEixo = ({ grupos }: { grupos: GrupoPerguntas[] }) => (
  <div className="space-y-6 max-w-2xl">
    {grupos.map((g) => (
      <div key={g.axis}>
        <span
          className="inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm mb-2"
          style={{ backgroundColor: getAxisColors(g.axis).bg, color: getAxisColors(g.axis).text }}
        >
          {axisLabels[g.axis] || g.axis}
        </span>
        {g.itens.length === 0 && <p className="text-xs opacity-60">Sem perguntas deste eixo na recolha.</p>}
        {g.itens.map((q, i) => (
          <div key={i} className="border-b border-foreground/10 pb-2 mb-2">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold tabular-nums opacity-40">{String(q.lugar).padStart(2, "0")}</span>
                <span className="text-sm font-medium">{q.term}</span>
              </div>
              <span className="text-xs font-bold tabular-nums shrink-0">{fraseDaSubida(q)}</span>
            </div>
            {fraseDasVariantes(q.variantes) && (
              <p className="text-[10px] opacity-60 mt-1 ml-6">{fraseDasVariantes(q.variantes)}</p>
            )}
          </div>
        ))}
      </div>
    ))}
  </div>
);

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

const Briefing = () => {
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [debunking, setDebunking] = useState<DebunkingRow[]>([]);
  const [healthQuestionsData, setHealthQuestionsData] = useState<{question: string; growth_percent: number | null; posicao: number | null; axis: string; updated_at: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedAt] = useState(new Date());
  const [exporting, setExporting] = useState(false);
  const [archives, setArchives] = useState<ArchivedBriefing[]>([]);
  const [expandedArchive, setExpandedArchive] = useState<string | null>(null);
  const [dizQueDisse, setDizQueDisse] = useState<DizQueDisse | null>(null);
  const [dizQueDisseLoading, setDizQueDisseLoading] = useState(false);
  const [dizQueDisseError, setDizQueDisseError] = useState(false);
  const [youtube, setYoutube] = useState<{titulo: string; canal: string; views: number; url: string; eixo: string}[]>([]);

  const week = getWeekRange();

  useEffect(() => {
    const fetchData = async () => {
      const [kwRes, newsRes, debunkRes, archiveRes, hqRes, ytRes] = await Promise.all([
        supabase.from("keywords").select("*").eq("is_active", true),
        supabase.from("news_items").select("*").order("date", { ascending: false }),
        supabase.from("debunking").select("*").order("data_publicacao", { ascending: false }),
        supabase.from("briefings_archive").select("*").order("week_start", { ascending: false }),
        // As perguntas da semana corrente pela regra do arquivo (29/10/2026): só o pytrends mede
        // a subida, só `is_question` separa a pergunta do ruído, e a recolha mais recente
        // escolhe-se em gruposDaRecolha. Até aqui eram as 8 maiores subidas de sempre, sem eixo.
        supabase
          .from("health_questions")
          .select("question, growth_percent, posicao, axis, updated_at")
          .eq("source", "pytrends")
          .eq("is_question", true)
          .order("updated_at", { ascending: false }),
        supabase.from("youtube_trends").select("*").order("views", { ascending: false }).limit(5),
      ]);

      if (kwRes.data) setKeywords(kwRes.data as KeywordRow[]);
      // a "depressão" meteorológica sai, pela regra do arquivo semanal (decisão da Marta,
      // 23/10/2026 — docs/sessoes/2026-10-23.md). O resto desta leitura fica como estava.
      if (newsRes.data) setNews(semMeteorologicas(newsRes.data as NewsRow[]));
      if (debunkRes.data) setDebunking(debunkRes.data as DebunkingRow[]);
      if (archiveRes.data) setArchives(archiveRes.data as ArchivedBriefing[]);
      if (hqRes.data && hqRes.data.length > 0) setHealthQuestionsData(hqRes.data as {question: string; growth_percent: number | null; posicao: number | null; axis: string; updated_at: string}[]);
      if (ytRes.data) setYoutube(ytRes.data as any[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Os "Sinais emergentes" da semana corrente, pela regra do arquivo, sobre o lote mais recente
  // (decisão da Marta, 29/10/2026). Substituem a leitura de `keywords.is_emergent`, parada desde 14/08.
  const sinais = useSinaisDaSemana();
  const novos = sinais.itens.filter((s) => s.parte === "novo") as { term: string; axis: string; change_percent: number }[];
  const alertasDaSemana = sinais.itens.filter((s) => s.parte === "novo" || s.parte === "em_curso") as { axis: string }[];

  // Fetch Diz Que Disse when keywords are loaded
  useEffect(() => {
    if (keywords.length === 0 || !sinais.carregado) return;

    // o primeiro alerta novo da semana; sem nenhum, a maior variação (como antes)
    const topGrowing = [...keywords].sort((a, b) => b.change_percent - a.change_percent);
    const topKeyword = novos[0] ?? topGrowing[0];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywords, sinais.carregado]);

  // Derived data — consistent with dashboard
  const topGrowing = [...keywords]
    .sort((a, b) => b.change_percent - a.change_percent)
    .slice(0, 5);

  // Filter news to this week
  const weekNews = news.filter((n) => {
    const d = new Date(n.date);
    return d >= week.start && d <= week.end;
  });
  const displayNews = weekNews.length > 0 ? weekNews.slice(0, 5) : news.slice(0, 5);

  // Fact-checks da semana corrente, pela regra do arquivo (_shared/factchecks.ts).
  const factChecksDaSemana = partesDaSemana(debunking, week.isoStart, week.isoEnd);

  const perguntasDaSemana = gruposDaRecolha(healthQuestionsData);

  // a sugestão de conteúdo: o primeiro alerta novo da semana (como o PDF dos arquivos desde 2/11)
  const topEmergent = novos[0]
    ? { ...novos[0], is_emergent: true }
    : topGrowing[0] ? { ...topGrowing[0], is_emergent: false } : undefined;

  // Urgency ranking — same logic as dashboard overview
  const axisOrder = ["saude-mental", "alimentacao", "menopausa", "emergentes"];
  const urgencyRanking = axisOrder.map((axisId) => {
    const axisKw = keywords.filter((k) => k.axis === axisId);
    const avgChange = axisKw.length > 0
      ? axisKw.reduce((s, k) => s + k.change_percent, 0) / axisKw.length
      : 0;
    // os alertas da semana do eixo (novos e em curso), em vez de `is_emergent`
    const emergentCount = alertasDaSemana.filter((s) => s.axis === axisId).length;
    const alertCount = axisKw.filter((k) => k.change_percent >= 30).length;
    const score = avgChange + (emergentCount * 30) + (alertCount * 20);
    return { axisId, label: axisLabels[axisId], avgChange, emergentCount, alertCount, score };
  }).sort((a, b) => b.score - a.score);

  // PDF export
  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await generateBriefingPdf({
        weekLabel: week.label,
        generatedAt,
        topGrowing,
        emergent: [],
        sinais: sinais.partes,
        topVolume: [],
        perguntas: perguntasDaSemana,
        news: displayNews,
        debunking: [],
        factChecks: factChecksDaSemana,
        topEmergent,
        dizQueDisse,
        youtube,
      });
      toast.success("PDF exportado com sucesso");
    } catch {
      toast.error("Erro ao exportar PDF");
    }
    setExporting(false);
  };

  // Export archived briefing as PDF
  const handleArchivePdf = async (archive: ArchivedBriefing) => {
    // Desde 2/11/2026 os sinais vêm em quatro partes (partesDosSinais). "O que está a subir"
    // passa a ser os alertas da semana — novos e em curso — e a sugestão, o primeiro novo.
    const partes = partesDosSinais(archive.top_emerging, archive.notas);
    if (partes) {
      const alertas = (archive.top_emerging || []).filter((e: any) => e.parte === "novo" || e.parte === "em_curso");
      const primeiroNovo = (archive.top_emerging || []).find((e: any) => e.parte === "novo");
      await generateBriefingPdf({
        weekLabel: archive.week_label,
        generatedAt: new Date(archive.created_at),
        topGrowing: alertas.map((e: any) => ({ ...e, current_volume: null })),
        emergent: [],
        sinais: partes,
        topVolume: archive.top_questions || [],
        perguntas: gruposDoArquivo(archive.top_questions),
        news: (archive.top_news || []).map((n: any) => ({ ...n, url: "" })),
        debunking: (archive.top_debunking || []).map((d: any) => ({ ...d, url: "" })),
        factChecks: partesDosFactChecks(archive.top_debunking, archive.notas),
        topEmergent: primeiroNovo ? { ...primeiroNovo, is_emergent: true } : null,
      });
      return;
    }
    await generateBriefingPdf({
      weekLabel: archive.week_label,
      generatedAt: new Date(archive.created_at),
      topGrowing: (archive.top_emerging || []).map((e: any) => ({
        ...e,
        // O arquivo nao guarda volume. Nao se escreve 0 — o PDF omite.
        current_volume: null,
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

      {/* SECTION 0 — Prioridade de comunicação */}
      <section className="px-6 py-10">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
          Prioridade de comunicação esta semana
        </h2>
        <p className="text-xs opacity-50 mb-6">Eixos ordenados por urgência combinada (variação + sinais emergentes + alertas)</p>
        <div className="flex flex-wrap gap-3 max-w-2xl">
          {urgencyRanking.map((axis, i) => (
            <div
              key={axis.axisId}
              className="flex items-center gap-2 px-3 py-2 border"
              style={{
                borderColor: i === 0 ? "#0000FF" : "rgba(0,0,255,0.15)",
                borderWidth: i === 0 ? 2 : 1,
              }}
            >
              <span className="text-[9px] font-bold text-foreground/30">
                {i + 1}.
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: i === 0 ? "#0000FF" : undefined }}>
                {axis.label}
              </span>
              <span className={`text-[10px] font-semibold ${axis.avgChange > 0 ? "" : "opacity-40"}`}>
                {axis.avgChange > 0 ? "+" : ""}{axis.avgChange.toFixed(0)}%
              </span>
              {axis.alertCount > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                  <span className="text-[8px] font-bold">{axis.alertCount}</span>
                </span>
              )}
              {axis.emergentCount > 0 && (
                <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 bg-foreground text-background">
                  {axis.emergentCount} {axis.emergentCount > 1 ? "sinais" : "sinal"}
                </span>
              )}
            </div>
          ))}
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
                <span
                  className="inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ml-3"
                  style={{ backgroundColor: getAxisColors(kw.axis).bg, color: getAxisColors(kw.axis).text }}
                >
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

      {/* SECTION 2 — Sinais emergentes da semana corrente, pela regra do arquivo (29/10/2026):
          Novos, Em curso, Tendências, A observar e Previsíveis, sobre o lote mais recente. */}
      <section className="px-6 py-10">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
          Sinais emergentes
        </h2>
        {sinais.semana && (
          <p className="text-xs opacity-50 mb-6">
            Semana do Google Trends de {intervaloDaSemana(sinais.semana)}, a última completa do lote mais recente
          </p>
        )}
        <div className="max-w-2xl">
          {sinais.partes ? (
            <SinaisEmergentes partes={sinais.partes} semTitulo />
          ) : sinais.carregado ? (
            <p className="text-sm opacity-60">Vazio: {sinais.nota}.</p>
          ) : (
            <p className="text-xs opacity-60">A ler os alertas…</p>
          )}
        </div>
      </section>

      <div className="section-divider" />

      {/* SECTION 3 — Perguntas mais pesquisadas */}
      <section className="px-6 py-10">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
          Perguntas mais pesquisadas
        </h2>
        <p className="text-xs opacity-50 mb-6">As principais dúvidas dos portugueses</p>
        <PerguntasPorEixo grupos={perguntasDaSemana} />
      </section>

      <div className="section-divider" />

      {/* SECTION 4 — O que os media dizem */}
      <section className="px-6 py-10">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
          O que os media dizem
        </h2>
        <div className="space-y-4 max-w-2xl">
          {displayNews.map((item, i) => (
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
          {displayNews.length === 0 && (
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
        {/* Desde 29/10/2026 da tabela `debunking`, em duas partes — como o arquivo. Até aqui
            mostrava as três primeiras linhas da tabela, sem filtro: com data nula à frente,
            eram as semeadas "a verificar". */}
        <div className="max-w-2xl">
          <FactChecks titulo="Fact-checks" partes={factChecksDaSemana} />
        </div>
      </section>

      <div className="section-divider" />

      {/* SECTION 6 — YouTube */}
      <section className="px-6 py-10">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
          O que se vê no YouTube
        </h2>
        <p className="text-xs opacity-50 mb-6">Top vídeos de canais portugueses de saúde e informação</p>
        {youtube.length > 0 ? (
          <div className="space-y-4 max-w-2xl">
            {youtube.map((v, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-foreground/10 pb-4">
                <span className="text-xs font-bold tabular-nums opacity-40 mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:opacity-70 transition-opacity leading-snug block"
                  >
                    {v.titulo}
                  </a>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] opacity-50">{v.canal}</span>
                    <span
                      className="inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                      style={{ backgroundColor: getAxisColors(v.eixo).bg, color: getAxisColors(v.eixo).text }}
                    >
                      {axisLabels[v.eixo] || v.eixo}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold">{v.views >= 1000 ? `${(v.views / 1000).toFixed(1)}K` : v.views}</span>
                  <span className="text-[8px] opacity-40 block">views</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm opacity-60">Sem dados de YouTube disponíveis.</p>
        )}
      </section>

      <div className="section-divider" />

      {/* SECTION 7 — Sugestão de conteúdo */}
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
                      {/* Emerging — quatro partes desde 2/11/2026; os anteriores como estavam */}
                      {partesDosSinais(archive.top_emerging, archive.notas) && (
                        <SinaisEmergentes partes={partesDosSinais(archive.top_emerging, archive.notas)!} />
                      )}
                      {!partesDosSinais(archive.top_emerging, archive.notas) && archive.top_emerging?.length > 0 && (
                        <div className="mb-5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#0000FF" }}>
                            Sinais emergentes
                          </p>
                          {archive.top_emerging.map((e: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 mb-2">
                              <span className="tag-emergent">Emergente</span>
                              <span className="text-sm font-semibold">{e.term}</span>
                              <span
                                className="inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                                style={{ backgroundColor: getAxisColors(e.axis).bg, color: getAxisColors(e.axis).text }}
                              >
                                {axisLabels[e.axis] || e.axis}
                              </span>
                              <span className="text-xs font-bold ml-auto">
                                +{Number(e.change_percent).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {!partesDosSinais(archive.top_emerging, archive.notas) && !(archive.top_emerging?.length > 0) && (
                        <SeccaoVazia titulo="Sinais emergentes" nota={archive.notas?.emergentes} />
                      )}

                      {/* Questions — por eixo desde 2/11/2026; os anteriores como estavam */}
                      {gruposDoArquivo(archive.top_questions) && (
                        <div className="mb-5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#0000FF" }}>
                            Perguntas mais pesquisadas
                          </p>
                          <PerguntasPorEixo grupos={gruposDoArquivo(archive.top_questions)!} />
                        </div>
                      )}
                      {!gruposDoArquivo(archive.top_questions) && archive.top_questions?.length > 0 && (
                        <div className="mb-5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#0000FF" }}>
                            Perguntas mais pesquisadas
                          </p>
                          {archive.top_questions.map((q: any, i: number) => (
                            <div key={i} className="flex items-baseline justify-between mb-2">
                              <span className="text-sm">{q.term}</span>
                              {/* Arquivos anteriores a 16/09/2026 guardavam a
                                  posição na lista em `current_volume`. Não é
                                  medida nenhuma — não se mostra. */}
                              {/* O tecto (9999) e o breakout não são medida:
                                  desde 28/09/2026 chegam sem número. */}
                              {q.fora_de_escala ? (
                                <span className="text-xs font-bold">fora de escala</span>
                              ) : q.growth_percent != null && (
                                <span className="text-xs font-bold tabular-nums">
                                  +{Math.round(q.growth_percent)}%
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {!gruposDoArquivo(archive.top_questions) && !(archive.top_questions?.length > 0) && (
                        <SeccaoVazia titulo="Perguntas mais pesquisadas" nota={archive.notas?.perguntas} />
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
                      {!(archive.top_news?.length > 0) && (
                        <SeccaoVazia titulo="Media" nota={archive.notas?.noticias} />
                      )}

                      {/* Debunking — duas partes desde 2/11/2026; os anteriores como estavam */}
                      {partesDosFactChecks(archive.top_debunking, archive.notas) && (
                        <FactChecks titulo="Debunking" partes={partesDosFactChecks(archive.top_debunking, archive.notas)!} />
                      )}
                      {!partesDosFactChecks(archive.top_debunking, archive.notas) && archive.top_debunking?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#0000FF" }}>
                            Debunking
                          </p>
                          {archive.top_debunking.map((d: any, i: number) => (
                            <div key={i} className="mb-2">
                              {/* Desde 28/09/2026 os desmentidos vêm das notícias
                                  de fact-check, que não trazem veredicto. */}
                              {d.classification && (
                                <span className="tag-emergent mr-2">{d.classification}</span>
                              )}
                              <span className="text-sm">{d.title}</span>
                              {d.source && !d.classification && (
                                <span className="text-[10px] opacity-50 ml-2">{d.source}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {!partesDosFactChecks(archive.top_debunking, archive.notas) && !(archive.top_debunking?.length > 0) && (
                        <SeccaoVazia titulo="Debunking" nota={archive.notas?.desmentidos} />
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
