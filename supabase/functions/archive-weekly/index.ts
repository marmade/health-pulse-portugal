import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const axisLabels: Record<string, string> = {
  "saude-mental": "Saude Mental",
  alimentacao: "Alimentacao",
  menopausa: "Menopausa",
  emergentes: "Emergentes",
};

function getPreviousWeek() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) - 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
  return {
    isoStart: monday.toISOString().split("T")[0],
    isoEnd: sunday.toISOString().split("T")[0],
    label: `${fmt(monday)} — ${fmt(sunday)} ${monday.getFullYear()}`,
    shortLabel: `${fmt(monday)} — ${fmt(sunday)}`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const prev = getPreviousWeek();
    const results: string[] = [];

    // ── 1. Fetch all data needed for archives ────────────────────────────

    const [kwRes, questionsRes, debunkingRes, newsRes, youtubeRes] =
      await Promise.all([
        supabase
          .from("keywords")
          .select("*")
          .eq("is_active", true),
        supabase
          .from("health_questions")
          .select("*")
          .order("growth_percent", { ascending: false }),
        supabase
          .from("debunking")
          .select("*"),
        supabase
          .from("news_items")
          .select("*")
          .order("date", { ascending: false }),
        supabase
          .from("youtube_trends")
          .select("*")
          .order("views", { ascending: false }),
      ]);

    const keywords = kwRes.data || [];
    const questions = questionsRes.data || [];
    const debunking = debunkingRes.data || [];
    const news = newsRes.data || [];
    const youtube = youtubeRes.data || [];

    // ── 2. Archive per-axis data (eixos_archive) ─────────────────────────

    const axes = ["saude-mental", "alimentacao", "menopausa", "emergentes"];

    for (const axis of axes) {
      // Check if already archived
      const { data: existing } = await supabase
        .from("eixos_archive")
        .select("id")
        .eq("axis", axis)
        .eq("week_start", prev.isoStart)
        .maybeSingle();

      if (existing) {
        results.push(`eixos/${axis}: already archived`);
        continue;
      }

      const axisKeywords = keywords
        .filter((k: any) => k.axis === axis)
        .sort(
          (a: any, b: any) => b.change_percent - a.change_percent
        );

      const axisTerms = new Set(
        axisKeywords.map((k: any) => (k.term as string).toLowerCase())
      );

      const topKeywords = axisKeywords.slice(0, 5).map((k: any) => ({
        term: k.term,
        change_percent: k.change_percent,
        current_volume: k.current_volume,
      }));

      const topQuestions = questions
        .filter((q: any) => q.axis === axis)
        .slice(0, 5)
        .map((q: any) => ({
          question: q.question,
          growth_percent: q.growth_percent,
        }));

      const topDebunking = debunking
        .filter((d: any) => axisTerms.has((d.term || "").toLowerCase()))
        .slice(0, 3)
        .map((d: any) => ({
          term: d.term,
          title: d.title,
          classification: d.classification,
        }));

      const topNews = news
        .filter((n: any) =>
          axisTerms.has((n.related_term || "").toLowerCase())
        )
        .slice(0, 3)
        .map((n: any) => ({
          title: n.title,
          outlet: n.outlet,
          date: n.date,
          source_type: n.source_type,
        }));

      const topYoutube = youtube
        .filter((v: any) => v.eixo === axis)
        .slice(0, 5)
        .map((v: any) => ({
          titulo: v.titulo,
          canal: v.canal,
          views: v.views,
          url: v.url,
        }));

      const { error: insertErr } = await supabase
        .from("eixos_archive")
        .insert({
          axis,
          axis_label: axisLabels[axis] || axis,
          week_start: prev.isoStart,
          week_end: prev.isoEnd,
          week_label: prev.label,
          top_keywords: topKeywords,
          top_questions: topQuestions,
          top_debunking: topDebunking,
          top_news: topNews,
          top_youtube: topYoutube,
        });

      if (insertErr) {
        console.error(`eixos/${axis} insert error:`, insertErr);
        results.push(`eixos/${axis}: ERROR — ${insertErr.message}`);
      } else {
        results.push(`eixos/${axis}: archived`);
      }
    }

    // ── 3. Archive briefing data (briefings_archive) ─────────────────────

    const { data: briefingExists } = await supabase
      .from("briefings_archive")
      .select("id")
      .eq("week_start", prev.isoStart)
      .maybeSingle();

    if (briefingExists) {
      results.push("briefing: already archived");
    } else {
      const emergent = keywords
        .filter((k: any) => k.is_emergent)
        .sort((a: any, b: any) => b.change_percent - a.change_percent);

      const { error: briefingErr } = await supabase
        .from("briefings_archive")
        .insert({
          week_start: prev.isoStart,
          week_end: prev.isoEnd,
          week_label: prev.shortLabel,
          top_emerging: emergent.slice(0, 5).map((k: any) => ({
            term: k.term,
            axis: k.axis,
            change_percent: k.change_percent,
          })),
          top_questions: questions.slice(0, 5).map((q: any) => ({
            term: q.question,
            current_volume: q.relative_volume,
          })),
          top_debunking: debunking.slice(0, 5).map((d: any) => ({
            term: d.term,
            title: d.title,
            classification: d.classification,
            source: d.source,
          })),
          top_news: news.slice(0, 5).map((n: any) => ({
            title: n.title,
            outlet: n.outlet,
            date: n.date,
            source_type: n.source_type,
          })),
        });

      if (briefingErr) {
        console.error("briefing insert error:", briefingErr);
        results.push(`briefing: ERROR — ${briefingErr.message}`);
      } else {
        results.push("briefing: archived");
      }
    }

    // ── Done ─────────────────────────────────────────────────────────────

    return new Response(
      JSON.stringify({
        week: prev.label,
        results,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in archive-weekly:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
