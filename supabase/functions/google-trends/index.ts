const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TrendRequest {
  keywords: string[];
  geo?: string;
  timeRange?: string; // e.g. "today 12-m", "today 3-m"
}

// Google Trends uses a ")]}'" prefix before JSON
function parseGoogleTrendsResponse(text: string): unknown {
  const cleaned = text.replace(/^\)\]\}',?\n/, '');
  return JSON.parse(cleaned);
}

async function getInterestOverTime(keywords: string[], geo: string, timeRange: string) {
  // Build the Google Trends explore URL to get tokens first
  const comparisonItem = keywords.map((kw) => ({
    keyword: kw,
    geo: geo.toUpperCase(),
    time: timeRange,
  }));

  const reqParam = JSON.stringify({
    comparisonItem,
    category: 0,
    property: '',
  });

  const exploreUrl = `https://trends.google.com/trends/api/explore?hl=pt-PT&tz=-60&req=${encodeURIComponent(reqParam)}&token=`;

  console.log('Fetching explore URL for tokens...');

  const exploreRes = await fetch(exploreUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
    },
  });

  if (!exploreRes.ok) {
    const body = await exploreRes.text();
    console.error('Explore request failed:', exploreRes.status, body);
    throw new Error(`Google Trends explore failed: ${exploreRes.status}`);
  }

  const exploreText = await exploreRes.text();
  const exploreData = parseGoogleTrendsResponse(exploreText) as {
    widgets: Array<{ id: string; token: string; request: Record<string, unknown> }>;
  };

  // Find the TIMESERIES widget
  const timeseriesWidget = exploreData.widgets?.find(
    (w) => w.id === 'TIMESERIES'
  );

  if (!timeseriesWidget) {
    console.error('No TIMESERIES widget found. Widgets:', exploreData.widgets?.map(w => w.id));
    throw new Error('Could not find timeseries data in Google Trends response');
  }

  // Now fetch the actual interest over time data
  const token = timeseriesWidget.token;
  const req = JSON.stringify(timeseriesWidget.request);

  const multilineUrl = `https://trends.google.com/trends/api/widgetdata/multiline?hl=pt-PT&tz=-60&req=${encodeURIComponent(req)}&token=${encodeURIComponent(token)}`;

  console.log('Fetching multiline data...');

  const multilineRes = await fetch(multilineUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
    },
  });

  if (!multilineRes.ok) {
    const body = await multilineRes.text();
    console.error('Multiline request failed:', multilineRes.status, body);
    throw new Error(`Google Trends multiline failed: ${multilineRes.status}`);
  }

  const multilineText = await multilineRes.text();
  const multilineData = parseGoogleTrendsResponse(multilineText) as {
    default: {
      timelineData: Array<{
        time: string;
        formattedTime: string;
        value: number[];
        formattedValue: string[];
      }>;
    };
  };

  return multilineData.default.timelineData;
}

async function getRelatedQueries(keyword: string, geo: string, timeRange: string) {
  const comparisonItem = [{
    keyword,
    geo: geo.toUpperCase(),
    time: timeRange,
  }];

  const reqParam = JSON.stringify({
    comparisonItem,
    category: 0,
    property: '',
  });

  const exploreUrl = `https://trends.google.com/trends/api/explore?hl=pt-PT&tz=-60&req=${encodeURIComponent(reqParam)}&token=`;

  const exploreRes = await fetch(exploreUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    },
  });

  if (!exploreRes.ok) {
    await exploreRes.text();
    throw new Error(`Google Trends explore failed: ${exploreRes.status}`);
  }

  const exploreText = await exploreRes.text();
  const exploreData = parseGoogleTrendsResponse(exploreText) as {
    widgets: Array<{ id: string; token: string; request: Record<string, unknown> }>;
  };

  const relatedWidget = exploreData.widgets?.find(
    (w) => w.id === 'RELATED_QUERIES'
  );

  if (!relatedWidget) {
    return { top: [], rising: [] };
  }

  const token = relatedWidget.token;
  const req = JSON.stringify(relatedWidget.request);

  const relatedUrl = `https://trends.google.com/trends/api/widgetdata/relatedsearches?hl=pt-PT&tz=-60&req=${encodeURIComponent(req)}&token=${encodeURIComponent(token)}`;

  const relatedRes = await fetch(relatedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    },
  });

  if (!relatedRes.ok) {
    await relatedRes.text();
    return { top: [], rising: [] };
  }

  const relatedText = await relatedRes.text();
  const relatedData = parseGoogleTrendsResponse(relatedText) as {
    default: {
      rankedList: Array<{
        rankedKeyword: Array<{
          query: string;
          value: number;
          formattedValue: string;
          link: string;
        }>;
      }>;
    };
  };

  const rankedList = relatedData.default?.rankedList || [];

  return {
    top: rankedList[0]?.rankedKeyword?.slice(0, 10) || [],
    rising: rankedList[1]?.rankedKeyword?.slice(0, 10) || [],
  };
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

    // Limit to 5 keywords (Google Trends max)
    const limitedKeywords = keywords.slice(0, 5);

    console.log(`Fetching Google Trends for: ${limitedKeywords.join(', ')} | geo: ${geo} | time: ${timeRange}`);

    // Fetch interest over time
    const timelineData = await getInterestOverTime(limitedKeywords, geo, timeRange);

    // Fetch related queries for each keyword (in parallel)
    const relatedPromises = limitedKeywords.map((kw) =>
      getRelatedQueries(kw, geo, timeRange).catch((e) => {
        console.warn(`Related queries failed for "${kw}":`, e.message);
        return { top: [], rising: [] };
      })
    );
    const relatedResults = await Promise.all(relatedPromises);

    const relatedQueries: Record<string, { top: unknown[]; rising: unknown[] }> = {};
    limitedKeywords.forEach((kw, i) => {
      relatedQueries[kw] = relatedResults[i];
    });

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
        relatedQueries,
      },
    };

    console.log(`Success: ${timelineData.length} data points returned`);

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
