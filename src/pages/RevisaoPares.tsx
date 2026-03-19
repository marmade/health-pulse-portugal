import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import EditorialSubNav from "@/components/EditorialSubNav";

const EIXOS = [
  { id: "saude-mental", label: "Saúde Mental", color: "rgba(0,255,200,0.12)" },
  { id: "alimentacao",  label: "Alimentação",  color: "rgba(255,230,0,0.20)" },
  { id: "menopausa",    label: "Menopausa",    color: "rgba(255,0,150,0.12)" },
  { id: "emergentes",   label: "Emergentes",   color: "rgba(0,0,255,0.08)" },
];

type ParEntry = {
  id: string;
  eixo: string;
  nome: string;
  titulo: string;
  afiliacao: string;
  nota: string | null;
};

const RevisaoPares = () => {
  const [dados, setDados] = useState<ParEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase.from as any)("revisao_pares")
      .select("*")
      .then(({ data }: any) => {
        if (data) setDados(data as ParEntry[]);
        setLoading(false);
      });
  }, []);

  const getByEixo = (eixo: string) => dados.filter((d) => d.eixo === eixo);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header editorial */}
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
            <Link to="/editorial/bookmarks" className="nav-link">Bookmarks</Link>
            <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>|</span>
            <Link to="/editorial/benchmark" className="nav-link">Benchmark</Link>
            <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>|</span>
            <Link to="/textos" className="nav-link">Textos</Link>
            <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>|</span>
            <Link to="/plataforma" className="nav-link">Plataforma</Link>
            <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>|</span>
            <Link to="/sobre" className="nav-link">Sobre</Link>
          </div>
        </nav>
        <EditorialSubNav activePage="revisao-pares" />
      </header>

      {/* Page content */}
      <section className="px-6 pt-12 pb-6">
        <h1 className="text-2xl md:text-4xl font-bold tracking-[0.03em] leading-tight">
          Revisão de Pares
        </h1>
        <p className="mt-2 text-xs font-medium tracking-[0.15em] uppercase opacity-50">
          Dupla científica por eixo
        </p>
      </section>

      <div className="section-divider" />

      <main className="px-6 py-10 max-w-[1200px] mx-auto">
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="animate-spin h-4 w-4 border-2 border-foreground border-t-transparent rounded-full" />
            <p className="text-xs opacity-50">A carregar...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {EIXOS.map(({ id, label, color }) => {
              const entries = getByEixo(id);
              return (
                <div key={id} className="border border-foreground/10" style={{ borderLeftColor: "#0000FF", borderLeftWidth: 3 }}>
                  <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: color }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "#0000FF" }}>
                      {label}
                    </p>
                  </div>

                  <div className="px-5 py-5 space-y-4">
                    {entries.length > 0 ? (
                      entries.map((entry) => (
                        <div key={entry.id} className="space-y-1">
                          <p className="text-sm font-semibold">{entry.nome || "—"}</p>
                          <p className="text-xs opacity-70">{entry.titulo || "—"}</p>
                          <p className="text-xs opacity-50">{entry.afiliacao || "—"}</p>
                          {entry.nota && (
                            <p className="text-[11px] opacity-40 pt-1 italic">{entry.nota}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">—</p>
                        <p className="text-xs opacity-70">—</p>
                        <p className="text-xs opacity-50">—</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default RevisaoPares;
