import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface FeedSource {
  url: string;
  fallbackUrls?: string[];
  outlet: string;
  type: 'media' | 'institucional' | 'factcheck';
}

// Estratégia de fallback: tenta URL principal; se 404/403, tenta fallbackUrls em sequência.
// Para adicionar novos outlets: basta acrescentar à lista.
const FEEDS: FeedSource[] = [
  // MEDIA GERAL
  { url: 'https://feeds.feedburner.com/PublicoRSS', fallbackUrls: ['https://www.publico.pt/rss'], outlet: 'Público', type: 'media' },
  { url: 'https://observador.pt/feed/', outlet: 'Observador', type: 'media' },
  { url: 'https://www.jn.pt/feed/', fallbackUrls: ['https://www.jn.pt/rss/'], outlet: 'Jornal de Notícias', type: 'media' },
  { url: 'https://www.dn.pt/stories.rss', fallbackUrls: ['https://www.dn.pt/feed/'], outlet: 'Diário de Notícias', type: 'media' },
  { url: 'https://expresso.pt/feed/', fallbackUrls: ['https://expresso.pt/rss'], outlet: 'Expresso', type: 'media' },
  { url: 'https://www.cmjornal.pt/feed/', fallbackUrls: ['https://www.cmjornal.pt/rss'], outlet: 'CM Jornal', type: 'media' },
  { url: 'https://www.rtp.pt/noticias/rss', fallbackUrls: ['https://www.rtp.pt/noticias/feed/'], outlet: 'RTP', type: 'media' },
  { url: 'https://www.tsf.pt/feed/', fallbackUrls: ['https://www.tsf.pt/rss'], outlet: 'TSF', type: 'media' },
  { url: 'https://sicnoticias.pt/feed/', fallbackUrls: ['https://sicnoticias.pt/rss'], outlet: 'SIC Notícias', type: 'media' },
  { url: 'https://rr.sapo.pt/feed/', outlet: 'Renascença', type: 'media' },
  { url: 'https://www.noticiasaominuto.com/feed', outlet: 'Notícias ao Minuto', type: 'media' },
  // MEDIA — SECÇÕES SAÚDE
  { url: 'https://www.publico.pt/rss/ciencia', outlet: 'Público — Ciência', type: 'media' },
  { url: 'https://observador.pt/tag/saude/feed/', outlet: 'Observador — Saúde', type: 'media' },
  { url: 'https://visao.pt/saude/feed/', fallbackUrls: ['https://visao.sapo.pt/saude/feed/'], outlet: 'Visão — Saúde', type: 'media' },
  { url: 'https://www.eco.pt/tag/saude/feed/', outlet: 'ECO — Saúde', type: 'media' },
  // INSTITUCIONAL
  { url: 'https://www.dgs.pt/paginas-de-sistema/rss.aspx', outlet: 'DGS', type: 'institucional' },
  { url: 'https://www.insa.min-saude.pt/feed/', fallbackUrls: ['https://www.insa.min-saude.pt/rss/'], outlet: 'INSA', type: 'institucional' },
  { url: 'https://www.sns.gov.pt/feed/', fallbackUrls: ['https://www.sns.gov.pt/rss/'], outlet: 'SNS', type: 'institucional' },
  { url: 'https://ordemdosmedicos.pt/feed/', outlet: 'Ordem dos Médicos', type: 'institucional' },
  { url: 'https://www.ordemenfermeiros.pt/feed/', outlet: 'Ordem dos Enfermeiros', type: 'institucional' },
  { url: 'https://www.spms.min-saude.pt/feed/', outlet: 'SPMS', type: 'institucional' },
  { url: 'https://www.ers.pt/feed/', outlet: 'ERS', type: 'institucional' },
  { url: 'https://saudemental.min-saude.pt/feed/', outlet: 'Coord. Nacional Saúde Mental', type: 'institucional' },
  // FACT-CHECKING
  { url: 'https://poligrafo.sapo.pt/feed/', fallbackUrls: ['https://poligrafo.sapo.pt/feed'], outlet: 'Polígrafo', type: 'factcheck' },
  { url: 'https://observador.pt/factchecks/feed/', outlet: 'Observador Fact Check', type: 'factcheck' },
];

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

