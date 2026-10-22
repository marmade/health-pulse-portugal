import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { arquivoPorPosicao, ultimoAno, termosPorProcura, seriesPorTermo, type EntradaArquivo } from "@/lib/vistaEixo";
import { analisar } from "@/lib/vistaEixo";
import ArquivoPosicoes from "@/components/ArquivoPosicoes";

// A vista do eixo, 22/10/2026 — critério em docs/sessoes/2026-10-22.md §2.

// Dados reais: menopausa, lote c2a00bb6, trends_termo_52s lida a 22/10/2026.
const MENOPAUSA_52S = [
  { termo: "adenomiose", mediana_52s: 5 }, { termo: "afrontamentos", mediana_52s: 0 }, { termo: "andropausa", mediana_52s: 0 },
  { termo: "cancro da mama", mediana_52s: 13 }, { termo: "candidíase", mediana_52s: 10.615 }, { termo: "climacare", mediana_52s: 0 },
  { termo: "endometriose", mediana_52s: 24.769 }, { termo: "estradiol", mediana_52s: 10.615 }, { termo: "ginecologista", mediana_52s: 52 },
  { termo: "idade menopausa", mediana_52s: 0 }, { termo: "incontinência urinária", mediana_52s: 0 }, { termo: "menopausa", mediana_52s: 55 },
  { termo: "menopausa precoce", mediana_52s: 0 }, { termo: "menstruação", mediana_52s: 42 }, { termo: "mioma", mediana_52s: 8 },
  { termo: "osteopenia", mediana_52s: 0 }, { termo: "osteoporose", mediana_52s: 10 }, { termo: "perimenopausa", mediana_52s: 8 },
  { termo: "pré-menopausa", mediana_52s: 0 }, { termo: "reposição hormonal", mediana_52s: 0 }, { termo: "sintomas menopausa", mediana_52s: 2 },
  { termo: "sop", mediana_52s: 0 }, { termo: "suores noturnos", mediana_52s: 0 }, { termo: "suplemento menopausa", mediana_52s: 0 },
  { termo: "tiroide", mediana_52s: 33 },
];
const ACTIVOS = MENOPAUSA_52S.map(l => l.termo);

describe("ultimoAno", () => {
  it("menopausa a 22/10: a regra do arquivo, com os empates no 7.º e no 10.º", () => {
    expect(ultimoAno(MENOPAUSA_52S, ACTIVOS).map(t => `${t.posicao} ${t.termo}`)).toEqual([
      "1 menopausa", "2 ginecologista", "3 menstruação", "4 tiroide", "5 endometriose", "6 cancro da mama",
      "7 candidíase", "7 estradiol", "9 osteoporose", "10 mioma", "10 perimenopausa",
    ]);
  });
  it("a ordem dos botões do painel: todos os activos, pela procura, e os sem procura no fim", () => {
    const ordem = termosPorProcura(MENOPAUSA_52S, ACTIVOS);
    expect(ordem).toHaveLength(25);
    expect(ordem.slice(0, 3)).toEqual(["menopausa", "ginecologista", "menstruação"]);
    // depois do 10.º vêm adenomiose (5) e sintomas menopausa (2); os 12 a zero no fim
    expect(ordem.slice(11, 13)).toEqual(["adenomiose", "sintomas menopausa"]);
    expect(ordem.slice(13)).toEqual(ACTIVOS.filter(t => MENOPAUSA_52S.find(l => l.termo === t)!.mediana_52s === 0));
  });
  it("termos com mediana zero, ou que não estão activos, ficam fora", () => {
    const r = ultimoAno(MENOPAUSA_52S, ["menopausa", "sop", "afrontamentos"]);
    expect(r).toEqual([{ termo: "menopausa", valor: 55, posicao: 1 }]);
  });
});

const ent = (week_start: string, top: EntradaArquivo["top_keywords"]): EntradaArquivo =>
  ({ id: week_start, week_start, week_label: week_start, top_keywords: top });

