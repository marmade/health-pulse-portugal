import { useState, useMemo } from "react";
import type { DebunkItem } from "@/data/mockData";
import { getAxisFilterStyle } from "@/lib/axisColors";
import { seMostra } from "../../supabase/functions/_shared/factchecks";
import { umaPorArtigo } from "@/lib/factchecksSite";

type Props = {
  items: DebunkItem[];
  // As verificações da covid-19, num separador próprio, fora dos eixos (decisão da Marta,
  // 29/10/2026). Só se passa na vista "Todos"; sem ele não há separadores.
  covid?: DebunkItem[];
};

type Grupo = "eixos" | "covid";

// Os veredictos são os do editor, TAL COMO VÊM (Observador: Errado, Enganador, Esticado,
// Certo, Praticamente certo…), sem tradução para uma escala nossa. O estilo é por família;
// o texto no ecrã é sempre o original. Desde 18/09/2026 a fonte é a Google Fact Check Tools
// API (ClaimReview), só editores portugueses — scripts/11_fetch_fact_checks.py.
function estiloVeredicto(v: string): string {
  const l = v.toLowerCase();
  if (/errad|fals/.test(l)) return "border-foreground bg-foreground text-background";
  if (/engan|estic|imprec|descontext/.test(l)) return "border-foreground";
  if (/certo|verdad/.test(l)) return "border-foreground/50 text-foreground/60";
  return "border-foreground/30 text-foreground/50";
}

// As 36 linhas semeadas a 25/03/2026 ficaram "a verificar", sem URL nem veredicto; não se
// apagam (regra do projecto), mas não são fact-checks — não se mostram. A regra (seMostra)
// é a do briefing, em _shared/factchecks.ts.

const DebunkingTable = ({ items, covid }: Props) => {
  const [activeFilter, setActiveFilter] = useState("TODOS");
  const [grupo, setGrupo] = useState<Grupo>("eixos");

  // cada artigo uma vez, com todas as keywords da lista no rótulo (29/10/2026)
  const dosEixos = useMemo(() => umaPorArtigo(items.filter(seMostra)), [items]);
  const daCovid = useMemo(() => umaPorArtigo((covid ?? []).filter(seMostra)), [covid]);
  const comVeredicto = covid && grupo === "covid" ? daCovid : dosEixos;
  // os separadores vêm dos dados, não de uma lista fixa que nunca lhes correspondeu
  const classifications = useMemo(
    () => ["TODOS", ...[...new Set(comVeredicto.map((i) => i.classification))].sort((a, b) => a.localeCompare(b, "pt"))],
    [comVeredicto]
  );

  const filteredItems = useMemo(() => {
    if (activeFilter === "TODOS") return comVeredicto;
    return comVeredicto.filter((item) => item.classification === activeFilter);
  }, [comVeredicto, activeFilter]);

  const separadores = covid ? (
    <div className="flex gap-3 mb-1.5 flex-shrink-0">
      {/* sem números: contavam linhas e não respondiam a nada (decisão da Marta, 29/10/2026) */}
      {([["eixos", "Eixos"], ["covid", "Covid-19"]] as const).map(([g, nome]) => (
        <button
          key={g}
          onClick={() => { setGrupo(g); setActiveFilter("TODOS"); }}
          className={`text-[8px] font-bold uppercase tracking-[0.15em] pb-0.5 border-b-2 transition-colors ${
            grupo === g ? "border-foreground text-foreground" : "border-transparent text-foreground/40"
          }`}
        >
          {nome}
        </button>
      ))}
    </div>
  ) : null;

  if (comVeredicto.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-foreground/50 mb-1.5">Fact-Check & Desinformação</p>
        {separadores}
        <p className="text-[10px] leading-relaxed text-foreground/50">
          Sem verificações com veredicto{covid ? (grupo === "covid" ? " sobre a covid-19" : " nos eixos") : " neste eixo"}.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-foreground/50 mb-1.5 flex-shrink-0">Fact-Check & Desinformação</p>
      {separadores}

      {/* Classification filter */}
      <div className="flex flex-wrap gap-0.5 mb-2 flex-shrink-0">
        {classifications.map((c) => (
          <button
            key={c}
            onClick={() => setActiveFilter(c)}
            className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 transition-colors border-none"
            style={
              activeFilter === c
                ? { background: getAxisFilterStyle(c).bg, color: getAxisFilterStyle(c).text }
                : { background: "transparent", color: "rgba(0,0,255,0.3)" }
            }
          >
            {c}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto flex-1 min-h-0 scrollbar-yellow space-y-0">
        {filteredItems.length === 0 ? (
          <p className="text-[10px] text-foreground/40 py-3">Nenhum item encontrado.</p>
        ) : (
          filteredItems.map((item, i) => (
            <div key={i}>
              <div className="py-1.5">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-semibold text-foreground/40 uppercase tracking-wider mb-0.5">
                      {item.term}
                    </p>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-medium hover:underline leading-tight block"
                    >
                      {item.title}
                    </a>
                    {/* o título da verificação: a afirmação sozinha às vezes não diz o que foi
                        verificado (decisão da Marta, 29/10/2026) */}
                    {(item as any).explicacao && (
                      <p className="text-[9px] text-foreground/60 leading-tight mt-0.5">
                        Verificação: {(item as any).explicacao}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[8px] text-foreground/40">{item.source}</p>
                      {(item as any).dataPublicacao && (
                        <p className="text-[8px] text-foreground/30">
                          {new Date((item as any).dataPublicacao).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[7px] font-bold uppercase tracking-wider border px-1 py-0.5 shrink-0 mt-0.5 ${estiloVeredicto(item.classification)}`}
                  >
                    {item.classification}
                  </span>
                </div>
              </div>
              {i < filteredItems.length - 1 && (
                <div className="border-t border-foreground/10" />
              )}
            </div>
          ))
        )}
      </div>
      <p className="text-[8px] leading-relaxed text-foreground/40 mt-1.5 flex-shrink-0">
        Verificações de editores portugueses indexadas pela Google Fact Check Tools API
        (ClaimReview), casadas com as keywords; o veredicto é o do editor, tal como o publicou.
      </p>
    </div>
  );
};

export default DebunkingTable;
