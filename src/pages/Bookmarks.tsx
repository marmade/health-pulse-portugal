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
  subcategoria?: string | null;
  eixo?: string | null;
  notas: string | null;
  ordem: number;
};

const CATEGORIAS: Record<string, string> = {
  desinformacao: "Desinformação",
  igualdade_social: "Elevador Social",
  cuidados_saude_primarios: "Cuidados de Saúde Primários",
  dunning_kruger: "Saber que não sabe",
  comunicacao_cientifica: "Comunicação Científica",
  fontes_referencia: "Fontes de Referência",
};

const SUBCATEGORIAS: Record<string, string> = {
  institucional: "Institucional",
  sociedades_cientificas: "Sociedades Científicas",
  ong_associacoes: "ONG e Associações",
  farmaceutica: "Farmacêutica",
  academia: "Academia e Investigação",
  referencia_clinica: "Referência Clínica",
  outros: "Outros",
};

const AXIS_LABELS: Record<string, string> = {
  "saude-mental": "Saúde Mental",
  alimentacao: "Alimentação",
  menopausa: "Menopausa",
  emergentes: "Emergentes",
};

const categoryOrder = [
  "desinformacao",
  "igualdade_social",
  "cuidados_saude_primarios",
  "dunning_kruger",
  "comunicacao_cientifica",
  "fontes_referencia",
];

const subcategoryOrder = [
  "institucional",
  "sociedades_cientificas",
  "ong_associacoes",
  "farmaceutica",
  "academia",
  "referencia_clinica",
  "outros",
];

// Eixo + subcategoria mappings (frontend-only until DB columns exist)
const EIXO_MAP: Record<string, string> = {
  // Saúde Mental
  "Psiquiatria": "saude-mental", "Suicidologia": "saude-mental", "Psicologia": "saude-mental",
  "Psicodrama": "saude-mental", "Neuropediatria": "saude-mental", "Neurociências": "saude-mental",
  "APAV": "saude-mental", "Cefaleias": "saude-mental", "Neurocirurgia": "saude-mental",
  // Alimentação
  "Nutrição": "alimentacao", "Alimentação": "alimentacao", "Alimentar": "alimentacao",
  "Obesidade": "alimentacao", "Diabetologia": "alimentacao", "Gastrenterologia": "alimentacao",
  "Nutrimento": "alimentacao", "EIPAS": "alimentacao", "Endocrinologia": "alimentacao",
  "Metabólica": "alimentacao", "Endoscopia Digestiva": "alimentacao",
  // Menopausa
  "Menopausa": "menopausa", "Ginecologia": "menopausa", "Obstetrícia": "menopausa",
  "Senologia": "menopausa", "Contracepção": "menopausa", "Reprodução": "menopausa",
  "Materno": "menopausa", "Andrologia": "menopausa",
  // Emergentes
  "Oncologia": "emergentes", "Transplantação": "emergentes", "Vascular Cerebral": "emergentes",
  "Imunologia": "emergentes", "Hematologia": "emergentes", "Saúde Pública": "emergentes",
  "Saúde e Ambiente": "emergentes", "Hepatologia": "emergentes", "Hipertensão": "emergentes",
  "Cruz Vermelha": "emergentes",
};

const SUBCAT_MAP: Record<string, string> = {
  "DGS": "institucional", "Governo": "institucional", "Ordem dos": "institucional",
  "EIPAS": "institucional", "Nutrimento": "institucional", "Alimentação Saudável": "institucional",
  "GIMM": "academia", "Gulbenkian": "academia", "Neurociências": "academia",
  "90 Segundos": "academia", "HPA": "academia",
  "Cruz Vermelha": "ong_associacoes", "APAV": "ong_associacoes", "Conselho Português": "ong_associacoes",
  "Bial": "farmaceutica",
  "MSD": "referencia_clinica", "NewsFarma": "referencia_clinica",
};

function resolveEixo(b: Bookmark): string | null {
  if (b.eixo) return b.eixo;
  for (const [key, eixo] of Object.entries(EIXO_MAP)) {
    if (b.titulo.includes(key)) return eixo;
  }
  return null;
}

