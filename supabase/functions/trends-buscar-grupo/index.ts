// trends-buscar-grupo — via B do Google Trends (decidida a 24/09/2026).
// Escrita a 29/09/2026 a partir da teste-429-trends v2/v3
// (docs/evidencia/2026-09-24-trends-a-partir-do-supabase/). POR PUBLICAR.
//
// O QUE FAZ: um pedido ao Google Trends para UM grupo de termos (uma régua) e devolve
// a série tal como o pytrends a daria — nada mais. A matemática (grupos, âncoras,
// calibração, top 5, alertas) e a gravação do lote ficam no scripts/5_fetch_google_trends.py,
// que chama esta função no lugar do pytrends, grupo a grupo, com as suas pausas.
//
// O QUE NÃO FAZ: não lê nem escreve na base. Não importa o cliente Supabase e não lê
// nenhuma variável de ambiente, logo não tem chave com que escrever.
//
// QUEM A PODE CHAMAR: só a service_role (o workflow de segunda). A assinatura do token é
// verificada antes, pelo `verify_jwt: true` da publicação — sem ele, o papel podia ser
// forjado. Publicar sempre com verify_jwt: true.
//
// AQUECIMENTO DE COOKIE: o pytrends pede primeiro https://trends.google.com/?geo=PT para
// apanhar o cookie NID (request.py:67, GetGoogleCookie) e só depois chama a API. Sem isso o
// Google devolve 429 aos servidores do Supabase (v1: 17/17 429; v2: 17/17 200; v3: 33/33
// 200). Aquece em CADA chamada, sem reaproveitar o cookie (decisão da Marta, 29/09): o
// primeiro teste real fica o mais perto possível do que passou a 24/09. Reaproveitar o
// cookie entre chamadas testa-se depois, como mudança isolada.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const HL = "pt-PT";
const TZ = 0;                        // o mesmo que o script 5: TrendReq(hl="pt-PT", tz=0)
const TIMEOUT_MS = 30_000;           // o mesmo que o script 5: timeout=(10, 30)
const MAX_TERMOS = 5;                // limite do Google por comparação

