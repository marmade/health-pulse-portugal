import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  seMostra, partesDoBriefing, topDebunkingDoBriefing, topDebunkingDoEixo, notaSemVerificacoes,
  N_ANTERIORES, type LinhaDebunking,
} from "../../supabase/functions/_shared/factchecks";
import { partesDosFactChecks, partesDaSemana } from "@/lib/factchecksBriefing";

// 29/10/2026 (docs/sessoes/2026-10-29.md): os fact-checks do briefing e do arquivo dos eixos
// passam a vir da tabela `debunking`, em duas partes — "Desta semana" e as 5 "Anteriores".

const linha = (o: Partial<LinhaDebunking>): LinhaDebunking => ({
  term: "vacinas", title: "afirmação", explicacao: "Fact Check. Título?", classification: "Errado",
  source: "Observador", url: `https://observador.pt/factchecks/${Math.random()}`, data_publicacao: "2026-10-20",
  eixo: "emergentes", covid: false, ...o,
});

describe("seMostra", () => {
  it("as 36 semeadas ('a verificar') ficam de fora, com ou sem link", () => {
    expect(seMostra({ url: "https://poligrafo.sapo.pt/x", classification: "a verificar" })).toBe(false);
    expect(seMostra({ url: "", classification: "a verificar" })).toBe(false);
  });
  it("sem veredicto do editor ou sem url fica de fora", () => {
    expect(seMostra({ url: "https://x", classification: "sem veredicto" })).toBe(false);
    expect(seMostra({ url: "  ", classification: "Errado" })).toBe(false);
  });
  it("só Errado e Enganador se mostram; Esticado, Certo e os outros ficam de fora (29/10)", () => {
    for (const c of ["Esticado", "Certo", "Praticamente Certo", "Inconclusivo"]) {
      expect(seMostra({ url: "https://x", classification: c })).toBe(false);
    }
    expect(seMostra({ url: "https://x", classification: "Errado" })).toBe(true);
  });
  it("com veredicto e url entra", () => {
    expect(seMostra({ url: "https://x", classification: "Enganador" })).toBe(true);
  });
});

describe("partesDoBriefing", () => {
  const ini = "2026-10-19", fim = "2026-10-25";

  it("desta semana: data entre início e fim, inclusive; depois do fim não entra em parte nenhuma", () => {
    const ls = [
      linha({ data_publicacao: "2026-10-19", url: "a" }),
      linha({ data_publicacao: "2026-10-25", url: "b" }),
      linha({ data_publicacao: "2026-10-26", url: "c" }),
      linha({ data_publicacao: "2026-10-18", url: "d" }),
    ];
    const p = partesDoBriefing(ls, ini, fim);
    expect(p.destaSemana.map((l) => l.url)).toEqual(["b", "a"]);
    expect(p.anteriores.map((l) => l.url)).toEqual(["d"]);
  });

  it("anteriores: as 5 mais recentes antes do início, seja qual for o tema", () => {
    const ls = ["2026-01-01", "2026-09-28", "2025-12-29", "2026-08-26", "2026-06-30", "2026-08-18", "2024-01-01"]
      .map((d, i) => linha({ data_publicacao: d, url: `u${i}`, covid: i % 2 === 0 }));
    const a = partesDoBriefing(ls, ini, fim).anteriores;
    expect(a).toHaveLength(N_ANTERIORES);
    expect(a.map((l) => l.data_publicacao)).toEqual(["2026-09-28", "2026-08-26", "2026-08-18", "2026-06-30", "2026-01-01"]);
  });

  it("a mesma verificação casada com duas keywords conta uma vez", () => {
    const ls = [linha({ url: "x", term: "vacinas" }), linha({ url: "x", term: "hantavírus" })];
    expect(partesDoBriefing(ls, ini, fim).destaSemana).toHaveLength(1);
    expect(partesDoBriefing(ls, ini, fim).destaSemana[0].term).toBe("hantavírus");
  });

  it("sem veredicto ou sem data não entra", () => {
    const ls = [linha({ classification: "a verificar" }), linha({ data_publicacao: null })];
    const p = partesDoBriefing(ls, ini, fim);
    expect(p.destaSemana).toHaveLength(0);
    expect(p.anteriores).toHaveLength(0);
  });
});

