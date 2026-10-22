import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GrupoResumo } from "@/lib/trendsGrupo";
import { lerTudo, type Leitura, type Pagina } from "@/lib/lerTudo";

/**
 * O dashboard lê SEMPRE de um lote só do Google Trends (trends_lotes) — nunca cola lotes.
 * Este hook vai buscar o último lote completo de 5 anos e, por eixo, devolve:
 *   - o top 5: os itens com posição <= 5 do top 10 do ÚLTIMO ARQUIVO SEMANAL do eixo
 *     (eixos_archive.top_keywords, escrito pelo archive-weekly). Aqui não se ordena nada:
 *     a ordenação é uma só, a do arquivo (supabase/functions/_shared/top_eixo.ts). Com
 *     empate no 5.º lugar vêm 6 ou mais. Decidido pela Marta a 13/10/2026; até aí o top 5
 *     era a mediana de 52 semanas, outra conta (docs/sessoes/2026-10-13.md). Entre a
 *     recolha de domingo e o arquivo de segunda, o top é o da semana anterior;
 *   - o gráfico: a média mensal DESSES termos, ano corrente vs anterior — a média de
 *     todos os termos do eixo seria arrastada pelos que estão a zero;
 *   - as leituras: mais interesse, mais sobe (média anual, anos completos), mês mais alto.
 * O gráfico e as leituras vêm das vistas trends_termo_mensal / trends_termo_anual, que
 * fazem a conta no servidor. Sem lote, devolve null e o Index cai no googleTrends.json.
 * Decidido a 18/09/2026; método em docs/metodo/2026-09-18-reguas-e-ancoras.md.
 */

/** Um item do top do arquivo: valor da semana na régua do eixo, posição partilhada nos empates. */
export type Top5Item = { termo: string; valor: number; posicao: number };
/** De que arquivo vem o top: a semana, e a nota quando falta medição (semana vazia ou termos sem número). */
export type TopSemana = { weekStart: string; weekLabel: string; semanaTrends: string | null; nota: string | null };
/** Uma linha de trends_alertas (regra de 18/09/2026, docs/metodo/2026-09-18-alertas-regra.md). */
export type AlertaItem = {
  termo: string; tipo: "subida" | "aparecimento" | "sazonal" | "a_observar";
  valor: number; referencia: number; razao: number; z: number | null;
  fatorSazonal: number | null; maxAnterior: number | null; semanaN: number; inicio: string;
};
/** Os alertas do eixo na última semana completa do lote. `semana` é essa semana (domingo). */
export type AlertasEixo = { semana: string; itens: AlertaItem[] };
/** Mensal e anual do eixo lidos a menos do que a base conta: n lidas de m. `termos`: a quem faltam
    meses e quantos — null quando o anual também veio incompleto e não se pode saber. O gráfico
    mostra-se na mesma, com o aviso (decisão da Marta, 21/10/2026). */
export type Incompleto = { n: number; m: number; termos: { termo: string; faltam: number }[] | null };
export type LoteEixo = { resumo: GrupoResumo; top5: Top5Item[]; topSemana: TopSemana | null; alertas: AlertasEixo | null; incompleto: Incompleto | null };
export type LoteInfo = { id: string; iniciadoEm: string; origem: string | null; timeframe: string };

const AXES = ["saude-mental", "alimentacao", "menopausa", "emergentes"];
const MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const media = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const VAZIA: Leitura<never> = { linhas: [], contadas: 0, completa: true };

type Men = { eixo: string; termo: string; mes: string; media: number };
type Anu = { eixo: string; termo: string; ano: number; media: number; meses: number };

/** null se o mensal e o anual do eixo chegaram inteiros. Senão, quantas linhas chegaram e, se o
    anual chegou inteiro, a quem faltam meses: a soma de `meses` de um termo no anual é o número
    de linhas mensais que ele tem na base. */
export function incompletoDoEixo(termos: string[], men: Leitura<Men>, anu: Leitura<Anu>): Incompleto | null {
  if (men.completa && anu.completa) return null;
  const emFalta = anu.completa
    ? termos.map(termo => ({
        termo,
        faltam: anu.linhas.filter(r => r.termo === termo).reduce((s, r) => s + +r.meses, 0)
              - men.linhas.filter(r => r.termo === termo).length,
      })).filter(t => t.faltam > 0)
    : null;
  return { n: men.linhas.length + anu.linhas.length, m: men.contadas + anu.contadas, termos: emFalta };
}
const ORDEM: Record<AlertaItem["tipo"], number> = { subida: 0, aparecimento: 1, sazonal: 2, a_observar: 3 };

