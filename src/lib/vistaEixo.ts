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

/** `n` = semanas do lote nesse mês (trends_termo_mensal); diz se o mês está completo. */
export type LinhaMensal ={ termo: string; mes: string; media: number | string; n?: number };
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

/* ---------- O mês: a leitura mensal (22/10/2026, docs/sessoes/2026-10-22.md §9.2 e §11) ---------- */

/** Quantos domingos tem o mês — as semanas do Trends começam ao domingo. `mes` = "AAAA-MM-01". */
export function domingosNoMes(mes: string): number {
  const ano = +mes.slice(0, 4), m = +mes.slice(5, 7) - 1;
  const dias = new Date(Date.UTC(ano, m + 1, 0)).getUTCDate();
  const primeiro = new Date(Date.UTC(ano, m, 1)).getUTCDay();
  return Array.from({ length: dias }, (_, d) => (primeiro + d) % 7).filter(w => w === 0).length;
}

const mesAnterior = (mes: string) => `${+mes.slice(0, 4) - 1}${mes.slice(4, 10)}`;

/** Os meses que o selector oferece, do mais recente ao mais antigo: completos (o lote tem todas
    as semanas que começam no mês) e com o mesmo mês do ano anterior também completo. */
export function mesesDaLeitura(linhas: LinhaMensal[]): string[] {
  const porMes = new Map<string, boolean>();
  for (const r of linhas) {
    const mes = r.mes.slice(0, 10);
    porMes.set(mes, (porMes.get(mes) ?? true) && r.n === domingosNoMes(mes));
  }
  const completos = new Set([...porMes].filter(([, c]) => c).map(([m]) => m));
  return [...completos].filter(m => completos.has(mesAnterior(m))).sort().reverse();
}

export const nomeDoMes = (mes: string) => `${MES_LONGO[+mes.slice(5, 7) - 1]} de ${mes.slice(0, 4)}`;

export type ItemMes = { termo: string; valor: number; posicao: number; anterior: number | null; variacao: number | null };

/** Os 10 mais procurados do mês (a regra do arquivo, topDoEixo, sobre a média do mês), com a
    variação face ao mesmo mês do ano anterior: sem percentagem quando esse valor é < 5 (o limiar
    do "mais sobe" do gráfico do eixo). Contas em centésimas inteiras, como a vista as grava, para
    o arredondamento ser o mesmo que o da consulta de prova. */
export function leituraDoMes(linhas: LinhaMensal[], termosActivos: string[], mes: string) {
  const ant = mesAnterior(mes);
  const doMes = linhas.filter(r => r.mes.slice(0, 10) === mes);
  const anteriores = new Map(linhas.filter(r => r.mes.slice(0, 10) === ant).map(r => [r.termo.toLowerCase(), +r.media]));
  const itens: ItemMes[] = topDoEixo(doMes.map(r => ({ termo: r.termo, valor: r.media })), termosActivos, 10)
    .map(t => {
      const anterior = anteriores.get(t.term.toLowerCase()) ?? null;
      const c = Math.round(t.valor_eixo * 100), p = anterior == null ? null : Math.round(anterior * 100);
      const variacao = p != null && p >= 500 ? Math.round((c - p) * 100 / p) : null;
      return { termo: t.term, valor: t.valor, posicao: t.posicao, anterior, variacao };
    });
  const subidas = itens.filter(i => i.variacao != null && i.variacao > 0);
  const maximo = subidas.length ? Math.max(...subidas.map(i => i.variacao!)) : null;
  const maisSubiu = maximo == null ? null : { termos: subidas.filter(i => i.variacao === maximo).map(i => i.termo), variacao: maximo };
  return { itens, maisSubiu, mesAnterior: ant };
}

const num = (v: number) => v.toLocaleString("pt-PT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** A variação por extenso, sem sinal (decisão de 22/10, §4.2): "sobe 12%", "desce 36%", "igual",
    ou os dois valores quando o ano anterior é < 5. */
export function variacaoPorExtenso(i: ItemMes): string {
  if (i.anterior == null) return "sem valor no ano anterior";
  if (i.variacao == null) return `de ${num(i.anterior)} para ${num(i.valor)}`;
  if (i.variacao === 0) return "igual";
  return `${i.variacao > 0 ? "sobe" : "desce"} ${Math.abs(i.variacao)}%`;
}
export { num as valorComUmaCasa };
