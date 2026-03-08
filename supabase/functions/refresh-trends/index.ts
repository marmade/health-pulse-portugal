import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Fetch all active keywords
    const { data: keywords, error: kwError } = await supabase
      .from("keywords")
      .select("*")
      .eq("is_active", true);

    if (kwError) throw kwError;
    if (!keywords || keywords.length === 0) {
      return new Response(
        JSON.stringify({ message: "No keywords found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date().toISOString().split("T")[0];
    const snapshotRows: any[] = [];

    // 2. Update each keyword with ±15% realistic variation
    for (const kw of keywords) {
      const variation = 1 + (Math.random() * 0.3 - 0.15); // ±15%
      const newVolume = Math.max(1, Math.round(kw.current_volume * variation));
      const newChange = +((
        ((newVolume - kw.previous_volume) / Math.max(1, kw.previous_volume)) *
        100
      ).toFixed(1));
      const newTrend =
        newChange > 10 ? "up" : newChange < -10 ? "down" : "stable";

      const { error: updateErr } = await supabase
        .from("keywords")
        .update({
          previous_volume: kw.current_volume,
          current_volume: newVolume,
          change_percent: newChange,
          trend: newTrend,
        })
        .eq("id", kw.id);

      if (updateErr) console.error("Update error for", kw.term, updateErr);

      // Prepare snapshot row
      snapshotRows.push({
        snapshot_date: today,
        axis: kw.axis,
        keyword: kw.term,
        search_index: newVolume,
        change_percent: newChange,
        is_emergent: kw.is_emergent,
      });
    }

    // 3. Save snapshots
    const { error: snapError } = await supabase
      .from("historical_snapshots")
      .insert(snapshotRows);

    if (snapError) console.error("Snapshot insert error:", snapError);

    // 4. Update last_refreshed setting
    const { error: settingsError } = await supabase
      .from("app_settings")
      .update({ value: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("key", "last_refreshed");

    if (settingsError) console.error("Settings update error:", settingsError);

    return new Response(
      JSON.stringify({
        message: `Refreshed ${keywords.length} keywords`,
        snapshots: snapshotRows.length,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in refresh-trends:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
