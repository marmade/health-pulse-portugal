/**
 * Os "Sinais emergentes" do briefing semanal, a partir de `trends_alertas` (28/10/2026).
 *
 * Chamada pelo archive-weekly, que grava o resultado em `briefings_archive.top_emerging`
 * (cada item com `parte`) e as frases das partes vazias em `briefings_archive.notas`.
 * Sem imports, para correr igual no Deno (função) e no vitest (src/test/emergentes.test.ts).
 *
 * Regra decidida pela Marta a 28/10/2026 (docs/sessoes/2026-10-28.md §6, §12): quatro partes,
 * todas do lote do top 10 do mesmo briefing.
 *   1. novos       — subida e aparecimento que começaram na semana (`semana_n = 1`);
 *   2. em curso    — subida e aparecimento de semanas anteriores (`semana_n > 1`), com a idade;
 *   3. a observar  — subiram (z >= 2) sem chegar ao limite de alerta;
 *   4. previsíveis — o que subiu no mês vigente em pelo menos 2 dos anos anteriores, com
 *                    factor sazonal >= 1,5. Uma subida num só ano é coincidência.
 * Ordem nas partes 1–3: a do ecrã (src/hooks/useTrendsLote.ts) — tipo, depois razão a descer.
 * As linhas `sazonal` da semana não entram nas partes 1–3 (o ecrã também não lhes chama alerta).
 *
 * TENDÊNCIA (decisão da Marta, 29/10/2026 — docs/metodo/2026-09-18-alertas-regra.md §7a): um
 * alerta em curso há mais de 26 semanas passa a `tendencia` em trends_alertas. Sai de "em curso"
 * e fica numa linha à parte (parte "tendencia"), sem bandeira e sem a palavra "alerta":
 * «creatina — tendência de subida desde 02/01/2022 · 190,6 (o valor normal antes era 40,8)».
 *
 * Os previsíveis só vêem as semanas em que o termo mexeu (há linha em `trends_alertas` só com
 * z >= 2 ou em curso). Um termo que sobe devagar todos os anos não aparece. Fica para depois
 * de 2/11: calcular a sazonalidade sobre `trends_calibrados`.
 */

export type TipoAlerta = "subida" | "aparecimento" | "sazonal" | "a_observar" | "tendencia";

/** Uma linha de trends_alertas como vem da API (numéricos em texto). */
export type LinhaAlerta = {
  eixo: string;
  termo: string;
  tipo: TipoAlerta;
  semana: string;
  valor: number | string;
  referencia: number | string;
  razao: number | string;
  z: number | string | null;
  fator_sazonal: number | string | null;
  max_anterior?: number | string | null;
  semana_n: number;
  inicio: string;
};

export type Parte = "novo" | "em_curso" | "tendencia" | "a_observar" | "previsivel";

export type SinalDaSemana = {
  parte: "novo" | "em_curso" | "tendencia" | "a_observar";
  term: string;
  axis: string;
  tipo: TipoAlerta;
  valor: number;
  referencia: number;
  razao: number;
  z: number | null;
  // Só no aparecimento: o máximo das 52 semanas anteriores, como no ecrã.
  max_anterior: number | null;
  semana_n: number;
  inicio: string;
  // O que a página e o PDF de antes de 28/10 lêem: (razão − 1) × 100, arredondado.
  change_percent: number;
};

export type Previsivel = {
  parte: "previsivel";
  term: string;
  axis: string;
  mes: number;
  anos: number[];
  anos_possiveis: number;
  fator_max: number;
};

const ORDEM: Record<TipoAlerta, number> = { subida: 0, aparecimento: 1, sazonal: 2, a_observar: 3, tendencia: 4 };
const COLLATOR = new Intl.Collator("pt");

export const FATOR_MIN = 1.5;
export const ANOS_MIN = 2;
// O factor sazonal da semana j precisa da semana j − 52 com 8 semanas antes: j >= 60.
const SEMANAS_PARA_FATOR = 60;

export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const dia = (iso: string, n: number) => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
};

/** O mês e o ano de uma semana do Trends (domingo): os da quarta-feira, que tem 4 dos 7 dias. */
export function mesDaSemana(semana: string): { mes: number; ano: number } {
  const q = dia(semana, 3);
  return { mes: q.getUTCMonth() + 1, ano: q.getUTCFullYear() };
}

const dataPt = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const umaCasa = (x: number) => x.toFixed(1).replace(".", ",");

/** A linha da tendência, sem o termo (decisão da Marta, 29/10/2026). */
export function fraseDaTendencia(t: { valor: number; referencia: number; inicio: string }) {
  return `tendência de subida desde ${dataPt(t.inicio)} · ` +
    `${umaCasa(t.valor)} (o valor normal antes era ${umaCasa(t.referencia)})`;
}

/** "18 a 24/10", a partir do domingo. */
export function intervaloDaSemana(semana: string): string {
  const a = dia(semana, 0), b = dia(semana, 6);
  const dd = (d: Date) => String(d.getUTCDate()).padStart(2, "0");
  const mm = (d: Date) => String(d.getUTCMonth() + 1).padStart(2, "0");
  return a.getUTCMonth() === b.getUTCMonth()
    ? `${dd(a)} a ${dd(b)}/${mm(b)}`
    : `${dd(a)}/${mm(a)} a ${dd(b)}/${mm(b)}`;
}

