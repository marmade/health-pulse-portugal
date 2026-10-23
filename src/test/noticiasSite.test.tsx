import { describe, it, expect, vi } from "vitest";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Os dois caminhos do site que leem `news_items` (docs/sessoes/2026-10-23.md §2.1 e §3, ponto 3):
// o useNewsData (Cobertura mediática e exportações da página inicial) e o /briefing ao vivo.
// Recebem as linhas como a base as devolve; a "depressão" meteorológica sai, e só ela.
// Datas antigas de propósito: o /briefing mostra as da semana corrente e, sem nenhuma, as 5 mais
// recentes — assim o teste não depende do dia em que corre.
const LINHAS = [
  { id: "1", date: "2025-01-20", created_at: "2025-01-20T06:00:00Z", outlet: "Observador", url: "u1",
    title: "Chuva regressa domingo e pode ser intensa terça e quarta",
    related_term: "depressão sintomas", casou_por: "depressão", categorias: ["Céu e Terra", "Ciência"] },
  { id: "2", date: "2025-01-19", created_at: "2025-01-19T06:00:00Z", outlet: "Notícias ao Minuto", url: "u2",
    title: "Mãe em depressão matou três filhos",
    related_term: "depressão sintomas", casou_por: "depressão", categorias: null },
  { id: "3", date: "2025-01-18", created_at: "2025-01-18T06:00:00Z", outlet: "Público", url: "u3",
    title: "Chuva de queixas sobre a ansiedade nas escolas",
    related_term: "ansiedade", casou_por: "ansiedade", categorias: null },
];

vi.mock("@/integrations/supabase/client", () => {
  const consulta = (tabela: string) => {
    const q: Record<string, unknown> = {};
    for (const m of ["select", "eq", "order", "in", "limit", "range", "gte", "lte", "not"]) q[m] = () => q;
    q.then = (r: (v: unknown) => unknown) =>
      Promise.resolve({ data: tabela === "news_items" ? LINHAS : [], error: null }).then(r);
    return q;
  };
  return {
    supabase: {
      from: consulta,
      functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
    },
  };
});

import { useNewsData } from "@/hooks/useAxisData";
import Briefing from "@/pages/Briefing";

describe("filtro meteorológico no site", () => {
  it("useNewsData: a meteorológica sai, a clínica e a outra com 'chuva' ficam", async () => {
    const { result } = renderHook(() => useNewsData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data.map((n) => n.title)).toEqual([
      "Mãe em depressão matou três filhos",
      "Chuva de queixas sobre a ansiedade nas escolas",
    ]);
  });

  it("/briefing ao vivo: a meteorológica não aparece, as outras sim", async () => {
    render(<MemoryRouter><Briefing /></MemoryRouter>);
    await screen.findByText("Mãe em depressão matou três filhos");
    expect(screen.getByText("Chuva de queixas sobre a ansiedade nas escolas")).toBeInTheDocument();
    expect(screen.queryByText(/Chuva regressa domingo/)).not.toBeInTheDocument();
  });
});
