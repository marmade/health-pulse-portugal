import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// 29/10/2026 (docs/sessoes/2026-10-29.md §15): numa semana sem alerta novo, a secção "Sugestão de
// conteúdo" da /briefing da semana corrente diz-o, em vez de ficar em branco. Os dados da base não
// chegam; os sinais da semana vêm com partes, mas nenhum novo.
vi.mock("@/hooks/useSinaisDaSemana", () => ({
  useSinaisDaSemana: () => ({
    partes: [{ chave: "novo", titulo: "Novos", ressalva: null, itens: [], nota: "Nenhum alerta começou na semana do Google Trends de 18 a 24/10." }],
    itens: [{ parte: "em_curso", term: "dengue", axis: "emergentes", tipo: "subida", valor: 15, razao: 1.6, referencia: 9 }],
    semana: "2026-10-18", lote: "lote", nota: null, carregado: true,
  }),
}));
vi.mock("@/integrations/supabase/client", () => {
  const q: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order", "in", "limit", "range", "gte", "lte", "not", "neq"]) q[m] = () => q;
  q.then = (r: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(r);
  return { supabase: { from: () => q, functions: { invoke: () => Promise.resolve({ data: null, error: null }) } } };
});
import Briefing from "@/pages/Briefing";

describe("/briefing sem alerta novo", () => {
  it("a sugestão de conteúdo diz «Nenhum alerta novo na semana de 18 a 24/10.»", async () => {
    render(<MemoryRouter><Briefing /></MemoryRouter>);
    const titulo = await screen.findByText("Sugestão de conteúdo");
    const seccao = titulo.closest("section")!;
    expect(seccao.textContent).toContain("Nenhum alerta novo na semana de 18 a 24/10.");
    expect(seccao.textContent).not.toMatch(/vezes acima|%/);
  });
});
