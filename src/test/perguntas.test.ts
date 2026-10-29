import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  ePerguntaSobreAPalavra, formaDeComparar, perguntasDoEixo, perguntasPorEixo, type LinhaPergunta,
} from "../../supabase/functions/_shared/perguntas";
import { gruposDoArquivo, gruposDaRecolha, fraseDasVariantes } from "@/lib/perguntasBriefing";

// 29/10/2026 (docs/sessoes/2026-10-29.md; simulações em docs/evidencia/2026-10-29-perguntas/):
// 5 perguntas por eixo, sem as perguntas pela palavra, com as quase iguais juntas.

describe("perguntas pela palavra", () => {
  it("escrita e tradução saem", () => {
    for (const p of ["como se escreve alzheimer", "enxaqueca em ingles", "sarampo em inglês", "o que é ptsd em ingles", "burnout tradução"]) {
      expect(ePerguntaSobreAPalavra(p)).toBe(true);
    }
  });
  it("as de significado e as outras ficam", () => {
    for (const p of ["o que significa tdah", "significado de burnout", "o que é endometriose", "como saber se sou bipolar"]) {
      expect(ePerguntaSobreAPalavra(p)).toBe(false);
    }
  });
});

describe("formaDeComparar", () => {
  it("junta as que só diferem nas palavras de ligação", () => {
    expect(formaDeComparar("qual a diferença entre psicólogo e psiquiatra")).toBe(formaDeComparar("diferença entre psicólogo e psiquiatra"));
    expect(formaDeComparar("sintomas do dengue")).toBe(formaDeComparar("sintomas da dengue"));
    expect(formaDeComparar("quais os sintomas dos piolhos")).toBe(formaDeComparar("sintomas piolhos"));
  });
  it("junta com e sem acento (decisão de 29/10)", () => {
    expect(formaDeComparar("o que e dengue")).toBe(formaDeComparar("o que é dengue"));
  });
  it("não junta quando muda uma palavra com conteúdo", () => {
    expect(formaDeComparar("sintomas da candidíase")).not.toBe(formaDeComparar("sintomas de candidíase vaginal"));
    expect(formaDeComparar("causas do autismo")).not.toBe(formaDeComparar("sintomas autismo"));
  });
});

const q = (question: string, growth_percent: number | null, posicao: number, o: Partial<LinhaPergunta> = {}): LinhaPergunta =>
  ({ question, axis: "menopausa", growth_percent, posicao, updated_at: "2026-10-26T12:00:00Z", ...o });

describe("perguntasDoEixo", () => {
  it("empate no 5.º lugar: as empatadas partilham o lugar e entram todas", () => {
    const qs = [q("a1", 900, 1), q("a2", 800, 1), q("a3", 700, 1), q("a4", 600, 1), q("a5", 500, 2), q("a6", 500, 2), q("a7", 400, 1)];
    const r = perguntasDoEixo(qs, "menopausa");
    expect(r.map((x) => [x.question, x.lugar])).toEqual([["a1", 1], ["a2", 2], ["a3", 3], ["a4", 4], ["a5", 5], ["a6", 5]]);
  });
  it("a mesma subida com posição diferente não é empate", () => {
    const r = perguntasDoEixo([q("x", 500, 1), q("y", 500, 2)], "menopausa");
    expect(r.map((x) => x.lugar)).toEqual([1, 2]);
  });
  it("fora de escala vem primeiro, sem número, e o tecto empata com o breakout na mesma posição", () => {
    const r = perguntasDoEixo([q("medida", 8000, 1), q("tecto", 9999, 1), q("breakout", 5000, 1)], "menopausa");
    expect(r.map((x) => [x.question, x.lugar, x.growth_percent, x.fora_de_escala])).toEqual([
      ["tecto", 1, null, true], ["breakout", 1, null, true], ["medida", 3, 8000, false],
    ]);
  });
  it("as quase iguais ocupam um lugar: à frente a de maior subida, tal como o Google a devolveu", () => {
    const r = perguntasDoEixo([q("diferença entre X e Y", 90, 4), q("qual a diferença entre X e Y", 2300, 3), q("outra", 50, 1)], "menopausa");
    expect(r.map((x) => x.question)).toEqual(["qual a diferença entre X e Y", "outra"]);
    expect(r[0].variantes).toEqual([{ question: "diferença entre X e Y", growth_percent: 90, fora_de_escala: false }]);
    expect(fraseDasVariantes(r[0].variantes)).toBe('também pesquisada como: "diferença entre X e Y" (+90%)');
  });
});

