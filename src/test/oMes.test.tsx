import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { domingosNoMes, mesesDaLeitura, leituraDoMes, variacaoPorExtenso, type LinhaMensal } from "@/lib/vistaEixo";
import OMes from "@/components/OMes";

// O mês — a leitura mensal, 22/10/2026. Decisões e critério em docs/sessoes/2026-10-22.md §11.

/** Um lote com a forma do c2a00bb6: de Outubro de 2021 (3 semanas) a Outubro de 2026 (2). */
function meses(): string[] {
  const r: string[] = [];
  for (let a = 2021, m = 10; a < 2026 || (a === 2026 && m <= 10); m === 12 ? (a++, m = 1) : m++)
    r.push(`${a}-${String(m).padStart(2, "0")}-01`);
  return r;
}
const nDoLote = (mes: string) => (mes === "2021-10-01" ? 3 : mes === "2026-10-01" ? 2 : domingosNoMes(mes));
const linhas = (valores: Record<string, Record<string, number>>, base = 1): LinhaMensal[] =>
  Object.keys(valores).flatMap(termo => meses().map(mes => ({ termo, mes, media: valores[termo][mes] ?? base, n: nDoLote(mes) })));

describe("domingosNoMes", () => {
  it("conta os domingos — as semanas do Trends começam ao domingo", () => {
    expect(domingosNoMes("2021-10-01")).toBe(5); // 3, 10, 17, 24, 31
    expect(domingosNoMes("2026-10-01")).toBe(4); // 4, 11, 18, 25
    expect(domingosNoMes("2026-09-01")).toBe(4);
    expect(domingosNoMes("2026-03-01")).toBe(5);
    expect(domingosNoMes("2024-02-01")).toBe(4);
  });
});

describe("mesesDaLeitura", () => {
  it("de Novembro de 2022 a Setembro de 2026: 47 meses, do mais recente ao mais antigo", () => {
    const r = mesesDaLeitura(linhas({ a: {} }));
    expect(r).toHaveLength(47);
    expect(r[0]).toBe("2026-09-01");
    expect(r[r.length - 1]).toBe("2022-11-01");
    expect(r).not.toContain("2026-10-01"); // incompleto
    expect(r).not.toContain("2022-10-01"); // o ano anterior (Out 2021) está incompleto
    expect(r.some(m => m.startsWith("2021"))).toBe(false);
  });
  it("um mês com uma semana a menos num termo deixa de estar completo", () => {
    const l = linhas({ a: {}, b: {} }).map(r => (r.termo === "b" && r.mes === "2026-09-01" ? { ...r, n: 3 } : r));
    const r = mesesDaLeitura(l);
    expect(r[0]).toBe("2026-08-01");
  });
});

describe("leituraDoMes", () => {
  const S = "2026-09-01", A = "2025-09-01";
  const v = (s: number, a: number) => ({ [S]: s, [A]: a });

  it("a regra do arquivo: empates partilham a posição, zero fica fora, só activos", () => {
    const l = linhas({ x: v(50, 40), y: v(30, 20), z: v(30, 30), w: v(0, 10), fora: v(99, 99) });
    const { itens } = leituraDoMes(l, ["x", "y", "z", "w"], S);
    expect(itens.map(i => `${i.posicao} ${i.termo}`)).toEqual(["1 x", "2 y", "2 z"]);
  });

  it("variação: percentagem a partir de 5, os dois valores abaixo de 5", () => {
    const l = linhas({ a: v(60, 40), b: v(20, 40), c: v(10, 10), d: v(6, 2.3), e: v(7, 5) });
    const r = leituraDoMes(l, ["a", "b", "c", "d", "e"], S);
    const por = Object.fromEntries(r.itens.map(i => [i.termo, variacaoPorExtenso(i)]));
    expect(por).toEqual({ a: "sobe 50%", b: "desce 50%", c: "igual", d: "de 2,3 para 6,0", e: "sobe 40%" });
  });

  it("arredonda com meio para cima, também a descer (−2,5 → desce 2%), como o floor(x + 0,5) da consulta", () => {
    const l = linhas({ sobe: v(8.2, 8), desce: v(7.8, 8) });
    const r = leituraDoMes(l, ["sobe", "desce"], S);
    expect(r.itens.find(i => i.termo === "sobe")!.variacao).toBe(3);   //  2,5
    expect(r.itens.find(i => i.termo === "desce")!.variacao).toBe(-2); // −2,5
  });

  it("o que mais subiu: o maior entre os da tabela com percentagem; empatados, nomeiam-se todos", () => {
    const l = linhas({ a: v(60, 40), b: v(15, 10), c: v(50, 1) }); // c sobe muito, mas sem percentagem
    expect(leituraDoMes(l, ["a", "b", "c"], S).maisSubiu).toEqual({ termos: ["a", "b"], variacao: 50 });
  });

  it("se nenhum subiu, não há o que mais subiu", () => {
    const l = linhas({ a: v(30, 40), b: v(10, 10) });
    expect(leituraDoMes(l, ["a", "b"], S).maisSubiu).toBeNull();
  });

  it("corta no 10.º, com o empate no corte incluído", () => {
    const vals: Record<string, Record<string, number>> = {};
    for (let i = 1; i <= 12; i++) vals[`t${String(i).padStart(2, "0")}`] = v(i <= 9 ? 100 - i : 50, 50);
    const { itens } = leituraDoMes(linhas(vals), Object.keys(vals), S);
    expect(itens).toHaveLength(12); // 9 + três empatados no 10.º
    expect(itens.slice(9).every(i => i.posicao === 10)).toBe(true);
  });
});

describe("<OMes>", () => {
  const l = linhas({
    menopausa: { "2026-09-01": 60, "2025-09-01": 40, "2026-01-01": 20, "2025-01-01": 40 },
    tiroide: { "2026-09-01": 30, "2025-09-01": 30, "2026-01-01": 25, "2025-01-01": 20 },
  });

  it("abre no último mês completo e muda com o selector", () => {
    render(<OMes mensal={l} termosActivos={["menopausa", "tiroide"]} loteId="c2a00bb6-xxxx" />);
    const sel = screen.getByLabelText("Mês") as HTMLSelectElement;
    expect(sel.value).toBe("2026-09-01");
    expect(sel.options).toHaveLength(47);
    expect(screen.getByText("sobe 50%")).toBeTruthy();
    expect(screen.getByText(/O que mais subiu face a Setembro de 2025: menopausa \(sobe 50%\)/)).toBeTruthy();

    fireEvent.change(sel, { target: { value: "2026-01-01" } });
    expect(screen.getByText("desce 50%")).toBeTruthy();
    expect(screen.getByText(/face a Janeiro de 2025: tiroide \(sobe 25%\)/)).toBeTruthy();
  });

  it("diz quantos tiveram procura, e o aviso só com dados a menos", () => {
    const { rerender } = render(<OMes mensal={l} termosActivos={["menopausa", "tiroide"]} />);
    expect(screen.getByText(/Só 2 termos tiveram procura medida em Setembro de 2026/)).toBeTruthy();
    expect(screen.queryByText(/incompletos/)).toBeNull();
    rerender(<OMes mensal={l} termosActivos={["menopausa", "tiroide"]} incompleto={{ n: 900, m: 1525, termos: null }} />);
    expect(screen.getByText(/900 de 1525 linhas/)).toBeTruthy();
  });
});
