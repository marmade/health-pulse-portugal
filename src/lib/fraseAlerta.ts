/**
 * A linha de um alerta, na formulação da Marta (decisão 5 de 18/09/2026, docs/metodo/2026-09-18-
 * alertas-regra.md §7): "N vezes acima do valor normal (ref)", nada de percentagens. Uma só função
 * para o ecrã (AlertasEixo), os "Sinais emergentes" do briefing (sinaisEmergentes.fraseDoSinal) e a
 * sugestão de conteúdo (decisão da Marta, 29/10/2026), para não haver duas versões.
 */
import { intervaloDaSemana } from "../../supabase/functions/_shared/emergentes";

export const vezes = (r: number) => (r >= 10 ? r.toFixed(0) : r.toFixed(1).replace(".", ","));
export const n0 = (x: number) => Math.round(x).toString();

/** "4,4 vezes acima do valor normal (46)", ou, no aparecimento, "apareceu; normalmente sem procura (máx. anterior 6)". */
export function fraseDoAlerta(a: { tipo?: string | null; razao: number; referencia: number; maxAnterior?: number | null }): string {
  if (a.tipo === "aparecimento") return `apareceu; normalmente sem procura (máx. anterior ${n0(a.maxAnterior ?? 0)})`;
  return `${vezes(a.razao)} vezes acima do valor normal (${n0(a.referencia)})`;
}

/**
 * A sugestão de conteúdo quando a semana não tem alerta novo (decisão da Marta, 29/10/2026): a
 * secção diz-o, no formato das frases das partes vazias, em vez de ficar em branco.
 */
export const fraseSemAlertaNovo = (semana: string) => `Nenhum alerta novo na semana de ${intervaloDaSemana(semana)}.`;

/**
 * A sugestão de conteúdo (decisão da Marta, 29/10/2026): «obesidade — 206, 4,4 vezes acima do valor
 * normal (46), na semana de 18 a 24/10». A parte do meio é a linha do alerta no ecrã.
 */
export function fraseDaSugestao(
  s: { term: string; tipo?: string | null; valor: number; razao: number; referencia: number; max_anterior?: number | null },
  semana: string,
): string {
  const linha = fraseDoAlerta({ tipo: s.tipo, razao: Number(s.razao), referencia: Number(s.referencia), maxAnterior: s.max_anterior });
  return `${s.term} — ${n0(Number(s.valor))}, ${linha}, na semana de ${intervaloDaSemana(semana)}`;
}
