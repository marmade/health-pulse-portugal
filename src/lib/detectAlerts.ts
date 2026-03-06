import type { SearchAlert } from "@/components/SearchAlerts";
import type { Keyword } from "@/data/mockData";

/**
 * Detect search spike alerts based on:
 * - Weekly growth > 150% (period "7d")
 * - 30-day growth > 250% (period "30d")
 * - For "12m", use changePercent > 150%
 */
export function detectAlerts(
  axisData: Record<string, { label: string; allKeywords: Keyword[] }>,
  period: string,
  region: string
): SearchAlert[] {
  const threshold = period === "7d" ? 150 : period === "30d" ? 250 : 150;

  const alerts: SearchAlert[] = [];

  for (const [, axis] of Object.entries(axisData)) {
    for (const kw of axis.allKeywords) {
      if (kw.changePercent >= threshold) {
        alerts.push({
          keyword: kw,
          growthPercent: kw.changePercent,
          peakDate: kw.lastPeak,
          axisLabel: axis.label,
          region,
        });
      }
    }
  }

  // Sort by growth descending, take top 10
  alerts.sort((a, b) => b.growthPercent - a.growthPercent);
  return alerts.slice(0, 10);
}
