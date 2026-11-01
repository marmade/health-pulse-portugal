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

/**
 * Porque entram poucas notícias desde 24/09/2026, dia em que a fetch-rss-feeds passou a filtrar os
 * feeds generalistas pela categoria (docs/sessoes/2026-09-24.md §9). Textos da Marta, 01/11/2026
 * (docs/sessoes/2026-11-01-para-rever.md R10); os números vêm de docs/sessoes/2026-10-16.md §3.
 */
export const NOTA_POUCAS_NOTICIAS =
  "Desde 24/09/2026 entram poucas notícias. Dos jornais generalistas só entram as que eles próprios marcam como saúde; a recolha é semanal, e o Público, o CM, o Observador e a RTP guardavam no feed só as últimas horas (medido a 16/10/2026). A 12/10/2026, a recolha não encontrou um feed válido em 19 dos 41 feeds (ver Limitações, no /sobre).";

export const SEM_NOTICIAS_NA_SEMANA =
  "Nenhuma notícia com data nesta semana. Dos jornais generalistas só entram as que eles próprios marcam como saúde; a recolha é semanal, e o Público, o CM, o Observador e a RTP guardavam no feed só as últimas horas (medido a 16/10/2026; ver Limitações, no /sobre).";
