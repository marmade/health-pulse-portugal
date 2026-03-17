import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword } = await req.json();
    if (!keyword) throw new Error("keyword is required");

    const PERPLEXITY_KEY = Deno.env.get("VITE_PERPLEXITY_API_KEY");
    if (!PERPLEXITY_KEY) throw new Error("VITE_PERPLEXITY_API_KEY is not configured");

    const systemPrompt = `És especialista em comunicação de ciência e saúde pública em Portugal. Respondes sempre em português europeu de Portugal, nunca em português do Brasil — usa o vocabulário, ortografia e expressões de Portugal. Respondes APENAS com JSON válido, sem texto antes ou depois, sem markdown, sem backticks.`;

    const userPrompt = `Com base no tema emergente '${keyword}' esta semana em Portugal, gera em JSON:

{
  "perguntas_voxpop": [string, string, string],
  "especialista_sugerido": string,
  "justificacao": string,
  "fonte_cientifica": string,
  "fonte_url": string
}

As perguntas devem ser coloquiais e directas, estilo vox pop de rua, cada uma tocando num mito ou crença comum associada ao tema. O especialista deve ser um perfil de dupla (dois tipos de especialistas complementares). A justificação deve explicar porque esta dupla é indicada e citar uma fonte científica real (DGS, OMS, INSA, PubMed ou revista indexada).`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Perplexity error:", response.status, errText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try to extract JSON from potential markdown wrapper
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-diz-que-disse error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
