/**
 * Os "Sinais emergentes" de um briefing arquivado, em quatro partes — o que a página /briefing e
 * o PDF mostram (decisão da Marta, 28/10/2026; docs/sessoes/2026-10-28.md §6, §12). Os itens
 * vêm do archive-weekly (supabase/functions/_shared/emergentes.ts), cada um com `parte`.
 *
 * Desde 29/10/2026 há também a linha da tendência (parte "tendencia"): um alerta em curso há mais de
 * 26 semanas, sem bandeira. Só aparece quando há alguma.
 *
 * Os briefings anteriores a 2/11/2026 não têm `notas.emergentes_mes`: para esses devolve null e
 * a página mostra-os como até aqui.
 */

import { fraseDaTendencia } from "../../supabase/functions/_shared/emergentes";

export type ParteSinais = {
  chave: "novo" | "em_curso" | "tendencia" | "a_observar" | "previsivel";
  titulo: string;
  ressalva: string | null;
  itens: { term: string; axis: string; tipo: string | null; frase: string }[];
  nota: string | null;
};

/** Um item de `briefings_archive.top_emerging` como o archive-weekly o grava desde 2/11/2026. */
export type SinalArquivado = {
  parte?: ParteSinais["chave"]; term: string; axis: string; tipo?: string;
  valor?: number; inicio?: string;
  razao?: number; referencia?: number; max_anterior?: number | null; semana_n?: number;
  anos?: number[]; anos_possiveis?: number;
};

const vezes = (r: number) => (r >= 10 ? r.toFixed(0) : r.toFixed(1).replace(".", ","));
const n0 = (x: number) => Math.round(x).toString();

/** A frase de cada item — a do ecrã (src/components/AlertasEixo.tsx) para os alertas. */
export function fraseDoSinal(s: SinalArquivado, mes: string): string {
  if (s.parte === "tendencia") {
    return fraseDaTendencia({ valor: Number(s.valor), referencia: Number(s.referencia), inicio: s.inicio ?? "" });
  }
  if (s.parte === "previsivel") {
    const anos = s.anos ?? [];
    return `subiu em ${mes} em ${anos.length} de ${s.anos_possiveis} anos (${anos.join(", ")})`;
  }
  let f = s.tipo === "aparecimento"
    ? `apareceu; normalmente sem procura (máx. anterior ${n0(s.max_anterior ?? 0)})`
    : `${vezes(Number(s.razao))} vezes acima do valor normal (${n0(Number(s.referencia))})`;
  if (s.parte === "em_curso") f += ` — em curso, ${s.semana_n}.ª semana`;
  return f;
}

export function partesDosSinais(
  topEmerging: SinalArquivado[] | null | undefined,
  notas: Record<string, string> | null | undefined,
): ParteSinais[] | null {
  const mes = notas?.emergentes_mes;
  if (!mes) return null;
  const itens = topEmerging || [];
  const parte = (
    chave: ParteSinais["chave"], titulo: string, ressalva: string | null, nota: string | undefined,
  ): ParteSinais => ({
    chave,
    titulo,
    ressalva,
    itens: itens.filter((s) => s.parte === chave).map((s) => ({
      term: s.term, axis: s.axis, tipo: s.tipo ?? null, frase: fraseDoSinal(s, mes),
    })),
    nota: nota ?? null,
  });
  const tendencia = parte("tendencia", "Tendências", null, undefined);
  return [
    parte("novo", "Novos", null, notas.emergentes_novos),
    parte("em_curso", "Em curso", null, notas.emergentes_em_curso),
    // a linha à parte da tendência só aparece quando há alguma (29/10/2026)
    ...(tendencia.itens.length ? [tendencia] : []),
    parte("a_observar", "A observar", "Subiram sem chegar ao limite de alerta.", notas.emergentes_a_observar),
    parte("previsivel", `Previsíveis para ${mes}`, null, notas.emergentes_previsiveis),
  ];
}
