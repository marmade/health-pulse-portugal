import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { HealthQuestion } from '@/data/healthQuestions';

export function useHealthQuestions(axis?: string) {
  const [questions, setQuestions] = useState<HealthQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);

      try {
        let rows: any[] = [];
        if (!axis || axis === 'all') {
          const axes = ['saude-mental', 'alimentacao', 'menopausa', 'emergentes'];
          const results = await Promise.all(
            axes.map(ax =>
              supabase
                .from('health_questions')
                .select('*')
                .eq('axis', ax)
                .order('growth_percent', { ascending: false })
                .limit(2)
            )
          );
          for (const r of results) {
            if (r.data) rows.push(...r.data);
          }
        } else {
          const { data: axisData, error: axisError } = await supabase
            .from('health_questions')
            .select('*')
            .eq('axis', axis)
            .order('growth_percent', { ascending: false })
            .limit(10);
          if (axisError) throw axisError;
          rows = axisData || [];
        }

        if (!cancelled) {
          const mapped = rows.map((row) => ({
            question: row.question,
            growthPercent: row.growth_percent,
            relativeVolume: row.relative_volume,
            axis: row.axis,
            axisLabel: row.axis_label,
            cluster: row.cluster,
            relatedTerms: [],
          }));
          // Sort cross-axis by growth so the most explosive questions surface first
          mapped.sort((a, b) => b.growthPercent - a.growthPercent);
          setQuestions(mapped);
        }
      } catch (err) {
        console.error('Error fetching health questions:', err);
        if (!cancelled) {
          setQuestions([]);
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
