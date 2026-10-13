/**
 * O top de um eixo numa semana — a única ordenação dos termos (13/10/2026).
 *
 * Chamada pelo archive-weekly, que grava o resultado em `eixos_archive.top_keywords`.
 * A página inicial não ordena: lê o arquivo e mostra os itens com `posicao <= 5`.
 * Sem imports, para correr igual no Deno (função) e no vitest (src/test/top_eixo.test.ts).
 *
 * Regra (top 5 de 24/09/2026, docs/metodo/2026-09-24-top5-do-arquivo-regra.md, alargado a
 * 10 a 13/10/2026 — docs/sessoes/2026-10-13.md):
 *   · só termos activos do eixo, com valor medido maior que zero;
 *   · ordem pelo valor da semana na régua do eixo (`trends_calibrados.valor_eixo`);
 *   · valores iguais PARTILHAM a posição (1, 1, 3…): são o mesmo interesse medido, e
 *     qualquer desempate inventaria uma diferença que a medição não tem;
 *   · dentro do empate, os termos escrevem-se por ordem alfabética portuguesa. É a ordem
 *     de escrita, para ser reproduzível — não é critério;
 *   · entram todos os de posição <= corte: com empate no corte, o top tem mais de 10.
 *
 * "Igual" é igual nas 3 casas com que o `valor_eixo` está gravado. Entre factores
 * diferentes não é prova de igualdade exacta (o `factor` está gravado a 6 casas); o caso
 * de 05/10/2026 (gripe A 6 × 34/3 = vacinas 32 × 17/8 = 68) é exacto.
 */

export type Medicao = { termo: string; valor: number | string | null };
export type ItemTop = { term: string; valor: number; valor_eixo: number; posicao: number };

const COLLATOR = new Intl.Collator("pt");

/** O valor em milésimas inteiras — compara-se assim, sem vírgula flutuante. */
const milesimas = (v: number | string) => Math.round(Number(v) * 1000);

export function topDoEixo(medicoes: Medicao[], termosActivos: string[], corte = 10): ItemTop[] {
  const activos = new Set(termosActivos.map((t) => t.toLowerCase()));
  const vistos = new Set<string>();
  const medidos: { termo: string; m: number }[] = [];
  for (const r of medicoes) {
    const chave = r.termo.toLowerCase();
    if (!activos.has(chave) || r.valor == null) continue;
    // Um termo, uma semana, um valor (chave primária de trends_calibrados). Se vier
    // repetido, pára em vez de escolher um.
    if (vistos.has(chave)) throw new Error(`topDoEixo: termo repetido na medição: ${r.termo}`);
    vistos.add(chave);
    const m = milesimas(r.valor);
    if (m > 0) medidos.push({ termo: r.termo, m });
  }
  medidos.sort((a, b) => b.m - a.m || COLLATOR.compare(a.termo, b.termo));

  const top: ItemTop[] = [];
  for (let i = 0; i < medidos.length; i++) {
    // posição = 1 + quantos têm valor maior; com a lista ordenada, é a do primeiro igual
    const posicao = i > 0 && medidos[i].m === medidos[i - 1].m ? top[i - 1].posicao : i + 1;
    if (posicao > corte) break;
    top.push({
      term: medidos[i].termo,
      valor: Math.round(medidos[i].m / 100) / 10,
      valor_eixo: medidos[i].m / 1000,
      posicao,
    });
  }
  return top;
}

/**
 * Os termos activos do eixo SEM medição na semana — o que o top não pode mostrar porque
 * não há número. A razão sai dos pedidos do lote que continham o termo:
 *   · algum veio `recolhido`  → "recolhido sem valor calibrado" (ex.: âncora a zero);
 *   · senão, algum `sem_dados` → o Google não devolveu dados;
 *   · senão, algum `falhou`    → o pedido falhou;
 *   · nenhum pedido o continha → não foi pedido neste lote.
 * Um termo medido a zero NÃO entra aqui: zero é medição.
 */
export type Pedido = { termos: string[]; collection_status: string };
export type SemMedicao = { term: string; razao: "recolhido sem valor calibrado" | "sem_dados" | "falhou" | "não pedido" };

export function semMedicao(medicoes: Medicao[], termosActivos: string[], pedidos: Pedido[]): SemMedicao[] {
  const comValor = new Set(medicoes.filter((r) => r.valor != null).map((r) => r.termo.toLowerCase()));
  const lista: SemMedicao[] = [];
  for (const termo of termosActivos) {
    const t = termo.toLowerCase();
    if (comValor.has(t)) continue;
    const estados = new Set(
      pedidos.filter((p) => p.termos.some((x) => x.toLowerCase() === t)).map((p) => p.collection_status),
    );
    const razao: SemMedicao["razao"] = estados.has("recolhido") ? "recolhido sem valor calibrado"
      : estados.has("sem_dados") ? "sem_dados"
      : estados.has("falhou") ? "falhou"
      : "não pedido";
    lista.push({ term: termo, razao });
  }
  return lista.sort((a, b) => COLLATOR.compare(a.term, b.term));
}

const RAZAO_POR_EXTENSO: Record<SemMedicao["razao"], string> = {
  "recolhido sem valor calibrado": "recolhido sem valor calibrado",
  sem_dados: "o Google não devolveu dados",
  falhou: "o pedido falhou",
  "não pedido": "não foi pedido neste lote",
};

/** A frase que vai para `eixos_archive.nota_medicao` quando há termos sem medição. */
export function notaSemMedicao(lista: SemMedicao[], semana: string): string | null {
  if (lista.length === 0) return null;
  const n = lista.length;
  return `sem medição na semana de ${semana} para ${n} ${n === 1 ? "termo activo, que fica" : "termos activos, que ficam"} ` +
    `fora do top: ${lista.map((s) => `${s.term} (${RAZAO_POR_EXTENSO[s.razao]})`).join(", ")}`;
}

/**
 * Os termos que a generate-guioes-weekly passa à IA (13/10/2026): os itens com
 * `posicao <= 5` do top gravado no arquivo — a mesma regra da página inicial, por isso
 * com empate no 5.º lugar vão 6 ou mais.
 *
 * Os arquivos até à semana de 14/09/2026 foram gravados sem `posicao` (formato
 * {term, change_percent, current_volume}), já pela ordem do top. Nesse caso vão os
 * primeiros `n`, com a posição pela ordem gravada. Um item sem `term` não vai.
 */
export type ItemArquivo = { term?: unknown; posicao?: unknown };

export function termosParaIA(itens: ItemArquivo[] | null | undefined, n = 5): { term: string; posicao: number }[] {
  const comTermo = (itens || []).filter((k) => typeof k?.term === "string" && k.term !== "");
  const temPosicao = comTermo.some((k) => typeof k.posicao === "number");
  if (!temPosicao) {
    return comTermo.slice(0, n).map((k, i) => ({ term: k.term as string, posicao: i + 1 }));
  }
  return comTermo
    .filter((k) => typeof k.posicao === "number" && (k.posicao as number) <= n)
    .map((k) => ({ term: k.term as string, posicao: k.posicao as number }));
}
