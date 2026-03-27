import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { TrendPoint } from "@/data/mockData";

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const monthFull = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const currentMonthLabel = monthLabels[new Date().getMonth()];

const periodLabels: Record<string, { current: string; previous: string; comparison: string }> = {
  "12m": { current: "2026", previous: "2025", comparison: "vs ano anterior" },
  "30d": { current: "Últimos 30d", previous: "30d anteriores", comparison: "vs 30d anteriores" },
  "7d": { current: "Últimos 7d", previous: "7d anteriores", comparison: "vs 7d anteriores" },
};

type Props = {
  data: TrendPoint[];
  label: string;
  period?: string;
};

const CustomTooltip = ({
  active,
  payload,
  label,
  peakValue,
  period,
}: any) => {
  if (!active || !payload?.length) return null;

  const currentEntry = payload.find((p: any) => p.dataKey === "current");
  const value = currentEntry?.value as number | undefined;
  if (value == null) return null;

  const pLabels = periodLabels[period] || periodLabels["12m"];

  // Build display title based on period
  let title: string;
  if (period === "12m") {
    const monthIdx = monthLabels.indexOf(label as string);
    const monthName = monthIdx >= 0 ? monthFull[monthIdx] : label;
    title = `${monthName} ${new Date().getFullYear()}`;
  } else {
    title = label as string;
  }

  const prevEntry = payload.find((p: any) => p.dataKey === "previous");
  const prevValue = prevEntry?.value as number | undefined;

  const isPeak = value === peakValue;

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #0000FF",
        borderRadius: 0,
        padding: 8,
        fontFamily: "'Space Grotesk', sans-serif",
        boxShadow: "none",
        minWidth: 180,
      }}
    >
      <p
        style={{
          color: "#0000FF",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          margin: 0,
          marginBottom: 6,
        }}
      >
        {title}
      </p>
      <p style={{ color: "#000000", fontSize: 11, margin: 0, marginBottom: 3 }}>
        <span style={{ fontWeight: 600 }}>Volume:</span> {value}{" "}
        <span style={{ fontSize: 9, color: "#666666" }}>(índice relativo 0–100)</span>
      </p>
      {prevValue != null && prevValue > 0 && (
        <p style={{ color: "#000000", fontSize: 11, margin: 0, marginBottom: 3 }}>
          {value >= prevValue ? "↑" : "↓"}{" "}
          {value >= prevValue ? "+" : ""}
          {(((value - prevValue) / prevValue) * 100).toFixed(1)}
          % <span style={{ fontSize: 9, color: "#666666" }}>{pLabels.comparison}</span>
        </p>
      )}
      {isPeak && (
        <p style={{ color: "#0000FF", fontSize: 10, fontWeight: 600, margin: 0, marginTop: 4 }}>
          ● Pico do período
        </p>
      )}
    </div>
  );
};

const TrendChart = ({ data, label, period = "12m" }: Props) => {
  const peakValue = useMemo(
    () => Math.max(...data.map((d) => d.current).filter((v) => v != null)),
    [data]
  );

  const pLabels = periodLabels[period] || periodLabels["12m"];

  // Reference line only for 12m (current month marker)
  const showRefLine = period === "12m" && data.some(d => d.week === currentMonthLabel);

  // Check if previous data has any non-zero values
  const hasPrevious = data.some(d => d.previous != null && d.previous > 0);

  return (
    <div>
      <p className="editorial-label mb-3">Evolução temporal — {label}</p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="week"
              tick={{ fontSize: 9, fill: "hsl(240, 100%, 50%)", fontFamily: "'Space Grotesk'" }}
              axisLine={{ stroke: "hsl(240, 100%, 50%)", strokeWidth: 0.5, opacity: 0.3 }}
              tickLine={false}
            />
            <YAxis hide />
            {showRefLine && (
              <ReferenceLine
                x={currentMonthLabel}
                stroke="hsl(240, 100%, 50%)"
                strokeWidth={0.75}
                strokeDasharray="2 3"
                opacity={0.4}
                label={{
                  value: "hoje",
                  position: "top",
                  fill: "hsl(240, 100%, 50%)",
                  fontSize: 8,
                  fontFamily: "'Space Grotesk'",
                  opacity: 0.5,
                }}
              />
            )}
            <Tooltip
              content={<CustomTooltip peakValue={peakValue} period={period} />}
              cursor={{ stroke: "hsl(240, 100%, 50%)", strokeWidth: 0.5, strokeDasharray: "3 3" }}
            />
            <Line
              type="monotone"
              dataKey="current"
              stroke="hsl(240, 100%, 50%)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: "#0000FF", stroke: "#0000FF" }}
              name={pLabels.current}
              connectNulls={false}
            />
            {hasPrevious && (
              <Line
                type="monotone"
                dataKey="previous"
                stroke="hsl(240, 100%, 50%)"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                opacity={0.3}
                name={pLabels.previous}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-px bg-foreground" />
          <span className="text-[9px] text-foreground/70">{pLabels.current}</span>
        </div>
        {hasPrevious && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-px bg-foreground/30 border-dashed" style={{ borderTop: "1px dashed hsl(240,100%,50%,0.3)", height: 0 }} />
            <span className="text-[9px] text-foreground/30">{pLabels.previous}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendChart;
