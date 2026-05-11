"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "./EvolutionChart";

export default function EvolutionChartImpl({
  data,
  unit,
  variant = "line",
}: {
  data: ChartPoint[];
  unit?: string;
  variant?: "line" | "bar";
}) {
  const tooltipStyle = {
    background: "#252525",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    fontSize: 12,
    padding: "6px 10px",
    color: "#fff",
  };
  const axisProps = {
    stroke: "#7c7c7c",
    fontSize: 11,
    tickLine: false,
    axisLine: false,
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {variant === "line" ? (
          <LineChart
            data={data}
            margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="#2a2a2a" vertical={false} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis
              {...axisProps}
              domain={["dataMin - 1", "dataMax + 1"]}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: "#2a2a2a" }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => [
                `${value.toFixed(1)}${unit ? ` ${unit}` : ""}`,
                "",
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#C9953A"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#C9953A", stroke: "#121212" }}
              activeDot={{ r: 5, fill: "#C9953A", stroke: "#121212" }}
              isAnimationActive={false}
            />
          </LineChart>
        ) : (
          <BarChart
            data={data}
            margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="#2a2a2a" vertical={false} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} width={56} />
            <Tooltip
              cursor={{ fill: "#1f1f1f" }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => [
                `${value.toLocaleString("pt-BR")}${unit ? ` ${unit}` : ""}`,
                "",
              ]}
            />
            <Bar
              dataKey="value"
              fill="#C9953A"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
