import { describe, it, expect, vi, beforeEach } from "vitest";

// Ponto 6 da prova de 19/10 (docs/sessoes/2026-10-13.md §1), fechado a 22/10/2026
// (docs/sessoes/2026-10-22.md §2, ponto 6): o PDF do arquivo de 12/10 numera os termos pela
// `posicao` gravada (partilhada nos empates) e mostra o `valor`. Um jsPDF falso regista o texto
// que o gerador escreve; as linhas são as da base, lidas a 22/10.
const escritos: string[] = [];
vi.mock("jspdf", () => ({
  default: class {
    internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 }, pages: [null, {}] };
    text(t: string | string[]) { escritos.push(...(Array.isArray(t) ? t : [t])); }
    splitTextToSize(t: string) { return [t]; }
    getNumberOfPages() { return 1; }
    setFontSize() {} setFont() {} setTextColor() {} setDrawColor() {} setLineWidth() {}
    setFillColor() {} line() {} rect() {} addPage() {} setPage() {} save() {}
  },
}));
import { generateEixoPdf } from "@/lib/eixoPdfExport";

const T = (linhas: [string, number, number][]) => linhas.map(([term, valor, posicao]) => ({ term, valor, posicao }));
const ARQUIVO_1210 = {
  "alimentacao": T([["creatina", 217.9, 1], ["dieta", 172.7, 2], ["emagrecer", 139.8, 3], ["anemia", 123.3, 4], ["suplementos", 123.3, 4],
    ["refluxo", 90.4, 6], ["fígado gorduroso", 89.9, 7], ["hipertensão", 58.1, 8], ["alimentação saudável", 55, 9], ["obesidade", 51.1, 10]]),
  "emergentes": T([["vacinas", 61.6, 1], ["gripe A", 56.7, 2], ["sarampo", 51.5, 3], ["dengue", 37.8, 4], ["avc", 30.2, 5],
    ["enxaqueca", 22.7, 6], ["mosquito tigre", 13, 7], ["lipedema", 12.4, 8], ["covid sintomas", 3.8, 9], ["lúpus", 3, 10]]),
  "menopausa": T([["menopausa", 59, 1], ["ginecologista", 58, 2], ["menstruação", 37, 3], ["tiroide", 32, 4], ["cancro da mama", 29, 5],
    ["endometriose", 23, 6], ["osteoporose", 12, 7], ["estradiol", 10.6, 8], ["perimenopausa", 10, 9], ["mioma", 9, 10]]),
  "saude-mental": T([["ansiedade", 169.6, 1], ["psiquiatra", 80, 2], ["autismo", 73.1, 3], ["toc", 51.6, 4], ["alzheimer", 48, 5],
    ["tdah", 41.5, 6], ["bipolar", 20, 7], ["demência", 20, 7], ["psicologa", 18, 9], ["anorexia", 16, 10]]),
};

describe("PDF do arquivo de 12/10", () => {
  beforeEach(() => { escritos.length = 0; });

  for (const [axis, top] of Object.entries(ARQUIVO_1210)) {
    it(`${axis}: cada termo com a sua posição e o seu valor, pela ordem do arquivo`, async () => {
      await generateEixoPdf({ axis, axis_label: axis, week_label: "12/10 — 18/10 2026", top_keywords: top, nota_medicao: null });
      const linhas = top.map(k => `${String(k.posicao).padStart(2, "0")}  ${k.term}`);
      const i = escritos.indexOf(linhas[0]);
      expect(i).toBeGreaterThanOrEqual(0);
      // cada linha do top é seguida do seu valor
      top.forEach((k, j) => {
        expect(escritos[i + 2 * j]).toBe(linhas[j]);
        expect(escritos[i + 2 * j + 1]).toBe(k.valor.toLocaleString("pt-PT", { maximumFractionDigits: 1 }));
      });
      expect(escritos).toContain("Top keywords — valor da semana, na régua do eixo".toUpperCase());
    });
  }

  it("os empates escrevem-se com a mesma posição: 04 anemia, 04 suplementos", async () => {
    await generateEixoPdf({ axis: "alimentacao", axis_label: "Alimentação", week_label: "12/10 — 18/10 2026", top_keywords: ARQUIVO_1210.alimentacao });
    expect(escritos).toContain("04  anemia");
    expect(escritos).toContain("04  suplementos");
    expect(escritos).toContain("123,3");
    expect(escritos).not.toContain("05  suplementos");
  });
});
