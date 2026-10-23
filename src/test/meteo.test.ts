import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { eDepressaoMeteorologica, CATEGORIA_METEO, TITULO_METEO } from "../../supabase/functions/_shared/meteo";
import { semMeteorologicas } from "@/lib/noticias";

// Critério de prova escrito antes do código: docs/sessoes/2026-10-23.md §3, pontos 1 a 3.

// As sete linhas reais que casaram por "depress", lidas da base a 23/10/2026 às 13:48 UTC
// (títulos como estão gravados, com o CDATA do feed).
const REAIS = [
  { title: "Depressão em jovens atinge máximos históricos em Portugal", related_term: "depressão sintomas", casou_por: "depressão", categorias: null },
  { title: '<![CDATA[Harrison Ford revela a sua luta contra a depressão: "Estava doente"]]>', related_term: "depressão sintomas", casou_por: "depressão", categorias: null },
  { title: '<![CDATA[Adeptos do Inter Miami declaram-se a Messi: "Salvaste-me da depressão"]]>', related_term: "depressão sintomas", casou_por: "depressão", categorias: null },
  { title: "O caso da depressão que escondia outra doença", related_term: "depressão sintomas", casou_por: "depressão", categorias: null },
  { title: "<![CDATA[Mãe em depressão matou três filhos. Nas redes sociais, há outra teoria]]>", related_term: "depressão sintomas", casou_por: "depressão", categorias: null },
  { title: "<![CDATA[Mãe que matou filhos durante depressão pós-parto considerada inocente]]>", related_term: "depressão pós-parto", casou_por: "depressão pós-parto", categorias: null },
  { title: "Chuva regressa domingo e pode ser intensa terça e quarta", related_term: null, casou_por: "depressão", categorias: ["Céu e Terra", "Ciência"] },
];

describe("uma regra só (ponto 1)", () => {
  const fonte = readFileSync(resolve(__dirname, "../../supabase/functions/archive-weekly/index.ts"), "utf8");

  it("o archive-weekly importa a regra de _shared/meteo.ts e não a define", () => {
    expect(fonte).toMatch(/import \{ eDepressaoMeteorologica \} from "\.\.\/_shared\/meteo\.ts";/);
    expect(fonte).not.toMatch(/function eDepressaoMeteorologica/);
    expect(fonte).not.toMatch(/const (CATEGORIA|TITULO)_METEO/);
  });

  it("as expressões são as do archive-weekly de 28/09 a 23/10 (v9 publicada), letra a letra", () => {
    expect(CATEGORIA_METEO.source).toBe(String.raw`c[ée]u e terra|meteorolog|\btempo\b`);
    expect(TITULO_METEO.source).toBe(
      String.raw`\b(chuvas?|trovoadas?|ipma|tempestades?|precipitação|ventos?|agitação marítima)\b|aviso (amarelo|laranja|vermelho)|meteorol`,
    );
    expect(CATEGORIA_METEO.flags).toBe("i");
    expect(TITULO_METEO.flags).toBe("i");
  });
});

describe("eDepressaoMeteorologica — casos sintéticos (ponto 2)", () => {
  it("casou por depressão, categoria Céu e Terra, título sem palavra do tempo → sai", () => {
    expect(eDepressaoMeteorologica({ casou_por: "depressão", categorias: ["Céu e Terra"], title: "Domingo começa cinzento" })).toBe(true);
  });

  it("casou por depressão, sem categorias, título com chuva, IPMA ou aviso amarelo → sai", () => {
    for (const title of ["Chuva forte no Norte", "IPMA prevê descida das temperaturas", "Aviso amarelo em sete distritos"]) {
      expect(eDepressaoMeteorologica({ casou_por: "depressão", categorias: null, title })).toBe(true);
    }
  });

  it("casou_por nulo, related_term depressão sintomas, título com tempestade → sai", () => {
    expect(eDepressaoMeteorologica({ casou_por: null, related_term: "depressão sintomas", title: "Tempestade Aline chega amanhã" })).toBe(true);
  });

  it("casou por depressão pós-parto, título com chuva → sai (a regra procura 'depress')", () => {
    expect(eDepressaoMeteorologica({ casou_por: "depressão pós-parto", title: "Chuva volta na terça" })).toBe(true);
  });

  it("casou por depressão, título clínico, sem categorias → fica", () => {
    expect(eDepressaoMeteorologica({ casou_por: "depressão", categorias: null, title: "Depressão em jovens atinge máximos históricos em Portugal" })).toBe(false);
  });

  it("casou por ansiedade, com chuva no título e categoria Céu e Terra → fica (a regra só olha para quem casou por depressão)", () => {
    expect(eDepressaoMeteorologica({ casou_por: "ansiedade", related_term: "ansiedade", categorias: ["Céu e Terra"], title: "Chuva e ansiedade" })).toBe(false);
  });

  it("as sete linhas reais: as seis clínicas ficam, a 'Chuva regressa…' sai", () => {
    expect(REAIS.map(eDepressaoMeteorologica)).toEqual([false, false, false, false, false, false, true]);
  });
});

describe("semMeteorologicas — o filtro do site (ponto 3)", () => {
  it("tira a meteorológica e só ela, mantendo a ordem e as linhas como vieram", () => {
    const outra = { title: "Chuva de queixas no SNS 24", related_term: "ansiedade", casou_por: "ansiedade", categorias: ["Céu e Terra"] };
    const linhas = [...REAIS, outra];
    const fica = semMeteorologicas(linhas);
    expect(fica).toEqual([...REAIS.slice(0, 6), outra]);
    expect(fica[0]).toBe(REAIS[0]);
  });
});
