import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Referencia = { label: string; url: string };

type Texto = {
  id: string;
  ordem: number;
  categoria: string;
  titulo: string;
  lead: string;
  corpo: string;
  referencias: Referencia[];
};

const Textos = () => {
  const [textos, setTextos] = useState<Texto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("textos")
        .select("*")
        .eq("ativo", true)
        .order("ordem");
      if (data) setTextos(data.map((t: any) => ({ ...t, referencias: t.referencias || [] })));
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
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

      {/* Page Title */}
      <section className="px-6 pt-12 pb-6">
        <h1 className="text-3xl md:text-5xl font-bold tracking-[0.04em] uppercase">
          Textos
        </h1>
        <p className="mt-2 text-xs font-medium tracking-[0.15em] uppercase opacity-50">
          Notas de investigação
        </p>
      </section>

      <div className="section-divider" />

      {/* Epígrafe */}
      <section className="px-6 py-16 md:py-24 max-w-3xl mx-auto text-center">
        <blockquote className="text-lg md:text-xl leading-relaxed italic text-foreground">
          "A promoção e protecção da saúde dos povos é essencial
          para o contínuo desenvolvimento económico e social
          e contribui para a melhoria na qualidade da vida
          e para a paz mundial."
        </blockquote>
        <p className="mt-6 text-xs font-medium tracking-[0.1em] uppercase opacity-50">
          — Declaração Alma-Ata, Conferência Internacional sobre Cuidados Primários de Saúde, URSS, 1978
        </p>
      </section>

      <div className="section-divider" />

      {/* Textos from DB */}
      {loading ? (
        <div className="px-6 py-16 max-w-3xl mx-auto">
          <p className="text-xs font-medium tracking-wide uppercase opacity-40">A carregar...</p>
        </div>
      ) : textos.length === 0 ? (
        <div className="px-6 py-16 max-w-3xl mx-auto">
          <p className="text-xs font-medium tracking-wide uppercase opacity-40">Em construção.</p>
        </div>
      ) : (
        textos.map((texto, index) => (
          <div key={texto.id}>
            <article className="px-6 py-12 md:py-16 max-w-3xl mx-auto">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground mb-4">
                {texto.categoria}
              </p>
              <h2 className="text-2xl md:text-4xl font-bold tracking-[0.02em] mb-4">
                {texto.titulo}
              </h2>
              {texto.lead && (
                <p className="text-base md:text-lg font-medium leading-relaxed mb-8 opacity-80">
                  {texto.lead}
                </p>
              )}
              {texto.corpo && (
                <div className="space-y-5 text-sm leading-relaxed opacity-90">
                  {texto.corpo.split("\n").filter(Boolean).map((paragraph, i) => {
                    // Check if paragraph is a blockquote (starts with ")
                    const isQuote = paragraph.trimStart().startsWith('"') || paragraph.trimStart().startsWith('"') || paragraph.trimStart().startsWith('«');
                    const isAttribution = paragraph.trimStart().startsWith('—') || paragraph.trimStart().startsWith('—');
                    
                    if (isQuote) {
                      return (
                        <blockquote key={i} className="pl-5 border-l-2 border-foreground/20">
                          <p className="italic text-foreground leading-relaxed">{paragraph}</p>
                        </blockquote>
                      );
                    }
                    if (isAttribution) {
                      return (
                        <p key={i} className="pl-5 text-xs opacity-50 -mt-3">{paragraph}</p>
                      );
                    }
                    return <p key={i}>{paragraph}</p>;
                  })}
                </div>
              )}

              {/* Referências */}
              {texto.referencias.length > 0 && (
                <div className="mt-10 pt-6 border-t border-foreground/10">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/40 mb-3">
                    Referências
                  </p>
                  <ul className="space-y-1.5 text-xs opacity-60">
                    {texto.referencias.map((ref, i) => (
                      <li key={i}>
                        {ref.url ? (
                          <a href={ref.url} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">
                            {ref.label}
                          </a>
                        ) : (
                          ref.label
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
            {index < textos.length - 1 && <div className="section-divider" />}
          </div>
        ))
      )}

      <div className="py-12" />
    </div>
  );
};

export default Textos;
