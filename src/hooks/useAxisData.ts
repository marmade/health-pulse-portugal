import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Keyword, TrendPoint } from '@/data/mockData';
import { buildAxisTrend } from '@/lib/buildTrend';

type AxisDataResult = Record<string, {
  label: string;
  keywords: Keyword[];
  allKeywords: Keyword[];
  trend: TrendPoint[];
}>;

const axisLabels: Record<string, string> = {
  "saude-mental": "SAÚDE MENTAL",
  "alimentacao": "ALIMENTAÇÃO",
  "menopausa": "MENOPAUSA",
  "emergentes": "EMERGENTES",
};

export function useAxisData(period: string) {
  const [data, setData] = useState<AxisDataResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromDb, setIsFromDb] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch keywords and historical snapshots in parallel
        const [kwResult, snapResult] = await Promise.all([
          supabase.from('keywords').select('*').eq('is_active', true),
          supabase.from('historical_snapshots').select('*').order('snapshot_date', { ascending: true }),
        ]);

        if (kwResult.error) throw kwResult.error;

        const keywords = kwResult.data;
        const snapshots = snapResult.data || [];

        if (!keywords || keywords.length === 0) {
          if (!cancelled) {
            setData(null);
            setIsFromDb(false);
          }
          return;
        }

        // Compute period-specific volumes from historical snapshots
        const now = new Date();
        let currentCutoff: Date;
        let previousCutoff: Date;

        if (period === "7d") {
          currentCutoff = new Date(now);
          currentCutoff.setDate(currentCutoff.getDate() - 7);
          previousCutoff = new Date(currentCutoff);
          previousCutoff.setDate(previousCutoff.getDate() - 7);
        } else if (period === "30d") {
          currentCutoff = new Date(now);
          currentCutoff.setDate(currentCutoff.getDate() - 30);
          previousCutoff = new Date(currentCutoff);
          previousCutoff.setDate(previousCutoff.getDate() - 30);
        } else {
          // 12m — use last 12 months vs previous 12 months
          currentCutoff = new Date(now);
          currentCutoff.setFullYear(currentCutoff.getFullYear() - 1);
          previousCutoff = new Date(currentCutoff);
          previousCutoff.setFullYear(previousCutoff.getFullYear() - 1);
        }

        // Build per-keyword volume averages for the selected period
        const kwSnapMap: Record<string, { current: number[]; previous: number[] }> = {};
        for (const s of snapshots) {
          const d = new Date(s.snapshot_date);
          if (!kwSnapMap[s.keyword]) kwSnapMap[s.keyword] = { current: [], previous: [] };
          if (d >= currentCutoff) {
            kwSnapMap[s.keyword].current.push(s.search_index);
          } else if (d >= previousCutoff && d < currentCutoff) {
            kwSnapMap[s.keyword].previous.push(s.search_index);
          }
        }

        const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

        // Group keywords by axis with period-specific volumes
        const grouped: Record<string, Keyword[]> = {};
        for (const kw of keywords) {
          const snaps = kwSnapMap[kw.term];
          const hasCurrent = snaps && snaps.current.length > 0;
          const hasPrevious = snaps && snaps.previous.length > 0;

          // Only use snapshot-derived values when BOTH periods have data.
          // If either is missing, use DB values consistently (both from same source).
          let currentVolume: number;
          let previousVolume: number;
          let changePercent: number;

          if (hasCurrent && hasPrevious) {
            // Best case: real comparison within the selected period
            currentVolume = avg(snaps.current);
            previousVolume = avg(snaps.previous);
            changePercent = previousVolume > 0
              ? +((currentVolume - previousVolume) / previousVolume * 100).toFixed(1)
              : 0;
          } else {
            // Insufficient snapshots for this period — use DB values
            // (calculated from 4-week Google Trends window, consistent pair)
            currentVolume = kw.current_volume;
            previousVolume = kw.previous_volume;
            changePercent = Number(kw.change_percent) || 0;
          }

          const trend = changePercent > 10 ? "up" : changePercent < -10 ? "down" : "stable";
          const isEmergent = changePercent >= 50 && currentVolume >= 10;

          const mapped: Keyword = {
            term: kw.term,
            synonyms: kw.synonyms || [],
            category: kw.category,
            axis: kw.axis,
            source: kw.source,
            currentVolume,
            previousVolume,
            changePercent,
            trend: trend as "up" | "down" | "stable",
            lastPeak: kw.last_peak || '',
            isEmergent,
          };

          if (!grouped[kw.axis]) grouped[kw.axis] = [];
          grouped[kw.axis].push(mapped);
        }

        // Build result with real historical trends
        const result: AxisDataResult = {};
        for (const [axisId, axisKeywords] of Object.entries(grouped)) {
          const sorted = [...axisKeywords].sort((a, b) => b.currentVolume - a.currentVolume);
          const top5 = sorted.slice(0, 5);

          result[axisId] = {
            label: axisLabels[axisId] || axisId.toUpperCase(),
            keywords: top5,
            allKeywords: sorted,
            trend: buildAxisTrend(snapshots, axisId, period),
          };
        }

        if (!cancelled) {
          setData(result);
          setIsFromDb(true);
        }
      } catch (err) {
        console.error('Error fetching axis data:', err);
        if (!cancelled) {
          setData(null);
          setIsFromDb(false);
          setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [period]);

  return { data, isLoading, error, isFromDb };
}

export function useDebunkingData() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: debunking } = await supabase
        .from('debunking')
        .select('*')
        .order('created_at', { ascending: false });

      if (debunking && debunking.length > 0) {
        setData(debunking.map(d => ({
          term: d.term,
          title: d.title,
          classification: d.classification,
          source: d.source,
          url: d.url,
          dataPublicacao: d.data_publicacao || null,
        })));
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return { data, isLoading };
}

export function useNewsData() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Limitar a 12 meses para evitar carregar toda a tabela
      const newsCutoff = new Date();
      newsCutoff.setFullYear(newsCutoff.getFullYear() - 1);
      const { data: news } = await supabase
        .from('news_items')
        .select('*')
        .gte('date', newsCutoff.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (news && news.length > 0) {
        setData(news.map(n => ({
          title: n.title,
          outlet: n.outlet,
          date: n.date,
          url: n.url,
          relatedTerm: n.related_term,
          sourceType: (n as any).source_type || 'media',
        })));
        const latest = news.reduce((max, n) => n.created_at > max ? n.created_at : max, news[0].created_at);
        setLastFetchTimestamp(latest);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return { data, isLoading, lastFetchTimestamp };
}
