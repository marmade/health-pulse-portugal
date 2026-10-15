import { describe, it, expect } from "vitest";
import { semanaIntervalo } from "@/lib/semana";

// Decisão da Marta, 15/10/2026 (docs/sessoes/2026-10-15-cowork.md §4.3): a semana do Trends
// diz-se de domingo a sábado.
describe("semanaIntervalo", () => {
  it("dentro do mês: um só mês", () => {
    expect(semanaIntervalo("2026-10-04")).toBe("4 a 10 Out");
  });
  it("atravessa o mês: os dois meses", () => {
    expect(semanaIntervalo("2026-09-27")).toBe("27 Set a 3 Out");
  });
  it("atravessa o ano", () => {
    expect(semanaIntervalo("2026-12-27")).toBe("27 Dez a 2 Jan");
  });
  it("o último dia do mês como sábado fica no mesmo mês", () => {
    expect(semanaIntervalo("2026-10-25")).toBe("25 a 31 Out");
  });
  it("aceita um timestamp e não depende do fuso", () => {
    expect(semanaIntervalo("2026-10-11T00:00:00+00:00")).toBe("11 a 17 Out");
  });
});
