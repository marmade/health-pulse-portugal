import { supabase } from '@/integrations/supabase/client';

export interface TrendTimelinePoint {
  time: string;
  formattedTime: string;
  values: Record<string, number>;
}

export interface RelatedQuery {
  query: string;
  value: number;
  formattedValue: string;
}

export interface GoogleTrendsResponse {
  success: boolean;
  error?: string;
  data?: {
    keywords: string[];
    geo: string;
    timeRange: string;
    timeline: TrendTimelinePoint[];
    relatedQueries: Record<string, { top: RelatedQuery[]; rising: RelatedQuery[] }>;
  };
}

export async function fetchGoogleTrends(
  keywords: string[],
  geo = 'PT',
  timeRange = 'today 12-m'
): Promise<GoogleTrendsResponse> {
  const { data, error } = await supabase.functions.invoke('google-trends', {
    body: { keywords, geo, timeRange },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data as GoogleTrendsResponse;
}
