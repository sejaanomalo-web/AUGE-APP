"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import type { WeightPoint } from "./WeightSparkline";

export default function WeightSparklineImpl({ data }: { data: WeightPoint[] }) {
  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
          <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} hide />
          <Tooltip
            cursor={false}
            contentStyle={{
              background: "#252525",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              fontSize: 12,
              padding: "6px 10px",
              color: "#fff",
            }}
            formatter={(value: number) => [`${value.toFixed(1)} kg`, "Peso"]}
            labelFormatter={() => ""}
          />
          <Line
            type="monotone"
            dataKey="weightKg"
            stroke="#C9953A"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: "#C9953A", stroke: "#121212" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
