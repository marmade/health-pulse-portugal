import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fraseDaSugestao, fraseDoAlerta } from "@/lib/fraseAlerta";
import { fraseDoSinal } from "@/lib/sinaisEmergentes";

// 29/10/2026 (docs/sessoes/2026-10-29.md §14): a sugestão de conteúdo na linguagem dos alertas —
// sem percentagens (decisão 5 de 18/09) e sem "sem histórico significativo".

describe("a sugestão de conteúdo", () => {
  it("subida: a frase da Marta, letra a letra", () => {
    expect(fraseDaSugestao({ term: "obesidade", tipo: "subida", valor: 206.25, razao: 4.408, referencia: 46.25 }, "2026-10-18"))
      .toBe("obesidade — 206, 4,4 vezes o valor normal (46), na semana de 18 a 24/10");
  });
  it("aparecimento: a linha do ecrã", () => {
    expect(fraseDaSugestao({ term: "candida auris", tipo: "aparecimento", valor: 100, razao: 0, referencia: 0, max_anterior: 6 }, "2026-10-18"))
      .toBe("candida auris — 100, apareceu; normalmente sem procura (máx. anterior 6), na semana de 18 a 24/10");
  });
  it("a parte do meio é a mesma que a linha do alerta e a do briefing escrevem (uma só função)", () => {
    const a = { tipo: "subida", razao: 4.408, referencia: 46.25 };
    expect(fraseDoSinal({ parte: "novo", term: "obesidade", axis: "alimentacao", ...a }, "Outubro")).toBe(fraseDoAlerta(a));
    const ecra = readFileSync("src/components/AlertasEixo.tsx", "utf8");
    expect(ecra).toMatch(/fraseDoAlerta\(a\)/);
    // A guarda contra a frase escrita à mão no ecrã apanha a forma de 04/11/2026 e a antiga.
    expect(ecra).not.toMatch(/vezes (acima do|o) valor normal \(\$\{/);
  });
  it("sem 'acima' (decisão da Marta, 01/11/2026): «4,4 vezes acima» lia-se como somado", () => {
    expect(fraseDoAlerta({ tipo: "subida", razao: 4.408, referencia: 46.25 })).toBe("4,4 vezes o valor normal (46)");
    expect(fraseDoAlerta({ tipo: "sazonal", razao: 12.4, referencia: 3 })).toBe("12 vezes o valor normal (3)");
    expect(readFileSync("src/lib/fraseAlerta.ts", "utf8")).not.toMatch(/vezes acima/);
  });
  it("a página e o PDF já não têm percentagens nem 'sem histórico significativo' na sugestão nova", () => {
    const pagina = readFileSync("src/pages/Briefing.tsx", "utf8");
    expect(pagina).not.toMatch(/sem histórico significativo/);
    expect(pagina).toMatch(/sugestao: fraseDaSugestao\(novos\[0\], sinais\.semana\)/);
  });
});

describe("sem alerta novo (decisão da Marta, 29/10/2026)", async () => {
  const { fraseSemAlertaNovo } = await import("@/lib/fraseAlerta");
  it("a frase, no formato das partes vazias", () => {
    expect(fraseSemAlertaNovo("2026-10-18")).toBe("Nenhum alerta novo na semana de 18 a 24/10.");
    expect(fraseSemAlertaNovo("2026-10-25")).toBe("Nenhum alerta novo na semana de 25 a 31/10.");
    expect(fraseSemAlertaNovo("2026-11-29")).toBe("Nenhum alerta novo na semana de 29/11 a 05/12.");
  });
  it("a página mostra-a em vez de ficar em branco, e o PDF também (semana corrente e arquivados desde 2/11)", () => {
    const pagina = readFileSync("src/pages/Briefing.tsx", "utf8");
    expect(pagina).toMatch(/sinais\.semana \? fraseSemAlertaNovo\(sinais\.semana\)/);
    expect(pagina).toMatch(/semSugestao: sinais\.semana \? fraseSemAlertaNovo\(sinais\.semana\) : null/);
    expect(pagina).toMatch(/semSugestao: archive\.top_emerging\?\.\[0\]\?\.semana_trends \? fraseSemAlertaNovo/);
    expect(pagina).not.toMatch(/Sem sugestões esta semana/);
    const pdf = readFileSync("src/lib/briefingPdfExport.ts", "utf8");
    expect(pdf).toMatch(/if \(!data\.topEmergent && data\.semSugestao\)/);
  });
});