/** Partes 1–3 e a linha da tendência, das linhas da semana do briefing (`semana` = semana do Trends). */
export function sinaisDaSemana(linhas: LinhaAlerta[], semana: string): SinalDaSemana[] {
  const parte = (l: LinhaAlerta): SinalDaSemana["parte"] | null =>
    l.tipo === "a_observar" ? "a_observar"
      : l.tipo === "tendencia" ? "tendencia"
      : l.tipo === "subida" || l.tipo === "aparecimento" ? (l.semana_n === 1 ? "novo" : "em_curso")
      : null;
  const ordemParte = { novo: 0, em_curso: 1, tendencia: 2, a_observar: 3 };
  return linhas
    .filter((l) => l.semana.slice(0, 10) === semana)
    .flatMap((l) => {
      const p = parte(l);
      if (!p) return [];
      const razao = Number(l.razao);
      return [{
        parte: p,
        term: l.termo,
        axis: l.eixo,
        tipo: l.tipo,
        valor: Number(l.valor),
        referencia: Number(l.referencia),
        razao,
        z: l.z == null ? null : Number(l.z),
        max_anterior: l.max_anterior == null ? null : Number(l.max_anterior),
        semana_n: l.semana_n,
        inicio: l.inicio,
        change_percent: Math.round((razao - 1) * 100),
      }];
    })
    .sort((a, b) =>
      ordemParte[a.parte] - ordemParte[b.parte] ||
      ORDEM[a.tipo] - ORDEM[b.tipo] ||
      b.razao - a.razao ||
      COLLATOR.compare(a.term, b.term)
    );
}

/**
 * Os anos anteriores a `ano` em que o mês podia ter factor sazonal no lote: os que têm, nesse
 * mês, uma semana com pelo menos 60 semanas de série antes. `inicioSerie` é a 1.ª semana do
 * lote (domingo). É o "de N" de "em 2 de N anos".
 */
export function anosPossiveis(mes: number, ano: number, inicioSerie: string): number[] {
  const anos = new Set<number>();
  for (let j = SEMANAS_PARA_FATOR; ; j++) {
    const semana = dia(inicioSerie, 7 * j).toISOString().slice(0, 10);
    const m = mesDaSemana(semana);
    if (m.ano >= ano) break;
    if (m.mes === mes) anos.add(m.ano);
  }
  return [...anos].sort((a, b) => a - b);
}

/** Parte 4: o que subiu no `mes` (1–12) em pelo menos 2 dos anos anteriores a `ano`. */
export function previsiveisDoMes(
  linhas: LinhaAlerta[],
  mes: number,
  ano: number,
  inicioSerie: string,
): { anosPossiveis: number[]; itens: Previsivel[] } {
  const possiveis = anosPossiveis(mes, ano, inicioSerie);
  const porTermo = new Map<string, { eixo: string; termo: string; anos: Set<number>; fator: number }>();
  for (const l of linhas) {
    if (l.fator_sazonal == null || Number(l.fator_sazonal) < FATOR_MIN) continue;
    const m = mesDaSemana(l.semana);
    if (m.mes !== mes || m.ano >= ano) continue;
    const chave = `${l.eixo}\u0000${l.termo}`;
    const t = porTermo.get(chave) ?? { eixo: l.eixo, termo: l.termo, anos: new Set<number>(), fator: 0 };
    t.anos.add(m.ano);
    t.fator = Math.max(t.fator, Number(l.fator_sazonal));
    porTermo.set(chave, t);
  }
  const itens = [...porTermo.values()]
    .filter((t) => t.anos.size >= ANOS_MIN)
    .map((t): Previsivel => ({
      parte: "previsivel",
      term: t.termo,
      axis: t.eixo,
      mes,
      anos: [...t.anos].sort((a, b) => a - b),
      anos_possiveis: possiveis.length,
      fator_max: Math.round(t.fator * 1000) / 1000,
    }))
    .sort((a, b) =>
      b.anos.length - a.anos.length || b.fator_max - a.fator_max || COLLATOR.compare(a.term, b.term)
    );
  return { anosPossiveis: possiveis, itens };
}

/** As frases das partes vazias, e o mês da parte 4. Chaves de `briefings_archive.notas`. */
export function notasDasPartes(
  sinais: SinalDaSemana[],
  previsiveis: { anosPossiveis: number[]; itens: Previsivel[] },
  semana: string,
  mes: number,
): Record<string, string> {
  const nomeMes = MESES[mes - 1];
  const notas: Record<string, string> = { emergentes_mes: nomeMes };
  const tem = (p: Parte) => sinais.some((s) => s.parte === p);
  if (!tem("novo")) {
    notas.emergentes_novos = `Nenhum alerta começou na semana do Google Trends de ${intervaloDaSemana(semana)}.`;
  }
  if (!tem("em_curso")) {
    notas.emergentes_em_curso = "Nenhum alerta de semanas anteriores continua em curso.";
  }
  if (!tem("a_observar")) {
    notas.emergentes_a_observar = "Nenhum termo subiu sem chegar ao limite de alerta.";
  }
  if (previsiveis.itens.length === 0) {
    const n = previsiveis.anosPossiveis.length;
    notas.emergentes_previsiveis = n < ANOS_MIN
      ? `O lote ainda não tem anos anteriores suficientes para ${nomeMes} (tem ${n}; são precisos ${ANOS_MIN}).`
      : `Nenhum termo subiu em ${nomeMes} em pelo menos ${ANOS_MIN} dos ${n} anos anteriores.`;
  }
  return notas;
}
