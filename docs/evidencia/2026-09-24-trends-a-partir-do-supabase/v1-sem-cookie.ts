// teste-429-trends — descartável, NÃO ESCREVE NADA
// ================================================
// 24/09/2026, sessão 18. Responde a uma pergunta só: o Google Trends bloqueia os
// servidores do Supabase como bloqueia os do GitHub (429 desde 28/07/2026)?
//
// CONDIÇÕES QUE A MARTA PÔS, e que este ficheiro cumpre:
//  1. NÃO usa a função `google-trends` publicada, porque essa escreve em `trends_cache`.
//     Aqui não há cliente Supabase nenhum, nem import dele. Não há escrita possível.
//  2. Não faz um pedido: repete a corrida semanal — os mesmos ~17 pedidos, com a mesma
//     pausa de 15 s (scripts/trends_grupos.json: pausa_segundos), os mesmos grupos de 5
//     termos com âncora, a mesma categoria 45 e geo PT.
//  3. Devolve o estado de cada pedido, para o resultado se ler como resultado.
//
// Corre por lotes por causa do limite de tempo de uma Edge Function: cada invocação faz
// `n` pedidos a partir de `inicio`. A pausa aplica-se antes de cada pedido excepto o
// primeiro de todos, para a cadência se manter entre invocações.
//
// APAGAR quando a pergunta estiver respondida.

const PAUSA_MS = 15_000;
const GEO = "PT";
const CATEGORIA = 45;
const TIMEFRAME = "today 5-y";

// Os mesmos grupos que o script 5 formou hoje: a âncora do eixo mais quatro termos.
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

async function umPedido(termos: string[]) {
  const comparisonItem = termos.map((kw) => ({ keyword: kw, geo: GEO, time: TIMEFRAME }));
  const reqParam = JSON.stringify({ comparisonItem, category: CATEGORIA, property: "" });
  const exploreUrl =
    `https://trends.google.com/trends/api/explore?hl=pt-PT&tz=-60&req=${encodeURIComponent(reqParam)}&token=`;

  const r1 = await fetch(exploreUrl, {
    headers: { "User-Agent": UA, "Accept": "application/json", "Accept-Language": "pt-PT,pt;q=0.9" },
  });
  if (!r1.ok) return { explore: r1.status, multiline: null, pontos: 0 };

  let widget: { token: string; request: Record<string, unknown> } | undefined;
  try {
    const d = JSON.parse(limpar(await r1.text())) as {
      widgets: Array<{ id: string; token: string; request: Record<string, unknown> }>;
    };
    widget = d.widgets?.find((w) => w.id === "TIMESERIES");
  } catch {
    return { explore: r1.status, multiline: null, pontos: 0, nota: "explore devolveu 200 mas não era JSON" };
  }
  if (!widget) return { explore: r1.status, multiline: null, pontos: 0, nota: "sem widget TIMESERIES" };

  const multilineUrl =
    `https://trends.google.com/trends/api/widgetdata/multiline?hl=pt-PT&tz=-60` +
    `&req=${encodeURIComponent(JSON.stringify(widget.request))}&token=${encodeURIComponent(widget.token)}`;
  const r2 = await fetch(multilineUrl, { headers: { "User-Agent": UA, "Accept": "application/json" } });
  if (!r2.ok) return { explore: r1.status, multiline: r2.status, pontos: 0 };

  try {
    const d = JSON.parse(limpar(await r2.text())) as { default: { timelineData: unknown[] } };
    return { explore: r1.status, multiline: r2.status, pontos: d.default.timelineData.length };
  } catch {
    return { explore: r1.status, multiline: r2.status, pontos: 0, nota: "multiline devolveu 200 mas não era JSON" };
  }
}

Deno.serve(async (req) => {
  const { inicio = 0, n = 4 } = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const resultados: unknown[] = [];
  const t0 = Date.now();

  for (let i = inicio; i < Math.min(inicio + n, GRUPOS.length); i++) {
    if (!(i === 0)) await new Promise((r) => setTimeout(r, PAUSA_MS));
    const r = await umPedido(GRUPOS[i]);
    resultados.push({ pedido: i + 1, termos: GRUPOS[i].length, ...r });
  }

  return new Response(
    JSON.stringify({
      de: inicio + 1,
      ate: Math.min(inicio + n, GRUPOS.length),
      total_grupos: GRUPOS.length,
      segundos: Math.round((Date.now() - t0) / 1000),
      resultados,
    }, null, 2),
    { headers: { "Content-Type": "application/json" } },
  );
});
