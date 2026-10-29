import { describe, it, expect } from "vitest";
import {
  sinaisDaSemana, previsiveisDoMes, anosPossiveis, notasDasPartes, mesDaSemana, intervaloDaSemana,
  type LinhaAlerta,
} from "../../supabase/functions/_shared/emergentes";
import { partesDosSinais } from "@/lib/sinaisEmergentes";

// Dados reais: lote 2d0a7be3 (completo, 25/10/2026), como estão na base. Lidos a 28/10/2026 —
// docs/sessoes/2026-10-28.md §2 e §12. A série do lote começa a 24/10/2021.
const LOTE_INICIO = "2021-10-24";
const l = (
  eixo: string, termo: string, tipo: LinhaAlerta["tipo"], semana: string, valor: string,
  referencia: string, razao: string, z: string | null, fator_sazonal: string | null,
  semana_n: number, inicio: string,
): LinhaAlerta => ({ eixo, termo, tipo, semana, valor, referencia, razao, z, fator_sazonal, semana_n, inicio });

// Todas as linhas da semana do Trends de 18/10/2026 (o briefing de 19–25/10).
const SEMANA_1810 = [
  l("alimentacao", "creatina", "subida", "2026-10-18", "190.556", "40.833", "4.667", "17.312", "1.024", 251, "2022-01-02"),
  l("alimentacao", "obesidade", "subida", "2026-10-18", "205.882", "46.324", "4.444", "11.616", "1.190", 1, "2026-10-18"),
  l("alimentacao", "diabetes tipo 2", "subida", "2026-10-18", "66.111", "21.389", "3.091", "5.750", "1.136", 1, "2026-10-18"),
  l("emergentes", "dengue", "subida", "2026-10-18", "14.667", "9.167", "1.600", "0.750", "1.000", 2, "2026-10-11"),
  l("emergentes", "sarampo", "subida", "2026-10-18", "18.000", "12.000", "1.500", "0.578", "1.354", 3, "2026-10-04"),
  l("menopausa", "cancro da mama", "a_observar", "2026-10-18", "34.000", "19.000", "1.789", "2.023", "2.302", 1, "2026-10-18"),
  l("menopausa", "menopausa", "a_observar", "2026-10-18", "77.000", "61.000", "1.262", "2.398", "1.257", 1, "2026-10-18"),
];

