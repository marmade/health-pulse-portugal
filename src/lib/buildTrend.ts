import type { TrendPoint } from '@/data/mockData';

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const dayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

type Snapshot = {
  snapshot_date: string;
  axis: string;
  keyword: string;
  search_index: number;
};

/**
 * Build trend points from real historical snapshots for a given axis.
 * Uses volume-weighted average so high-volume keywords dominate the curve.
 */
export function buildAxisTrend(
  snapshots: Snapshot[],
  axisId: string,
  period: string,
): TrendPoint[] {
  const axisSnaps = snapshots.filter(s => s.axis === axisId);
  if (axisSnaps.length === 0) return [];
  return buildTrendWeighted(axisSnaps, period);
}

/**
 * Build trend points from real historical snapshots for a single keyword.
 * Simple average (no weighting needed for a single keyword).
 */
export function buildKeywordTrend(
  snapshots: Snapshot[],
  keyword: string,
  period: string,
): TrendPoint[] {
  const kwSnaps = snapshots.filter(s => s.keyword === keyword);
  if (kwSnaps.length === 0) return [];
  return buildTrendSimple(kwSnaps, period);
}

/** Simple average — used for single-keyword trends */
function simpleAvg(arr: number[]): number | undefined {
  if (arr.length === 0) return undefined;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

/** Volume-weighted average: sum(v²) / sum(v) — high-volume keywords dominate */
function weightedAvg(arr: number[]): number | undefined {
  if (arr.length === 0) return undefined;
  const sumV = arr.reduce((a, b) => a + b, 0);
  if (sumV === 0) return 0;
  const sumVV = arr.reduce((a, v) => a + v * v, 0);
  return Math.round(sumVV / sumV);
}

// ── 12m ──────────────────────────────────────────────────────────────────────

function build12m(
  snapshots: Snapshot[],
  avg: (arr: number[]) => number | undefined,
): TrendPoint[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;

  const byMonth: Record<number, { current: number[]; previous: number[] }> = {};
  for (let m = 0; m < 12; m++) byMonth[m] = { current: [], previous: [] };

  for (const s of snapshots) {
    const d = new Date(s.snapshot_date);
    const month = d.getMonth();
    const year = d.getFullYear();
    if (year === currentYear) byMonth[month].current.push(s.search_index);
    else if (year === previousYear) byMonth[month].previous.push(s.search_index);
  }

  return monthLabels.map((label, i) => {
    const bucket = byMonth[i];
    const current = i <= now.getMonth() ? avg(bucket.current) : undefined;
    const previous = avg(bucket.previous);
    return {
      week: label,
      current: current as unknown as number,
      previous: (previous ?? 0) as number,
    };
  });
}

// ── 30d ──────────────────────────────────────────────────────────────────────

function build30d(
  snapshots: Snapshot[],
  avg: (arr: number[]) => number | undefined,
): TrendPoint[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const recent = snapshots
    .filter(s => new Date(s.snapshot_date) >= cutoff)
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));

  // Previous 30 days for comparison
  const prevCutoff = new Date(cutoff);
  prevCutoff.setDate(prevCutoff.getDate() - 30);
  const previous = snapshots
    .filter(s => {
      const d = new Date(s.snapshot_date);
      return d >= prevCutoff && d < cutoff;
    })
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));

  const weekLabels = ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];
  const currentBuckets: number[][] = [[], [], [], []];
  const previousBuckets: number[][] = [[], [], [], []];

  for (const s of recent) {
    const daysSinceCutoff = Math.floor((new Date(s.snapshot_date).getTime() - cutoff.getTime()) / (1000 * 60 * 60 * 24));
    const weekIdx = Math.min(3, Math.floor(daysSinceCutoff / 7));
    currentBuckets[weekIdx].push(s.search_index);
  }

  for (const s of previous) {
    const daysSincePrevCutoff = Math.floor((new Date(s.snapshot_date).getTime() - prevCutoff.getTime()) / (1000 * 60 * 60 * 24));
    const weekIdx = Math.min(3, Math.floor(daysSincePrevCutoff / 7));
    previousBuckets[weekIdx].push(s.search_index);
  }

  return weekLabels.map((label, i) => ({
    week: label,
    current: (avg(currentBuckets[i]) ?? undefined) as unknown as number,
    previous: avg(previousBuckets[i]) ?? 0,
  }));
}

// ── 7d ───────────────────────────────────────────────────────────────────────

function build7d(
  snapshots: Snapshot[],
  avg: (arr: number[]) => number | undefined,
): TrendPoint[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const recent = snapshots
    .filter(s => new Date(s.snapshot_date) >= cutoff)
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));

  // Previous 7 days for comparison
  const prevCutoff = new Date(cutoff);
  prevCutoff.setDate(prevCutoff.getDate() - 7);
  const previous = snapshots
    .filter(s => {
      const d = new Date(s.snapshot_date);
      return d >= prevCutoff && d < cutoff;
    })
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));

  const currentByDay: Record<string, number[]> = {};
  const previousByDay: Record<string, number[]> = {};

  for (const s of recent) {
    const d = new Date(s.snapshot_date);
    const dayIdx = (d.getDay() + 6) % 7;
    const key = dayLabels[dayIdx];
    if (!currentByDay[key]) currentByDay[key] = [];
    currentByDay[key].push(s.search_index);
  }

  for (const s of previous) {
    const d = new Date(s.snapshot_date);
    const dayIdx = (d.getDay() + 6) % 7;
    const key = dayLabels[dayIdx];
    if (!previousByDay[key]) previousByDay[key] = [];
    previousByDay[key].push(s.search_index);
  }

  return dayLabels.map(label => ({
    week: label,
    current: (avg(currentByDay[label] || []) ?? undefined) as unknown as number,
    previous: avg(previousByDay[label] || []) ?? 0,
  }));
}

// ── Entry points ─────────────────────────────────────────────────────────────

function buildTrendWeighted(snapshots: Snapshot[], period: string): TrendPoint[] {
  if (period === "12m") return build12m(snapshots, weightedAvg);
  if (period === "30d") return build30d(snapshots, weightedAvg);
  if (period === "7d") return build7d(snapshots, weightedAvg);
  return [];
}

function buildTrendSimple(snapshots: Snapshot[], period: string): TrendPoint[] {
  if (period === "12m") return build12m(snapshots, simpleAvg);
  if (period === "30d") return build30d(snapshots, simpleAvg);
  if (period === "7d") return build7d(snapshots, simpleAvg);
  return [];
}
