import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { limpar, descodificarEntidades } from "../../supabase/functions/_shared/texto";

// 29/10/2026 (2026-10-29-cowork.md §14): entidades HTML nos títulos das notícias. O limpar() da
// fetch-rss-feeds só descodificava seis entidades com nome.

describe("limpar", () => {
  it("entidades numéricas", () => {
    expect(limpar("Projeto DiversITy &#038; Health")).toBe("Projeto DiversITy & Health");
    expect(limpar("Webinar &#8211; Zona Norte")).toBe("Webinar – Zona Norte");
    expect(limpar("Demências &#124; A demência")).toBe("Demências | A demência");
    expect(limpar("x &#x2014; y")).toBe("x — y");
  });
  it("entidades com nome, como antes, e as aspas", () => {
    expect(limpar("Filme &quot;Banzo&quot; lidera")).toBe('Filme "Banzo" lidera');
    expect(limpar("A &amp; B &lt;3 &#39;x&#039;")).toBe("A & B <3 'x'");
    expect(limpar("a&nbsp;b")).toBe("a b");
  });
  it("marcas codificadas, uma ou duas vezes, saem", () => {
    expect(limpar("ao luar, &lt;em&gt;Pink moon&lt;/em&gt; no auto-rádio")).toBe("ao luar, Pink moon no auto-rádio");
    expect(limpar("&amp;quot;sim&amp;quot;")).toBe('"sim"');
  });
  it("o CDATA, como desde 18/09", () => {
    expect(limpar(" <![CDATA[Anemia na gravidez]]> ")).toBe("Anemia na gravidez");
  });
  it("uma entidade desconhecida fica como está", () => {
    expect(descodificarEntidades("a &naoexiste; b")).toBe("a &naoexiste; b");
  });
  it("a fetch-rss-feeds importa limpar() de _shared/texto.ts e não o define", () => {
    const fonte = readFileSync("supabase/functions/fetch-rss-feeds/index.ts", "utf8");
    expect(fonte).toMatch(/import \{ limpar \} from '\.\.\/_shared\/texto\.ts';/);
    expect(fonte).not.toMatch(/function limpar\(/);
  });
});
