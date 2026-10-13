/**
 * O papel de quem chama uma função (28/09/2026), e o que se pode registar sobre a chave
 * sem a registar (13/10/2026, diagnóstico do 403 dos guiões — docs/sessoes/2026-10-05.md §5,
 * passo 2). Sem imports: corre no Deno e no vitest (src/test/papel.test.ts).
 *
 * As funções com restrição só aceitam `role: service_role` no payload do JWT. A ASSINATURA
 * é verificada antes, pelo `verify_jwt: true` da publicação — sem ele, este papel podia ser
 * forjado. Publicar sempre com verify_jwt: true.
 *
 * O que se regista de uma chave: o número de partes separadas por ponto, o prefixo de tipo
 * quando é uma chave nova da Supabase (`sb_secret_`, `sb_publishable_`) e o `role` do
 * payload. NUNCA a chave nem o payload inteiro.
 */

export type LeituraDaChave = {
  /** número de partes separadas por "." — um JWT tem 3 */
  partes: number;
  /** "jwt", "sb_secret", "sb_publishable", "ausente" ou "outro" */
  tipo: string;
  /** o `role` do payload, quando é um JWT legível; senão null */
  papel: string | null;
};

export function lerChave(chave: string | null | undefined): LeituraDaChave {
  const k = (chave ?? "").trim();
  if (!k) return { partes: 0, tipo: "ausente", papel: null };
  const partes = k.split(".");
  const tipo = k.startsWith("sb_secret_") ? "sb_secret"
    : k.startsWith("sb_publishable_") ? "sb_publishable"
    : partes.length === 3 ? "jwt"
    : "outro";
  let papel: string | null = null;
  if (partes.length === 3) {
    try {
      const b64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)));
      papel = typeof payload.role === "string" ? payload.role : null;
    } catch {
      papel = null;
    }
  }
  return { partes: partes.length, tipo, papel };
}

/** A chave do cabeçalho Authorization, sem o "Bearer ". */
export function chaveDoPedido(req: Request): string {
  return (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
}

/** O papel do pedido, como até 13/10/2026 (null se o token não for um JWT legível). */
export function papelDoPedido(req: Request): string | null {
  return lerChave(chaveDoPedido(req)).papel;
}

/**
 * Quem chama é a service_role? (13/10/2026, passo 3 de docs/sessoes/2026-10-05.md §5.)
 *
 * Duas formas aceites:
 *   · "jwt": o Authorization traz um JWT com `role: service_role` (a chave antiga — é a
 *     que o workflow do GitHub usa);
 *   · "chave secreta": o cabeçalho `apikey` é IGUAL à chave secreta do ambiente desta
 *     função, que na plataforma é uma `sb_secret_`.
 *
 * Porquê a segunda, pelo diagnóstico de 13/10/2026 às 14:45 UTC
 * (docs/sessoes/2026-10-13.md §6.2): a chamada interna da generate-guioes-weekly sai com a
 * `sb_secret_` do ambiente, e chega à generate-guiao-questions SEM Authorization, só com
 * `apikey`. O papelDoPedido não encontrava papel e dava 403 — em todas as corridas desde que
 * a verificação foi publicada (28/09 às 18:37 UTC).
 *
 * A comparação é em tempo constante, e só vale para uma chave `sb_secret_` não vazia: uma
 * chave publicável, ou um ambiente sem chave, nunca passam por aqui.
 */
export function pedidoDeServico(req: Request, chaveDoAmbiente: string | null | undefined): string | null {
  if (papelDoPedido(req) === "service_role") return "jwt";
  const amb = (chaveDoAmbiente ?? "").trim();
  const recebida = (req.headers.get("apikey") ?? "").trim();
  if (amb.startsWith("sb_secret_") && igualEmTempoConstante(recebida, amb)) return "chave secreta";
  return null;
}

function igualEmTempoConstante(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a), eb = new TextEncoder().encode(b);
  let dif = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) dif |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return dif === 0;
}

/** Uma linha para os logs: o que chegou, sem a chave. */
export function descreverPedido(req: Request): string {
  const auth = lerChave(chaveDoPedido(req));
  const apikey = lerChave(req.headers.get("apikey"));
  return `authorization: partes=${auth.partes} tipo=${auth.tipo} role=${auth.papel ?? "—"} · ` +
    `apikey: partes=${apikey.partes} tipo=${apikey.tipo} role=${apikey.papel ?? "—"}`;
}
