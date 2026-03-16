import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  type HealthQuestion,
  healthQuestions as fallbackQuestions,
  getTopQuestionsPerAxis,
  getHealthQuestions as getFallbackQuestions,
} from '@/data/healthQuestions';

export function useHealthQuestions(axis?: string) {
  const [questions, setQuestions] = useState<HealthQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);

      try {
        let query = supabase
          .from('health_questions')
          .select('*')
          .order('growth_percent', { ascending: false })
          .limit(30);

        if (axis && axis !== 'all') {
          query = query.eq('axis', axis);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (!cancelled) {
          if (data && data.length > 0) {
            setQuestions(
              data.map((row) => ({
                question: row.question,
                growthPercent: row.growth_percent,
                relativeVolume: row.relative_volume,
                axis: row.axis,
                axisLabel: row.axis_label,
                cluster: row.cluster,
                relatedTerms: [],
              }))
            );
          } else {
            // Fallback to hardcoded data
            const isOverview = !axis || axis === 'all';
            setQuestions(isOverview ? getTopQuestionsPerAxis(2) : getFallbackQuestions(axis));
          }
        }
      } catch (err) {
        console.error('Error fetching health questions:', err);
        if (!cancelled) {
          const isOverview = !axis || axis === 'all';
          setQuestions(isOverview ? getTopQuestionsPerAxis(2) : getFallbackQuestions(axis));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [axis]);

  return { questions, isLoading };
}
