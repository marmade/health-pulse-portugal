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

export function useHistoricalData() {
  const [data, setData] = useState<HistoricalSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: snapshots } = await supabase
        .from('historical_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: true });

      if (snapshots && snapshots.length > 0) {
        setData(snapshots as HistoricalSnapshot[]);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return { data, isLoading };
}
