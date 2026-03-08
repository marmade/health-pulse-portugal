import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

const axisLabels: Record<string, string> = {
  "saude-mental": "Saúde Mental",
  alimentacao: "Alimentação",
  menopausa: "Menopausa",
  emergentes: "Emergentes",
};

const sourceTypeBadge: Record<string, string> = {
  institucional: "🏥 INST",
  media: "📰 MEDIA",
  "fact-check": "🔍 FC",
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

  return {
    start: monday,
    end: sunday,
    label: `${fmt(monday)} — ${fmt(sunday)} ${now.getFullYear()}`,
  };
}

const Briefing = () => {
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [debunking, setDebunking] = useState<DebunkingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedAt] = useState(new Date());

  const week = getWeekRange();

  useEffect(() => {
    const fetch = async () => {
      const [kwRes, newsRes, debunkRes] = await Promise.all([
        supabase.from("keywords").select("*").eq("is_active", true),
        supabase.from("news_items").select("*").order("date", { ascending: false }).limit(3),
        supabase.from("debunking").select("*").order("created_at", { ascending: false }).limit(1),
      ]);

      if (kwRes.data) setKeywords(kwRes.data as KeywordRow[]);
      if (newsRes.data) setNews(newsRes.data as NewsRow[]);
      if (debunkRes.data) setDebunking(debunkRes.data as DebunkingRow[]);
      setLoading(false);
    };
    fetch();
  }, []);

  // Derived data
  const topGrowing = [...keywords]
    .sort((a, b) => b.change_percent - a.change_percent)
    .slice(0, 3);

  const emergent = keywords.filter((k) => k.is_emergent);

  const topVolume = [...keywords]
    .sort((a, b) => b.current_volume - a.current_volume)
    .slice(0, 5);

  const topEmergent = emergent.length > 0
    ? emergent.sort((a, b) => b.change_percent - a.change_percent)[0]
    : topGrowing[0];

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
      {/* Nav */}
      <header className="w-full">
        <div className="px-6 py-5 flex items-baseline justify-between">
          <Link to="/" className="text-lg font-bold tracking-[0.05em] uppercase hover:opacity-70 transition-opacity">
            Reportagem Viva
          </Link>
          <Link to="/" className="text-[10px] font-bold uppercase tracking-[0.15em] border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors">
            ← Dashboard
          </Link>
        </div>
        <div className="section-divider" />
      </header>

      {/* Header */}
      <section className="px-6 py-12 md:py-16">
        <p className="editorial-label mb-2">Briefing Semanal</p>
        <h1 className="text-2xl md:text-4xl font-bold tracking-[0.04em] uppercase">
          Briefing Semanal
        </h1>
        <p className="text-xs font-medium tracking-wide uppercase mt-2 opacity-60">
          {week.label}
        </p>
        <p className="text-sm mt-3 opacity-80">
          O que está a acontecer esta semana em Portugal
        </p>
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
            {emergent.map((kw) => (
              <div key={kw.term} className="flex items-center gap-3">
                <span className="tag-emergent">Emergente</span>
                <span className="text-sm font-semibold">{kw.term}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-50">
                  {axisLabels[kw.axis] || kw.axis}
                </span>
                <span className="text-xs font-bold ml-auto">
                  +{Number(kw.change_percent).toFixed(0)}%
                </span>
              </div>
            ))}
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
                {kw.current_volume}
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
                  {sourceTypeBadge[item.source_type] || "📰 MEDIA"}
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
          <p className="text-sm opacity-60">Sem verificações esta semana.</p>
        )}
      </section>

      <div className="section-divider" />

      {/* SECTION 6 — Sugestão de conteúdo */}
      <section className="px-6 py-10">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
          Sugestão de conteúdo
        </h2>
        {topEmergent ? (
          <div className="max-w-2xl border border-foreground/20 p-6">
            <p className="text-sm leading-relaxed">
              Esta semana vale a pena falar sobre{" "}
              <span className="font-bold">{topEmergent.term}</span> —{" "}
              {topEmergent.is_emergent
                ? `sinal emergente com crescimento de +${Number(topEmergent.change_percent).toFixed(0)}%, sem histórico significativo no período anterior.`
                : `crescimento de +${Number(topEmergent.change_percent).toFixed(0)}% no volume de pesquisa esta semana, indicando interesse crescente dos portugueses neste tema.`}
            </p>
          </div>
        ) : (
          <p className="text-sm opacity-60">Sem sugestões esta semana.</p>
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
