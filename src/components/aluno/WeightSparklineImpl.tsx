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
              background: "#12161C",
              border: "1px solid #252B33",
              borderRadius: 12,
              fontSize: 12,
              padding: "6px 10px",
              color: "#F7F8FA",
            }}
            formatter={(value: number) => [`${value.toFixed(1)} kg`, "Peso"]}
            labelFormatter={() => ""}
          />
          <Line
            type="monotone"
            dataKey="weightKg"
            stroke="#B7FF2A"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: "#B7FF2A", stroke: "#12161C" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