describe("o que o archive-weekly grava", () => {
  it("briefing: cada item marcado com a parte, com o título da verificação", () => {
    const top = topDebunkingDoBriefing([linha({ url: "s" }), linha({ url: "a", data_publicacao: "2026-10-01" })], "2026-10-19", "2026-10-25");
    expect(top.map((d) => [d.parte, d.url, d.date])).toEqual([["semana", "s", "2026-10-20"], ["anterior", "a", "2026-10-01"]]);
    expect(top[0].explicacao).toBe("Fact Check. Título?");
  });

  it("eixo: só as da semana e do eixo, sem as da covid-19, no máximo 3", () => {
    const ls = [
      linha({ url: "1" }), linha({ url: "2" }), linha({ url: "3" }), linha({ url: "4" }),
      linha({ url: "c", covid: true }),
      linha({ url: "m", eixo: "menopausa" }),
      linha({ url: "v", data_publicacao: "2026-10-01" }),
    ];
    const t = topDebunkingDoEixo(ls, "emergentes", "2026-10-19", "2026-10-25");
    expect(t).toHaveLength(3);
    expect(t.every((d) => d.eixo === "emergentes" && !d.covid && !d.parte)).toBe(true);
  });

  it("o archive-weekly importa a regra de _shared/factchecks.ts e já não lê as notícias de fact-check", () => {
    const fonte = readFileSync("supabase/functions/archive-weekly/index.ts", "utf8");
    expect(fonte).toMatch(/from "\.\.\/_shared\/factchecks\.ts";/);
    expect(fonte).not.toMatch(/eFactCheck|desmentidoDaNoticia/);
    expect(fonte).toMatch(/\.from\("debunking"\)/);
  });
});

describe("a primeira carga, com a lista revista de 29/10", () => {
  // As 265 da lista menos as 25 exclusões = as 240 que o --gravar grava.
  const D = "docs/evidencia/2026-10-29-fact-checks/";
  const lista = JSON.parse(readFileSync(D + "lista-dry-run.json", "utf8")) as LinhaDebunking[];
  const fora = new Set((JSON.parse(readFileSync(D + "exclusoes.json", "utf8")) as { url: string; term: string }[]).map((e) => `${e.url} ${e.term}`));
  const carga = lista.filter((l) => !fora.has(`${l.url} ${l.term}`)).map((l) => ({ ...l, data_publicacao: l.data_publicacao!.slice(0, 10) }));

  it("são 240", () => expect(carga).toHaveLength(240));

  it("o briefing de 26/10–01/11: nada desta semana; as 5 anteriores começam no AVC de Xi Jinping (28/09)", () => {
    const p = partesDoBriefing(carga, "2026-10-26", "2026-11-01");
    expect(p.destaSemana).toHaveLength(0);
    expect(p.anteriores.map((l) => l.data_publicacao)).toEqual(["2026-09-28", "2026-08-26", "2026-06-30", "2026-06-24", "2026-06-24"]);
    expect(p.anteriores[0].term).toBe("avc");
  });
});

describe("partesDosFactChecks (a página e o PDF)", () => {
  it("briefings arquivados antes de 2/11 (sem parte) ficam como estavam", () => {
    expect(partesDosFactChecks([{ term: "x", title: "y", classification: null, source: "Observador", url: "u", date: "2026-09-28" } as any],
      { desmentidos: "nenhuma notícia de fact-check com data entre…" })).toBeNull();
    expect(partesDosFactChecks([], {})).toBeNull();
  });
  it("desta semana vazia diz-o numa frase; as anteriores aparecem", () => {
    const top = topDebunkingDoBriefing([linha({ url: "a", data_publicacao: "2026-10-01" })], "2026-10-26", "2026-11-01");
    const p = partesDosFactChecks(top, { desmentidos: notaSemVerificacoes("2026-10-26", "2026-11-01") })!;
    expect(p.destaSemana.itens).toHaveLength(0);
    expect(p.destaSemana.nota).toBe("Nenhuma verificação do Observador publicada entre 2026-10-26 e 2026-11-01.");
    expect(p.anteriores.itens).toHaveLength(1);
  });
  it("um arquivo novo sem nenhuma verificação reconhece-se pela nota", () => {
    const p = partesDosFactChecks([], { desmentidos: notaSemVerificacoes("2026-10-26", "2026-11-01") })!;
    expect(p.anteriores.itens).toHaveLength(0);
    expect(p.anteriores.nota).toMatch(/Sem verificações anteriores/);
  });
  it("a semana corrente usa a mesma regra", () => {
    const p = partesDaSemana([linha({ url: "s" }), linha({ url: "x", classification: "a verificar" })], "2026-10-19", "2026-10-25");
    expect(p.destaSemana.itens.map((d) => d.url)).toEqual(["s"]);
  });
});
