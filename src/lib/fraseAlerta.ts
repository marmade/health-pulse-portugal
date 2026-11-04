/**
 * A linha de um alerta, na formulação da Marta (decisão 5 de 18/09/2026, docs/metodo/2026-09-18-
 * alertas-regra.md §7): "N vezes o valor normal (ref)", nada de percentagens. Uma só função
 * para o ecrã (AlertasEixo), os "Sinais emergentes" do briefing (sinaisEmergentes.fraseDoSinal) e a
 * sugestão de conteúdo (decisão da Marta, 29/10/2026), para não haver duas versões.
 */
import { intervaloDaSemana } from "../../supabase/functions/_shared/emergentes";

export const vezes = (r: number) => (r >= 10 ? r.toFixed(0) : r.toFixed(1).replace(".", ","));
export const n0 = (x: number) => Math.round(x).toString();

/** "4,4 vezes o valor normal (46)", ou, no aparecimento, "apareceu; normalmente sem procura (máx. anterior 6)". */
export function fraseDoAlerta(a: { tipo?: string | null; razao: number; referencia: number; maxAnterior?: number | null }): string {
  if (a.tipo === "aparecimento") return `apareceu; normalmente sem procura (máx. anterior ${n0(a.maxAnterior ?? 0)})`;
  return `${vezes(a.razao)} vezes o valor normal (${n0(a.referencia)})`;
}

/**
 * A nota da linha de uma tendência que começa com a melhoria do Google de 01/01/2022 (decisão da
 * Marta, 01/11/2026; nota vista no gráfico do Google Trends nesse dia): hoje só a creatina. Fica no
 * site e não no _shared/emergentes.ts, que é da archive-weekly. Janela: a primeira semana do lote
 * que contém 01/01/2022 (26/12/2021) e a seguinte; parâmetro do Claude Code.
 */
export const NOTA_MELHORIA_GOOGLE =
  "A data coincide com uma melhoria que o Google aplicou à recolha dos dados a 1/1/2022 (ver Limitações, no /sobre).";
export function notaDaMelhoriaDoGoogle(inicio: string | null | undefined): string | null {
  const d = (inicio ?? "").slice(0, 10);
  return d >= "2021-12-26" && d <= "2022-01-08" ? NOTA_MELHORIA_GOOGLE : null;
}

/**
 * A sugestão de conteúdo quando a semana não tem alerta novo (decisão da Marta, 29/10/2026): a
 * secção diz-o, no formato das frases das partes vazias, em vez de ficar em branco.
 */
export const fraseSemAlertaNovo = (semana: string) => `Nenhum alerta novo na semana de ${intervaloDaSemana(semana)}.`;

/**
 * A sugestão de conteúdo (decisão da Marta, 29/10/2026): «obesidade — 206, 4,4 vezes o valor
 * normal (46), na semana de 18 a 24/10». A parte do meio é a linha do alerta no ecrã.
 */
export function fraseDaSugestao(
  s: { term: string; tipo?: string | null; valor: number; razao: number; referencia: number; max_anterior?: number | null },
  semana: string,
): string {
  const linha = fraseDoAlerta({ tipo: s.tipo, razao: Number(s.razao), referencia: Number(s.referencia), maxAnterior: s.max_anterior });
  return `${s.term} — ${n0(Number(s.valor))}, ${linha}, na semana de ${intervaloDaSemana(semana)}`;
}
