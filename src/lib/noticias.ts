import { eDepressaoMeteorologica } from "../../supabase/functions/_shared/meteo";

/**
 * As notícias que o site mostra, sem a "depressão" meteorológica (decisão da Marta, 23/10/2026:
 * saem do site como saem do arquivo semanal, e não se mostram assinaladas). A notícia fica na
 * base; sai do que se mostra.
 *
 * A regra é a do archive-weekly, importada do mesmo ficheiro (_shared/meteo.ts) — não é uma
 * cópia. Recebe as linhas de `news_items` como a base as devolve, antes de qualquer mapeamento:
 * a regra precisa de `casou_por`, `related_term`, `categorias` e `title`.
 * Ver docs/sessoes/2026-10-23.md.
 */
export function semMeteorologicas<T>(linhas: T[]): T[] {
  return linhas.filter((n) => !eDepressaoMeteorologica(n));
}
