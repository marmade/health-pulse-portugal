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
  { url: 'https://www.dn.pt/stories.rss', fallbackUrls: ['https://www.dn.pt/feed/'], outlet: 'Diário de Notícias', type: 'media' },
  { url: 'https://www.cmjornal.pt/rss', fallbackUrls: ['https://www.cmjornal.pt/rss/'], outlet: 'CM Jornal', type: 'media' },
  { url: 'https://www.rtp.pt/noticias/rss', fallbackUrls: ['https://www.rtp.pt/noticias/feed/'], outlet: 'RTP', type: 'media' },
  { url: 'https://sicnoticias.pt/rss', fallbackUrls: ['https://sicnoticias.pt/rss/'], outlet: 'SIC Notícias', type: 'media' },
  { url: 'https://www.noticiasaominuto.com/rss/ultima-hora', fallbackUrls: ['https://www.noticiasaominuto.com/rss'], outlet: 'Notícias ao Minuto', type: 'media' },
  // MEDIA — SECÇÕES SAÚDE
  { url: 'https://feeds.feedburner.com/PublicoRSS', outlet: 'Público — Ciência', type: 'media' },
  { url: 'https://observador.pt/seccao/saude/feed/', fallbackUrls: ['https://observador.pt/seccao/sociedade/saude/feed/'], outlet: 'Observador — Saúde', type: 'media' },
  { url: 'https://visao.pt/saude/feed/', fallbackUrls: ['https://visao.sapo.pt/saude/feed/'], outlet: 'Visão — Saúde', type: 'media' },
  { url: 'https://www.eco.pt/tag/saude/feed/', outlet: 'ECO — Saúde', type: 'media' },
  // INSTITUCIONAL
  { url: 'https://www.dgs.pt/paginas-de-sistema/rss.aspx', outlet: 'DGS', type: 'institucional' },
  { url: 'https://www.insa.min-saude.pt/feed/', fallbackUrls: ['https://www.insa.min-saude.pt/rss/'], outlet: 'INSA', type: 'institucional' },
  { url: 'https://www.sns.gov.pt/feed/', fallbackUrls: ['https://www.sns.gov.pt/rss/'], outlet: 'SNS', type: 'institucional' },
  { url: 'https://ordemdosmedicos.pt/feed/', outlet: 'Ordem dos Médicos', type: 'institucional' },
  { url: 'https://www.spms.min-saude.pt/feed/', outlet: 'SPMS', type: 'institucional' },
  { url: 'https://saudemental.min-saude.pt/feed/', outlet: 'Coord. Nacional Saúde Mental', type: 'institucional' },
  // NUTRIÇÃO E ALIMENTAÇÃO
  { url: 'https://nutrimento.pt/feed/', outlet: 'Nutrimento (PNPAS)', type: 'institucional' },
  { url: 'https://alimentacaosaudavel.dgs.pt/feed/', outlet: 'Alimentação Saudável (DGS)', type: 'institucional' },
  { url: 'https://eipas.pt/feed/', outlet: 'EIPAS — Promoção da Alimentação Saudável', type: 'institucional' },
  // SOCIEDADES CIENTÍFICAS
  { url: 'https://spreumatologia.pt/feed/', outlet: 'Sociedade Portuguesa de Reumatologia', type: 'institucional' },
  { url: 'https://spginecologia.pt/feed/', outlet: 'Sociedade Portuguesa de Ginecologia', type: 'institucional' },
  { url: 'https://sppneumologia.pt/feed/', outlet: 'SPPneumologia', type: 'institucional' },
  { url: 'https://splsportugal.pt/feed/', outlet: 'Sociedade Portuguesa de Literacia em Saúde', type: 'institucional' },
  { url: 'https://sppcv.org/feed/', outlet: 'Sociedade Portuguesa Patologia Coluna Vertebral', type: 'institucional' },
  { url: 'https://www.cnc.uc.pt/pt/feed/', outlet: 'Centro de Neurociências e Biologia Celular', type: 'institucional' },
  { url: 'https://spem.pt/feed/', outlet: 'Sociedade Portuguesa de Esclerose Múltipla', type: 'institucional' },
  { url: 'https://gimm.pt/feed/', outlet: 'GIMM Gulbenkian', type: 'institucional' },
  { url: 'https://spc.pt/feed/', outlet: 'Sociedade Portuguesa de Cardiologia', type: 'institucional' },
  { url: 'https://spsp.pt/feed/', outlet: 'Sociedade Portuguesa de Saúde Pública', type: 'institucional' },
  { url: 'https://spesf.pt/feed/', outlet: 'SP Enfermagem de Saúde Familiar', type: 'institucional' },
  { url: 'http://www.sppsm.org/feed/', outlet: 'SP Psiquiatria e Saúde Mental', type: 'institucional' },
  { url: 'http://www.spmi.pt/feed/', outlet: 'SP Medicina Interna', type: 'institucional' },
  { url: 'http://www.speo-obesidade.pt/feed/', outlet: 'SP Estudo da Obesidade', type: 'institucional' },
  { url: 'http://www.spavc.org/feed/', outlet: 'SP Acidente Vascular Cerebral', type: 'institucional' },
  { url: 'http://neuropediatria.pt/feed/', outlet: 'SP Neuropediatria', type: 'institucional' },
  // ONG E ASSOCIAÇÕES
  { url: 'https://apav.pt/feed/', outlet: 'APAV', type: 'institucional' },
  { url: 'https://cpsa.pt/feed/', outlet: 'Conselho Português para a Saúde e Ambiente', type: 'institucional' },
  // FARMACÊUTICA
  { url: 'https://www.bial.com/pt/feed/', outlet: 'Bial', type: 'institucional' },
  // DIVULGAÇÃO CIENTÍFICA
  { url: 'https://www.90segundosdeciencia.pt/feed/', outlet: '90 Segundos de Ciência', type: 'media' },
  // FACT-CHECKING
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
          // 200 OK mas sem itens RSS — tentar próximo URL (não ficar neste)
          break;
        }
        // 403/405 — tentar outro User-Agent; outros status — próximo URL
        if (res.status !== 403 && res.status !== 405) break;
      } catch (_) {
        // timeout ou erro de rede — tentar próximo URL (não desistir de tudo)
        break;
      }
    }
  }
  return null;
}

