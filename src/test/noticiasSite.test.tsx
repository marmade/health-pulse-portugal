import { describe, it, expect, vi } from "vitest";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Os dois caminhos do site que leem `news_items` (docs/sessoes/2026-10-23.md §2.1 e §3, ponto 3):
// o useNewsData (Cobertura mediática e exportações da página inicial) e o /briefing ao vivo.
// Recebem as linhas como a base as devolve; a "depressão" meteorológica sai, e só ela.
// Desde 01/11/2026 o /briefing mostra só as notícias da semana corrente e com termo (decisão da
// Marta): as linhas têm a data de hoje, para o teste não depender do dia em que corre.
const HOJE = new Date().toISOString().slice(0, 10);
const LINHAS = [
  { id: "1", date: HOJE, created_at: `${HOJE}T06:00:00Z`, outlet: "Observador", url: "u1",
    title: "Chuva regressa domingo e pode ser intensa terça e quarta",
    related_term: "depressão sintomas", casou_por: "depressão", categorias: ["Céu e Terra", "Ciência"] },
  { id: "2", date: HOJE, created_at: `${HOJE}T06:00:00Z`, outlet: "Notícias ao Minuto", url: "u2",
    title: "Mãe em depressão matou três filhos",
    related_term: "depressão sintomas", casou_por: "depressão", categorias: null },
  { id: "3", date: HOJE, created_at: `${HOJE}T06:00:00Z`, outlet: "Público", url: "u3",
    title: "Chuva de queixas sobre a ansiedade nas escolas",
    related_term: "ansiedade", casou_por: "ansiedade", categorias: null },
];
// Só para o /briefing: uma notícia antiga e uma sem termo, que não podem aparecer.
const FORA = [
  { id: "4", date: "2025-01-17", created_at: "2025-01-17T06:00:00Z", outlet: "RTP", url: "u4",
    title: "Notícia antiga sobre ansiedade", related_term: "ansiedade", casou_por: "ansiedade", categorias: null },
  { id: "5", date: HOJE, created_at: `${HOJE}T06:00:00Z`, outlet: "RTP", url: "u5",
    title: "Notícia desta semana sem termo", related_term: null, casou_por: null, categorias: null },
];
let linhas: unknown[] = LINHAS;

vi.mock("@/integrations/supabase/client", () => {
  const consulta = (tabela: string) => {
    const q: Record<string, unknown> = {};
    for (const m of ["select", "eq", "order", "in", "limit", "range", "gte", "lte", "not"]) q[m] = () => q;
    q.then = (r: (v: unknown) => unknown) =>
      Promise.resolve({ data: tabela === "news_items" ? linhas : [], error: null }).then(r);
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
import { SEM_NOTICIAS_NA_SEMANA } from "@/lib/noticias";

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
    linhas = [...LINHAS, ...FORA];
    render(<MemoryRouter><Briefing /></MemoryRouter>);
    await screen.findByText("Mãe em depressão matou três filhos");
    expect(screen.getByText("Chuva de queixas sobre a ansiedade nas escolas")).toBeInTheDocument();
    expect(screen.queryByText(/Chuva regressa domingo/)).not.toBeInTheDocument();
    // 01/11/2026: nem a de outra semana, nem a sem termo
    expect(screen.queryByText("Notícia antiga sobre ansiedade")).not.toBeInTheDocument();
    expect(screen.queryByText("Notícia desta semana sem termo")).not.toBeInTheDocument();
    linhas = LINHAS;
  });

  it("/briefing ao vivo: sem notícias da semana, diz porquê, e não mostra as de outras semanas", async () => {
    linhas = FORA;
    render(<MemoryRouter><Briefing /></MemoryRouter>);
    await screen.findByText(SEM_NOTICIAS_NA_SEMANA);
    expect(screen.queryByText("Notícia antiga sobre ansiedade")).not.toBeInTheDocument();
    linhas = LINHAS;
  });
});
