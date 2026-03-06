import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TrendPoint } from "@/data/mockData";

type Props = {
  data: TrendPoint[];
  label: string;
};

const TrendChart = ({ data, label }: Props) => {
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
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid hsl(240, 100%, 50%)",
                borderRadius: 0,
                fontSize: 11,
                fontFamily: "'Space Grotesk'",
              }}
              labelStyle={{ color: "hsl(240, 100%, 50%)", fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="current"
              stroke="hsl(240, 100%, 50%)"
              strokeWidth={1.5}
              dot={false}
              name="2026"
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