describe("a recolha de 26/10 (simulação v2)", () => {
  const recolha = JSON.parse(readFileSync("docs/evidencia/2026-10-29-perguntas/recolha-26-10.json", "utf8")) as LinhaPergunta[];
  const r = perguntasPorEixo(recolha);
  const doEixo = (e: string) => r.filter((x) => x.axis === e);

  it("são 41, e a exclusão tira só 'como se escreve alzheimer'", () => {
    expect(recolha).toHaveLength(41);
    expect(recolha.filter((x) => ePerguntaSobreAPalavra(x.question)).map((x) => x.question)).toEqual(["como se escreve alzheimer"]);
  });
  it("saúde mental: bipolar, psicólogo/psiquiatra com a variante, autismo, pânico, alzheimer", () => {
    expect(doEixo("saude-mental").map((x) => [x.lugar, x.question])).toEqual([
      [1, "como saber se sou bipolar"],
      [2, "qual a diferença entre psicólogo e psiquiatra"],
      [3, "causas do autismo"],
      [4, "sintomas de ataque de pânico"],
      [5, "sintomas de alzheimer"],
    ]);
    expect(doEixo("saude-mental")[1].variantes.map((v) => v.question)).toEqual(["diferença entre psicólogo e psiquiatra"]);
  });
  it("alimentação: anemia, ferro, passos, celíaca (empatadas em 1.º) e refluxo", () => {
    expect(doEixo("alimentacao").map((x) => [x.lugar, x.question])).toEqual([
      [1, "como tratar anemia"], [1, "quais os alimentos ricos em ferro"],
      [1, "quantos passos por dia para emagrecer"], [1, "o que é a doença celíaca"],
      [5, "como tratar o refluxo"],
    ]);
  });
  it("menopausa e emergentes como na simulação; nenhum empate no corte", () => {
    expect(doEixo("menopausa").map((x) => x.lugar)).toEqual([1, 1, 3, 4, 5]);
    expect(doEixo("emergentes").map((x) => x.question)).toEqual([
      "o que são doenças cardiovasculares", "sintomas lúpus fase terminal", "o que causa avc",
      "sintomas dengue adulto", "sintomas de dengue e zika",
    ]);
    expect(r).toHaveLength(20);
  });
});

describe("a página e o PDF", () => {
  it("briefings arquivados antes de 2/11 (sem lugar) ficam como estavam", () => {
    expect(gruposDoArquivo([{ term: "x", growth_percent: 100, fora_de_escala: false }])).toBeNull();
    expect(gruposDoArquivo([])).toBeNull();
  });
  it("um arquivo novo agrupa pelos quatro eixos, pela ordem fixa", () => {
    const g = gruposDoArquivo([{ term: "x", axis: "menopausa", lugar: 1, growth_percent: null, fora_de_escala: true }])!;
    expect(g.map((x) => [x.axis, x.itens.length])).toEqual([["saude-mental", 0], ["alimentacao", 0], ["menopausa", 1], ["emergentes", 0]]);
  });
  it("a semana corrente lê só a recolha mais recente", () => {
    const g = gruposDaRecolha([
      q("nova", 100, 1, { updated_at: "2026-11-02T12:50:00Z" }),
      q("velha", 9000, 1, { updated_at: "2026-10-26T12:50:00Z" }),
    ]);
    expect(g.find((x) => x.axis === "menopausa")!.itens.map((x) => x.term)).toEqual(["nova"]);
  });
  it("o archive-weekly importa a regra de _shared/perguntas.ts e não a define", () => {
    const fonte = readFileSync("supabase/functions/archive-weekly/index.ts", "utf8");
    expect(fonte).toMatch(/from "\.\.\/_shared\/perguntas\.ts";/);
    expect(fonte).not.toMatch(/function (foraDeEscala|medidaDaPergunta|ordenarPerguntas)/);
  });
});

describe("o painel de perguntas do site (29/10/2026)", async () => {
  const { juntarQuaseIguais, fraseDasVariantesDoPainel } = await import("@/lib/juntarPerguntas");

  it("as quase iguais juntam-se num só lugar, à frente a de maior subida, no lugar da primeira da lista", () => {
    const r = juntarQuaseIguais([
      { question: "outra", growth_percent: 3000, posicao: 1 },
      { question: "diferença entre psicólogo e psiquiatra", growth_percent: 90, posicao: 4 },
      { question: "qual a diferença entre psicólogo e psiquiatra", growth_percent: 2300, posicao: 3 },
    ]);
    expect(r.map((x) => x.question)).toEqual(["outra", "qual a diferença entre psicólogo e psiquiatra"]);
    expect(r[1].variantes.map((v) => v.question)).toEqual(["diferença entre psicólogo e psiquiatra"]);
  });

  it("no Trends a variante leva a subida; no Autocomplete e nas relacionadas, só a forma", () => {
    const v = [{ question: "diferença entre psicólogo e psiquiatra", growthPercent: 90 }];
    expect(fraseDasVariantesDoPainel(v, true)).toBe('também pesquisada como: "diferença entre psicólogo e psiquiatra" (+90%)');
    expect(fraseDasVariantesDoPainel(v, false)).toBe('também pesquisada como: "diferença entre psicólogo e psiquiatra"');
    expect(fraseDasVariantesDoPainel([{ question: "x", growthPercent: 9999 }], true)).toBe('também pesquisada como: "x" (fora de escala)');
    expect(fraseDasVariantesDoPainel([], true)).toBeNull();
  });

  it("o painel aplica a junção e a exclusão nas colunas e nas relacionadas", () => {
    const hook = readFileSync("src/hooks/useHealthQuestions.ts", "utf8");
    expect(hook.match(/juntarQuaseIguais\(/g)).toHaveLength(3);
    expect(hook).toMatch(/ePerguntaSobreAPalavra\(pergunta\)/);
    const painel = readFileSync("src/components/HealthQuestionsPanel.tsx", "utf8");
    expect(painel).toMatch(/juntarQuaseIguais\(\s*\(data \|\| \[\]\)\.filter\(row => !ePerguntaSobreAPalavra/);
  });
});
