import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// 22/10/2026 (docs/sessoes/2026-10-22.md §5–§6): escolher um eixo antes de os dados da página
// chegarem deixava o site em branco — o `axisTerms` do Index lia `filteredData[activeAxis]` com
// `filteredData` ainda null. Aqui os dados nunca chegam, e escolhe-se um eixo.
vi.mock("@/hooks/useAxisData", () => ({
  useAxisData: () => ({ data: null, isLoading: true, error: null, isFromDb: false }),
  useDebunkingData: () => ({ data: [] }),
  useNewsData: () => ({ data: [], lastFetchTimestamp: null }),
}));
vi.mock("@/hooks/useLastRefreshed", () => ({ useLastRefreshed: () => null }));
vi.mock("@/hooks/useHistoricalData", () => ({ useHistoricalData: () => ({ data: [], isLoading: false }) }));
vi.mock("@/hooks/useTrendsLote", () => ({ useTrendsLote: () => ({ porEixo: null, lote: null, erro: null }) }));
vi.mock("@/hooks/useVistaEixo", () => ({ useVistaEixo: () => ({ dados: null, erro: null }) }));
vi.mock("@/integrations/supabase/client", () => {
  const q: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order", "in", "limit", "range", "gte"]) q[m] = () => q;
  q.then = (r: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(r);
  return { supabase: { from: () => q } };
});
import Index from "@/pages/Index";

describe("Index enquanto os dados carregam", () => {
  it("escolher um eixo antes de a página carregar não rebenta", () => {
    render(<MemoryRouter><Index /></MemoryRouter>);
    expect(screen.getByText(/A carregar dados/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("EIXOS"));
    fireEvent.click(screen.getAllByRole("button").find(b => /menopausa/i.test(b.textContent || ""))!);
    expect(screen.getByText(/A carregar dados/)).toBeInTheDocument();
  });
});
