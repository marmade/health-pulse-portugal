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
        // Quando axis='all': 2 perguntas por eixo (balanceado)
        // Quando axis específico: top 10 desse eixo
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
        const data = rows;

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
