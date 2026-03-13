import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAxisColors } from "@/lib/axisColors";

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
};

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Sort categories to maintain consistent order
  const categoryOrder = ["desinformacao", "igualdade_social", "cuidados_saude_primarios", "dunning_kruger"];
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ia = categoryOrder.indexOf(a);
    const ib = categoryOrder.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="w-full">
        <div className="px-6 py-5">
          <p className="text-lg font-bold tracking-[0.05em] uppercase">Diz que Disse</p>
          <p className="editorial-label mt-1" style={{ opacity: 0.5 }}>Serviço Nacional de Literacia em Saúde</p>
        </div>
        <nav className="px-6 py-2 flex items-center justify-between" style={{ borderTop: "1px solid rgba(0,0,255,0.15)", borderBottom: "1px solid rgba(0,0,255,0.15)" }}>
          <Link to="/" className="text-[10px] font-bold tracking-[0.15em] uppercase hover:opacity-70 transition-opacity">
            Reportagem Viva
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/editorial/bookmarks" className="nav-link nav-link-active">Bookmarks</Link>
            <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>|</span>
            <Link to="/textos" className="nav-link">Textos</Link>
            <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>|</span>
            <Link to="/plataforma" className="nav-link">Plataforma</Link>
            <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>|</span>
            <Link to="/sobre" className="nav-link">Sobre</Link>
          </div>
        </nav>
      </header>

      <section className="px-6 pt-12 pb-6">
        <h1 className="text-2xl md:text-4xl font-bold tracking-[0.03em] leading-tight">
          Bookmarks
        </h1>
        <p className="mt-2 text-xs font-medium tracking-[0.15em] uppercase opacity-50">
          Referências e recursos
        </p>
      </section>

      <section className="px-6 pb-16">
        {loading ? (
          <p className="text-sm opacity-50">A carregar...</p>
        ) : sortedCategories.length === 0 ? (
          <p className="text-sm opacity-50">Sem bookmarks registados.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sortedCategories.map((cat) => (
              <div key={cat}>
                <span
                  className="inline-block text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm mb-4 ml-4"
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
                      className="block border border-foreground/10 p-4 hover:border-foreground/25 transition-colors"
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
        )}
      </section>
    </div>
  );
};

export default Bookmarks;
