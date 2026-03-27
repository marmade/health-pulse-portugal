import type { SearchAlert } from "@/components/SearchAlerts";
import type { Keyword } from "@/data/mockData";

/**
 * Detect search spike alerts.
 * Thresholds calibrated for Google Trends PT indices (0–100):
 * - 7d:  >30% weekly growth — fast-moving signals
 * - 30d: >50% monthly growth — sustained acceleration
 * - 12m: >40% year-over-year — structural shifts
 *
 * Additionally, any keyword flagged as emergent (is_emergent) is included
 * regardless of threshold, as it represents a new or explosive term.
 */
export function detectAlerts(
  axisData: Record<string, { label: string; allKeywords: Keyword[] }>,
  period: string
): SearchAlert[] {
  const threshold = period === "7d" ? 30 : period === "30d" ? 50 : 40;

  const alerts: SearchAlert[] = [];

  for (const [, axis] of Object.entries(axisData)) {
    for (const kw of axis.allKeywords) {
      if (kw.changePercent >= threshold || kw.isEmergent) {
        alerts.push({
          keyword: kw,
          growthPercent: kw.changePercent,
          peakDate: kw.lastPeak,
          axisLabel: axis.label,
        });
      }
    }
  }

  // Sort by growth descending, take top 10
  alerts.sort((a, b) => b.growthPercent - a.growthPercent);
  return alerts.slice(0, 10);
}
