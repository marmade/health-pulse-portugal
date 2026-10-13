import { describe, it, expect } from "vitest";
import { lerChave, papelDoPedido, descreverPedido, pedidoDeServico } from "../../supabase/functions/_shared/papel";

// JWTs de teste, sem assinatura válida: só o payload interessa aqui (a assinatura é
// verificada pela plataforma, verify_jwt: true).
const b64url = (o: object) => btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const jwt = (payload: object) => `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(payload)}.assinatura`;
const pedido = (h: Record<string, string>) => new Request("http://x", { method: "POST", headers: h });

describe("lerChave", () => {
  it("JWT com role", () => {
    expect(lerChave(jwt({ role: "service_role" }))).toEqual({ partes: 3, tipo: "jwt", papel: "service_role" });
    expect(lerChave(jwt({ role: "anon" })).papel).toBe("anon");
  });
  it("chaves novas da Supabase: tipo pelo prefixo, sem papel", () => {
    expect(lerChave("sb_secret_abc123")).toEqual({ partes: 1, tipo: "sb_secret", papel: null });
    expect(lerChave("sb_publishable_xyz")).toEqual({ partes: 1, tipo: "sb_publishable", papel: null });
  });
  it("ausente, lixo e JWT ilegível", () => {
    expect(lerChave(null)).toEqual({ partes: 0, tipo: "ausente", papel: null });
    expect(lerChave("abc")).toEqual({ partes: 1, tipo: "outro", papel: null });
    expect(lerChave("a.%%%.c")).toEqual({ partes: 3, tipo: "jwt", papel: null });
  });
});

describe("papelDoPedido e descreverPedido", () => {
  it("lê o Authorization sem o Bearer", () => {
    expect(papelDoPedido(pedido({ authorization: `Bearer ${jwt({ role: "service_role" })}` }))).toBe("service_role");
    expect(papelDoPedido(pedido({}))).toBeNull();
  });
  it("a linha de log nunca leva a chave", () => {
    const segredo = "sb_secret_NAO_PODE_APARECER";
    const linha = descreverPedido(pedido({ authorization: `Bearer ${segredo}`, apikey: segredo }));
    expect(linha).toBe(
      "authorization: partes=1 tipo=sb_secret role=— · apikey: partes=1 tipo=sb_secret role=—",
    );
    expect(linha).not.toContain("NAO_PODE");
  });
});

describe("pedidoDeServico", () => {
  const AMB = "sb_secret_chave_do_ambiente";
  it("o caso do diagnóstico de 13/10: sem Authorization, apikey igual à chave do ambiente → aceite", () => {
    expect(pedidoDeServico(pedido({ apikey: AMB }), AMB)).toBe("chave secreta");
  });
  it("o JWT antigo com service_role continua a passar", () => {
    expect(pedidoDeServico(pedido({ authorization: `Bearer ${jwt({ role: "service_role" })}` }), AMB)).toBe("jwt");
  });
  it("recusados: anon, outra chave secreta, chave publicável, nada", () => {
    expect(pedidoDeServico(pedido({ authorization: `Bearer ${jwt({ role: "anon" })}` }), AMB)).toBeNull();
    expect(pedidoDeServico(pedido({ apikey: "sb_secret_outra" }), AMB)).toBeNull();
    expect(pedidoDeServico(pedido({ apikey: AMB + "x" }), AMB)).toBeNull();
    expect(pedidoDeServico(pedido({ apikey: "sb_publishable_x" }), "sb_publishable_x")).toBeNull();
    expect(pedidoDeServico(pedido({}), AMB)).toBeNull();
  });
  it("ambiente sem chave: um apikey vazio não passa", () => {
    expect(pedidoDeServico(pedido({ apikey: "" }), "")).toBeNull();
    expect(pedidoDeServico(pedido({}), undefined)).toBeNull();
  });
});