describe("arquivoPorPosicao", () => {
  const entradas = [
    ent("2026-09-14", [{ term: "refluxo gastroesofágico" }]),
    ent("2026-10-12", [
      { term: "creatina", valor: 217.9, posicao: 1, semana_trends: "2026-10-11" },
      { term: "anemia", valor: 123.3, posicao: 4, semana_trends: "2026-10-11" },
      { term: "suplementos", valor: 123.3, posicao: 4, semana_trends: "2026-10-11" },
    ]),
    ent("2026-09-21", [{ term: "creatina", valor: 236, posicao: 1, semana_trends: "2026-09-20" }]),
  ];
  it("separa as semanas com posição das antigas, do mais recente ao mais antigo", () => {
    const { comPosicao, antigas } = arquivoPorPosicao(entradas);
    expect(comPosicao.map(s => s.entrada.week_start)).toEqual(["2026-10-12", "2026-09-21"]);
    expect(antigas.map(e => e.week_start)).toEqual(["2026-09-14"]);
  });
  it("os empates ficam juntos na mesma posição", () => {
    const { comPosicao } = arquivoPorPosicao(entradas);
    expect(comPosicao[0].porPosicao.get(4)).toEqual(["anemia", "suplementos"]);
    expect(comPosicao[0].semanaTrends).toBe("2026-10-11");
  });
  it("no ecrã: termos e posições, sem valores; as antigas à parte, com a linha da outra medida", () => {
    render(<ArquivoPosicoes entradas={entradas} />);
    expect(screen.getAllByText("creatina")).toHaveLength(2);
    expect(screen.getByText("suplementos")).toBeInTheDocument();
    expect(screen.queryByText(/217/)).toBeNull();
    expect(screen.queryByText(/123/)).toBeNull();
    expect(screen.getByText(/Só posições, sem valores/)).toBeInTheDocument();
    expect(screen.getByText(/Semanas anteriores — outra medida/)).toBeInTheDocument();
    expect(screen.getByText("11 a 17 Out")).toBeInTheDocument();
  });
});

describe("seriesPorTermo e analisar", () => {
  it("um termo activo sem linhas fica com série vazia; as linhas ordenam-se por mês", () => {
    const m = seriesPorTermo([
      { termo: "a", mes: "2025-02-01T00:00:00+00:00", media: "2" },
      { termo: "a", mes: "2025-01-01T00:00:00+00:00", media: "1" },
    ], ["a", "b"]);
    expect(m.get("a")).toEqual([{ data: "2025-01-01", valor: 1 }, { data: "2025-02-01", valor: 2 }]);
    expect(m.get("b")).toEqual([]);
  });
  it("série mensal: ano corrente contra anterior, anos completos, máximo e zeros", () => {
    const serie = [
      ...Array.from({ length: 12 }, (_, i) => ({ data: `2025-${String(i + 1).padStart(2, "0")}-01`, valor: i === 6 ? 0 : 10 + i })),
      ...Array.from({ length: 10 }, (_, i) => ({ data: `2026-${String(i + 1).padStart(2, "0")}-01`, valor: 20 })),
    ];
    const a = analisar(serie);
    expect(a.corrente).toBe(2026);
    expect(a.sobrepostos).toBe(10);
    expect(a.pontos[0]).toEqual({ week: "Jan", current: 20, previous: 10 });
    expect(a.pontos[11].current).toBeUndefined();
    expect(a.mediasAnuais.map(x => x.ano)).toEqual([2025]);
    expect(a.maximo).toEqual({ data: "2025-12-01", valor: 21 });
    expect(a.zeros).toBe(1);
  });
  it("série vazia não rebenta", () => {
    const a = analisar([]);
    expect(a.maximo).toBeNull();
    expect(a.sobrepostos).toBe(0);
  });
});
