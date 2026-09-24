// teste-429-trends v2 — a versão que respondeu à pergunta. NÃO ESCREVE NADA.
// 24/09/2026, sessão 18.
//
// Diferença face à v1: faz o AQUECIMENTO DE COOKIE que o pytrends faz e a v1 não fazia.
// O pytrends pede primeiro https://trends.google.com/?geo=PT para apanhar o cookie NID
// (verificado no código instalado: .venv-trends/.../pytrends/request.py:67, GetGoogleCookie)
// e só depois chama a API. Sem isso, um 429 pode ser falta de cookie em vez de bloqueio por
// IP — e era: a v1 levou 17/17 429, esta levou 17/17 200.
//
// Condições que a Marta pôs: não usa a `google-trends` publicada (essa escreve em
// trends_cache); aqui não há cliente Supabase nenhum, logo não pode escrever. Repete a
// corrida semanal inteira: 17 pedidos, grupos de 5 termos com âncora, categoria 45, geo PT,
// 5 anos, pausa de 15 s. Corre por lotes (`inicio`, `n`) por causa do limite de tempo.

const PAUSA_MS = 15_000;
const GEO = "PT";
const CATEGORIA = 45;
const TIMEFRAME = "today 5-y";

const GRUPOS: string[][] = [
  ["psiquiatra", "alzheimer", "anorexia", "ansiedade", "ansiedade social"],
  ["psiquiatra", "antidepressivos", "ataque de pânico", "autismo", "automutilação"],
  ["psiquiatra", "bipolar", "calmantes naturais", "crise de ansiedade", "demência"],
  ["psiquiatra", "dependências", "depressão sintomas", "depressão pós-parto", "fobia social"],
  ["psiquiatra", "insónias", "psicologa", "stress sintomas", "stress pós-traumático"],
  ["psiquiatra", "suicídio", "síndrome de burnout", "tdah", "toc"],
  ["colesterol alto", "alergias alimentares", "alimentação anti-inflamatória", "alimentação saudável", "alimentos ricos em ferro"],
  ["colesterol alto", "anemia", "canetas para emagrecer", "creatina", "diabetes tipo 2"],
  ["colesterol alto", "dieta", "dieta mediterrânica", "doença celíaca", "emagrecer"],
  ["colesterol alto", "fígado gorduroso", "glúten", "hipertensão", "intestino irritável"],
  ["colesterol alto", "intolerância à lactose", "jejum intermitente", "obesidade", "ozempic"],
  ["colesterol alto", "pré-diabetes", "refluxo", "suplementos", "ultraprocessados"],
  ["menopausa", "adenomiose", "afrontamentos", "andropausa", "cancro da mama"],
  ["menopausa", "candidíase", "climacare", "endometriose", "estradiol"],
  ["menopausa", "ginecologista", "idade menopausa", "incontinência urinária", "menopausa precoce"],
  ["menopausa", "menstruação", "mioma", "osteopenia", "osteoporose"],
  ["avc", "candida auris", "covid sintomas", "creutzfeldt-jakob", "dengue"],
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function limpar(t: string) { return t.replace(/^\)\]\}',?\n/, ""); }

// O mesmo que o pytrends faz no arranque: GetGoogleCookie().
async function aquecerCookie() {
  try {
    const r = await fetch(`https://trends.google.com/?geo=${GEO}`, {
      headers: { "User-Agent": UA, "Accept-Language": "pt-PT,pt;q=0.9" },
      redirect: "follow",
    });
    const bruto = r.headers.get("set-cookie") || "";
    const cookie = bruto.split(",").map((p) => p.trim().split(";")[0])
      .filter((p) => p.includes("=")).join("; ");
    return { estado: r.status, cookie, tem_nid: /(^|;\s*)NID=/.test(cookie) };
  } catch (e) {
    return { estado: 0, cookie: "", tem_nid: false, erro: String(e).slice(0, 120) };
  }
}

async function umPedido(termos: string[], cookie: string) {
  const cab: Record<string, string> = {
    "User-Agent": UA, "Accept": "application/json", "Accept-Language": "pt-PT,pt;q=0.9",
  };
  if (cookie) cab["Cookie"] = cookie;

  const comparisonItem = termos.map((kw) => ({ keyword: kw, geo: GEO, time: TIMEFRAME }));
  const reqParam = JSON.stringify({ comparisonItem, category: CATEGORIA, property: "" });
  const r1 = await fetch(
    `https://trends.google.com/trends/api/explore?hl=pt-PT&tz=-60&req=${encodeURIComponent(reqParam)}&token=`,
    { headers: cab },
  );
  if (!r1.ok) return { explore: r1.status, multiline: null, pontos: 0 };

  let widget: { token: string; request: Record<string, unknown> } | undefined;
  try {
    const d = JSON.parse(limpar(await r1.text())) as {
      widgets: Array<{ id: string; token: string; request: Record<string, unknown> }>;
    };
    widget = d.widgets?.find((w) => w.id === "TIMESERIES");
  } catch {
    return { explore: r1.status, multiline: null, pontos: 0, nota: "explore 200 mas não era JSON" };
  }
  if (!widget) return { explore: r1.status, multiline: null, pontos: 0, nota: "sem widget TIMESERIES" };

  const r2 = await fetch(
    `https://trends.google.com/trends/api/widgetdata/multiline?hl=pt-PT&tz=-60` +
    `&req=${encodeURIComponent(JSON.stringify(widget.request))}&token=${encodeURIComponent(widget.token)}`,
    { headers: cab },
  );
  if (!r2.ok) return { explore: r1.status, multiline: r2.status, pontos: 0 };
  try {
    const d = JSON.parse(limpar(await r2.text())) as { default: { timelineData: unknown[] } };
    return { explore: r1.status, multiline: r2.status, pontos: d.default.timelineData.length };
  } catch {
    return { explore: r1.status, multiline: r2.status, pontos: 0, nota: "multiline 200 mas não era JSON" };
  }
}

Deno.serve(async (req) => {
  const { inicio = 0, n = 4 } = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const aquecimento = await aquecerCookie();
  const resultados: unknown[] = [];
  const t0 = Date.now();

  for (let i = inicio; i < Math.min(inicio + n, GRUPOS.length); i++) {
    if (!(i === 0)) await new Promise((r) => setTimeout(r, PAUSA_MS));
    const r = await umPedido(GRUPOS[i], aquecimento.cookie);
    resultados.push({ pedido: i + 1, ...r });
  }

  return new Response(
    JSON.stringify({
      aquecimento: { estado: aquecimento.estado, tem_nid: aquecimento.tem_nid,
                     cookies: aquecimento.cookie ? aquecimento.cookie.split("; ").length : 0 },
      de: inicio + 1, ate: Math.min(inicio + n, GRUPOS.length),
      segundos: Math.round((Date.now() - t0) / 1000),
      resultados,
    }, null, 2),
    { headers: { "Content-Type": "application/json" } },
  );
});
