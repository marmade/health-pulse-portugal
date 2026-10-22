import { topDoEixo } from "../../supabase/functions/_shared/top_eixo";
import type { TrendPoint } from "@/data/mockData";

/**
 * As contas da vista do eixo (22/10/2026, docs/sessoes/2026-10-22.md). Sem rede: o hook
 * useVistaEixo lê, isto ordena e agrupa.
 */

export type ItemArquivo = { term: string; valor?: number; posicao?: number; semana_trends?: string };
export type EntradaArquivo = { id: string; week_start: string; week_label: string; top_keywords: ItemArquivo[] | null };
/** Uma semana do arquivo com posições: os termos de cada posição (empates juntos), sem valores. */
export type SemanaPorPosicao = { entrada: EntradaArquivo; semanaTrends: string | null; porPosicao: Map<number, string[]> };

/**
 * Separa o arquivo em duas medidas (decisão da Marta, 22/10/2026):
 *   · com posição — arquivos escritos a partir de 28/09/2026 (week_start ≥ 21/09), do lote;
 *   · antigas — a regra anterior, sem posição nem lote: ficam à parte, só com o PDF.
 * Uma semana conta como "com posição" se todos os itens a têm.
 */
export function arquivoPorPosicao(entradas: EntradaArquivo[]): { comPosicao: SemanaPorPosicao[]; antigas: EntradaArquivo[] } {
  const ordenadas = [...entradas].sort((a, b) => b.week_start.localeCompare(a.week_start));
  const comPosicao: SemanaPorPosicao[] = [];
  const antigas: EntradaArquivo[] = [];
  for (const e of ordenadas) {
    const itens = e.top_keywords || [];
    if (!itens.length || !itens.every(k => typeof k.posicao === "number")) { antigas.push(e); continue; }
    const porPosicao = new Map<number, string[]>();
    for (const k of itens) {
      if (!porPosicao.has(k.posicao!)) porPosicao.set(k.posicao!, []);
      porPosicao.get(k.posicao!)!.push(k.term);
    }
    comPosicao.push({ entrada: e, semanaTrends: itens[0].semana_trends ?? null, porPosicao });
  }
  return { comPosicao, antigas };
}

export type Linha52s = { termo: string; mediana_52s: number | string | null };

/** Os mais procurados do último ano: a regra do arquivo (topDoEixo) sobre a mediana das 52 semanas. */
export function ultimoAno(linhas: Linha52s[], termosActivos: string[], corte = 10) {
  return topDoEixo(linhas.map(l => ({ termo: l.termo, valor: l.mediana_52s })), termosActivos, corte)
    .map(t => ({ termo: t.term, valor: t.valor, posicao: t.posicao }));
}

/** Os termos activos pela ordem do último ano (todas as posições, não só as 10 primeiras); os
    que não tiveram procura vão no fim, pela ordem em que vieram. Ordena os botões do painel e
    escolhe o termo com que ele abre (decisão da Marta, 22/10/2026). */
export function termosPorProcura(linhas: Linha52s[], termosActivos: string[]): string[] {
  const comProcura = ultimoAno(linhas, termosActivos, Infinity).map(t => t.termo);
  const vistos = new Set(comProcura);
  return [...comProcura, ...termosActivos.filter(t => !vistos.has(t))];
}

export type LinhaMensal ={ termo: string; mes: string; media: number | string };
export type PontoMensal = { data: string; valor: number };

/** A série mensal de cada termo, por ordem de mês. Termos activos sem linhas ficam com série vazia. */
export function seriesPorTermo(linhas: LinhaMensal[], termosActivos: string[]): Map<string, PontoMensal[]> {
  const m = new Map<string, PontoMensal[]>(termosActivos.map(t => [t, []]));
  for (const r of linhas) m.get(r.termo)?.push({ data: r.mes.slice(0, 10), valor: +r.media });
  for (const s of m.values()) s.sort((a, b) => a.data.localeCompare(b.data));
  return m;
}

const MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const MES_LONGO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const media = (a: number[]) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

/** A leitura de uma série mensal (o painel do Google Trends): ano corrente contra anterior, anos
    completos, sazonalidade, máximo e zeros. Calculada dos pontos, nunca escrita à mão. */
export function analisar(pontosMes: PontoMensal[]) {
  const porAnoMes = new Map<string, number[]>();
  for (const p of pontosMes) {
    const k = p.data.slice(0, 7);
    if (!porAnoMes.has(k)) porAnoMes.set(k, []);
    porAnoMes.get(k)!.push(p.valor);
  }
  const anoDe = (d: string) => +d.slice(0, 4);
  const anos = [...new Set(pontosMes.map(p => anoDe(p.data)))].sort();
  const corrente = anos[anos.length - 1];
  const anterior = corrente - 1;

  // pontos para o TrendChart: mês a mês, ano corrente vs anterior
  const pontos: TrendPoint[] = MES.map((lab, i) => {
    const mm = String(i + 1).padStart(2, "0");
    const c = porAnoMes.get(`${corrente}-${mm}`);
    const p = porAnoMes.get(`${anterior}-${mm}`);
    return {
      week: lab,
      current: (c ? Math.round(media(c)) : undefined) as unknown as number,
      previous: (p ? Math.round(media(p)) : undefined) as unknown as number,
    };
  });
  const sobrepostos = pontos.filter(p => p.current != null && p.previous != null).length;

  // anos civis completos, para tendência e sazonalidade
  const completos = anos.filter(a => new Set(
    pontosMes.filter(p => anoDe(p.data) === a).map(p => p.data.slice(5, 7))).size === 12);
  const mediasAnuais = completos.map(a => ({
    ano: a, m: media(pontosMes.filter(p => anoDe(p.data) === a).map(p => p.valor)),
  }));
  const sazonal = MES.map((_, i) => {
    const mm = String(i + 1).padStart(2, "0");
    const v = completos.flatMap(a => porAnoMes.get(`${a}-${mm}`) || []);
    return { mes: i, m: media(v) };
  }).filter(x => x.m > 0);
  const alto = sazonal.length ? sazonal.reduce((a, b) => (b.m > a.m ? b : a)) : null;
  const baixo = sazonal.length ? sazonal.reduce((a, b) => (b.m < a.m ? b : a)) : null;

  const maximo = pontosMes.reduce<PontoMensal | null>((m, p) => (!m || p.valor > m.valor ? p : m), null);
  const zeros = pontosMes.filter(p => p.valor === 0).length;

  return { pontos, sobrepostos, corrente, anterior, mediasAnuais, alto, baixo, maximo, zeros };
}
