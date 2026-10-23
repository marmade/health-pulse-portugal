/**
 * "Depressão" no sentido meteorológico. O termo `depressão sintomas` tem
 * "depressão" como sinónimo, e com a fronteira de palavra da fetch-rss-feeds
 * v2 continua a casar com a depressão do boletim do tempo — é homónimo, não
 * pedaço de palavra. Caso de 24/09/2026: "Chuva regressa domingo e pode ser
 * intensa terça e quarta" (Observador, categoria "Céu e Terra").
 *
 * Só se aplica às notícias que casaram por "depressão". O texto da descrição
 * não é guardado na base, logo decide-se pelo título e pelas categorias do
 * feed.
 *
 * A regra única (23/10/2026): até aqui estava escrita dentro do archive-weekly
 * (desde 28/09/2026, `100b1fb`). Passou para aqui, sem mudar uma letra, para o
 * arquivo semanal e o site lerem a mesma — a notícia fica na base e sai do que
 * se mostra (decisão da Marta, 23/10). Sem imports: corre no Deno e no vitest
 * (src/test/meteo.test.ts). Chamada por archive-weekly/index.ts e por
 * src/lib/noticias.ts. Ver docs/sessoes/2026-10-23.md.
 */
export const CATEGORIA_METEO = /c[ée]u e terra|meteorolog|\btempo\b/i;
export const TITULO_METEO =
  /\b(chuvas?|trovoadas?|ipma|tempestades?|precipitação|ventos?|agitação marítima)\b|aviso (amarelo|laranja|vermelho)|meteorol/i;

export function eDepressaoMeteorologica(n: any) {
  const casou = String(n.casou_por ?? n.related_term ?? "").toLowerCase();
  if (!casou.includes("depress")) return false;
  const cats = (n.categorias || []).join(" · ");
  return CATEGORIA_METEO.test(cats) || TITULO_METEO.test(n.title || "");
}
