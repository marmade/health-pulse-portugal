import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GrupoResumo } from "@/lib/trendsGrupo";

/**
 * O dashboard lê SEMPRE de um lote só do Google Trends (trends_lotes) — nunca cola lotes.
 * Este hook vai buscar o último lote completo de 5 anos e, por eixo, devolve:
 *   - o top 5 dos termos (mediana calibrada nas últimas 52 semanas, na régua da âncora);
 *   - o gráfico: a média mensal DESSES 5 termos, ano corrente vs anterior — a média de
 *     todos os termos do eixo seria arrastada pelos que estão a zero;
 *   - as leituras: mais interesse, mais sobe (média anual, anos completos), mês mais alto.
 * Tudo vem das vistas trends_termo_52s / trends_termo_mensal / trends_termo_anual, que
 * fazem a conta no servidor. Sem lote, devolve null e o Index cai no googleTrends.json.
 * Decidido a 18/09/2026; método em docs/metodo/2026-09-18-reguas-e-ancoras.md.
 */

export type Top5Item = {
  termo: string; mediana: number; maximo: number; picoEm: string | null;
  medianaAnterior: number | null; variacao: number | null;   // 52s vs 52s anteriores, %
};
export type LoteEixo = { resumo: GrupoResumo; top5: Top5Item[] };
export type LoteInfo = { id: string; iniciadoEm: string; origem: string | null; timeframe: string };

const AXES = ["saude-mental", "alimentacao", "menopausa", "emergentes"];
const MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const media = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