// Todas as linhas de Outubro e Novembro com fator_sazonal >= 1,5, de 2023 a 2026.
const OUT_NOV_F15 = [
  l("alimentacao", "ozempic", "sazonal", "2023-10-01", "47.353", "27.794", "1.704", "4.750", "2.706", 1, "2023-10-01"),
  l("menopausa", "cancro da mama", "sazonal", "2023-10-01", "29.000", "14.500", "2.000", "7.250", "1.931", 1, "2023-10-01"),
  l("saude-mental", "tdah", "a_observar", "2023-10-01", "68.491", "49.763", "1.376", "3.763", "1.591", 1, "2023-10-01"),
  l("menopausa", "cancro da mama", "sazonal", "2023-10-08", "33.000", "15.000", "2.200", "6.070", "2.774", 1, "2023-10-08"),
  l("menopausa", "cancro da mama", "sazonal", "2023-10-15", "48.000", "16.000", "3.000", "8.633", "2.457", 1, "2023-10-15"),
  l("saude-mental", "tdah", "a_observar", "2023-10-15", "66.351", "50.833", "1.305", "3.053", "1.556", 1, "2023-10-15"),
  l("menopausa", "cancro da mama", "a_observar", "2023-10-22", "36.000", "19.000", "1.895", "2.085", "1.955", 1, "2023-10-22"),
  l("menopausa", "cancro da mama", "a_observar", "2024-10-06", "25.000", "16.000", "1.562", "2.023", "2.987", 1, "2024-10-06"),
  l("alimentacao", "hipertensão", "a_observar", "2024-10-13", "55.000", "32.500", "1.692", "2.023", "2.450", 1, "2024-10-13"),
  l("menopausa", "cancro da mama", "sazonal", "2024-10-13", "42.000", "17.000", "2.471", "5.621", "2.729", 1, "2024-10-13"),
  l("menopausa", "cancro da mama", "a_observar", "2024-10-20", "32.000", "18.500", "1.730", "2.276", "2.240", 1, "2024-10-20"),
  l("alimentacao", "diabetes tipo 2", "a_observar", "2024-11-10", "35.000", "19.444", "1.800", "2.000", "1.615", 1, "2024-11-10"),
  l("emergentes", "dengue", "subida", "2024-11-17", "44.000", "11.000", "4.000", "4.500", "1.500", 1, "2024-11-17"),
  l("menopausa", "cancro da mama", "sazonal", "2025-10-05", "32.000", "14.000", "2.286", "6.070", "2.774", 1, "2025-10-05"),
  l("menopausa", "osteoporose", "a_observar", "2025-10-05", "15.000", "10.000", "1.500", "2.500", "1.765", 1, "2025-10-05"),
  l("menopausa", "cancro da mama", "sazonal", "2025-10-12", "35.000", "14.000", "2.500", "4.721", "2.471", 1, "2025-10-12"),
  l("emergentes", "gripe A", "a_observar", "2025-11-16", "77.000", "33.000", "2.333", "2.000", "3.000", 1, "2025-11-16"),
  l("emergentes", "gripe A", "subida", "2025-11-23", "143.000", "33.000", "4.333", "5.000", "3.000", 1, "2025-11-23"),
  l("emergentes", "gripe A", "subida", "2025-11-30", "220.000", "33.000", "6.667", "8.500", "2.222", 2, "2025-11-23"),
  l("alimentacao", "hipertensão", "subida", "2026-10-04", "75.000", "40.000", "1.875", "1.889", "1.833", 2, "2026-09-27"),
  l("emergentes", "gripe A", "a_observar", "2026-10-04", "66.000", "11.000", "6.000", "2.500", "2.500", 1, "2026-10-04"),
  l("menopausa", "cancro da mama", "sazonal", "2026-10-04", "25.000", "14.000", "1.786", "3.710", "2.700", 1, "2026-10-04"),
  l("emergentes", "sarampo", "subida", "2026-10-11", "50.000", "12.000", "4.167", "3.662", "1.503", 2, "2026-10-04"),
  l("menopausa", "cancro da mama", "a_observar", "2026-10-11", "29.000", "16.500", "1.758", "2.409", "2.485", 1, "2026-10-11"),
  l("menopausa", "cancro da mama", "a_observar", "2026-10-18", "34.000", "19.000", "1.789", "2.023", "2.302", 1, "2026-10-18"),
];

const resumo = (s: { parte: string; term: string; semana_n?: number }[]) =>
  s.map((x) => `${x.parte} ${x.term}${x.semana_n && x.semana_n > 1 ? ` (${x.semana_n}.ª)` : ""}`);

describe("sinaisDaSemana — o briefing de 19–25/10", () => {
  // O cancro da mama de 18/10 está nas duas listas; na base é uma linha só.
  const sinais = sinaisDaSemana(
    [...SEMANA_1810, ...OUT_NOV_F15.filter((x) => x.semana !== "2026-10-18")], "2026-10-18",
  );

  it("as três partes, pela ordem do ecrã; as outras semanas não entram", () => {
    expect(resumo(sinais)).toEqual([
      "novo obesidade", "novo diabetes tipo 2",
      "em_curso creatina (251.ª)", "em_curso dengue (2.ª)", "em_curso sarampo (3.ª)",
      "a_observar cancro da mama", "a_observar menopausa",
    ]);
  });

  it("os números como na base, e o change_percent da página antiga", () => {
    expect(sinais[0]).toEqual({
      parte: "novo", term: "obesidade", axis: "alimentacao", tipo: "subida",
      valor: 205.882, referencia: 46.324, razao: 4.444, z: 11.616, max_anterior: null, semana_n: 1,
      inicio: "2026-10-18", change_percent: 344,
    });
    expect(sinais.find((s) => s.term === "creatina")?.change_percent).toBe(367);
  });

  it("uma linha sazonal da semana não entra nas partes 1–3", () => {
    const s = sinaisDaSemana(OUT_NOV_F15, "2026-10-04");
    expect(resumo(s)).toEqual(["em_curso hipertensão (2.ª)", "a_observar gripe A"]);
  });

  it("aparecimento conta como alerta e fica depois da subida", () => {
    const s = sinaisDaSemana([
      l("emergentes", "x", "aparecimento", "2026-10-18", "30", "0", "9.000", null, null, 1, "2026-10-18"),
      l("emergentes", "y", "subida", "2026-10-18", "30", "10", "1.600", "4", null, 1, "2026-10-18"),
    ], "2026-10-18");
    expect(resumo(s)).toEqual(["novo y", "novo x"]);
  });
});

