import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { axisData as mockAxisData, getFilteredAxisData as getMockFilteredData, type Keyword, type TrendPoint } from '@/data/mockData';

type AxisDataResult = Record<string, {
  label: string;
  keywords: Keyword[];
  allKeywords: Keyword[];
  trend: TrendPoint[];
}>;

// Per-keyword period multipliers
const kwPeriodMult: Record<string, Record<string, number>> = {
  burnout: { "7d": 1.5, "30d": 1.2, "12m": 1 },
  pânico: { "7d": 1.8, "30d": 1.3, "12m": 1 },
  "PTSD": { "7d": 0.6, "30d": 0.8, "12m": 1 },
  "solidão": { "7d": 0.5, "30d": 0.7, "12m": 1 },
  "TDAH adulto": { "7d": 1.4, "30d": 1.1, "12m": 1 },
  "terapia online": { "7d": 1.6, "30d": 1.3, "12m": 1 },
  "automutilação": { "7d": 1.3, "30d": 1.1, "12m": 1 },
  "jejum intermitente": { "7d": 1.7, "30d": 1.4, "12m": 1 },
  "alimentação plant-based": { "7d": 1.5, "30d": 1.2, "12m": 1 },
  "ultraprocessados": { "7d": 1.8, "30d": 1.3, "12m": 1 },
  "dieta cetogénica": { "7d": 1.6, "30d": 1.2, "12m": 1 },
  "menopausa precoce": { "7d": 1.4, "30d": 1.1, "12m": 1 },
  "libido menopausa": { "7d": 1.3, "30d": 1.1, "12m": 1 },
  "menopausa masculina": { "7d": 1.9, "30d": 1.3, "12m": 1 },
  "mpox portugal": { "7d": 2.0, "30d": 1.5, "12m": 1 },
  "dengue europa": { "7d": 2.2, "30d": 1.6, "12m": 1 },
  "vírus nipah": { "7d": 2.5, "30d": 1.4, "12m": 1 },
  "bactérias carnívoras": { "7d": 2.0, "30d": 1.5, "12m": 1 },
  "microplásticos sangue": { "7d": 1.6, "30d": 1.2, "12m": 1 },
  "sarampo surto": { "7d": 1.8, "30d": 1.3, "12m": 1 },
};

const axisLabels: Record<string, string> = {
  "saude-mental": "SAÚDE MENTAL",
  "alimentacao": "ALIMENTAÇÃO",
  "menopausa": "MENOPAUSA",
  "emergentes": "EMERGENTES",
};

const generateTrend = (base: number, variance: number, period: string = "12m"): TrendPoint[] => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentDayOfWeek = now.getDay();

  const configs: Record<string, { labels: string[]; count: number }> = {
    "7d": { labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"], count: 7 },
    "30d": { labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"], count: 4 },
    "12m": { labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"], count: 12 },
  };
  const config = configs[period] || configs["12m"];
  return config.labels.map((w, i) => {
    const previous = Math.round(base * 0.8 + (Math.random() - 0.5) * variance * 0.7);

    if (period === "12m" && i > currentMonth) {
      return { week: w, current: undefined as unknown as number, previous };
    }
    if (period === "7d") {
      const dayMap = [1, 2, 3, 4, 5, 6, 0];
      if (dayMap[i] > currentDayOfWeek && dayMap[i] !== 0) {
        return { week: w, current: undefined as unknown as number, previous };
      }
    }

    return {
      week: w,
      current: Math.round(base + (Math.random() - 0.3) * variance),
      previous,
    };
  });
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
        const { data: keywords, error: fetchError } = await supabase
          .from('keywords')
          .select('*')
          .eq('is_active', true);

        if (fetchError) throw fetchError;

        if (!keywords || keywords.length === 0) {
          // Fallback to mock data
          const mockData = getMockFilteredData(period, "pt");
          if (!cancelled) {
            setData(mockData);
            setIsFromDb(false);
          }
          return;
        }

        // Group keywords by axis
        const grouped: Record<string, Keyword[]> = {};
        for (const kw of keywords) {
          const mapped: Keyword = {
            term: kw.term,
            synonyms: kw.synonyms || [],
            category: kw.category,
            axis: kw.axis,
            source: kw.source,
            currentVolume: kw.current_volume,
            previousVolume: kw.previous_volume,
            changePercent: Number(kw.change_percent),
            trend: kw.trend as "up" | "down" | "stable",
            lastPeak: kw.last_peak || '',
            isEmergent: kw.is_emergent,
          };

          // Apply period multipliers
          const pm = kwPeriodMult[mapped.term]?.[period] ?? 1;

          mapped.currentVolume = Math.round(mapped.currentVolume * pm);
          mapped.changePercent = +(((mapped.currentVolume - mapped.previousVolume) / mapped.previousVolume) * 100).toFixed(1);
          mapped.trend = (pm > 1.2 ? "up" : pm < 0.8 ? "down" : mapped.trend) as "up" | "down" | "stable";

          if (!grouped[kw.axis]) grouped[kw.axis] = [];
          grouped[kw.axis].push(mapped);
        }

        // Build result
        const result: AxisDataResult = {};
        for (const [axisId, axisKeywords] of Object.entries(grouped)) {
          const sorted = [...axisKeywords].sort((a, b) => b.currentVolume - a.currentVolume);
          const top5 = sorted.slice(0, 5);
          const baseVol = Math.round(top5.reduce((s, k) => s + k.currentVolume, 0) / top5.length);

          result[axisId] = {
            label: axisLabels[axisId] || axisId.toUpperCase(),
            keywords: top5,
            allKeywords: sorted,
            trend: generateTrend(baseVol, baseVol * 0.4, period),
          };
        }

        if (!cancelled) {
          setData(result);
          setIsFromDb(true);
        }
      } catch (err) {
        console.error('Error fetching axis data:', err);
        // Fallback to mock data on error
        const mockData = getMockFilteredData(period, "pt");
        if (!cancelled) {
          setData(mockData);
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
        .select('*');
      
      if (debunking && debunking.length > 0) {
        setData(debunking.map(d => ({
          term: d.term,
          title: d.title,
          classification: d.classification,
          source: d.source,
          url: d.url,
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
      const { data: news } = await supabase
        .from('news_items')
        .select('*')
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
        // Use the most recent created_at as last fetch timestamp
        const latest = news.reduce((max, n) => n.created_at > max ? n.created_at : max, news[0].created_at);
        setLastFetchTimestamp(latest);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return { data, isLoading, lastFetchTimestamp };
}
