import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import AlertasEixo, { ComoLerAlertas } from "@/components/AlertasEixo";

// Critério de prova escrito antes do código: docs/sessoes/2026-10-23.md §7.5, pontos 1 a 4 e 6.
// O texto aprovado pela Marta a 23/10/2026 (§7.1 e §7.4), escrito aqui à parte do componente.
// O "A observar" mudou a 28/10/2026, para dizer o mesmo que o briefing (2026-10-28.md §16).
// A frase da tendência entrou a 29/10/2026, texto da Marta (2026-10-29-cowork.md §17).
const APROVADO = [
  "Um alerta diz que um termo foi mais procurado numa semana do que costuma ser. Os valores vêm do Google Trends e não são números de pesquisas: são relativos, numa escala própria de cada eixo, e só se comparam dentro do mesmo eixo.",
  "▲ Subida. O «valor normal» é a mediana das oito semanas anteriores. Há alerta quando a semana fica pelo menos 1,5 vezes acima desse valor e bem acima da oscilação habitual do termo. «Em curso, 3.ª semana» quer dizer que a subida dura há três semanas. Enquanto dura, o valor normal fica o de antes de começar.",
  "Um alerta que dura mais de meio ano passa a tendência: deixa de ter bandeira, e o valor normal passa a ser o novo nível. Uma subida acima desse nível volta a dar alerta.",
  "● Aparecimento. Um termo sem procura regular passa a ser procurado, muito acima do que tinha no último ano.",
  "~ Sazonal. A subida é a que esta época do ano costuma trazer. Mostra-se, mas não é alerta.",
  "○ A observar. Subiu sem chegar ao limite de alerta.",
  "A semana em curso não conta. O alerta diz que algo subiu, não porquê: isso é leitura de quem o vê. «Nenhum alerta» quer dizer que nenhum termo cumpriu a regra nessa semana, não que nada mudou no tema.",
];

const DADOS = { semana: "2026-10-11", itens: [] };

describe("Como ler os alertas", () => {
  it("o texto é o aprovado, letra a letra, parágrafo a parágrafo (ponto 1)", () => {
    render(<ComoLerAlertas />);
    const texto = screen.getByText("Como ler os alertas").nextElementSibling!;
    expect([...texto.querySelectorAll(":scope > p")].map((p) => p.textContent)).toEqual(APROVADO);
  });

  it("só os quatro nomes dos tipos estão em negrito (ponto 1)", () => {
    const { container } = render(<ComoLerAlertas />);
    expect([...container.querySelectorAll("strong")].map((s) => s.textContent)).toEqual([
      "Subida.", "Aparecimento.", "Sazonal.", "A observar.",
    ]);
  });

  it("sempre visível: o título é título de coluna, sem nada que se abra ou feche (decisão da Marta, 23/10)", () => {
    const { container } = render(<ComoLerAlertas />);
    expect(container.querySelectorAll("details, summary, button")).toHaveLength(0);
    const titulo = screen.getByText("Como ler os alertas");
    expect(titulo.tagName).toBe("P");
    expect(titulo.className).toContain("editorial-label");
    expect(titulo.nextElementSibling!.textContent).toContain("Um alerta diz que um termo");
  });

  it("aparece debaixo dos alertas do eixo e não no modo compacto; a nota antiga não (pontos 3 e 4)", () => {
    const normal = render(<AlertasEixo dados={DADOS} />);
    expect(normal.getAllByText("Como ler os alertas")).toHaveLength(1);
    expect(normal.container.textContent).not.toMatch(/desvios robustos/);
    normal.unmount();
    const compacto = render(<AlertasEixo dados={DADOS} compacto />);
    expect(compacto.container.textContent).not.toMatch(/desvios robustos|Como ler os alertas/);
  });

  it("os símbolos da legenda têm as cores das linhas dos alertas (ajuste da Marta, 23/10)", () => {
    const item = (tipo: "subida" | "aparecimento" | "sazonal" | "a_observar", termo: string) => ({
      termo, tipo, valor: 50, referencia: 20, razao: 2.5, z: 3, fatorSazonal: tipo === "sazonal" ? 2 : null,
      maxAnterior: tipo === "aparecimento" ? 5 : null, semanaN: 1, inicio: "2026-10-11",
    });
    const dados = { semana: "2026-10-11", itens: [item("subida", "a"), item("aparecimento", "b"), item("sazonal", "c"), item("a_observar", "d")] };
    const { container } = render(<AlertasEixo dados={dados} />);
    const classeNaLinha = (s: string) =>
      [...container.querySelectorAll("span.w-3")].find((e) => e.textContent === s)!.className.replace(/text-\[11px\] w-3 shrink-0 mt-0\.5 /, "");
    const legenda = screen.getByText("Como ler os alertas").nextElementSibling!;
    const classeNaLegenda = (s: string) =>
      [...legenda.querySelectorAll("span")].find((e) => e.textContent === s)!.className;
    const cores = ["▲", "●", "~", "○"].map((s) => [s, classeNaLegenda(s), classeNaLinha(s)]);
    for (const [, naLegenda, naLinha] of cores) expect(naLegenda).toBe(naLinha);
    expect(cores.map(([s, c]) => `${s} ${c}`)).toEqual([
      "▲ text-destructive", "● text-destructive", "~ text-foreground/60", "○ text-foreground/60",
    ]);
  });

  it("o §1.1 do rascunho das notas de método diz o mesmo que o ecrã (ponto 6)", () => {
    const md = readFileSync(
      resolve(__dirname, "../../docs/evidencia/2026-09-18-sobre-linha-do-tempo/rascunho-notas-de-metodo.md"),
      "utf8",
    );
    const seccao = md.split("### 1.1")[1].split("### 1.2")[0];
    const citado = seccao.split("\n").filter((l) => l.startsWith(">")).map((l) => l.replace(/^>\s?/, "")).join(" ");
    const normaliza = (s: string) => s.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
    expect(normaliza(citado)).toBe(normaliza(APROVADO.join(" ")));
  });
});

describe("a linha da tendência no ecrã (29/10/2026)", () => {
  it("à parte, sem bandeira nem símbolo, com o texto da Marta", () => {
    const dados = { semana: "2026-10-18", itens: [
      { termo: "creatina", tipo: "tendencia" as const, valor: 190.583, referencia: 40.833, razao: 4.667, z: null,
        fatorSazonal: null, maxAnterior: null, semanaN: 251, inicio: "2022-01-02" },
    ] };
    const { container } = render(<AlertasEixo dados={dados} compacto />);
    expect(container.textContent).toContain("creatina — tendência de subida desde 02/01/2022 · 190,6 (o valor normal antes era 40,8)");
    expect(container.textContent).not.toMatch(/[▲●~○]|em curso/);
    expect(container.textContent).toContain("Nenhum alerta esta semana.");
  });
});