// Limpa o invólucro CDATA (em qualquer posição, com ou sem espaços à volta) e as
// entidades HTML mais comuns. Até 18/09/2026 o CDATA só era tirado quando colava
// exactamente à tag: 113 dos 310 títulos (Notícias ao Minuto) ficaram com "<![CDATA[".
function limpar(texto: string): string {
  return texto
    .replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .trim();
}

type Item = { title: string; link: string; pubDate: string; description: string; categories: string[] };

function extractItems(xml: string): Item[] {
  const items: Item[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const getTag = (tag: string) => {
      const m = content.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return m ? limpar(m[1]) : '';
    };
    const categories: string[] = [];
    const catRegex = /<category[^>]*>([\s\S]*?)<\/category>/gi;
    let c;
    while ((c = catRegex.exec(content)) !== null) categories.push(limpar(c[1]));
    items.push({
      title: getTag('title'),
      link: getTag('link') || getTag('guid'),
      pubDate: getTag('pubDate') || getTag('dc:date'),
      description: getTag('description'),
      categories,
    });
  }
  return items;
}

// Casamento por PALAVRA INTEIRA. Até 18/09/2026 era `includes()` sobre minúsculas:
// "candida" apanhava recandidatura (63 das 79 "candidíase" eram política e futebol),
// "POC" apanhava época, "SOP" apanhava Sophie, "PEA" apanhava pontapeados.
// Regras:
//   - fronteira de palavra com letras acentuadas (\p{L}), não \b, que ignora o ç e o ã;
//   - siglas (só maiúsculas, até 5 letras) casam com maiúsculas exactas — "SOP" não é "sop";
//   - entre vários termos que casem, ganha o MAIS LONGO (o mais específico), e em empate o
//     alfabético — critério escrito, em vez da ordem física da tabela (achado de 15/09).
function escapeRegex(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function isSigla(s: string): boolean { return /^[A-ZÀ-Ý]{2,5}$/.test(s); }

function matchesKeyword(text: string, keywords: string[]): string | null {
  const hits: string[] = [];
  for (const kw of keywords) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(kw)}(?![\\p{L}\\p{N}])`, isSigla(kw) ? 'u' : 'iu');
    if (re.test(text)) hits.push(kw);
  }
  if (hits.length === 0) return null;
  hits.sort((a, b) => b.length - a.length || a.localeCompare(b, 'pt'));
  return hits[0];
}

// Filtro por categoria do próprio feed — o que a Marta escolheu ("canais com tag saúde")
// e que nunca tinha sido implementado. Só se aplica quando o feed traz categorias; feeds
// sem categorias (institucionais, quase todos) passam directamente ao casamento por keyword.
const CATEGORIA_SAUDE = /sa[úu]de|health|medicin|vacin|doen[çc]a|hospital|\bsns\b|bem-estar|nutri|psic|ci[êe]ncia|epidem|farm[áa]c/i;
function passaCategoria(item: Item): boolean {
  if (item.categories.length === 0) return true;
  return item.categories.some((c) => CATEGORIA_SAUDE.test(c));
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sb = getSupabaseAdmin();

    const { data: keywordRows, error: kwErr } = await sb
      .from('keywords')
      .select('id, term, synonyms')
      .eq('is_active', true);
    if (kwErr) throw kwErr;

    // Map cada termo/sinónimo → { term (canónico), id }
    const termToKeyword = new Map<string, { term: string; id: string }>();
    const allTerms: string[] = [];
    for (const kw of keywordRows || []) {
      allTerms.push(kw.term);
      termToKeyword.set(kw.term.toLowerCase(), { term: kw.term, id: kw.id });
      if (kw.synonyms && Array.isArray(kw.synonyms)) {
        for (const syn of kw.synonyms) {
          allTerms.push(syn);
          termToKeyword.set(syn.toLowerCase(), { term: kw.term, id: kw.id });
        }
      }
    }

    const { data: existingItems } = await sb.from('news_items').select('url');
    const existingUrls = new Set((existingItems || []).map((i: { url: string }) => i.url));

    if (allTerms.length === 0) {
      console.warn('RSS fetch: keywords table is empty — no articles will match');
    }

    let totalInserted = 0;
    let totalProcessed = 0;
    let totalDuplicates = 0;
    let totalNoMatch = 0;
    let totalForaDaCategoria = 0;
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
          keyword_id: string | null; casou_por: string; categorias: string[];
        }> = [];

        for (const item of items) {
          if (!item.link || existingUrls.has(item.link)) { totalDuplicates++; continue; }
          if (!passaCategoria(item)) { totalForaDaCategoria++; continue; }
          const searchText = `${item.title} ${(item.description || '').substring(0, 200)}`;
          const matchedTerm = matchesKeyword(searchText, allTerms);
          if (!matchedTerm) { totalNoMatch++; continue; }

          const resolved = termToKeyword.get(matchedTerm.toLowerCase());
          const relatedTerm = resolved?.term ?? matchedTerm;
          const keywordId = resolved?.id ?? null;

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
            keyword_id: keywordId,
            casou_por: matchedTerm,          // o termo ou sinónimo que casou — para auditar
            categorias: item.categories,     // as categorias do feed — para auditar o filtro
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
      feeds: FEEDS.length,
      keywords: allTerms.length,
      processed: totalProcessed,
      fora_da_categoria: totalForaDaCategoria,
      duplicates: totalDuplicates,
      no_match: totalNoMatch,
      inserted: totalInserted,
      fallbacks_used: fallbacksUsed.length > 0 ? fallbacksUsed : undefined,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log(`RSS fetch complete: ${totalInserted} inserted, ${totalNoMatch} no keyword match, ${totalDuplicates} duplicates, from ${totalProcessed} processed (${allTerms.length} keywords)`);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('RSS fetch error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