function resolveSubcat(b: Bookmark): string {
  if (b.subcategoria) return b.subcategoria;
  if (b.categoria !== "fontes_referencia") return "";
  for (const [key, sub] of Object.entries(SUBCAT_MAP)) {
    if (b.titulo.includes(key)) return sub;
  }
  // Default: if it looks like a society
  if (b.titulo.startsWith("Sociedade Portuguesa") || b.titulo.startsWith("Associação Portuguesa") ||
      b.titulo.startsWith("Federação") || b.titulo.startsWith("Núcleo") || b.titulo.startsWith("Clube")) {
    return "sociedades_cientificas";
  }
  return "outros";
}

const BookmarkCard = ({ b }: { b: Bookmark }) => {
  const eixo = resolveEixo(b);
  const axisColors = eixo ? getAxisColors(eixo) : null;

  return (
    <a
      key={b.id}
      href={b.url || undefined}
      target={b.url ? "_blank" : undefined}
      rel="noopener noreferrer"
      className={`block border border-foreground/10 p-4 transition-colors bg-white ${b.url ? "hover:border-foreground/25" : "opacity-70"}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{b.titulo}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {b.fonte && (
              <span className="text-[9px] uppercase tracking-wider opacity-50">{b.fonte}</span>
            )}
            {axisColors && eixo && (
              <span
                className="inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                style={{ backgroundColor: axisColors.bg, color: axisColors.text }}
              >
                {AXIS_LABELS[eixo] || eixo}
              </span>
            )}
          </div>
        </div>
      </div>
      {b.notas && (
        <p className="text-xs opacity-60 italic mt-2">{b.notas}</p>
      )}
    </a>
  );
};

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoria, setActiveCategoria] = useState("todas");

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .order("ordem");
      if (data) setBookmarks(data as Bookmark[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const grouped = bookmarks.reduce<Record<string, Bookmark[]>>((acc, b) => {
    const cat = b.categoria || "outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(b);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped)
    .filter((cat) => activeCategoria === "todas" || cat === activeCategoria)
    .sort((a, b) => {
      const ia = categoryOrder.indexOf(a);
      const ib = categoryOrder.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

  const visibleCount = sortedCategories.reduce((sum, cat) => sum + (grouped[cat]?.length || 0), 0);

  // Group fontes_referencia by subcategoria
  const renderFontesReferencia = (items: Bookmark[]) => {
    const bySubcat: Record<string, Bookmark[]> = {};
    for (const b of items) {
      const sub = resolveSubcat(b);
      if (!bySubcat[sub]) bySubcat[sub] = [];
      bySubcat[sub].push(b);
    }
    const sortedSubs = Object.keys(bySubcat).sort((a, b) => {
      const ia = subcategoryOrder.indexOf(a);
      const ib = subcategoryOrder.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    return (
      <div className="space-y-8">
        {sortedSubs.map((sub) => (
          <div key={sub}>
            <span
              className="block text-[8px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm mb-3 w-fit"
              style={{ backgroundColor: "rgba(123,0,255,0.08)", color: "#7B00FF" }}
            >
              {SUBCATEGORIAS[sub] || sub}
            </span>
            <div className="columns-1 md:columns-2 xl:columns-3 gap-3">
              {bySubcat[sub].map((b) => (
                <div key={b.id} className="break-inside-avoid mb-3">
                  <BookmarkCard b={b} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

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
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-0.5 flex-wrap">
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
        ) : (
          <div className="space-y-12">
            {sortedCategories.map((cat) => (
              <div key={cat}>
                {/* Category header */}
                {(activeCategoria === "todas" || cat !== "fontes_referencia") && (
                  <span
                    className="block text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm mb-4 w-fit"
                    style={{ backgroundColor: "rgba(0,0,255,0.08)", color: "#0000FF" }}
                  >
                    {CATEGORIAS[cat] || cat}
                  </span>
                )}

                {cat === "fontes_referencia" ? (
                  renderFontesReferencia(grouped[cat])
                ) : (
                  <div className="columns-1 md:columns-2 xl:columns-3 gap-3">
                    {grouped[cat].map((b) => (
                      <div key={b.id} className="break-inside-avoid mb-3">
                        <BookmarkCard b={b} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Bookmarks;
