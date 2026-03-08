import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface FeedSource {
  url: string;
  outlet: string;
  type: 'media' | 'institucional' | 'factcheck';
}

const FEEDS: FeedSource[] = [
  // MEDIA
  { url: 'https://feeds.feedburner.com/PublicoRSS', outlet: 'Público', type: 'media' },
  { url: 'https://observador.pt/feed/', outlet: 'Observador', type: 'media' },
  { url: 'https://www.jn.pt/rss/', outlet: 'Jornal de Notícias', type: 'media' },
  { url: 'https://www.dn.pt/rss/', outlet: 'Diário de Notícias', type: 'media' },
  { url: 'https://expresso.pt/rss', outlet: 'Expresso', type: 'media' },
  { url: 'https://www.cmjornal.pt/rss', outlet: 'CM Jornal', type: 'media' },
  { url: 'https://www.rtp.pt/noticias/rss', outlet: 'RTP', type: 'media' },
  { url: 'https://www.tsf.pt/rss', outlet: 'TSF', type: 'media' },
  { url: 'https://sicnoticias.pt/rss', outlet: 'SIC Notícias', type: 'media' },
  // INSTITUCIONAL
  { url: 'https://www.dgs.pt/paginas-de-sistema/rss.aspx', outlet: 'DGS', type: 'institucional' },
  { url: 'https://ordemdosmedicos.pt/feed/', outlet: 'Ordem dos Médicos', type: 'institucional' },
  // FACT-CHECKING
  { url: 'https://poligrafo.sapo.pt/feed', outlet: 'Polígrafo', type: 'factcheck' },
  { url: 'https://observador.pt/factchecks/feed/', outlet: 'Observador Fact Check', type: 'factcheck' },
];

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

function extractItems(xml: string): Array<{ title: string; link: string; pubDate: string; description: string }> {
  const items: Array<{ title: string; link: string; pubDate: string; description: string }> = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const getTag = (tag: string) => {
      const r = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 'is');
      const m = content.match(r);
      return m ? m[1].trim() : '';
    };
    items.push({
      title: getTag('title'),
      link: getTag('link') || getTag('guid'),
      pubDate: getTag('pubDate') || getTag('dc:date'),
      description: getTag('description'),
    });
  }
  return items;
}

function matchesKeyword(text: string, keywords: string[]): string | null {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) {
      return kw;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sb = getSupabaseAdmin();

    // 1. Get all keywords from database
    const { data: keywordRows, error: kwErr } = await sb
      .from('keywords')
      .select('term, synonyms')
      .eq('is_active', true);

    if (kwErr) throw kwErr;

    const allTerms: string[] = [];
    for (const kw of keywordRows || []) {
      allTerms.push(kw.term);
      if (kw.synonyms && Array.isArray(kw.synonyms)) {
        allTerms.push(...kw.synonyms);
      }
    }

    // 2. Get existing URLs to avoid duplicates
    const { data: existingItems } = await sb
      .from('news_items')
      .select('url');
    const existingUrls = new Set((existingItems || []).map((i: { url: string }) => i.url));

    let totalInserted = 0;
    let totalProcessed = 0;
    const errors: string[] = [];

    // 3. Fetch each feed
    for (const feed of FEEDS) {
      try {
        const res = await fetch(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; HealthPulse/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
          errors.push(`${feed.outlet}: HTTP ${res.status}`);
          continue;
        }

        const xml = await res.text();
        const items = extractItems(xml);
        totalProcessed += items.length;

        const toInsert: Array<{
          title: string;
          outlet: string;
          date: string;
          url: string;
          related_term: string;
          source_type: string;
        }> = [];

        for (const item of items) {
          if (!item.link || existingUrls.has(item.link)) continue;

          const searchText = `${item.title} ${item.description}`;
          const matchedTerm = matchesKeyword(searchText, allTerms);
          if (!matchedTerm) continue;

          // Find the parent keyword term for the matched synonym
          let relatedTerm = matchedTerm;
          for (const kw of keywordRows || []) {
            if (kw.term.toLowerCase() === matchedTerm.toLowerCase()) {
              relatedTerm = kw.term;
              break;
            }
            if (kw.synonyms?.some((s: string) => s.toLowerCase() === matchedTerm.toLowerCase())) {
              relatedTerm = kw.term;
              break;
            }
          }

          let date: string;
          try {
            const d = new Date(item.pubDate);
            date = isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
          } catch {
            date = new Date().toISOString().split('T')[0];
          }

          toInsert.push({
            title: item.title.substring(0, 500),
            outlet: feed.outlet,
            date,
            url: item.link,
            related_term: relatedTerm,
            source_type: feed.type,
          });

          existingUrls.add(item.link);
        }

        if (toInsert.length > 0) {
          const { error: insertErr } = await sb.from('news_items').insert(toInsert);
          if (insertErr) {
            errors.push(`${feed.outlet} insert: ${insertErr.message}`);
          } else {
            totalInserted += toInsert.length;
          }
        }
      } catch (feedErr) {
        errors.push(`${feed.outlet}: ${feedErr instanceof Error ? feedErr.message : 'unknown error'}`);
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      processed: totalProcessed,
      inserted: totalInserted,
      feeds: FEEDS.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log(`RSS fetch complete: ${totalInserted} new items from ${totalProcessed} processed`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('RSS fetch error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
