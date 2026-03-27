import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TEMAS = [
  { value: "saude-mental", label: "SAÚDE MENTAL", db: "saude_mental" },
  { value: "alimentacao", label: "ALIMENTAÇÃO", db: "alimentacao" },
  { value: "menopausa", label: "MENOPAUSA", db: "menopausa" },
  { value: "emergentes", label: "EMERGENTES", db: "emergentes" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Calculate current week (Monday)
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const semanaStr = monday.toISOString().split("T")[0];

    // Fetch active keywords
    const { data: keywords } = await supabase
      .from("keywords")
      .select("term, axis, current_volume, change_percent")
      .eq("is_active", true);

    if (!keywords || keywords.length === 0) {
      return new Response(
        JSON.stringify({ message: "No keywords found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: string[] = [];

    for (const tema of TEMAS) {
      // Check if already generated this week
      const { data: existing } = await supabase
        .from("guioes_semanais")
        .select("id")
        .eq("semana", semanaStr)
        .eq("tema", tema.value)
        .maybeSingle();

      if (existing) {
        results.push(`${tema.value}: already generated`);
        continue;
      }

      // Get top keywords for this tema
      const temaKeywords = keywords
        .filter((k: any) => k.axis === tema.value)
        .sort((a: any, b: any) => b.change_percent - a.change_percent)
        .slice(0, 10);

      // Fetch 5 banco base questions
      const { data: bancoData } = await supabase
        .from("guioes")
        .select("pergunta, resposta, referencia_cientifica, referencia_url")
        .ilike("tema", tema.db)
        .limit(50);

      const shuffled = (bancoData || [])
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      const bancoPerguntas = shuffled.map((r: any) => ({
        pergunta: r.pergunta || "",
        resposta_simples: r.resposta || "",
        contexto_cientifico: "",
        referencia_nome: r.referencia_cientifica || "",
        referencia_url: r.referencia_url || "",
        source: "banco",
      }));

      // Generate 5 AI questions via the existing edge function
      try {
        const { data: aiData, error: aiError } = await supabase.functions.invoke(
          "generate-guiao-questions",
          { body: { tema: tema.label, keywords: temaKeywords } }
        );

        const aiPerguntas = aiError ? [] : (aiData?.perguntas || []).slice(0, 5).map((p: any) => ({
          ...p,
          source: "ia",
        }));

        const allPerguntas = [...bancoPerguntas, ...aiPerguntas];

        // Save to guioes_semanais
        const { error: insertErr } = await supabase
          .from("guioes_semanais")
          .insert({
            semana: semanaStr,
            tema: tema.value,
            perguntas: allPerguntas,
            estado: "gerado",
            gerado_por_ia: true,
          });

        if (insertErr) {
          results.push(`${tema.value}: ERROR — ${insertErr.message}`);
        } else {
          results.push(`${tema.value}: ${bancoPerguntas.length} banco + ${aiPerguntas.length} IA`);
        }
      } catch (e) {
        results.push(`${tema.value}: AI ERROR — ${e instanceof Error ? e.message : "unknown"}`);
        // Save banco-only version
        await supabase.from("guioes_semanais").insert({
          semana: semanaStr,
          tema: tema.value,
          perguntas: bancoPerguntas,
          estado: "parcial",
          gerado_por_ia: false,
        });
      }
    }

    return new Response(
      JSON.stringify({
        semana: semanaStr,
        results,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-guioes-weekly error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