describe("previsiveisDoMes", () => {
  it("Outubro de 2026: só o cancro da mama, em 3 de 3 anos", () => {
    const p = previsiveisDoMes(OUT_NOV_F15, 10, 2026, LOTE_INICIO);
    expect(p.anosPossiveis).toEqual([2023, 2024, 2025]);
    expect(p.itens).toEqual([{
      parte: "previsivel", term: "cancro da mama", axis: "menopausa", mes: 10,
      anos: [2023, 2024, 2025], anos_possiveis: 3, fator_max: 2.987,
    }]);
  });

  it("Novembro de 2026: vazio — gripe A, diabetes tipo 2 e dengue só num ano cada", () => {
    const p = previsiveisDoMes(OUT_NOV_F15, 11, 2026, LOTE_INICIO);
    expect(p.anosPossiveis).toEqual([2023, 2024, 2025]);
    expect(p.itens).toEqual([]);
  });

  it("o ano corrente não conta (cancro da mama em 2026 não faz 4)", () => {
    const p = previsiveisDoMes(OUT_NOV_F15, 10, 2027, LOTE_INICIO);
    expect(p.itens[0].anos).toEqual([2023, 2024, 2025, 2026]);
  });

  it("um factor abaixo de 1,5 não conta", () => {
    const linhas = [
      l("a", "t", "a_observar", "2023-10-08", "1", "1", "1", "2", "1.499", 1, "2023-10-08"),
      l("a", "t", "a_observar", "2024-10-06", "1", "1", "1", "2", "1.6", 1, "2024-10-06"),
    ];
    expect(previsiveisDoMes(linhas, 10, 2026, LOTE_INICIO).itens).toEqual([]);
  });
});

describe("anosPossiveis e o mês da semana", () => {
  it("o primeiro factor possível é 18/12/2022: Dezembro tem 4 anos, Outubro 3", () => {
    expect(anosPossiveis(12, 2026, LOTE_INICIO)).toEqual([2022, 2023, 2024, 2025]);
    expect(anosPossiveis(10, 2026, LOTE_INICIO)).toEqual([2023, 2024, 2025]);
  });

  it("a semana conta no mês da quarta-feira", () => {
    expect(mesDaSemana("2025-11-30")).toEqual({ mes: 12, ano: 2025 });
    expect(mesDaSemana("2026-10-25")).toEqual({ mes: 10, ano: 2026 });
    expect(mesDaSemana("2026-10-28")).toEqual({ mes: 10, ano: 2026 });
    expect(mesDaSemana("2026-10-29")).toEqual({ mes: 11, ano: 2026 });
  });

  it("intervalo da semana", () => {
    expect(intervaloDaSemana("2026-10-18")).toBe("18 a 24/10");
    expect(intervaloDaSemana("2026-10-25")).toBe("25 a 31/10");
    expect(intervaloDaSemana("2026-11-29")).toBe("29/11 a 05/12");
  });
});

describe("notasDasPartes", () => {
  it("19–25/10: nenhuma parte vazia, fica só o mês", () => {
    const sinais = sinaisDaSemana(SEMANA_1810, "2026-10-18");
    const prev = previsiveisDoMes(OUT_NOV_F15, 10, 2026, LOTE_INICIO);
    expect(notasDasPartes(sinais, prev, "2026-10-18", 10)).toEqual({ emergentes_mes: "Outubro" });
  });

  it("tudo vazio, Novembro", () => {
    const prev = previsiveisDoMes(OUT_NOV_F15, 11, 2026, LOTE_INICIO);
    expect(notasDasPartes([], prev, "2026-10-25", 11)).toEqual({
      emergentes_mes: "Novembro",
      emergentes_novos: "Nenhum alerta começou na semana do Google Trends de 25 a 31/10.",
      emergentes_em_curso: "Nenhum alerta de semanas anteriores continua em curso.",
      emergentes_a_observar: "Nenhum termo subiu sem chegar ao limite de alerta.",
      emergentes_previsiveis: "Nenhum termo subiu em Novembro em pelo menos 2 dos 3 anos anteriores.",
    });
  });

  it("lote sem anos anteriores suficientes", () => {
    const prev = previsiveisDoMes([], 10, 2023, LOTE_INICIO);
    expect(notasDasPartes([], prev, "2023-10-01", 10).emergentes_previsiveis).toBe(
      "O lote ainda não tem anos anteriores suficientes para Outubro (tem 0; são precisos 2).",
    );
  });
});

