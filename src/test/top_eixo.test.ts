import { describe, it, expect } from "vitest";
import { topDoEixo, semMedicao, notaSemMedicao, termosParaIA } from "../../supabase/functions/_shared/top_eixo";

// Dados reais: emergentes, lote fe58e0e5, semana do Trends de 27/09/2026 (arquivo de 05/10),
// valor_eixo como está na base. Lidos a 13/10/2026 — docs/sessoes/2026-10-13.md.
const EMERGENTES_2709 = [
  { termo: "gripe A", valor: "68.000" }, { termo: "vacinas", valor: "68.000" },
  { termo: "avc", valor: "41.556" }, { termo: "enxaqueca", valor: "22.667" },
  { termo: "lipedema", valor: "15.455" }, { termo: "creutzfeldt-jakob", valor: "15.111" },
  { termo: "dengue", valor: "11.333" }, { termo: "sarampo", valor: "8.000" },
  { termo: "covid sintomas", valor: "3.778" }, { termo: "lúpus", valor: "3.000" },
  { termo: "onda de calor", valor: "2.125" }, { termo: "doenças cardiovasculares", valor: "2.125" },
  { termo: "mpox", valor: "0.000" },
];
const termos = (m: { termo: string }[]) => m.map((r) => r.termo);
const comPosicao = (top: { term: string; posicao: number }[]) => top.map((t) => `${t.posicao} ${t.term}`);

describe("topDoEixo", () => {
  it("o caso real de 05/10: gripe A = vacinas partilham o 1.º lugar", () => {
    const top = topDoEixo(EMERGENTES_2709, termos(EMERGENTES_2709));
    expect(comPosicao(top)).toEqual([
      "1 gripe A", "1 vacinas", "3 avc", "4 enxaqueca", "5 lipedema",
      "6 creutzfeldt-jakob", "7 dengue", "8 sarampo", "9 covid sintomas", "10 lúpus",
    ]);
    expect(top[0]).toEqual({ term: "gripe A", valor: 68, valor_eixo: 68, posicao: 1 });
    expect(top[3]).toEqual({ term: "enxaqueca", valor: 22.7, valor_eixo: 22.667, posicao: 4 });
  });

  it("empate no corte: entram todos os empatados, e o top fica com mais de 10", () => {
    const m = Array.from({ length: 9 }, (_, i) => ({ termo: `t${i}`, valor: 100 - i }));
    m.push({ termo: "b", valor: 50 }, { termo: "a", valor: 50 }, { termo: "c", valor: 49 });
    const top = topDoEixo(m, termos(m));
    expect(top).toHaveLength(11);
    expect(comPosicao(top.slice(9))).toEqual(["10 a", "10 b"]);
  });

  it("empate no 5.º lugar: os itens com posição <= 5 são 6", () => {
    const m = [
      { termo: "a", valor: 9 }, { termo: "b", valor: 8 }, { termo: "c", valor: 7 },
      { termo: "d", valor: 6 }, { termo: "f", valor: 5 }, { termo: "e", valor: 5 }, { termo: "g", valor: 4 },
    ];
    const top = topDoEixo(m, termos(m));
    expect(comPosicao(top.filter((t) => t.posicao <= 5))).toEqual(["1 a", "2 b", "3 c", "4 d", "5 e", "5 f"]);
    expect(top.at(-1)).toMatchObject({ term: "g", posicao: 7 });
  });

  it("dentro do empate, a ordem de escrita é a alfabética portuguesa", () => {
    const m = [{ termo: "vacinas", valor: 3 }, { termo: "úlcera", valor: 3 }, { termo: "Ansiedade", valor: 3 }];
    expect(comPosicao(topDoEixo(m, termos(m)))).toEqual(["1 Ansiedade", "1 úlcera", "1 vacinas"]);
  });

  it("igual é igual nas 3 casas gravadas; diferente na 3.ª casa não é empate", () => {
    const m = [{ termo: "a", valor: "8.846" }, { termo: "b", valor: 8.8460001 }, { termo: "c", valor: "8.845" }];
    expect(comPosicao(topDoEixo(m, termos(m)))).toEqual(["1 a", "1 b", "3 c"]);
  });

  it("fora: termos inactivos, zeros e nulos; os activos casam sem maiúsculas", () => {
    const m = [
      { termo: "Menopausa", valor: 50 }, { termo: "âncora", valor: 100 },
      { termo: "zero", valor: 0 }, { termo: "nulo", valor: null },
    ];
    expect(topDoEixo(m, ["menopausa", "zero", "nulo"])).toEqual([
      { term: "Menopausa", valor: 50, valor_eixo: 50, posicao: 1 },
    ]);
  });

  it("um termo repetido na medição pára, em vez de escolher um", () => {
    expect(() => topDoEixo([{ termo: "a", valor: 1 }, { termo: "A", valor: 2 }], ["a"])).toThrow(/repetido/);
  });

  it("sem medição nenhuma, o top é vazio", () => {
    expect(topDoEixo([], ["a", "b"])).toEqual([]);
  });
});

