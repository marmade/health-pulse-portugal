import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DebunkingTable from "@/components/DebunkingTable";

// 29/10/2026 (docs/sessoes/2026-10-29.md): as verificações da covid-19 num separador próprio,
// fora dos eixos, e o título da verificação ao lado da afirmação.

const item = (o: Record<string, unknown>) => ({
  term: "vacinas", title: "afirmação", classification: "Errado", source: "Observador",
  url: "https://observador.pt/factchecks/x", explicacao: null, ...o,
}) as any;

describe("DebunkingTable", () => {
  it("mostra o título da verificação ao lado da afirmação", () => {
    render(<DebunkingTable items={[item({ title: "A verdade está cá fora e os médicos sabem-na.", explicacao: "Fact Check. Vacinação aumenta casos de autismo em menores?" })]} />);
    expect(screen.getByText("A verdade está cá fora e os médicos sabem-na.")).toBeInTheDocument();
    expect(screen.getByText(/Verificação: Fact Check\. Vacinação aumenta casos de autismo/)).toBeInTheDocument();
  });

  it("as semeadas 'a verificar' não aparecem", () => {
    render(<DebunkingTable items={[item({ title: "semeada", classification: "a verificar" })]} />);
    expect(screen.queryByText("semeada")).toBeNull();
  });

  it("com as da covid-19 há dois separadores, e as da covid só aparecem no seu", () => {
    render(<DebunkingTable items={[item({ title: "do eixo" })]} covid={[item({ title: "da covid" })]} />);
    expect(screen.getByText("Eixos · 1")).toBeInTheDocument();
    expect(screen.getByText("do eixo")).toBeInTheDocument();
    expect(screen.queryByText("da covid")).toBeNull();
    fireEvent.click(screen.getByText("Covid-19 · 1"));
    expect(screen.getByText("da covid")).toBeInTheDocument();
    expect(screen.queryByText("do eixo")).toBeNull();
  });

  it("sem as da covid (vista de um eixo) não há separadores", () => {
    render(<DebunkingTable items={[item({ title: "do eixo" })]} />);
    expect(screen.queryByText(/Covid-19 ·/)).toBeNull();
  });
});

describe("exportações do painel principal", () => {
  it("o PDF e o CSV recebem o que o ecrã mostra, sem as semeadas (29/10/2026)", async () => {
    const { readFileSync } = await import("node:fs");
    const fonte = readFileSync("src/pages/Index.tsx", "utf8");
    expect(fonte).toMatch(/debunkingExportavel = useMemo\(\(\) => debunkingData\.filter\(temVeredicto\)/);
    expect(fonte).not.toMatch(/debunkingData=\{debunkingData\}/);
  });
});
