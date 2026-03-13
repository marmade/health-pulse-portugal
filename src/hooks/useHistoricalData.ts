import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type HistoricalSnapshot = {
  snapshot_date: string;
  axis: string;
  keyword: string;
  search_index: number;
  change_percent: number;
  is_emergent: boolean;
};

export function useHistoricalData(period: string = "12m") {
  const [data, setData] = useState<HistoricalSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      let query = supabase
        .from('historical_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: true });

      if (period === "7d") {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        query = query.gte('snapshot_date', cutoff.toISOString().split('T')[0]);
      } else if (period === "30d") {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        query = query.gte('snapshot_date', cutoff.toISOString().split('T')[0]);
      }
      // "12m" → no date filter

      const { data: snapshots } = await query;

      if (snapshots && snapshots.length > 0) {
        setData(snapshots as HistoricalSnapshot[]);
      } else {
        setData([]);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [period]);

  return { data, isLoading };
}
