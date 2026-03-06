import { useState, useEffect } from 'react';
import { fetchGoogleTrends } from '@/lib/api/googleTrends';
import { axisData as mockAxisData, type TrendPoint } from '@/data/mockData';

type AxisId = keyof typeof mockAxisData;

export function useGoogleTrends(axisId: AxisId) {
  const [trendData, setTrendData] = useState<TrendPoint[]>(mockAxisData[axisId].trend);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const keywords = mockAxisData[axisId].keywords.map((k) => k.term);
    // Only fetch the first keyword for the trend line
    const mainKeyword = keywords[0];
    if (!mainKeyword) return;

    let cancelled = false;
    setIsLoading(true);

    fetchGoogleTrends([mainKeyword], 'PT', 'today 12-m')
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data?.timeline?.length) {
          const mapped: TrendPoint[] = res.data.timeline.map((p) => ({
            week: p.formattedTime,
            current: p.values[mainKeyword] ?? 0,
            previous: 0,
          }));
          setTrendData(mapped);
          setIsLive(true);
          setError(null);
        } else {
          setError(res.error || 'Sem dados');
          // Keep mock data as fallback
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        // Keep mock data as fallback
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [axisId]);

  return { trendData, isLive, isLoading, error };
}
