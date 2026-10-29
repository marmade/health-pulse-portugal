/**
 * As perguntas quase iguais juntas no painel de perguntas do site (decisão da Marta, 29/10/2026 —
 * docs/sessoes/2026-10-29.md §10). O painel tem limites (30 na vista geral, 15 por eixo, 5
 * relacionadas), e duas formas da mesma dúvida gastavam dois lugares.
 *
 * A regra de comparar e a ordem são as do briefing (supabase/functions/_shared/perguntas.ts): à
 * frente a forma com maior subida, tal como o Google a devolveu; as outras por baixo. O grupo
 * fica no lugar onde a lista mostrava a primeira das suas formas.
 */
import { compararPerguntas, foraDeEscala, formaDeComparar } from "../../supabase/functions/_shared/perguntas";

type Linha = { question: string; growth_percent: number | null; posicao?: number | null; updated_at?: string | null; axis?: string };

export function juntarQuaseIguais<T extends Linha>(linhas: T[]): (T & { variantes: T[] })[] {
  const grupos = new Map<string, T[]>();
  for (const l of linhas) {
    const k = formaDeComparar(l.question);
    grupos.set(k, [...(grupos.get(k) ?? []), l]);
  }
  return [...grupos.values()].map((g) => {
    const [frente, ...resto] = [...g].sort((a, b) => compararPerguntas(a as any, b as any));
    return { ...frente, variantes: resto };
  });
}

export type VariantePainel = { question: string; growthPercent: number | null };

/**
 * "também pesquisada como: "…" (+90%)". O número só onde há medida (o Trends); o Autocomplete
 * não tem subida e as relacionadas não mostram números — aí vai só a forma.
 */
export function fraseDasVariantesDoPainel(variantes: VariantePainel[] | undefined, comSubida: boolean): string | null {
  if (!variantes?.length) return null;
  const subida = (v: VariantePainel) => {
    if (!comSubida || v.growthPercent == null) return "";
    return foraDeEscala({ growth_percent: v.growthPercent }) ? " (fora de escala)" : ` (+${v.growthPercent}%)`;
  };
  return `também pesquisada como: ${variantes.map((v) => `"${v.question}"${subida(v)}`).join("; ")}`;
}