describe("semMedicao e notaSemMedicao", () => {
  const pedidos = [
    { termos: ["a", "b", "Sarampo"], collection_status: "recolhido" },
    { termos: ["c", "d"], collection_status: "sem_dados" },
    { termos: ["e"], collection_status: "falhou" },
    { termos: ["d"], collection_status: "falhou" },
    { termos: ["f"], collection_status: "sem_dados" },
    { termos: ["f"], collection_status: "recolhido" },
  ];
  const medicoes = [
    { termo: "a", valor: 10 }, { termo: "b", valor: 0 }, { termo: "sarampo", valor: null },
  ];

  it("classifica pela ordem recolhido > sem_dados > falhou > não pedido; zero é medição", () => {
    expect(semMedicao(medicoes, ["a", "b", "sarampo", "c", "d", "e", "f", "g"], pedidos)).toEqual([
      { term: "c", razao: "sem_dados" },
      { term: "d", razao: "sem_dados" },
      { term: "e", razao: "falhou" },
      { term: "f", razao: "recolhido sem valor calibrado" },
      { term: "g", razao: "não pedido" },
      { term: "sarampo", razao: "recolhido sem valor calibrado" },
    ]);
  });

  it("a nota diz quais e porquê; sem termos em falta, não há nota", () => {
    expect(notaSemMedicao([{ term: "gripe A", razao: "sem_dados" }], "2026-10-11")).toBe(
      "sem medição na semana de 2026-10-11 para 1 termo activo, que fica fora do top: " +
        "gripe A (o Google não devolveu dados)",
    );
    expect(notaSemMedicao(semMedicao(medicoes, ["a", "b"], pedidos), "2026-10-11")).toBeNull();
  });

  it("todos os termos com linha (como nos lotes reais até 13/10), a lista fica vazia", () => {
    const m = EMERGENTES_2709.map((r) => ({ ...r }));
    expect(semMedicao(m, termos(m), [{ termos: termos(m), collection_status: "recolhido" }])).toEqual([]);
  });
});

describe("termosParaIA (guiões)", () => {
  it("com posição: os itens com posição <= 5, empate no 5.º incluído", () => {
    const top = [
      { term: "a", posicao: 1 }, { term: "b", posicao: 2 }, { term: "c", posicao: 3 },
      { term: "d", posicao: 4 }, { term: "e", posicao: 5 }, { term: "f", posicao: 5 },
      { term: "g", posicao: 7 }, { term: "h", posicao: 8 },
    ];
    expect(termosParaIA(top)).toEqual([
      { term: "a", posicao: 1 }, { term: "b", posicao: 2 }, { term: "c", posicao: 3 },
      { term: "d", posicao: 4 }, { term: "e", posicao: 5 }, { term: "f", posicao: 5 },
    ]);
  });

  it("o top 10 que a v9 grava: vão só os 5 primeiros", () => {
    const top = topDoEixo(EMERGENTES_2709, termos(EMERGENTES_2709));
    expect(top).toHaveLength(10);
    expect(termosParaIA(top).map((t) => `${t.posicao} ${t.term}`)).toEqual([
      "1 gripe A", "1 vacinas", "3 avc", "4 enxaqueca", "5 lipedema",
    ]);
  });

  it("arquivo sem posição (formato até 14/09/2026): os 5 primeiros pela ordem gravada", () => {
    const antigo = ["dependências", "terapia online", "PTSD", "demência", "pânico", "stress"]
      .map((term, i) => ({ term, change_percent: 30 - i, current_volume: 0 }));
    expect(termosParaIA(antigo)).toEqual([
      { term: "dependências", posicao: 1 }, { term: "terapia online", posicao: 2 },
      { term: "PTSD", posicao: 3 }, { term: "demência", posicao: 4 }, { term: "pânico", posicao: 5 },
    ]);
  });

  it("vazio, nulo ou itens sem termo: nada vai à IA", () => {
    expect(termosParaIA([])).toEqual([]);
    expect(termosParaIA(null)).toEqual([]);
    expect(termosParaIA([{ posicao: 1 }, { term: "", posicao: 2 }])).toEqual([]);
  });
});
