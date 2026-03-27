import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { Keyword } from "@/data/mockData";
import { buildKeywordTrend } from "@/lib/buildTrend";
import type { HistoricalSnapshot } from "@/hooks/useHistoricalData";

const COLORS = [
  "hsl(240, 100%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(150, 70%, 40%)",
  "hsl(30, 90%, 50%)",
  "hsl(280, 70%, 50%)",
];

type Props = {
  allKeywords: Keyword[];
  selectedTerms: string[];
  onToggleTerm: (term: string) => void;
  period: string;
  historicalData?: HistoricalSnapshot[];
};

const KeywordCompare = ({ allKeywords, selectedTerms, onToggleTerm, period, historicalData = [] }: Props) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(
    () =>
      allKeywords.filter(
        (kw) =>
          kw.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
          kw.synonyms.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [allKeywords, searchQuery]
  );

  const selectedKeywords = useMemo(
    () => allKeywords.filter((kw) => selectedTerms.includes(kw.term)),
    [allKeywords, selectedTerms]
  );

  // Build merged chart data from real historical snapshots
  const chartData = useMemo(() => {
    if (selectedKeywords.length === 0) return [];
    const trends = selectedKeywords.map((kw) => ({
      term: kw.term,
      data: buildKeywordTrend(historicalData, kw.term, period),
    }));
    if (trends[0].data.length === 0) return [];
    return trends[0].data.map((point, i) => {
      const merged: Record<string, unknown> = { week: point.week };
      trends.forEach((t) => {
        merged[`${t.term}_current`] = t.data[i]?.current ?? 0;
        merged[`${t.term}_previous`] = t.data[i]?.previous ?? 0;
      });
      return merged;
    });
  }, [selectedKeywords, period, historicalData]);

  return (
    <div className="space-y-4">
      <p className="editorial-label">Comparar Palavras</p>

      {/* Selected pills */}
      {selectedTerms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTerms.map((term, i) => (
            <button
              key={term}
              onClick={() => onToggleTerm(term)}
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider border border-foreground px-2 py-1 hover:bg-foreground hover:text-primary-foreground transition-colors"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              {term}
              <span className="ml-1 opacity-50">×</span>
            </button>
          ))}
        </div>
      )}

      {/* Search & select */}
      {selectedTerms.length < 5 && (
        <div>
          <input
            type="text"
            placeholder="Pesquisar keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs border border-foreground/20 bg-transparent px-2 py-1.5 focus:outline-none focus:border-foreground placeholder:text-foreground/30"
          />
          {searchQuery && (
            <div className="mt-1 max-h-32 overflow-y-auto border border-foreground/10">
              {filteredOptions
                .filter((kw) => !selectedTerms.includes(kw.term))
                .map((kw) => (
                  <button
                    key={kw.term}
                    onClick={() => {
                      onToggleTerm(kw.term);
                      setSearchQuery("");
                    }}
                    className="w-full text-left text-xs px-2 py-1.5 hover:bg-foreground/5 flex justify-between"
                  >
                    <span>{kw.term}</span>
                    <span className="text-foreground/30">Vol. {kw.currentVolume}</span>
                  </button>
                ))}
              {filteredOptions.filter((kw) => !selectedTerms.includes(kw.term)).length === 0 && (
                <p className="text-[10px] text-foreground/30 px-2 py-1.5">Sem resultados</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Comparative chart */}
      {selectedKeywords.length > 0 && chartData.length > 0 && (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="week"
                tick={{ fontSize: 9, fill: "hsl(240, 100%, 50%)", fontFamily: "'Space Grotesk'" }}
                axisLine={{ stroke: "hsl(240, 100%, 50%)", strokeWidth: 0.5, opacity: 0.3 }}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid hsl(240, 100%, 50%)",
                  borderRadius: 0,
                  fontSize: 11,
                  fontFamily: "'Space Grotesk'",
                }}
              />
              {selectedKeywords.map((kw, i) => (
                <Line
                  key={`${kw.term}_current`}
                  type="monotone"
                  dataKey={`${kw.term}_current`}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={1.5}
                  dot={false}
                  name={`${kw.term} (2026)`}
                />
              ))}
              {selectedKeywords.map((kw, i) => (
                <Line
                  key={`${kw.term}_previous`}
                  type="monotone"
                  dataKey={`${kw.term}_previous`}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  opacity={0.3}
                  name={`${kw.term} (2025)`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      {selectedKeywords.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {selectedKeywords.map((kw, i) => (
            <div key={kw.term} className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                <div className="w-3 h-px" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[9px]" style={{ color: COLORS[i % COLORS.length] }}>2026</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0 border-t border-dashed" style={{ borderColor: COLORS[i % COLORS.length], opacity: 0.3 }} />
                <span className="text-[9px] opacity-30" style={{ color: COLORS[i % COLORS.length] }}>2025</span>
              </div>
              <span className="text-[9px] font-semibold">{kw.term}</span>
            </div>
          ))}
        </div>
      )}

      {selectedKeywords.length === 0 && (
        <p className="text-[10px] text-foreground/30 italic">
          Clica numa keyword do Top 5 ou pesquisa acima para comparar.
        </p>
      )}
    </div>
  );
};

export default KeywordCompare;
