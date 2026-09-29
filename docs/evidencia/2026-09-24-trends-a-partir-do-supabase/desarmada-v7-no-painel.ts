// teste-429-trends — DESARMADA a 24/09/2026, depois do teste dos 33.
//
// Serviu duas perguntas, ambas respondidas:
//   1. O Google Trends bloqueia os servidores do Supabase? NÃO — desde que se faça o
//      aquecimento de cookie que o pytrends faz. Sem ele: 17/17 com 429. Com ele: 17/17 com 200.
//   2. Aguenta a corrida semanal INTEIRA, que são 33 pedidos e não 17?
//      SIM — 33/33 com 200, 262 pontos cada, 9 aquecimentos em 9 com cookie NID.
//
// O código das versões e os resultados estão em
// docs/evidencia/2026-09-24-trends-a-partir-do-supabase/.
//
// Não há ferramenta para apagar uma Edge Function pelo MCP, nem CLI nesta máquina, logo o
// que se pôde fazer foi esvaziá-la: já não fala com o Google, não lê nada, não escreve nada,
// e exige JWT. APAGAR no painel: Edge Functions → teste-429-trends → Delete.

Deno.serve(() =>
  new Response(
    JSON.stringify({
      estado: "desarmada a 24/09/2026, depois do teste dos 33",
      resultado: "33/33 pedidos com 200 e 262 pontos, a partir dos servidores do Supabase",
      registo: "docs/evidencia/2026-09-24-trends-a-partir-do-supabase/",
      apagar: "painel do Supabase → Edge Functions → teste-429-trends → Delete",
    }),
    { status: 410, headers: { "Content-Type": "application/json" } },
  )
);
