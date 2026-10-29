/**
 * As perguntas do briefing agrupadas por eixo — o que a página /briefing e o PDF mostram (decisões
 * da Marta, 29/10/2026; docs/sessoes/2026-10-29.md). A regra está em
 * supabase/functions/_shared/perguntas.ts, a mesma do archive-weekly.
 *
 * Os briefings arquivados antes de 2/11/2026 não têm `lugar` nos itens (eram o top 5 geral): para
 * esses gruposDoArquivo devolve null e a página mostra-os como até aqui.
 */
import {
  EIXOS, perguntasPorEixo, type LinhaPergunta, type Variante,
} from "../../supabase/functions/_shared/perguntas";

export type PerguntaArquivada = {
  term: string; axis: string; lugar: number;
  growth_percent: number | null; fora_de_escala: boolean; variantes?: Variante[];
};

export type GrupoPerguntas = { axis: string; itens: PerguntaArquivada[] };

const subida = (q: { growth_percent: number | null; fora_de_escala: boolean }) =>
  q.fora_de_escala ? "fora de escala" : q.growth_percent != null ? `+${Math.round(q.growth_percent)}%` : "";

export const fraseDaSubida = subida;

/** "também pesquisada como: "diferença entre psicólogo e psiquiatra" (+90%)" — ou null. */
export function fraseDasVariantes(variantes: Variante[] | undefined): string | null {
  if (!variantes?.length) return null;
  return `também pesquisada como: ${variantes.map((v) => `"${v.question}" (${subida(v)})`).join("; ")}`;
}

const agrupar = (itens: PerguntaArquivada[]): GrupoPerguntas[] =>
  EIXOS.map((axis) => ({ axis, itens: itens.filter((q) => q.axis === axis) }));

/** Um briefing arquivado desde 2/11/2026 (itens com `lugar`), por eixo; null para os anteriores. */
export function gruposDoArquivo(top: any[] | null | undefined): GrupoPerguntas[] | null {
  const itens = top || [];
  if (!itens.some((q) => q?.lugar != null)) return null;
  return agrupar(itens as PerguntaArquivada[]);
}

/**
 * A semana corrente: a recolha mais recente — as perguntas escritas no dia da última
 * (`updated_at`), que é o dia em que o script 6 correu —, pela regra do arquivo.
 */
export function gruposDaRecolha(linhas: LinhaPergunta[]): GrupoPerguntas[] {
  const dia = linhas.reduce((m, q) => ((q.updated_at ?? "") > m ? q.updated_at ?? "" : m), "").slice(0, 10);
  const daRecolha = dia ? linhas.filter((q) => (q.updated_at ?? "").slice(0, 10) === dia) : [];
  return agrupar(perguntasPorEixo(daRecolha).map((q) => ({
    term: q.question, axis: q.axis, lugar: q.lugar,
    growth_percent: q.growth_percent, fora_de_escala: q.fora_de_escala, variantes: q.variantes,
  })));
}
