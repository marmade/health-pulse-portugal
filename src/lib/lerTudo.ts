/**
 * Lê todas as linhas de um pedido à base, por páginas.
 *
 * A API devolve no máximo 1000 linhas por pedido e corta sem erro (HTTP 206; o supabase-js
 * devolve as 1000 e segue). A 21/10/2026 o gráfico da página inicial pedia 1220 linhas de
 * trends_termo_mensal num pedido só e perdia 220, sem se saber quais
 * (docs/sessoes/2026-10-06.md §3, 2026-10-21.md).
 *
 * `pedir(de, ate)` constrói o pedido de uma página com `.range(de, ate)`, com
 * `{ count: "exact" }` e com uma ordem ÚNICA — sem ela, as páginas podem repetir ou saltar
 * linhas. Cada página começa onde a anterior acabou, por isso serve também se o servidor
 * cortar abaixo de `pagina`.
 *
 * Devolve as linhas e a contagem da base. `completa` é false se não baterem: quem chama
 * decide o que o ecrã diz, mas não segue como se tivesse tudo.
 */
export type Pagina<T> = { data: T[] | null; error: unknown; count: number | null };
export type Leitura<T> = { linhas: T[]; contadas: number; completa: boolean };

export const PAGINA = 1000;

export async function lerTudo<T>(
  pedir: (de: number, ate: number) => PromiseLike<Pagina<T>>,
  pagina = PAGINA,
): Promise<Leitura<T>> {
  const linhas: T[] = [];
  let contadas: number | null = null;
  for (;;) {
    const { data, error, count } = await pedir(linhas.length, linhas.length + pagina - 1);
    if (error) throw error;
    if (count == null) throw new Error("lerTudo: o pedido não trouxe count exacto");
    contadas = count;
    const recebidas = data ?? [];
    linhas.push(...recebidas);
    if (recebidas.length === 0 || linhas.length >= contadas) break;
  }
  return { linhas, contadas, completa: linhas.length === contadas };
}
