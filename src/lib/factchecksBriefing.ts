/**
 * Os fact-checks do briefing em duas partes, "Desta semana" e "Anteriores" — o que a página
 * /briefing e o PDF mostram (decisão da Marta, 29/10/2026; docs/sessoes/2026-10-29.md). A regra
 * está em supabase/functions/_shared/factchecks.ts, a mesma do archive-weekly.
 *
 * Os briefings arquivados antes de 2/11/2026 não têm `parte` nos itens: para esses
 * partesDosFactChecks devolve null e a página mostra-os como até aqui.
 */
import {
  arquivado, notaSemVerificacoes, partesDoBriefing,
  type FactCheckArquivado, type LinhaDebunking,
} from "../../supabase/functions/_shared/factchecks";

export type PartesFactChecks = {
  destaSemana: { itens: FactCheckArquivado[]; nota: string };
  anteriores: { itens: FactCheckArquivado[]; nota: string };
};

const NOTA_ANTERIORES = "Sem verificações anteriores a esta semana.";

/** "Desta semana" vazia, em frase: a nota do arquivo ("nenhuma verificação…") com maiúscula e ponto. */
const frase = (nota: string) => `${nota.charAt(0).toUpperCase()}${nota.slice(1)}.`;

/** Um briefing arquivado desde 2/11/2026 (itens com `parte`), ou null para os anteriores. */
export function partesDosFactChecks(
  top: FactCheckArquivado[] | null | undefined,
  notas: Record<string, string> | null | undefined,
): PartesFactChecks | null {
  const itens = top || [];
  const comParte = itens.some((d) => d.parte);
  // Um arquivo novo sem nenhuma verificação não tem itens com parte: reconhece-se pela nota.
  const notaNova = notas?.desmentidos?.startsWith("nenhuma verificação do Observador");
  if (!comParte && !notaNova) return null;
  return {
    destaSemana: {
      itens: itens.filter((d) => d.parte === "semana"),
      nota: frase(notas?.desmentidos || "sem verificações nesta semana"),
    },
    anteriores: { itens: itens.filter((d) => d.parte === "anterior"), nota: NOTA_ANTERIORES },
  };
}

/** A semana corrente, lida da tabela `debunking` pela mesma regra do arquivo. */
export function partesDaSemana(linhas: LinhaDebunking[], isoInicio: string, isoFim: string): PartesFactChecks {
  const { destaSemana, anteriores } = partesDoBriefing(linhas, isoInicio, isoFim);
  return {
    destaSemana: { itens: destaSemana.map((l) => arquivado(l, "semana")), nota: frase(notaSemVerificacoes(isoInicio, isoFim)) },
    anteriores: { itens: anteriores.map((l) => arquivado(l, "anterior")), nota: NOTA_ANTERIORES },
  };
}

/** A data de uma verificação, como no ecrã: "28 set. 2026". */
export const dataDaVerificacao = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("pt-PT", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  });
