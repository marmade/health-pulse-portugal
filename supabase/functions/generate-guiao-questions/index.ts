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
    const { tema, subtema, contexto } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `És um assistente especializado em comunicação de ciência e saúde pública em Portugal. Geras perguntas para vox pop — perguntas simples, directas, que testam a literacia em saúde de cidadãos comuns na rua. As perguntas não julgam nem acusam — apenas revelam o que as pessoas sabem ou não sabem. Respondes sempre em português europeu.`;

    let userPrompt = `Gera 5 perguntas de vox pop sobre ${subtema} no contexto de ${tema}, adequadas para abordar pessoas na rua em Portugal.`;
    if (contexto && contexto.trim()) {
      userPrompt += ` Contexto extra: ${contexto}`;
    }
    userPrompt += ` As perguntas devem testar literacia, não verificar factos.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_perguntas",
                description: "Return an array of vox pop questions.",
                parameters: {
                  type: "object",
                  properties: {
                    perguntas: {
                      type: "array",
                      items: { type: "string" },
                      description: "Array of questions in Portuguese",
                    },
                  },
                  required: ["perguntas"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_perguntas" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de pedidos excedido. Tenta novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adiciona créditos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "Erro na geração de perguntas." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let perguntas: string[] = [];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        perguntas = parsed.perguntas || [];
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    // Fallback: try to parse from content if tool call failed
    if (perguntas.length === 0) {
      const content = data.choices?.[0]?.message?.content || "";
      try {
        const match = content.match(/\{[\s\S]*"perguntas"[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          perguntas = parsed.perguntas || [];
        }
      } catch {
        // ignore
      }
    }

    return new Response(JSON.stringify({ perguntas }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-guiao-questions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
