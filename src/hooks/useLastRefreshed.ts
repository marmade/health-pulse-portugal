import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useLastRefreshed() {
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'last_refreshed')
        .single();
      if (data) setLastRefreshed(data.value);
    };
    fetch();
  }, []);

  return lastRefreshed;
}
