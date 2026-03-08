import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fallbacks per tema when INSA returns nothing
const FALLBACKS: Record<string, { nome: string; url: string }> = {
  "SAÚDE MENTAL": { nome: "DGS", url: "https://www.dgs.pt/saude-mental.aspx" },
  "ALIMENTAÇÃO": { nome: "INSA", url: "https://www.insa.min-saude.pt" },
  "MENOPAUSA": { nome: "OMS", url: "https://www.who.int/news-room/fact-sheets/detail/menopause" },
  "EMERGENTES": { nome: "ECDC", url: "https://www.ecdc.europa.eu" },
};

async function searchInsa(keyword: string): Promise<{ nome: string; url: string } | null> {
  try {
    const query = encodeURIComponent(keyword);
    const apiUrl = `https://repositorio.insa.pt/server/api/discover/search/objects?query=${query}&size=1&f.access_status=open.access,equals&f.language=por,equals`;
    console.log("INSA search:", apiUrl);
    const resp = await fetch(apiUrl, { signal: AbortSignal.timeout(6000) });
    if (!resp.ok) {
      console.log("INSA API returned", resp.status);
      return null;
    }
    const data = await resp.json();
    const objects = data?._embedded?.searchResult?._embedded?.objects;
    if (!Array.isArray(objects) || objects.length === 0) {
      console.log("INSA: no results for", keyword);
      return null;
    }
    const item = objects[0]?._embedded?.indexableObject;
    if (!item) return null;

    const handle = item.handle;
    const name = item.name || item.metadata?.["dc.title"]?.[0]?.value || "Artigo INSA";
    const truncatedName = name.length > 60 ? name.substring(0, 57) + "..." : name;

    if (handle) {
      return {
        nome: `INSA — ${truncatedName}`,
        url: `https://repositorio.insa.pt/handle/${handle}`,
      };
    }
    if (item.id) {
      return {
        nome: `INSA — ${truncatedName}`,
        url: `https://repositorio.insa.pt/items/${item.id}`,
      };
    }
    return null;
  } catch (e) {
    console.error("INSA lookup error:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tema, keywords } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const keywordList = (keywords || [])
      .map((k: any) => `${k.term} (volume: ${k.current_volume}, crescimento: ${k.change_percent}%)`)
      .join(", ");

    const systemPrompt = `És especialista em comunicação de ciência e saúde pública em Portugal. Respondes APENAS com JSON válido, sem texto antes ou depois, sem markdown, sem backticks.`;

    const userPrompt = `Gera exactamente 10 perguntas de vox pop sobre ${tema} para o programa Diz que Disse. Vamos para as ruas perguntar a cidadãos comuns. As perguntas testam literacia em saúde — revelam o que as pessoas sabem ou não sabem, sem julgar comportamentos.
São directas, concretas, em português europeu.

As keywords mais pesquisadas esta semana em Portugal para este tema são: ${keywordList}.
Inspira-te nessas keywords para gerar perguntas relevantes e actuais.

Cada pergunta deve ter resposta_simples obrigatoriamente preenchida em 1-2 frases claras. Nunca deixar vazio.

Responde APENAS com este JSON:
[{
  "pergunta": "texto",
  "resposta_simples": "1-2 frases em português europeu",
  "keyword_pesquisa": "1-2 palavras para pesquisar no repositório INSA"
}]`;

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
    const content = data.choices?.[0]?.message?.content || "";
    console.log("AI raw response:", content.substring(0, 500));

    let rawPerguntas: any[] = [];

    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        rawPerguntas = parsed;
      } else if (parsed.perguntas && Array.isArray(parsed.perguntas)) {
        rawPerguntas = parsed.perguntas;
      }
    } catch {
      try {
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          rawPerguntas = JSON.parse(match[0]);
        }
      } catch {
        console.error("Failed to parse AI response as JSON");
      }
    }

    // Filter valid items
    rawPerguntas = rawPerguntas.filter(
      (p: any) => p && typeof p === "object" && p.pergunta
    );

    const fallback = FALLBACKS[tema] || { nome: "OMS", url: "https://www.who.int" };

    // Enrich each question with INSA lookup in parallel
    const perguntas = await Promise.all(
      rawPerguntas.map(async (p: any) => {
        const kw = String(p.keyword_pesquisa || p.pergunta || "").trim();
        const insaResult = await searchInsa(kw);

        return {
          pergunta: String(p.pergunta || ""),
          resposta_simples: String(
            p.resposta_simples || p.reposta_simples || "Consulte a fonte indicada para mais informações."
          ),
          referencia_nome: insaResult ? insaResult.nome : fallback.nome,
          referencia_url: insaResult ? insaResult.url : fallback.url,
        };
      })
    );

    console.log(`Generated ${perguntas.length} questions, enriched with INSA data`);

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
