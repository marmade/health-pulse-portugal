/**
 * O nome de uma semana do Google Trends no ecrã: de domingo a sábado (decisão da Marta,
 * 15/10/2026, docs/sessoes/2026-10-15-cowork.md §4.3). Antes dizia só o domingo
 * ("semana de 4 Out"), o que se lia como um dia.
 *
 *   semanaIntervalo("2026-10-04") → "4 a 10 Out"
 *   semanaIntervalo("2026-09-27") → "27 Set a 3 Out"   (atravessa o mês: os dois meses)
 *   semanaIntervalo("2026-12-27") → "27 Dez a 2 Jan"
 *
 * iso: o domingo em que a semana começa (AAAA-MM-DD), como vem de trends_alertas.semana e de
 * semana_trends. As contas fazem-se em UTC para o fuso do leitor não mudar o dia.
 */
const MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function semanaIntervalo(iso: string): string {
  const ini = new Date(iso.slice(0, 10) + "T00:00:00Z");
  const fim = new Date(ini.getTime() + 6 * 86400000);
  const d1 = ini.getUTCDate(), m1 = ini.getUTCMonth(), d2 = fim.getUTCDate(), m2 = fim.getUTCMonth();
  return m1 === m2 ? `${d1} a ${d2} ${MES[m2]}` : `${d1} ${MES[m1]} a ${d2} ${MES[m2]}`;
}