// Tenta fetch com fallback automático de URLs.
// Usa vários User-Agent strings para contornar bloqueios de servidores institucionais.
async function fetchFeedWithFallback(feed: FeedSource): Promise<{ xml: string; usedUrl: string } | null> {
  const urlsToTry = [feed.url, ...(feed.fallbackUrls || [])];

  const userAgents = [
    'Mozilla/5.0 (compatible; HealthPulse/1.0; +https://github.com/marmade/health-pulse-portugal)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Feedfetcher-Google; (+http://www.google.com/feedfetcher.html)',
  ];

  for (const url of urlsToTry) {
    for (const ua of userAgents) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': ua,
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          },
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          const xml = await res.text();
          if (xml.includes('<item') || xml.includes('<entry')) {
            return { xml, usedUrl: url };
          }
        }
        // Se 200 mas sem conteúdo válido, não tenta outros UA para este URL
        if (res.status !== 403 && res.status !== 405) break;
      } catch (_) {
        break; // timeout ou erro de rede — passar ao próximo URL
      }
    }
  }
  return null;
}

function extractItems(xml: string): Array<{ title: string; link: string; pubDate: string; description: string }> {
  const items: Array<{ title: string; link: string; pubDate: string; description: string }> = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const getTag = (tag: string) => {
      const r = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\/${tag}>`, 'is');
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
    if (lower.includes(kw.toLowerCase())) return kw;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sb = getSupabaseAdmin();

    const { data: keywordRows, error: kwErr } = await sb
      .from('keywords')
      .select('term, synonyms')
      .eq('is_active', true);
    if (kwErr) throw kwErr;

    const allTerms: string[] = [];
    for (const kw of keywordRows || []) {
      allTerms.push(kw.term);
      if (kw.synonyms && Array.isArray(kw.synonyms)) allTerms.push(...kw.synonyms);
    }

    const { data: existingItems } = await sb.from('news_items').select('url');
    const existingUrls = new Set((existingItems || []).map((i: { url: string }) => i.url));

    let totalInserted = 0;
    let totalProcessed = 0;
    const errors: string[] = [];
    const fallbacksUsed: string[] = [];

    for (const feed of FEEDS) {
      try {
        const result = await fetchFeedWithFallback(feed);
        if (!result) {
          errors.push(`${feed.outlet}: sem feed válido encontrado`);
          continue;
        }
        const { xml, usedUrl } = result;
        if (usedUrl !== feed.url) fallbacksUsed.push(`${feed.outlet}: usou ${usedUrl}`);

        const items = extractItems(xml);
        totalProcessed += items.length;

        const toInsert: Array<{
          title: string; outlet: string; date: string;
          url: string; related_term: string; source_type: string;
        }> = [];

        for (const item of items) {
          if (!item.link || existingUrls.has(item.link)) continue;
          const searchText = `${item.title} ${item.description}`;
          const matchedTerm = matchesKeyword(searchText, allTerms);
          if (!matchedTerm) continue;

          let relatedTerm = matchedTerm;
          for (const kw of keywordRows || []) {
            if (kw.term.toLowerCase() === matchedTerm.toLowerCase()) { relatedTerm = kw.term; break; }
            if (kw.synonyms?.some((s: string) => s.toLowerCase() === matchedTerm.toLowerCase())) { relatedTerm = kw.term; break; }
          }

          let date: string;
          try {
            const d = new Date(item.pubDate);
            date = isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
          } catch { date = new Date().toISOString().split('T')[0]; }

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
          if (insertErr) errors.push(`${feed.outlet} insert: ${insertErr.message}`);
          else totalInserted += toInsert.length;
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
      fallbacks_used: fallbacksUsed.length > 0 ? fallbacksUsed : undefined,
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
