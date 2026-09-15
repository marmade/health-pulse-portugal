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

// O PostgREST devolve no maximo 1000 linhas por pedido. Sem paginacao, o grafico
// recebia 1000 das 3462 linhas — as mais antigas, por causa do order ascendente —
// e tudo a partir de Abril/2026 nunca chegava a pagina.
const PAGE_SIZE = 1000;

export function useHistoricalData(period: string = "12m") {
  const [data, setData] = useState<HistoricalSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);

      const cutoffFor = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() - days);
        return d.toISOString().split('T')[0];
      };

      const buildQuery = (from: number) => {
        let q = supabase
          .from('historical_snapshots')
          .select('*')
          .order('snapshot_date', { ascending: true })
          .range(from, from + PAGE_SIZE - 1);

        if (period === "7d") q = q.gte('snapshot_date', cutoffFor(7));
        else if (period === "30d") q = q.gte('snapshot_date', cutoffFor(30));
        // "12m" → sem filtro de data

        return q;
      };

      const all: HistoricalSnapshot[] = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data: page, error } = await buildQuery(from);
        if (error || !page) break;
        all.push(...(page as HistoricalSnapshot[]));
        if (page.length < PAGE_SIZE) break;
      }

      if (!cancelled) {
        setData(all);
        setIsLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [period]);

  return { data, isLoading };
}
