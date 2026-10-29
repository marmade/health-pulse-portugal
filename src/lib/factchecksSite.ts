/**
 * Um artigo, uma linha (decisão da Marta, 29/10/2026 — 2026-10-29-cowork.md §14). A mesma
 * verificação pode ter casado com mais de uma keyword: na base são linhas diferentes com o mesmo
 * url (12 artigos a 29/10). No painel e nas exportações aparece uma vez, com todas as keywords no
 * rótulo, pela ordem em que vieram.
 *
 * Na vista "Todos" junta-se a lista toda; na vista de um eixo junta-se a lista desse eixo — por isso
 * o artigo aparece em cada eixo onde casou.
 */
export const SEPARADOR_KEYWORDS = " · ";

export function umaPorArtigo<T extends { url: string; term: string }>(itens: T[]): T[] {
  const porUrl = new Map<string, { item: T; termos: string[] }>();
  for (const i of itens) {
    const j = porUrl.get(i.url);
    if (!j) porUrl.set(i.url, { item: i, termos: [i.term] });
    else if (!j.termos.includes(i.term)) j.termos.push(i.term);
  }
  return [...porUrl.values()].map(({ item, termos }) => ({ ...item, term: termos.join(SEPARADOR_KEYWORDS) }));
}