/** termosDoEixo: os termos activos de cada eixo (a âncora pode não ser keyword — sai do top). */
export function useTrendsLote(termosDoEixo: Record<string, string[]> | null) {
  const [lote, setLote] = useState<LoteInfo | null>(null);
  const [porEixo, setPorEixo] = useState<Record<string, LoteEixo> | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!termosDoEixo) return;
    let cancelado = false;
    (async () => {
      try {
        // 1. o último lote completo de 5 anos
        const { data: ped, error: e1 } = await supabase
          .from("trends_pedidos" as never).select("lote_id, timeframe, fetched_at, trends_lotes!inner(id, estado, iniciado_em, origem)")
          .eq("timeframe", "today 5-y").eq("trends_lotes.estado", "completo")
          .order("fetched_at", { ascending: false }).limit(1);
        if (e1) throw e1;
        const p = (ped as unknown as { lote_id: string; timeframe: string; trends_lotes: { iniciado_em: string; origem: string | null } }[])?.[0];
        if (!p) { if (!cancelado) { setLote(null); setPorEixo(null); } return; }
        const loteId = p.lote_id;
        const info: LoteInfo = { id: loteId, iniciadoEm: p.trends_lotes.iniciado_em, origem: p.trends_lotes.origem, timeframe: p.timeframe };

        // 2. por termo: mediana e máximo nas últimas 52 semanas
        const { data: t52, error: e2 } = await supabase
          .from("trends_termo_52s" as never).select("*").eq("lote_id", loteId);
        if (e2) throw e2;
        type T52 = { eixo: string; termo: string; mediana_52s: number | null; maximo_52s: number | null; pico_em: string | null; mediana_52s_anteriores: number | null };
        const rows52 = (t52 as unknown as T52[]) || [];

        const resultado: Record<string, LoteEixo> = {};
        const termosTop: { eixo: string; termo: string }[] = [];
        for (const eixo of AXES) {
          const activos = new Set((termosDoEixo[eixo] || []).map(t => t.toLowerCase()));
          const top5 = rows52
            // só termos com procura: um "top 5 dos mais pesquisados" não pode ter medianas a 0
            .filter(r => r.eixo === eixo && activos.has(r.termo.toLowerCase()) && r.mediana_52s != null && +r.mediana_52s > 0)
            .sort((a, b) => (b.mediana_52s || 0) - (a.mediana_52s || 0))
            .slice(0, 5)
            .map(r => ({
              termo: r.termo, mediana: +(r.mediana_52s || 0), maximo: +(r.maximo_52s || 0), picoEm: r.pico_em,
              medianaAnterior: r.mediana_52s_anteriores == null ? null : +r.mediana_52s_anteriores,
              variacao: r.mediana_52s_anteriores && +r.mediana_52s_anteriores > 0
                ? Math.round(((+(r.mediana_52s || 0) - +r.mediana_52s_anteriores) / +r.mediana_52s_anteriores) * 100) : null,
            }));
          top5.forEach(t => termosTop.push({ eixo, termo: t.termo }));
          resultado[eixo] = { top5, resumo: null as unknown as GrupoResumo };
        }

        // 3. mensal e anual, só para os termos do top
        const termos = termosTop.map(t => t.termo);
        const [{ data: men, error: e3 }, { data: anu, error: e4 }] = await Promise.all([
          supabase.from("trends_termo_mensal" as never).select("eixo, termo, mes, media").eq("lote_id", loteId).in("termo", termos).limit(5000),
          supabase.from("trends_termo_anual" as never).select("eixo, termo, ano, media, meses").eq("lote_id", loteId).in("termo", termos).limit(1000),
        ]);
        if (e3) throw e3; if (e4) throw e4;
        type Men = { eixo: string; termo: string; mes: string; media: number };
        type Anu = { eixo: string; termo: string; ano: number; media: number; meses: number };
        const mensal = (men as unknown as Men[]) || [];
        const anual = (anu as unknown as Anu[]) || [];

        for (const eixo of AXES) {
          const top = resultado[eixo].top5.map(t => t.termo);
          const porMes = new Map<string, number[]>();   // "2026-03" → médias dos 5 termos
          for (const r of mensal) {
            if (r.eixo !== eixo || !top.includes(r.termo)) continue;
            const k = r.mes.slice(0, 7);
            if (!porMes.has(k)) porMes.set(k, []);
            porMes.get(k)!.push(+r.media);
          }
          const anos = [...new Set([...porMes.keys()].map(k => +k.slice(0, 4)))].sort();
          const anoCorrente = anos[anos.length - 1];
          const anoAnterior = anoCorrente - 1;
          const pontos = MES.map((lab, i) => {
            const mm = String(i + 1).padStart(2, "0");
            const c = porMes.get(`${anoCorrente}-${mm}`), a = porMes.get(`${anoAnterior}-${mm}`);
            return { week: lab,
              current: (c ? Math.round(media(c)) : undefined) as unknown as number,
              previous: (a ? Math.round(media(a)) : undefined) as unknown as number };
          });
          const comuns = pontos.filter(p => p.current != null && p.previous != null);
          const cM = media(comuns.map(p => p.current)), aM = media(comuns.map(p => p.previous));
          const anosCompletos = anos.filter(a => MES.every((_, i) => porMes.has(`${a}-${String(i + 1).padStart(2, "0")}`)));
          const ultimo = anosCompletos[anosCompletos.length - 1], penultimo = anosCompletos[anosCompletos.length - 2];

          let maisInteresse: GrupoResumo["maisInteresse"] = null, maisSobe: GrupoResumo["maisSobe"] = null;
          for (const termo of top) {
            const a = anual.filter(r => r.eixo === eixo && r.termo === termo);
            const u = a.find(r => r.ano === ultimo), p2 = a.find(r => r.ano === penultimo);
            if (u && (!maisInteresse || +u.media > maisInteresse.media)) maisInteresse = { termo, media: +u.media };
            if (u && p2 && +p2.media >= 5) {
              const v = Math.round((+u.media - +p2.media) / +p2.media * 100);
              if (!maisSobe || v > maisSobe.variacao) maisSobe = { termo, variacao: v, de: +p2.media, a: +u.media };
            }
          }
          let mesAlto: GrupoResumo["mesAlto"] = null;
          if (anosCompletos.length) MES.forEach((_, i) => {
            const mm = String(i + 1).padStart(2, "0");
            const m = media(anosCompletos.flatMap(a => porMes.get(`${a}-${mm}`) || []));
            if (!mesAlto || m > mesAlto.media) mesAlto = { mes: i, media: m };
          });

          resultado[eixo].resumo = {
            eixo, termos: top, regua: `lote ${loteId.slice(0, 8)}`, ficheiro: "trends_calibrados",
            descarregadoEm: info.iniciadoEm.slice(0, 10), granularidade: "semanal → mensal",
            pontos, anoCorrente, anoAnterior, mesesSobrepostos: comuns.length,
            maisInteresse, maisSobe, mesAlto, anosCompletos,
            variacao: comuns.length && aM > 0 ? { corrente: cM, anterior: aM, pct: (cM - aM) / aM * 100, meses: comuns.length } : null,
          };
        }
        if (!cancelado) { setLote(info); setPorEixo(resultado); }
      } catch (e) {
        console.error("useTrendsLote:", e);
        if (!cancelado) setErro(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelado = true; };
  }, [termosDoEixo]);

  return { lote, porEixo, erro };
}
