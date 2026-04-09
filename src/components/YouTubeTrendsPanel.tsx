import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAxisColors } from "@/lib/axisColors";

type YouTubeTrend = {
  id: string;
  titulo: string;
  canal: string;
  views: number;
  url: string;
  eixo: string;
  data_publicacao: string;
  thumbnail_url: string | null;
};

const AXIS_LABELS: Record<string, string> = {
  "saude-mental": "Saúde Mental",
  alimentacao: "Alimentação",
  menopausa: "Menopausa",
  emergentes: "Emergentes",
};

const formatViews = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
};

const getFreshnessLabel = (dateStr: string): { label: string; fresh: boolean } | null => {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 7) return { label: "ESTA SEMANA", fresh: true };
  if (days <= 30) return { label: "ESTE MÊS", fresh: false };
  return null;
};

const YouTubeTrendsPanel = ({ axis }: { axis?: string }) => {
  const [trends, setTrends] = useState<YouTubeTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const isOverview = !axis || axis === "all";

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase
        .from("youtube_trends")
        .select("*")
        .order("views", { ascending: false })
        .limit(30);
      if (axis && axis !== "all") {
        query = query.eq("eixo", axis);
      }
      const { data } = await query;
      if (data) {
        // Garantir número par para colunas equilibradas
        const even = data.length % 2 === 0 ? data : data.slice(0, -1);
        setTrends(even as YouTubeTrend[]);
      }
      setLoading(false);
    };
    fetchData();
  }, [axis]);

  return (
    <div className={`py-5 flex flex-col h-full min-h-0 ${isOverview ? "" : "max-h-[700px]"}`}>
      <div className="flex items-center gap-3 mb-1 flex-shrink-0">
        <span className="inline-block w-1.5 h-1.5 bg-foreground rounded-full" />
        <p className="text-xs font-bold uppercase tracking-[0.15em]">
          Tendências YouTube
        </p>
      </div>
      <p className="text-[9px] text-foreground/40 mb-4 ml-[18px] flex-shrink-0">
        Selecção curada de canais portugueses de jornalismo e saúde
      </p>

      <div className={`flex-1 min-h-0 ${isOverview ? "" : "overflow-y-auto scrollbar-yellow"}`}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" />
          </div>
        ) : trends.length === 0 ? (
          <p className="text-[10px] text-foreground/30 py-8 text-center">
            Sem dados de YouTube disponíveis.
          </p>
        ) : (
          <div className={`${isOverview ? "md:columns-2 md:gap-6" : ""} space-y-0`}>
            {trends.map((t, i) => {
              const freshness = getFreshnessLabel(t.data_publicacao);
              return (
                <div key={t.id} className="break-inside-avoid">
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block py-2.5 group hover:bg-foreground/[0.02] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {t.thumbnail_url && (
                        <img
                          src={t.thumbnail_url}
                          alt=""
                          className="w-16 h-9 object-cover flex-shrink-0 mt-0.5"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold leading-snug line-clamp-2 group-hover:underline">
                          {t.titulo}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[9px] text-foreground/50">
                            {t.canal}
                          </span>
                          {t.eixo && AXIS_LABELS[t.eixo] && (
                            <span
                              className="inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                              style={{
                                backgroundColor: getAxisColors(t.eixo).bg,
                                color: getAxisColors(t.eixo).text,
                              }}
                            >
                              {AXIS_LABELS[t.eixo]}
                            </span>
                          )}
                          {freshness && (
                            <span
                              className={`text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 ${
                                freshness.fresh
                                  ? "bg-foreground text-background"
                                  : "border border-foreground/30 text-foreground/50"
                              }`}
                            >
                              {freshness.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">
                          {formatViews(t.views)}
                        </p>
                        {t.data_publicacao && (
                          <span className="text-[8px] text-foreground/40">
                            {formatDate(t.data_publicacao)}
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                  {i < trends.length - 1 && (
                    <div className="border-t border-foreground/10" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeTrendsPanel;
