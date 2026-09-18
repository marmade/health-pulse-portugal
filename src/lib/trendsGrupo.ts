import type { TrendPoint } from "@/data/mockData";
import dados from "@/data/googleTrends.json";

/**
 * O gráfico-resumo de cada eixo na página inicial (decisão da Marta, 18/09/2026):
 * uma linha por eixo, este ano contra o anterior, calculada como a MÉDIA dos termos
 * de UMA descarga de grupo — todos na mesma régua, logo a média é legítima.
 *
 * Antes, a linha era a média de todas as keywords do eixo sobre `historical_snapshots`,
 * cada uma na sua régua (normalizada ao próprio máximo) e sobre uma série parada desde
 * 10/08/2026. A forma dessa curva era um artefacto. Ver docs/sessoes/2026-09-18.md.
 *
 * Regra de escolha da descarga: na pasta do eixo, o ficheiro com mais termos (em
 * empate, o nome mais recente), excluindo as réguas conjuntas com período anterior.
 * Tudo o que se lê por baixo do gráfico é calculado daqui — nada é escrito à mão.
 */

type Ponto = { data: string; valor: number };
type Serie = {
  termo: string; rotulo: string; eixo: string; granularidade: string; pontos: Ponto[];
  regua: string; ficheiro: string; descarregado_em: string; maximo: number;
  termos_no_ficheiro: number; regua_conjunta_com_periodo_anterior: boolean;
};

export type GrupoResumo = {
  eixo: string;
  termos: string[];
  regua: string;
  ficheiro: string;
  descarregadoEm: string;
  granularidade: string;
  pontos: TrendPoint[];          // média do grupo, mês a mês: ano corrente vs anterior
  anoCorrente: number;
  anoAnterior: number;
  mesesSobrepostos: number;
  maisInteresse: { termo: string; media: number } | null;   // média no último ano completo
  maisSobe: { termo: string; variacao: number; de: number; a: number } | null;
  mesAlto: { mes: number; media: number } | null;           // sazonalidade da média do grupo
  anosCompletos: number[];
  /** média do grupo nos meses que existem nos dois anos: corrente vs anterior */
  variacao: { corrente: number; anterior: number; pct: number; meses: number } | null;
};

const MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const MES_LONGO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const media = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const SERIES = (dados as unknown as { series: Serie[] }).series;

function escolherRegua(eixo: string): Serie[] {
  const porRegua = new Map<string, Serie[]>();
  for (const s of SERIES) {
    if (s.eixo !== eixo || s.regua_conjunta_com_periodo_anterior) continue;
    if (!porRegua.has(s.regua)) porRegua.set(s.regua, []);
    porRegua.get(s.regua)!.push(s);
  }
  const candidatas = [...porRegua.entries()]
    .sort((a, b) => b[1].length - a[1].length || b[0].localeCompare(a[0]));
  return candidatas.length ? candidatas[0][1] : [];
}

export function grupoDoEixo(eixo: string): GrupoResumo | null {
  const grupo = escolherRegua(eixo);
  if (grupo.length === 0) return null;

  // ano-mês → valores de todos os termos (mesma régua: a média é legítima)
  const porAnoMes = new Map<string, number[]>();
  const porTermoAno = new Map<string, Map<number, number[]>>();
  for (const s of grupo) {
    const t = new Map<number, number[]>();
    porTermoAno.set(s.termo, t);
    for (const p of s.pontos) {
      const k = p.data.slice(0, 7);
      const ano = +p.data.slice(0, 4);
      if (!porAnoMes.has(k)) porAnoMes.set(k, []);
      porAnoMes.get(k)!.push(p.valor);
      if (!t.has(ano)) t.set(ano, []);
      t.get(ano)!.push(p.valor);
    }
  }
  const anos = [...new Set([...porAnoMes.keys()].map(k => +k.slice(0, 4)))].sort();
  const anoCorrente = anos[anos.length - 1];
  const anoAnterior = anoCorrente - 1;

  const pontos: TrendPoint[] = MES.map((lab, i) => {
    const mm = String(i + 1).padStart(2, "0");
    const c = porAnoMes.get(`${anoCorrente}-${mm}`);
    const p = porAnoMes.get(`${anoAnterior}-${mm}`);
    return {
      week: lab,
      current: (c ? Math.round(media(c)) : undefined) as unknown as number,
      previous: (p ? Math.round(media(p)) : undefined) as unknown as number,
    };
  });
  const mesesSobrepostos = pontos.filter(p => p.current != null && p.previous != null).length;

  // "Var. média" da coluna: os mesmos meses nos dois anos, na mesma régua
  let variacao: GrupoResumo["variacao"] = null;
  if (mesesSobrepostos > 0) {
    const comuns = pontos.filter(p => p.current != null && p.previous != null);
    const c = media(comuns.map(p => p.current));
    const a = media(comuns.map(p => p.previous));
    if (a > 0) variacao = { corrente: c, anterior: a, pct: (c - a) / a * 100, meses: comuns.length };
  }

  // anos civis completos: os 12 meses presentes
  const anosCompletos = anos.filter(a =>
    MES.every((_, i) => porAnoMes.has(`${a}-${String(i + 1).padStart(2, "0")}`)));
  const ultimoCompleto = anosCompletos[anosCompletos.length - 1];
  const penultimoCompleto = anosCompletos[anosCompletos.length - 2];

  let maisInteresse: GrupoResumo["maisInteresse"] = null;
  let maisSobe: GrupoResumo["maisSobe"] = null;
  if (ultimoCompleto != null) {
    for (const s of grupo) {
      const m = media(porTermoAno.get(s.termo)!.get(ultimoCompleto) || []);
      if (!maisInteresse || m > maisInteresse.media) maisInteresse = { termo: s.termo, media: m };
      if (penultimoCompleto != null) {
        const de = media(porTermoAno.get(s.termo)!.get(penultimoCompleto) || []);
        // base mínima de 5 pontos: abaixo disso a variação é ruído de arredondamento
        if (de >= 5) {
          const v = Math.round((m - de) / de * 100);
          if (!maisSobe || v > maisSobe.variacao) maisSobe = { termo: s.termo, variacao: v, de, a: m };
        }
      }
    }
  }

  let mesAlto: GrupoResumo["mesAlto"] = null;
  if (anosCompletos.length > 0) {
    MES.forEach((_, i) => {
      const mm = String(i + 1).padStart(2, "0");
      const v = anosCompletos.flatMap(a => porAnoMes.get(`${a}-${mm}`) || []);
      const m = media(v);
      if (!mesAlto || m > mesAlto.media) mesAlto = { mes: i, media: m };
    });
  }

  const s0 = grupo[0];
  return {
    eixo, termos: grupo.map(s => s.termo), regua: s0.regua, ficheiro: s0.ficheiro,
    descarregadoEm: s0.descarregado_em, granularidade: s0.granularidade,
    pontos, anoCorrente, anoAnterior, mesesSobrepostos, maisInteresse, maisSobe, mesAlto,
    anosCompletos, variacao,
  };
}
