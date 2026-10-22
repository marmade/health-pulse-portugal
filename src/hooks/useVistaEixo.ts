import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lerTudo, type Pagina } from "@/lib/lerTudo";
import { ultimoAno, termosPorProcura, seriesPorTermo, type Linha52s, type LinhaMensal, type PontoMensal } from "@/lib/vistaEixo";
import type { Top5Item, Incompleto } from "@/hooks/useTrendsLote";

/**
 * O que só a vista do eixo lê do lote (22/10/2026, docs/sessoes/2026-10-22.md): a mediana das
 * 52 semanas de cada termo activo (os mais procurados do último ano) e a série mensal de cada
 * termo activo (o painel do Google Trends, que até aqui lia o googleTrends.json de 18/09).
 * São ~1525 linhas mensais por eixo: lidas por páginas, e com o lido a menos diz-se quanto.
 */
export type VistaEixo = {
  ultimoAno: Top5Item[];
  ultimoAnoIncompleto: Incompleto | null;
  /** Os termos activos pela procura do último ano: a ordem dos botões do painel. */
  termosPorProcura: string[];
  series: Map<string, PontoMensal[]>;
  seriesIncompleto: Incompleto | null;
  /** As mesmas linhas mensais, com `n`: a leitura mensal ("O mês") faz as contas a partir daqui. */
  mensal: LinhaMensal[];
};

export function useVistaEixo(eixo: string | null, loteId: string | null, termosActivos: string[] | null) {
  const [dados, setDados] = useState<VistaEixo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const chave = termosActivos?.join("|") ?? "";

  useEffect(() => {
    setDados(null);
    if (!eixo || !loteId || !termosActivos?.length) return;
    let cancelado = false;
    (async () => {
      try {
        const [s52, men] = await Promise.all([
          lerTudo<Linha52s>((de, ate) => supabase.from("trends_termo_52s" as never)
            .select("termo, mediana_52s", { count: "exact" }).eq("lote_id", loteId).eq("eixo", eixo)
            .in("termo", termosActivos).order("termo").range(de, ate) as unknown as Promise<Pagina<Linha52s>>),
          lerTudo<LinhaMensal>((de, ate) => supabase.from("trends_termo_mensal" as never)
            .select("termo, mes, media, n", { count: "exact" }).eq("lote_id", loteId).eq("eixo", eixo)
            .in("termo", termosActivos).order("termo").order("mes").range(de, ate) as unknown as Promise<Pagina<LinhaMensal>>),
        ]);
        const incompleto = (l: { linhas: unknown[]; contadas: number; completa: boolean }): Incompleto | null =>
          l.completa ? null : { n: l.linhas.length, m: l.contadas, termos: null };
        if (!cancelado) setDados({
          ultimoAno: ultimoAno(s52.linhas, termosActivos),
          ultimoAnoIncompleto: incompleto(s52),
          termosPorProcura: termosPorProcura(s52.linhas, termosActivos),
          series: seriesPorTermo(men.linhas, termosActivos),
          seriesIncompleto: incompleto(men),
          mensal: men.linhas,
        });
      } catch (e) {
        console.error("useVistaEixo:", e);
        if (!cancelado) setErro(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eixo, loteId, chave]);

  return { dados, erro };
}
