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

type Props = {
  data: TrendPoint[];
  label: string;
};

const CustomTooltip = ({
  active,
  payload,
  label,
  peakValue,
}: any) => {
  if (!active || !payload?.length) return null;

  const currentEntry = payload.find((p: any) => p.dataKey === "current");
  const value = currentEntry?.value as number | undefined;
  if (value == null) return null;

  // Find month index from short label
  const monthIdx = monthLabels.indexOf(label as string);
  const monthName = monthIdx >= 0 ? monthFull[monthIdx] : label;
  const year = new Date().getFullYear();

  // Calculate variation vs previous month from the chart data
  const allData = currentEntry?.payload ? undefined : undefined;
  // We get prev month value from the payload's source
  let variationText = "";
  const chartData = (currentEntry as any)?.payload;
  // We'll compute variation in the parent and pass via context — 
  // for now compute from payload
  const prevMonthEntry = payload.find((p: any) => p.dataKey === "previous");
  const prevYearValue = prevMonthEntry?.value as number | undefined;

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
        {monthName} {year}
      </p>
      <p style={{ color: "#000000", fontSize: 11, margin: 0, marginBottom: 3 }}>
        <span style={{ fontWeight: 600 }}>Volume:</span> {value}{" "}
        <span style={{ fontSize: 9, color: "#666666" }}>(índice relativo 0–100)</span>
      </p>
      {prevYearValue != null && (
        <p style={{ color: "#000000", fontSize: 11, margin: 0, marginBottom: 3 }}>
          {value >= prevYearValue ? "↑" : "↓"}{" "}
          {value >= prevYearValue ? "+" : ""}
          {prevYearValue !== 0
            ? (((value - prevYearValue) / prevYearValue) * 100).toFixed(1)
            : "0.0"}
          % <span style={{ fontSize: 9, color: "#666666" }}>vs ano anterior</span>
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

const TrendChart = ({ data, label }: Props) => {
  const peakValue = useMemo(
    () => Math.max(...data.map((d) => d.current).filter((v) => v != null)),
    [data]
  );

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
            {data.some(d => d.week === currentMonthLabel) && (
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
              content={<CustomTooltip peakValue={peakValue} />}
              cursor={{ stroke: "hsl(240, 100%, 50%)", strokeWidth: 0.5, strokeDasharray: "3 3" }}
            />
            <Line
              type="monotone"
              dataKey="current"
              stroke="hsl(240, 100%, 50%)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: "#0000FF", stroke: "#0000FF" }}
              name="2026"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke="hsl(240, 100%, 50%)"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              opacity={0.3}
              name="2025"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-px bg-foreground" />
          <span className="text-[9px] text-foreground/70">2026</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-px bg-foreground/30 border-dashed" style={{ borderTop: "1px dashed hsl(240,100%,50%,0.3)", height: 0 }} />
          <span className="text-[9px] text-foreground/30">2025</span>
        </div>
      </div>
    </div>
  );
};

export default TrendChart;