describe("o briefing de 19–25/10 como a página e o PDF o mostram", () => {
  it("as quatro partes, com as frases", () => {
    const sinais = sinaisDaSemana(SEMANA_1810, "2026-10-18");
    const prev = previsiveisDoMes(OUT_NOV_F15, 10, 2026, LOTE_INICIO);
    const notas = notasDasPartes(sinais, prev, "2026-10-18", 10);
    // O que o archive-weekly grava passa por JSON.
    const arquivado = JSON.parse(JSON.stringify([...sinais, ...prev.itens]));
    const partes = partesDosSinais(arquivado, notas)!;
    expect(partes.map((p) => [p.titulo, p.ressalva, p.itens.map((i) => `${i.term}: ${i.frase}`), p.nota])).toEqual([
      ["Novos", null, [
        "obesidade: 4,4 vezes acima do valor normal (46)",
        "diabetes tipo 2: 3,1 vezes acima do valor normal (21)",
      ], null],
      ["Em curso", null, [
        "creatina: 4,7 vezes acima do valor normal (41) — em curso, 251.ª semana",
        "dengue: 1,6 vezes acima do valor normal (9) — em curso, 2.ª semana",
        "sarampo: 1,5 vezes acima do valor normal (12) — em curso, 3.ª semana",
      ], null],
      ["A observar", "Subiram sem chegar ao limite de alerta.", [
        "cancro da mama: 1,8 vezes acima do valor normal (19)",
        "menopausa: 1,3 vezes acima do valor normal (61)",
      ], null],
      ["Previsíveis para Outubro", null, [
        "cancro da mama: subiu em Outubro em 3 de 3 anos (2023, 2024, 2025)",
      ], null],
    ]);
  });

  it("os briefings antigos (sem emergentes_mes) ficam como estavam", () => {
    expect(partesDosSinais([], { emergentes: "vazio até os alertas…" })).toBeNull();
  });
});

describe("tendência (decisão da Marta, 29/10/2026)", async () => {
  const { sinaisDaSemana, fraseDaTendencia } = await import("../../supabase/functions/_shared/emergentes");
  const { partesDosSinais } = await import("@/lib/sinaisEmergentes");
  const base = { eixo: "alimentacao", semana: "2026-10-18", z: null, fator_sazonal: null, max_anterior: null };
  const creatina = { ...base, termo: "creatina", tipo: "tendencia" as const, valor: "190.583", referencia: "40.833", razao: "4.667", semana_n: 251, inicio: "2022-01-02" };
  const dengue = { ...base, eixo: "emergentes", termo: "dengue", tipo: "subida" as const, valor: "20", referencia: "10", razao: "2", semana_n: 2, inicio: "2026-10-11" };

  it("a tendência sai de 'em curso' e vai para a sua parte", () => {
    const s = sinaisDaSemana([creatina, dengue], "2026-10-18");
    expect(s.map((x) => [x.term, x.parte])).toEqual([["dengue", "em_curso"], ["creatina", "tendencia"]]);
  });
  it("a frase, o texto da Marta, sem a palavra alerta", () => {
    expect(fraseDaTendencia({ valor: 190.583, referencia: 40.833, inicio: "2022-01-02" }))
      .toBe("tendência de subida desde 02/01/2022 · 190,6 (o valor normal antes era 40,8)");
  });
  it("no briefing, a linha à parte só aparece quando há tendência, e sem a etiqueta Emergente", () => {
    const notas = { emergentes_mes: "Outubro" };
    const com = partesDosSinais(sinaisDaSemana([creatina, dengue], "2026-10-18") as any, notas)!;
    expect(com.map((p) => p.chave)).toEqual(["novo", "em_curso", "tendencia", "a_observar", "previsivel"]);
    expect(com.find((p) => p.chave === "tendencia")!.itens[0].frase).toBe("tendência de subida desde 02/01/2022 · 190,6 (o valor normal antes era 40,8)");
    const sem = partesDosSinais(sinaisDaSemana([dengue], "2026-10-18") as any, notas)!;
    expect(sem.map((p) => p.chave)).toEqual(["novo", "em_curso", "a_observar", "previsivel"]);
  });
});
