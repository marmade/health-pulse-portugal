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

const YouTubeTrendsPanel = () => {
  const [trends, setTrends] = useState<YouTubeTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("youtube_trends")
        .select("*")
        .order("views", { ascending: false })
        .limit(15);
      if (data) setTrends(data as YouTubeTrend[]);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="py-5 flex flex-col h-full min-h-0 max-h-[500px]">
      <div className="flex items-center gap-3 mb-1 flex-shrink-0">
        <span className="inline-block w-1.5 h-1.5 bg-foreground rounded-full" />
        <p className="text-xs font-bold uppercase tracking-[0.15em]">
          Tendências YouTube
        </p>
      </div>
      <p className="text-[9px] text-foreground/40 mb-4 ml-[18px] flex-shrink-0">
        Vídeos em destaque sobre saúde em Portugal
      </p>

      <div className="overflow-y-auto flex-1 min-h-0 scrollbar-yellow">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" />
          </div>
        ) : trends.length === 0 ? (
          <p className="text-[10px] text-foreground/30 py-8 text-center">
            Sem dados de YouTube disponíveis.
          </p>
        ) : (
          <div className="space-y-0">
            {trends.map((t, i) => (
              <div key={t.id}>
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
                      <div className="flex items-center gap-2 mt-1">
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
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">
                        {formatViews(t.views)}
                      </p>
                      <span className="text-[8px] text-foreground/40">
                        views
                      </span>
                    </div>
                  </div>
                </a>
                {i < trends.length - 1 && (
                  <div className="border-t border-foreground/10" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeTrendsPanel;
