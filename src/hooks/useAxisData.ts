import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { axisData as mockAxisData, getFilteredAxisData as getMockFilteredData, type Keyword, type TrendPoint } from '@/data/mockData';

type AxisDataResult = Record<string, {
  label: string;
  keywords: Keyword[];
  allKeywords: Keyword[];
  trend: TrendPoint[];
}>;

// Per-keyword region multipliers
const kwRegionMult: Record<string, Record<string, number>> = {
  ansiedade: { pt: 1, norte: 0.8, centro: 0.7, lisboa: 1.3, sul: 0.6 },
  depressão: { pt: 1, norte: 0.9, centro: 0.85, lisboa: 1.1, sul: 0.75 },
  burnout: { pt: 1, norte: 0.6, centro: 0.5, lisboa: 1.4, sul: 0.55 },
  insónia: { pt: 1, norte: 1.1, centro: 1.0, lisboa: 0.9, sul: 1.2 },
  pânico: { pt: 1, norte: 0.7, centro: 0.65, lisboa: 1.2, sul: 0.6 },
  "PTSD": { pt: 1, norte: 0.5, centro: 0.4, lisboa: 1.5, sul: 0.45 },
  "automutilação": { pt: 1, norte: 1.1, centro: 0.9, lisboa: 1.0, sul: 0.8 },
  "solidão": { pt: 1, norte: 1.2, centro: 1.3, lisboa: 0.7, sul: 1.4 },
  "TDAH adulto": { pt: 1, norte: 0.6, centro: 0.5, lisboa: 1.6, sul: 0.4 },
  "terapia online": { pt: 1, norte: 0.9, centro: 0.8, lisboa: 1.3, sul: 0.7 },
  "dieta mediterrânica": { pt: 1, norte: 0.9, centro: 1.0, lisboa: 0.85, sul: 1.3 },
  "jejum intermitente": { pt: 1, norte: 0.7, centro: 0.6, lisboa: 1.4, sul: 0.65 },
  "intolerância ao glúten": { pt: 1, norte: 0.8, centro: 0.9, lisboa: 1.1, sul: 0.85 },
  "obesidade infantil": { pt: 1, norte: 1.1, centro: 1.0, lisboa: 0.9, sul: 1.05 },
  "suplementos alimentares": { pt: 1, norte: 0.75, centro: 0.7, lisboa: 1.3, sul: 0.6 },
  "alimentação plant-based": { pt: 1, norte: 0.5, centro: 0.45, lisboa: 1.6, sul: 0.5 },
  "açúcar e saúde": { pt: 1, norte: 1.0, centro: 1.1, lisboa: 0.9, sul: 1.15 },
  "alergias alimentares": { pt: 1, norte: 1.1, centro: 1.05, lisboa: 0.95, sul: 0.9 },
  "ultraprocessados": { pt: 1, norte: 0.6, centro: 0.55, lisboa: 1.5, sul: 0.5 },
  "dieta cetogénica": { pt: 1, norte: 0.65, centro: 0.6, lisboa: 1.4, sul: 0.55 },
  "menopausa sintomas": { pt: 1, norte: 0.9, centro: 1.0, lisboa: 1.1, sul: 0.85 },
  "terapia hormonal": { pt: 1, norte: 0.7, centro: 0.75, lisboa: 1.3, sul: 0.65 },
  "osteoporose": { pt: 1, norte: 1.1, centro: 1.15, lisboa: 0.85, sul: 1.2 },
  "menopausa precoce": { pt: 1, norte: 0.8, centro: 0.75, lisboa: 1.2, sul: 0.7 },
  "fitoterapia menopausa": { pt: 1, norte: 1.2, centro: 1.1, lisboa: 0.7, sul: 1.3 },
  "secura vaginal": { pt: 1, norte: 0.85, centro: 0.9, lisboa: 1.1, sul: 0.8 },
  "peso na menopausa": { pt: 1, norte: 1.0, centro: 1.05, lisboa: 0.95, sul: 1.1 },
  "libido menopausa": { pt: 1, norte: 0.6, centro: 0.55, lisboa: 1.5, sul: 0.5 },
  "menopausa masculina": { pt: 1, norte: 0.5, centro: 0.45, lisboa: 1.4, sul: 0.4 },
  "suores noturnos": { pt: 1, norte: 1.15, centro: 1.1, lisboa: 0.8, sul: 1.2 },
  "mpox portugal": { pt: 1, norte: 0.6, centro: 0.5, lisboa: 1.5, sul: 0.4 },
  "gripe aviária H5N1": { pt: 1, norte: 1.2, centro: 1.1, lisboa: 0.8, sul: 0.9 },
  "resistência antibióticos": { pt: 1, norte: 0.9, centro: 0.85, lisboa: 1.1, sul: 0.8 },
  "long covid": { pt: 1, norte: 1.0, centro: 1.05, lisboa: 0.95, sul: 1.1 },
  "poluição e saúde": { pt: 1, norte: 0.7, centro: 0.65, lisboa: 1.4, sul: 0.6 },
  "dengue europa": { pt: 1, norte: 0.3, centro: 0.35, lisboa: 1.3, sul: 1.5 },
  "sarampo surto": { pt: 1, norte: 1.1, centro: 1.0, lisboa: 0.9, sul: 0.8 },
  "microplásticos sangue": { pt: 1, norte: 0.8, centro: 0.75, lisboa: 1.2, sul: 0.7 },
  "vírus nipah": { pt: 1, norte: 0.5, centro: 0.45, lisboa: 1.4, sul: 0.4 },
  "bactérias carnívoras": { pt: 1, norte: 0.4, centro: 0.35, lisboa: 1.0, sul: 1.6 },
};

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

export function useAxisData(period: string, region: string) {
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
          const mockData = getMockFilteredData(period, region);
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

          // Apply region and period multipliers
          const rm = kwRegionMult[mapped.term]?.[region] ?? 1;
          const pm = kwPeriodMult[mapped.term]?.[period] ?? 1;
          const m = rm * pm;

          mapped.currentVolume = Math.round(mapped.currentVolume * m);
          mapped.previousVolume = Math.round(mapped.previousVolume * rm);
          mapped.changePercent = +(((mapped.currentVolume - mapped.previousVolume) / mapped.previousVolume) * 100).toFixed(1);
          mapped.trend = (m > 1.2 ? "up" : m < 0.8 ? "down" : mapped.trend) as "up" | "down" | "stable";

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
        const mockData = getMockFilteredData(period, region);
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
  }, [period, region]);

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
        })));
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return { data, isLoading };
}