/** termosDoEixo: os termos activos de cada eixo. Desde 13/10/2026 o filtro dos activos faz-se
    no archive-weekly; aqui só marca quando a página tem os dados para pedir o lote. */
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

        // 2. o top de cada eixo: o do último arquivo semanal, tal como foi gravado. Os
        //    itens chegam já ordenados e com a posição; aqui só se escolhem os de posição <= 5.
        const { data: arq, error: e2 } = await supabase
          .from("eixos_archive" as never).select("axis, week_start, week_label, top_keywords, nota_medicao")
          .in("axis", AXES).order("week_start", { ascending: false }).limit(AXES.length * 2);
        if (e2) throw e2;
        type Arq = { axis: string; week_start: string; week_label: string; nota_medicao: string | null;
                     top_keywords: { term: string; valor: number; posicao: number | null; semana_trends?: string }[] | null };
        const ultimoArquivo: Record<string, Arq> = {};
        for (const a of (arq as unknown as Arq[]) || []) ultimoArquivo[a.axis] ??= a;

        const resultado: Record<string, LoteEixo> = {};
        for (const eixo of AXES) {
          const a = ultimoArquivo[eixo];
          const itens = a?.top_keywords || [];
          const top5 = itens
            .filter(k => k.posicao != null && k.posicao <= 5)
            .map(k => ({ termo: k.term, valor: +k.valor, posicao: k.posicao as number }));
          const topSemana = a ? {
            weekStart: a.week_start, weekLabel: a.week_label,
            semanaTrends: itens[0]?.semana_trends ?? null, nota: a.nota_medicao,
          } : null;
          resultado[eixo] = { top5, topSemana, resumo: null as unknown as GrupoResumo, alertas: null, incompleto: null };
        }

        // 2b. os alertas da última semana COMPLETA do lote (a semana parcial nunca conta —
        //     o Google marca-a; a regra avalia sempre a anterior). Se a tabela ainda não
        //     existir, o resto do lote continua a servir.
        try {
          const { data: ult } = await supabase
            .from("trends_calibrados" as never).select("data").eq("lote_id", loteId)
            .order("data", { ascending: false }).limit(1);
          const ultima = (ult as unknown as { data: string }[])?.[0]?.data?.slice(0, 10);
          if (ultima) {
            const { data: parc } = await supabase
              .from("trends_pontos" as never).select("pedido_id, trends_pedidos!inner(lote_id)")
              .eq("trends_pedidos.lote_id", loteId).eq("data", `${ultima}T00:00:00+00:00`).eq("is_partial", true).limit(1);
            const d = new Date(ultima + "T00:00:00Z");
            if ((parc as unknown[])?.length) d.setUTCDate(d.getUTCDate() - 7);
            const semana = d.toISOString().slice(0, 10);
            // "Nenhum alerta esta semana" é uma afirmação sobre os dados; um lote sem linha
            // nenhuma em trends_alertas (o passo 7 do script 5 falhou, ou o lote é anterior à
            // regra) não pode dizê-la — fica sem bloco.
            const { data: algum, error: e5a } = await supabase
              .from("trends_alertas" as never).select("semana").eq("lote_id", loteId).limit(1);
            if (e5a) throw e5a;
            if (!(algum as unknown[])?.length) throw new Error(`lote ${loteId.slice(0, 8)} sem alertas calculados`);
            const { data: al, error: e5 } = await supabase
              .from("trends_alertas" as never).select("*").eq("lote_id", loteId).eq("semana", semana);
            if (e5) throw e5;
            type Al = { eixo: string; termo: string; tipo: AlertaItem["tipo"]; valor: number; referencia: number; razao: number;
                        z: number | null; fator_sazonal: number | null; max_anterior: number | null; semana_n: number; inicio: string };
            const linhas = (al as unknown as Al[]) || [];
            for (const eixo of AXES) {
              resultado[eixo].alertas = {
                semana,
                itens: linhas.filter(r => r.eixo === eixo).map(r => ({
                  termo: r.termo, tipo: r.tipo, valor: +r.valor, referencia: +r.referencia, razao: +r.razao,
                  z: r.z == null ? null : +r.z, fatorSazonal: r.fator_sazonal == null ? null : +r.fator_sazonal,
                  maxAnterior: r.max_anterior == null ? null : +r.max_anterior, semanaN: r.semana_n, inicio: r.inicio,
                })).sort((a, b) => ORDEM[a.tipo] - ORDEM[b.tipo] || b.razao - a.razao),
              };
            }
          }
        } catch (e) {
          console.warn("useTrendsLote: alertas indisponíveis —", e);
        }

        // 3. mensal e anual, só para os termos do top. Um pedido por eixo, lido por páginas: a
        //    API corta em 1000 linhas sem erro, e o lote c2a00bb6 tem 1220 para os 20 termos
        //    (docs/sessoes/2026-10-21.md). Se o lido não bater com a contagem da base, o gráfico
        //    mostra-se na mesma, com um aviso do que falta (decisão da Marta, 21/10/2026).
        const leituras = await Promise.all(AXES.map(async eixo => {
          const termos = resultado[eixo].top5.map(t => t.termo);
          if (!termos.length) return { eixo, men: VAZIA as Leitura<Men>, anu: VAZIA as Leitura<Anu> };
          const [men, anu] = await Promise.all([
            lerTudo<Men>((de, ate) => supabase.from("trends_termo_mensal" as never)
              .select("eixo, termo, mes, media", { count: "exact" }).eq("lote_id", loteId).eq("eixo", eixo)
              .in("termo", termos).order("termo").order("mes").range(de, ate) as unknown as Promise<Pagina<Men>>),
            lerTudo<Anu>((de, ate) => supabase.from("trends_termo_anual" as never)
              .select("eixo, termo, ano, media, meses", { count: "exact" }).eq("lote_id", loteId).eq("eixo", eixo)
              .in("termo", termos).order("termo").order("ano").range(de, ate) as unknown as Promise<Pagina<Anu>>),
          ]);
          return { eixo, men, anu };
        }));
        const mensal = leituras.flatMap(l => l.men.linhas);
        const anual = leituras.flatMap(l => l.anu.linhas);
        for (const { eixo, men, anu } of leituras) {
          resultado[eixo].incompleto = incompletoDoEixo(resultado[eixo].top5.map(t => t.termo), men, anu);
          if (resultado[eixo].incompleto) console.error(`useTrendsLote: ${eixo} incompleto — mensal ${men.linhas.length} de ${men.contadas}, anual ${anu.linhas.length} de ${anu.contadas}`);
        }

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
