/**
 * Os fact-checks do briefing e do arquivo dos eixos, lidos da tabela `debunking`
 * (decisão da Marta, 29/10/2026 — docs/sessoes/2026-10-29.md). Até aqui vinham das
 * notícias de fact-check (`eFactCheck`), e desde Agosto só tinha entrado uma.
 *
 * A tabela é escrita pelo scripts/11_fetch_fact_checks.py (Observador, Google Fact Check
 * Tools API) e, quando entrar, pelo scripts/12_fetch_poligrafo.py (Polígrafo). Só contam as
 * linhas com url e com um veredicto que o seu jornal mostra (seMostra, abaixo): as semeadas a
 * 25/03/2026 ficam "a verificar" e ficam de fora.
 *
 * Usado pelo archive-weekly e pelo site (/briefing, PDF e painel de fact-check), para que
 * o arquivo e o ecrã não divirjam.
 */

/** Uma linha da `debunking` (os campos que se usam). */
export type LinhaDebunking = {
  term: string;
  title: string;
  explicacao?: string | null;
  classification: string;
  source: string;
  url: string;
  data_publicacao?: string | null;
  eixo?: string | null;
  covid?: boolean | null;
  /** Lateral à saúde, guardada como indício (2/11/2026): fica fora de tudo o que se mostra. */
  contexto?: boolean | null;
};

/** Um fact-check como fica gravado em `briefings_archive.top_debunking` e `eixos_archive`. */
export type FactCheckArquivado = {
  parte?: "semana" | "anterior";
  term: string;
  title: string;
  explicacao: string | null;
  classification: string;
  source: string;
  url: string;
  date: string;
  eixo: string | null;
  covid: boolean;
};

/** Quantas verificações "Anteriores" entram no briefing (decisão de 29/10/2026). */
export const N_ANTERIORES = 5;
/** Quantas por eixo no `eixos_archive` — as mesmas três de antes. */
export const N_EIXO = 3;

/**
 * Os veredictos que se mostram, POR JORNAL (decisão da Marta, 10/11/2026 —
 * docs/sessoes/2026-11-10.md §8.8): cada verificação aparece com o veredicto do próprio jornal,
 * sem traduzir nem juntar escalas, e com o nome do jornal ao lado. Mostram-se só os que dizem
 * que a informação é falsa ou distorcida:
 *   Observador — Errado, Enganador (como desde 29/10/2026, 2026-10-29-cowork.md §14);
 *   Polígrafo  — Falso, Pimenta na Língua, Manipulado, Descontextualizado.
 * Os outros (Esticado, Certo, Praticamente Certo, Inconclusivo; Verdadeiro, Verdadeiro mas...,
 * Impreciso) ficam na base e saem do que se mostra: no site, no briefing, no arquivo dos eixos e
 * nas exportações. Os veredictos NÃO se renomeiam. Um jornal que não esteja aqui não se mostra.
 * O jornal é a coluna `source`, comparada sem acentos nem maiúsculas.
 * Ficam também de fora as semeadas a 25/03 ("a verificar") e o "sem veredicto" dos scripts.
 *
 * E as marcadas `contexto` (decisão da Marta, 2/11/2026 — docs/sessoes/2026-11-02.md): as
 * verificações laterais à saúde ficam na base como indícios, fora do ecrã e do briefing. Vale
 * para os dois jornais.
 */
export const VEREDICTOS_MOSTRADOS: Record<string, string[]> = {
  observador: ["errado", "enganador"],
  poligrafo: ["falso", "pimenta na lingua", "manipulado", "descontextualizado"],
};

// O intervalo U+0300–U+036F (acentos combinantes) está escrito com os caracteres literais, como em
// _shared/perguntas.ts: a publicação pela MCP converte a forma escrita com barra e "u" nos
// próprios caracteres, e o ficheiro publicado deixava de ser igual ao do repositório (10/11/2026).
const semAcentos = (s: string | null | undefined) =>
  (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

export function seMostra(l: Pick<LinhaDebunking, "url" | "classification" | "contexto" | "source">): boolean {
  const mostrados = VEREDICTOS_MOSTRADOS[semAcentos(l.source)] ?? [];
  return !!(l.url ?? "").trim() && mostrados.includes(semAcentos(l.classification)) && !l.contexto;
}

/** A data da verificação (YYYY-MM-DD), ou null. */
const dataDe = (l: LinhaDebunking) => (l.data_publicacao ? l.data_publicacao.slice(0, 10) : null);

/**
 * Com veredicto e data, da mais recente para a mais antiga, e cada verificação uma só vez:
 * a mesma verificação pode ter casado com duas keywords (duas linhas, o mesmo url).
 * Fica a primeira pela ordem (data, depois url e termo), para o resultado não depender da
 * ordem em que a base devolve as linhas.
 */
export function verificacoesDatadas(linhas: LinhaDebunking[]): LinhaDebunking[] {
  const ordenadas = linhas
    .filter((l) => seMostra(l) && dataDe(l))
    .sort((a, b) =>
      dataDe(b)!.localeCompare(dataDe(a)!) ||
      a.url.localeCompare(b.url) ||
      a.term.localeCompare(b.term)
    );
  const vistos = new Set<string>();
  return ordenadas.filter((l) => !vistos.has(l.url) && vistos.add(l.url));
}

export function arquivado(l: LinhaDebunking, parte?: FactCheckArquivado["parte"]): FactCheckArquivado {
  return {
    ...(parte ? { parte } : {}),
    term: l.term,
    title: l.title,
    explicacao: l.explicacao ?? null,
    classification: l.classification,
    source: l.source,
    url: l.url,
    date: dataDe(l)!,
    eixo: l.eixo ?? null,
    covid: !!l.covid,
  };
}

/**
 * As duas partes do briefing: "Desta semana" (data da verificação entre início e fim da
 * semana, inclusive) e "Anteriores" (as N_ANTERIORES mais recentes antes do início). O tema
 * não conta: a covid-19 entra como as outras.
 */
export function partesDoBriefing(linhas: LinhaDebunking[], isoInicio: string, isoFim: string) {
  const datadas = verificacoesDatadas(linhas);
  return {
    destaSemana: datadas.filter((l) => dataDe(l)! >= isoInicio && dataDe(l)! <= isoFim),
    anteriores: datadas.filter((l) => dataDe(l)! < isoInicio).slice(0, N_ANTERIORES),
  };
}

/** O que o archive-weekly grava em `briefings_archive.top_debunking`: as duas partes, marcadas. */
export function topDebunkingDoBriefing(linhas: LinhaDebunking[], isoInicio: string, isoFim: string) {
  const { destaSemana, anteriores } = partesDoBriefing(linhas, isoInicio, isoFim);
  return [
    ...destaSemana.map((l) => arquivado(l, "semana")),
    ...anteriores.map((l) => arquivado(l, "anterior")),
  ];
}

/** A frase de "Desta semana" vazia. */
export function notaSemVerificacoes(isoInicio: string, isoFim: string) {
  return `nenhuma verificação do Observador publicada entre ${isoInicio} e ${isoFim}`;
}

/**
 * As verificações da semana de um eixo, para `eixos_archive.top_debunking`. As da covid-19
 * não entram em eixo nenhum: no site estão fora dos quatro eixos.
 */
export function topDebunkingDoEixo(linhas: LinhaDebunking[], eixo: string, isoInicio: string, isoFim: string) {
  return partesDoBriefing(linhas.filter((l) => l.eixo === eixo && !l.covid), isoInicio, isoFim)
    .destaSemana.slice(0, N_EIXO)
    .map((l) => arquivado(l));
}
