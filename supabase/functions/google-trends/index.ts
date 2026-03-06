import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TrendRequest {
  keywords: string[];
  geo?: string;
  timeRange?: string;
}

function parseGoogleTrendsResponse(text: string): unknown {
  const cleaned = text.replace(/^\)\]\}',?\n/, '');
  return JSON.parse(cleaned);
}

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

function buildCacheKey(keywords: string[], geo: string, timeRange: string): string {
  return `trends:${keywords.sort().join(',')}:${geo}:${timeRange}`;
}

async function getCached(cacheKey: string) {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from('trends_cache')
    .select('response_data, expires_at')
    .eq('cache_key', cacheKey)
    .single();

  if (data && new Date(data.expires_at) > new Date()) {
    return data.response_data;
  }
  return null;
}

async function setCache(cacheKey: string, responseData: unknown) {
  const sb = getSupabaseAdmin();
  await sb.from('trends_cache').upsert({
    cache_key: cacheKey,
    response_data: responseData,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }, { onConflict: 'cache_key' });
}

async function getInterestOverTime(keywords: string[], geo: string, timeRange: string) {
  const comparisonItem = keywords.map((kw) => ({
    keyword: kw,
    geo: geo.toUpperCase(),
    time: timeRange,
  }));

  const reqParam = JSON.stringify({ comparisonItem, category: 0, property: '' });
  const exploreUrl = `https://trends.google.com/trends/api/explore?hl=pt-PT&tz=-60&req=${encodeURIComponent(reqParam)}&token=`;

  const exploreRes = await fetch(exploreUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
    },
  });

  if (!exploreRes.ok) {
    throw new Error(`Google Trends explore failed: ${exploreRes.status}`);
  }

  const exploreText = await exploreRes.text();
  const exploreData = parseGoogleTrendsResponse(exploreText) as {
    widgets: Array<{ id: string; token: string; request: Record<string, unknown> }>;
  };

  const timeseriesWidget = exploreData.widgets?.find((w) => w.id === 'TIMESERIES');
  if (!timeseriesWidget) throw new Error('No TIMESERIES widget found');

  const req = JSON.stringify(timeseriesWidget.request);
  const multilineUrl = `https://trends.google.com/trends/api/widgetdata/multiline?hl=pt-PT&tz=-60&req=${encodeURIComponent(req)}&token=${encodeURIComponent(timeseriesWidget.token)}`;

  const multilineRes = await fetch(multilineUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
  });

  if (!multilineRes.ok) throw new Error(`Google Trends multiline failed: ${multilineRes.status}`);

  const multilineText = await multilineRes.text();
  const multilineData = parseGoogleTrendsResponse(multilineText) as {
    default: { timelineData: Array<{ time: string; formattedTime: string; value: number[]; formattedValue: string[] }> };
  };

  return multilineData.default.timelineData;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: TrendRequest = await req.json();
    const { keywords, geo = 'PT', timeRange = 'today 12-m' } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'keywords array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const limitedKeywords = keywords.slice(0, 5);
    const cacheKey = buildCacheKey(limitedKeywords, geo, timeRange);

    // Check cache first
    const cached = await getCached(cacheKey);
    if (cached) {
      console.log(`Cache HIT for: ${cacheKey}`);
      return new Response(JSON.stringify({ ...cached, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Cache MISS — fetching Google Trends for: ${limitedKeywords.join(', ')}`);

    const timelineData = await getInterestOverTime(limitedKeywords, geo, timeRange);

    const result = {
      success: true,
      data: {
        keywords: limitedKeywords,
        geo,
        timeRange,
        timeline: timelineData.map((point) => ({
          time: point.time,
          formattedTime: point.formattedTime,
          values: limitedKeywords.reduce((acc, kw, i) => {
            acc[kw] = point.value[i] ?? 0;
            return acc;
          }, {} as Record<string, number>),
        })),
      },
    };

    // Save to cache (don't await — fire and forget)
    setCache(cacheKey, result).catch((e) => console.warn('Cache write failed:', e));

    console.log(`Success: ${timelineData.length} data points — cached for 24h`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching Google Trends:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch trends';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
