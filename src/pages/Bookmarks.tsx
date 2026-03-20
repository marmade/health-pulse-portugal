import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAxisColors } from "@/lib/axisColors";
import EditorialHeader from "@/components/EditorialHeader";

type Bookmark = {
  id: string;
  url: string;
  titulo: string;
  fonte: string;
  categoria: string;
  notas: string | null;
  ordem: number;
};

const CATEGORIAS: Record<string, string> = {
  desinformacao: "Desinformação",
  igualdade_social: "Elevador Social",
  cuidados_saude_primarios: "Cuidados de Saúde Primários",
  dunning_kruger: "Saber que não sabe",
  comunicacao_cientifica: "Comunicação Científica",
};

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoria, setActiveCategoria] = useState("todas");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .order("ordem");
      if (data) setBookmarks(data as Bookmark[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const grouped = bookmarks.reduce<Record<string, Bookmark[]>>((acc, b) => {
    const cat = b.categoria || "outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(b);
    return acc;
  }, {});

  const categoryOrder = ["desinformacao", "igualdade_social", "cuidados_saude_primarios", "dunning_kruger", "comunicacao_cientifica"];
  const sortedCategories = Object.keys(grouped)
    .filter((cat) => activeCategoria === "todas" || cat === activeCategoria)
    .sort((a, b) => {
      const ia = categoryOrder.indexOf(a);
      const ib = categoryOrder.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

  const visibleCount = sortedCategories.reduce((sum, cat) => sum + (grouped[cat]?.length || 0), 0);

  return (
    <div className="min-h-screen text-foreground" style={{ backgroundColor: "#F5F5FF" }}>
      <EditorialHeader />

      <section className="px-6 pt-12 pb-6">
        <h1 className="text-2xl md:text-4xl font-bold tracking-[0.03em] leading-tight">
          Bookmarks
        </h1>
        <p className="mt-2 text-xs font-medium tracking-[0.15em] uppercase opacity-50">
          Referências e recursos
        </p>
      </section>

      <section className="px-6 pb-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-0.5">
            <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-foreground/50 mr-1.5">Categoria</span>
            <button
              onClick={() => setActiveCategoria("todas")}
              className={`text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 border transition-colors ${
                activeCategoria === "todas"
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/20 text-foreground/40 hover:text-foreground hover:border-foreground"
              }`}
            >
              Todas
            </button>
            {categoryOrder.map((catKey) => (
              <button
                key={catKey}
                onClick={() => setActiveCategoria(catKey)}
                className={`text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 border transition-colors ${
                  activeCategoria === catKey
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/20 text-foreground/40 hover:text-foreground hover:border-foreground"
                }`}
              >
                {CATEGORIAS[catKey] || catKey}
              </button>
            ))}
          </div>
          <span className="text-[7px] font-medium uppercase tracking-[0.15em] text-foreground/35">
            {visibleCount} bookmarks
          </span>
        </div>
      </section>

      <section className="px-6 pb-16 pt-4">
        {loading ? (
          <p className="text-sm opacity-50">A carregar...</p>
        ) : sortedCategories.length === 0 ? (
          <p className="text-sm opacity-50">Sem bookmarks registados.</p>
        ) : activeCategoria !== "todas" ? (
          <div className="columns-1 md:columns-3 gap-8">
            {sortedCategories.flatMap((cat) =>
              grouped[cat].map((b) => (
                <a
                  key={b.id}
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-inside-avoid mb-3 block border border-foreground/10 p-4 hover:border-foreground/25 transition-colors bg-white"
                >
                  <p className="text-sm font-medium leading-snug">{b.titulo}</p>
                  {b.fonte && (
                    <p className="text-[9px] uppercase tracking-wider opacity-50 mt-1.5">{b.fonte}</p>
                  )}
                  {b.notas && (
                    <p className="text-xs opacity-60 italic mt-2">{b.notas}</p>
                  )}
                </a>
              ))
            )}
          </div>
        ) : (
          (() => {
            // Distribute categories across 3 columns for balanced layout
            const cols: string[][] = [[], [], []];
            sortedCategories.forEach((cat, i) => cols[i % 3].push(cat));
            return (
              <div className="flex flex-col md:flex-row gap-8">
                {cols.map((colCats, colIdx) => (
                  <div key={colIdx} className="flex-1 flex flex-col gap-8 min-w-0">
                    {colCats.map((cat) => (
                      <div key={cat}>
                        <span
                          className="block text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm mb-4"
                          style={{ backgroundColor: "rgba(0,0,255,0.08)", color: "#0000FF" }}
                        >
                          {CATEGORIAS[cat] || cat}
                        </span>
                        <div className="flex flex-col gap-3">
                          {grouped[cat].map((b) => (
                            <a
                              key={b.id}
                              href={b.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block border border-foreground/10 p-4 hover:border-foreground/25 transition-colors bg-white"
                            >
                              <p className="text-sm font-medium leading-snug">{b.titulo}</p>
                              {b.fonte && (
                                <p className="text-[9px] uppercase tracking-wider opacity-50 mt-1.5">{b.fonte}</p>
                              )}
                              {b.notas && (
                                <p className="text-xs opacity-60 italic mt-2">{b.notas}</p>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </section>
    </div>
  );
};

export default Bookmarks;
