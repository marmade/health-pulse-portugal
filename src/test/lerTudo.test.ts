import { describe, it, expect } from "vitest";
import { lerTudo, type Pagina } from "@/lib/lerTudo";

// Critério em docs/sessoes/2026-10-21.md §1, ponto 2: um cliente falso que corta como a API
// (no máximo `corte` linhas por pedido, sem erro) e conta os pedidos.
function clienteFalso(total: number, corte = 1000, contagem = total) {
  const base = Array.from({ length: total }, (_, i) => i);
  const pedidos: [number, number][] = [];
  const pedir = async (de: number, ate: number): Promise<Pagina<number>> => {
    pedidos.push([de, ate]);
    const fim = Math.min(ate + 1, de + corte, base.length);
    return { data: base.slice(de, fim), error: null, count: contagem };
  };
  return { pedir, pedidos };
}

describe("lerTudo", () => {
  it("2500 linhas chegam todas, em três pedidos", async () => {
    const { pedir, pedidos } = clienteFalso(2500);
    const r = await lerTudo(pedir);
    expect(r.linhas).toHaveLength(2500);
    expect(r.linhas).toEqual(Array.from({ length: 2500 }, (_, i) => i));
    expect(r).toMatchObject({ contadas: 2500, completa: true });
    expect(pedidos).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
  });

  it("exactamente 1000: um pedido, sem pedido a mais", async () => {
    const { pedir, pedidos } = clienteFalso(1000);
    const r = await lerTudo(pedir);
    expect(r).toMatchObject({ contadas: 1000, completa: true });
    expect(r.linhas).toHaveLength(1000);
    expect(pedidos).toHaveLength(1);
  });

  it("exactamente 2000: dois pedidos", async () => {
    const { pedir, pedidos } = clienteFalso(2000);
    const r = await lerTudo(pedir);
    expect(r).toMatchObject({ contadas: 2000, completa: true });
    expect(r.linhas).toHaveLength(2000);
    expect(pedidos).toHaveLength(2);
  });

  it("1220, o caso do lote c2a00bb6: chegam as 1220, não as 1000", async () => {
    const { pedir } = clienteFalso(1220);
    const r = await lerTudo(pedir);
    expect(r.linhas).toHaveLength(1220);
    expect(r.completa).toBe(true);
  });

  it("nenhuma linha: um pedido, completa", async () => {
    const { pedir, pedidos } = clienteFalso(0);
    const r = await lerTudo(pedir);
    expect(r).toEqual({ linhas: [], contadas: 0, completa: true });
    expect(pedidos).toHaveLength(1);
  });

  it("um servidor que corta abaixo da página continua a ler tudo", async () => {
    const { pedir, pedidos } = clienteFalso(1220, 300);
    const r = await lerTudo(pedir);
    expect(r.linhas).toEqual(Array.from({ length: 1220 }, (_, i) => i));
    expect(r.completa).toBe(true);
    expect(pedidos[1][0]).toBe(300);
  });

  it("contagem maior do que o que chega: incompleta, com os números reais", async () => {
    const { pedir } = clienteFalso(1000, 1000, 1220);
    const r = await lerTudo(pedir);
    expect(r).toMatchObject({ contadas: 1220, completa: false });
    expect(r.linhas).toHaveLength(1000);
  });

  it("um erro do pedido propaga-se", async () => {
    const erro = new Error("rede");
    await expect(lerTudo(async () => ({ data: null, error: erro, count: null }))).rejects.toBe(erro);
  });

  it("sem count exacto, não segue", async () => {
    await expect(lerTudo(async () => ({ data: [1], error: null, count: null }))).rejects.toThrow(/count exacto/);
  });
});
