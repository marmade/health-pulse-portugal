/**
 * Limpar o texto que vem dos feeds RSS (fetch-rss-feeds): tira o CDATA, descodifica as entidades
 * HTML e tira as marcas. Até 29/10/2026 só descodificava seis entidades com nome (&amp; &quot;
 * &#39; &lt; &gt; &nbsp;), e passavam para os títulos as numéricas — &#038;, &#8211;, &#124; — e
 * as que vinham codificadas duas vezes (&amp;quot;, &amp;lt;em&amp;gt;). Eram 16 títulos na
 * news_items (contagem do Cowork, 2026-10-29-cowork.md §14).
 */

const COM_NOME: Record<string, string> = {
  amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ",
  ndash: "–", mdash: "—", hellip: "…", laquo: "«", raquo: "»",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", euro: "€", ordm: "º", ordf: "ª",
};

function descodificarUmaVez(texto: string): string {
  return texto.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (todo, e: string) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : todo;
    }
    return COM_NOME[e.toLowerCase()] ?? todo;
  });
}

/** As entidades, até três camadas (há feeds que codificam duas vezes). Uma entidade desconhecida fica como está. */
export function descodificarEntidades(texto: string): string {
  let t = texto;
  for (let i = 0; i < 3; i++) {
    const d = descodificarUmaVez(t);
    if (d === t) break;
    t = d;
  }
  return t;
}

export function limpar(texto: string): string {
  return descodificarEntidades(
    texto.replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, ""),
  )
    .replace(/<[^>]+>/g, "")
    .replace(/ /g, " ")
    .trim();
}