/** O papel do JWT do pedido. Igual à generate-guiao-questions (28/09/2026). */
function papelDoPedido(req: Request): string | null {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  try {
    const b64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

type Entrada = { termos: string[]; timeframe: string; categoria: number; geo: string };

/** Valida o corpo do pedido. Devolve a entrada ou a frase do erro. */
function validar(corpo: unknown): Entrada | string {
  if (typeof corpo !== "object" || corpo === null) return "o corpo tem de ser um objecto JSON";
  const { termos, timeframe, categoria, geo } = corpo as Record<string, unknown>;
  if (!Array.isArray(termos) || termos.length < 1 || termos.length > MAX_TERMOS)
    return `termos: lista de 1 a ${MAX_TERMOS}`;
  if (!termos.every((t) => typeof t === "string" && t.trim() !== "" && t.length <= 100))
    return "termos: cada um texto não vazio, até 100 caracteres";
  if (new Set(termos).size !== termos.length) return "termos: repetidos";
  if (typeof timeframe !== "string" ||
      !/^(today \d{1,2}-[my]|now \d{1,2}-[dH]|\d{4}-\d{2}-\d{2} \d{4}-\d{2}-\d{2})$/.test(timeframe))
    return "timeframe: por exemplo 'today 12-m' ou 'today 5-y'";
  if (!Number.isInteger(categoria) || (categoria as number) < 0) return "categoria: inteiro ≥ 0";
  if (typeof geo !== "string" || !/^[A-Z]{2}(-[A-Z0-9]{1,3})?$/.test(geo)) return "geo: por exemplo 'PT'";
  return { termos: termos as string[], timeframe, categoria: categoria as number, geo };
}

async function aquecerCookie(geo: string): Promise<{ cookie: string; tem_nid: boolean }> {
  try {
    const r = await fetch(`https://trends.google.com/?geo=${geo}`, {
      headers: { "User-Agent": UA, "Accept-Language": "pt-PT,pt;q=0.9" },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    await r.body?.cancel();
    const bruto = r.headers.get("set-cookie") || "";
    const cookie = bruto.split(",").map((p) => p.trim().split(";")[0])
      .filter((p) => p.includes("=")).join("; ");
    return { cookie, tem_nid: /(^|;\s*)NID=/.test(cookie) };
  } catch {
    return { cookie: "", tem_nid: false };
  }
}

/** O Google antepõe ")]}'," ao JSON; o pytrends corta-o (trim_chars). */
function limpar(t: string) { return t.replace(/^\)\]\}',?\n?/, ""); }

type Ponto = { t: number; valores: Record<string, number>; parcial: boolean };
type Resultado = { estado: "recolhido" | "sem_dados" | "falhou"; erro: string | null; pontos: Ponto[] };

/**
 * timelineData → pontos, como o pytrends.interest_over_time(): a data é `time` (segundos
 * UNIX), os valores vêm pela ordem dos termos pedidos, `isPartial` falta quando é falso.
 */
function paraPontos(termos: string[], timelineData: unknown[]): Ponto[] {
  return timelineData.map((p) => {
    const q = p as { time: string; value: number[]; isPartial?: boolean };
    const valores: Record<string, number> = {};
    termos.forEach((t, i) => { valores[t] = Number(q.value[i]); });
    return { t: Number(q.time), valores, parcial: q.isPartial === true };
  });
}

async function buscar(e: Entrada, cookie: string): Promise<Resultado> {
  const cab: Record<string, string> = {
    "User-Agent": UA, "Accept": "application/json", "Accept-Language": "pt-PT,pt;q=0.9",
  };
  if (cookie) cab["Cookie"] = cookie;
  const falhou = (erro: string): Resultado => ({ estado: "falhou", erro, pontos: [] });

  // 1. explore: o Google devolve o token do gráfico (widget TIMESERIES)
  const comparisonItem = e.termos.map((kw) => ({ keyword: kw, geo: e.geo, time: e.timeframe }));
  const reqExplore = JSON.stringify({ comparisonItem, category: e.categoria, property: "" });
  let r1: Response;
  try {
    r1 = await fetch(
      `https://trends.google.com/trends/api/explore?hl=${HL}&tz=${TZ}&req=${encodeURIComponent(reqExplore)}`,
      { headers: cab, signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
  } catch (err) {
    return falhou(`explore: ${String(err).slice(0, 150)}`);
  }
  // "HTTP 429" no texto: é por aí que o script 5 decide esperar e repetir uma vez
  if (!r1.ok) { await r1.body?.cancel(); return falhou(`explore: HTTP ${r1.status}`); }
  let widget: { token: string; request: unknown } | undefined;
  try {
    const d = JSON.parse(limpar(await r1.text())) as { widgets?: Array<{ id: string; token: string; request: unknown }> };
    widget = d.widgets?.find((w) => w.id === "TIMESERIES");
  } catch {
    return falhou("explore: HTTP 200 mas a resposta não era JSON");
  }
  if (!widget) return falhou("explore: sem widget TIMESERIES");

  // 2. multiline: a série
  let r2: Response;
  try {
    r2 = await fetch(
      `https://trends.google.com/trends/api/widgetdata/multiline?hl=${HL}&tz=${TZ}` +
      `&req=${encodeURIComponent(JSON.stringify(widget.request))}&token=${encodeURIComponent(widget.token)}`,
      { headers: cab, signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
  } catch (err) {
    return falhou(`multiline: ${String(err).slice(0, 150)}`);
  }
  if (!r2.ok) { await r2.body?.cancel(); return falhou(`multiline: HTTP ${r2.status}`); }
  let timelineData: unknown[];
  try {
    const d = JSON.parse(limpar(await r2.text())) as { default?: { timelineData?: unknown[] } };
    timelineData = d.default?.timelineData ?? [];
  } catch {
    return falhou("multiline: HTTP 200 mas a resposta não era JSON");
  }
  // o pytrends devolve um DataFrame vazio, e o script 5 chama-lhe "sem_dados"
  if (timelineData.length === 0) return { estado: "sem_dados", erro: null, pontos: [] };
  return { estado: "recolhido", erro: null, pontos: paraPontos(e.termos, timelineData) };
}

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (papelDoPedido(req) !== "service_role")
    return json({ error: "só a service_role pode chamar esta função" }, 403);
  if (req.method !== "POST") return json({ error: "só POST" }, 405);

  const entrada = validar(await req.json().catch(() => null));
  if (typeof entrada === "string") return json({ error: entrada }, 400);

  const t0 = Date.now();
  const aq = await aquecerCookie(entrada.geo);
  const r = await buscar(entrada, aq.cookie);

  // 200 mesmo quando o Google falhou: a falha é um resultado, e vai em `estado`/`erro`,
  // como o script 5 já a regista (`falhou`/`sem_dados`, pontos NULL, nunca 0).
  return json({
    ...r,
    aquecimento: { tem_nid: aq.tem_nid },
    milissegundos: Date.now() - t0,
  });
});
