import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AxisColumn from "@/components/AxisColumn";
import { incompletoDoEixo } from "@/hooks/useTrendsLote";
import type { GrupoResumo } from "@/lib/trendsGrupo";

// O ResponsiveContainer do recharts precisa dele, e o jsdom não o tem.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;

// Decisão da Marta, 21/10/2026 (docs/sessoes/2026-10-21.md §3): há sempre gráfico. Com os dados
// incompletos, mostra-se na mesma, com um aviso do que falta.
const grupo: GrupoResumo = {
  eixo: "menopausa", termos: ["menopausa"], regua: "lote c2a00bb6", ficheiro: "trends_calibrados",
  descarregadoEm: "2026-10-18", granularidade: "semanal → mensal", pontos: [],
  anoCorrente: 2026, anoAnterior: 2025, mesesSobrepostos: 9,
  maisInteresse: { termo: "menopausa", media: 50 }, maisSobe: null, mesAlto: null, anosCompletos: [2025],
  variacao: { corrente: 55, anterior: 50, pct: 10, meses: 9 },
};
const base = { axisId: "menopausa", label: "Menopausa", keywords: [], allKeywords: [], trendData: [], period: "12m", grupo, hideKeywords: true };

describe("AxisColumn com dados incompletos", () => {
  it("mostra o gráfico, as leituras e a variação, com o aviso de N de M e dos meses em falta", () => {
    render(<AxisColumn {...base} incompleto={{ n: 205, m: 335, termos: [{ termo: "psiquiatra", faltam: 61 }, { termo: "ansiedade", faltam: 37 }] }} />);
    expect(screen.getByText(/Aviso: os dados deste gráfico chegaram incompletos — 205 de 335 linhas\./)).toBeInTheDocument();
    expect(screen.getByText(/Faltam meses a: psiquiatra \(61\), ansiedade \(37\)\./)).toBeInTheDocument();
    expect(screen.getByText(/Evolução temporal/i)).toBeInTheDocument();
    expect(screen.getByText(/Mais interesse/)).toBeInTheDocument();
    expect(screen.getByText(/Var\. 2026 vs 2025/)).toBeInTheDocument();
  });

  it("sem saber que termos (o anual também incompleto), diz só N de M", () => {
    render(<AxisColumn {...base} incompleto={{ n: 900, m: 1000, termos: null }} />);
    expect(screen.getByText(/900 de 1000 linhas/)).toBeInTheDocument();
    expect(screen.queryByText(/Faltam meses a/)).toBeNull();
  });

  it("com os dados completos, não há aviso", () => {
    render(<AxisColumn {...base} incompleto={null} />);
    expect(screen.queryByText(/Aviso:/)).toBeNull();
    expect(screen.getByText(/Mais interesse/)).toBeInTheDocument();
  });
});

describe("incompletoDoEixo", () => {
  const men = (termo: string, n: number) => Array.from({ length: n }, (_, i) => ({ eixo: "saude-mental", termo, mes: `m${i}`, media: 1 }));
  const anu = (termo: string) => [{ eixo: "saude-mental", termo, ano: 2025, media: 1, meses: 12 }, { eixo: "saude-mental", termo, ano: 2026, media: 1, meses: 10 }];
  const leitura = <T,>(linhas: T[], contadas = linhas.length) => ({ linhas, contadas, completa: linhas.length === contadas });

  it("tudo inteiro: null", () => {
    expect(incompletoDoEixo(["alzheimer"], leitura(men("alzheimer", 22)), leitura(anu("alzheimer")))).toBeNull();
  });

  it("o caso de saúde mental a 21/10: os termos e os meses que faltam, pelo anual", () => {
    const r = incompletoDoEixo(
      ["ansiedade", "psiquiatra", "alzheimer"],
      leitura([...men("ansiedade", 8), ...men("alzheimer", 22)], 66),
      leitura([...anu("ansiedade"), ...anu("psiquiatra"), ...anu("alzheimer")]),
    );
    expect(r).toEqual({ n: 36, m: 72, termos: [{ termo: "ansiedade", faltam: 14 }, { termo: "psiquiatra", faltam: 22 }] });
  });

  it("anual incompleto: não se diz que termos", () => {
    const r = incompletoDoEixo(["ansiedade"], leitura(men("ansiedade", 22)), leitura(anu("ansiedade").slice(0, 1), 2));
    expect(r).toEqual({ n: 23, m: 24, termos: null });
  });
});
