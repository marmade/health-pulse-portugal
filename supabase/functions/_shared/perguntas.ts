/**
 * As perguntas do briefing e do arquivo dos eixos (decisões da Marta, 29/10/2026 —
 * docs/sessoes/2026-10-29-cowork.md §12 e §12a; simulações em
 * docs/evidencia/2026-10-29-perguntas/).
 *
 *   · 5 por eixo, em vez do top 5 geral;
 *   · ordem de 28/09: fora de escala primeiro, depois a subida, depois a posição no Google;
 *   · empate no corte: as empatadas partilham o lugar e entram todas (como o top dos termos);
 *   · fora do que se mostra: as perguntas pela palavra — escrita e tradução. Ficam na base;
 *   · as quase iguais juntam-se num só lugar: à frente a de maior subida, as outras por baixo.
 *
 * Usado pelo archive-weekly e pelo site (/briefing, PDF e painel de perguntas), para que o
 * arquivo e o ecrã não divirjam.
 */

/**
 * O tecto do script 6 (`min(growth, 9999)`) e o `breakout` do Google, que o script 6 converte em
 * 5000. Nenhum dos dois é medida: o primeiro lê-se "pelo menos isto", o segundo não tem limiar
 * publicado. Vão para o arquivo como "fora de escala", sem número. (Vinha do archive-weekly.)
 *
 * Limitação: um crescimento medido de exactamente 5000% seria lido como breakout. Nas recolhas
 * de 14/09 a 28/09 não há nenhum 5000.
 */
export const TECTO = 9999;
export const BREAKOUT = 5000;
/** Quantos lugares por eixo. */
export const POR_EIXO = 5;
export const EIXOS = ["saude-mental", "alimentacao", "menopausa", "emergentes"];

export type LinhaPergunta = {
  question: string;
  axis: string;
  growth_percent: number | null;
  posicao?: number | null;
  updated_at?: string | null;
};

export function foraDeEscala(q: Pick<LinhaPergunta, "growth_percent">) {
  return q.growth_percent === TECTO || q.growth_percent === BREAKOUT;
}

/** O que se grava da medida: o número só quando é medida. */
export function medidaDaPergunta(q: LinhaPergunta) {
  const fora = foraDeEscala(q);
  return {
    growth_percent: fora ? null : q.growth_percent,
    fora_de_escala: fora,
    posicao: q.posicao ?? null,
  };
}

/**
 * Perguntas pela palavra e não pela saúde (decisão da Marta, 29/10/2026): como se escreve, e a
 * tradução ("X em inglês", "X tradução"). As de significado ("o que significa…") ficam: são
 * dúvida de saúde, como "o que é…".
 */
const SOBRE_A_PALAVRA = [
  /^\s*como se escreve\b/i,
  /\bem ingl[eê]s\b/i,
  /\btradu[çc][ãa]o\b/i,
];

export const ePerguntaSobreAPalavra = (pergunta: string) =>
  SOBRE_A_PALAVRA.some((rx) => rx.test(pergunta));

/** Palavras de ligação que não contam para dizer se duas perguntas são a mesma dúvida. */
const LIGACAO = new Set([
  "qual", "quais", "o", "a", "os", "as", "um", "uma", "uns", "umas", "que",
  "de", "do", "da", "dos", "das",
]);

/**
 * A forma de comparar: minúsculas, sem acentos, sem pontuação e sem palavras de ligação.
 * "qual a diferença entre psicólogo e psiquiatra" e "diferença entre psicólogo e psiquiatra"
 * dão o mesmo; "sintomas da candidíase" e "sintomas de candidíase vaginal" não.
 */
export function formaDeComparar(pergunta: string): string {
  return pergunta
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w && !LIGACAO.has(w))
    .join(" ");
}

/**
 * Ordem de 28/09/2026: fora de escala primeiro, sem as ordenar pelo número, que não é medida;
 * depois a subida; depois a posição em que o Google as devolveu. A `posicao` é a ordem DENTRO
 * da lista de cada termo: duas perguntas de termos diferentes podem estar ambas na posição 1, e
 * aí o Google não dá ordem nenhuma entre elas. O último desempate é a ordem
 * da recolha (`updated_at`): não é critério, serve só para mostrar as empatadas sempre na mesma
 * ordem — e não desfaz o empate (ver mesmoLugar).
 */
const pos = (q: LinhaPergunta) => q.posicao ?? Number.MAX_SAFE_INTEGER;

export function compararPerguntas(a: LinhaPergunta, b: LinhaPergunta): number {
  const fa = foraDeEscala(a), fb = foraDeEscala(b);
  if (fa !== fb) return fa ? -1 : 1;
  if (!fa && a.growth_percent !== b.growth_percent) return (b.growth_percent ?? 0) - (a.growth_percent ?? 0);
  if (pos(a) !== pos(b)) return pos(a) - pos(b);
  return String(a.updated_at ?? "").localeCompare(String(b.updated_at ?? ""));
}

export const ordenarPerguntas = <T extends LinhaPergunta>(qs: T[]) => [...qs].sort(compararPerguntas);

/** Empate: a mesma subida (ou ambas fora de escala) e a mesma posição no Google. */
const mesmoLugar = (a: LinhaPergunta, b: LinhaPergunta) =>
  foraDeEscala(a) === foraDeEscala(b) &&
  (foraDeEscala(a) || a.growth_percent === b.growth_percent) &&
  pos(a) === pos(b);

export type Variante = { question: string; growth_percent: number | null; fora_de_escala: boolean };

export type PerguntaDoEixo = ReturnType<typeof medidaDaPergunta> & {
  question: string;
  axis: string;
  lugar: number;
  variantes: Variante[];
};

/**
 * As perguntas de um eixo: sem as perguntas pela palavra, as quase iguais juntas, e o corte no
 * lugar `corte` com todas as empatadas nesse lugar. À frente de cada grupo fica a primeira pela
 * ordem (a de maior subida), tal como o Google a devolveu; o grupo ocupa o lugar dela.
 */
export function perguntasDoEixo(qs: LinhaPergunta[], eixo: string, corte = POR_EIXO): PerguntaDoEixo[] {
  const grupos = new Map<string, LinhaPergunta[]>();
  for (const q of ordenarPerguntas(qs.filter((q) => q.axis === eixo && !ePerguntaSobreAPalavra(q.question)))) {
    const k = formaDeComparar(q.question);
    grupos.set(k, [...(grupos.get(k) ?? []), q]);
  }
  const lista = [...grupos.values()];
  const out: PerguntaDoEixo[] = [];
  for (let i = 0; i < lista.length; i++) {
    const [frente, ...resto] = lista[i];
    // lugar = o da anterior se empatam; senão, 1 + quantos grupos vêm antes
    const lugar = i > 0 && mesmoLugar(frente, lista[i - 1][0]) ? out[i - 1].lugar : i + 1;
    if (lugar > corte) break;
    out.push({
      question: frente.question,
      axis: eixo,
      ...medidaDaPergunta(frente),
      lugar,
      variantes: resto.map((v) => ({
        question: v.question,
        growth_percent: foraDeEscala(v) ? null : v.growth_percent,
        fora_de_escala: foraDeEscala(v),
      })),
    });
  }
  return out;
}

/** Os quatro eixos, pela ordem fixa, cada um com as suas perguntas. */
export const perguntasPorEixo = (qs: LinhaPergunta[], corte = POR_EIXO) =>
  EIXOS.flatMap((e) => perguntasDoEixo(qs, e, corte));
