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
    background: "#12161C",
    border: "1px solid #252B33",
    borderRadius: 12,
    fontSize: 12,
    padding: "6px 10px",
    color: "#F7F8FA",
  };
  const axisProps = {
    stroke: "#8A929E",
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
            <CartesianGrid stroke="#252B33" vertical={false} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis
              {...axisProps}
              domain={["dataMin - 1", "dataMax + 1"]}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: "#252B33" }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => [
                `${value.toFixed(1)}${unit ? ` ${unit}` : ""}`,
                "",
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#B7FF2A"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#B7FF2A", stroke: "#12161C" }}
              activeDot={{ r: 5, fill: "#B7FF2A", stroke: "#12161C" }}
              isAnimationActive={false}
            />
          </LineChart>
        ) : (
          <BarChart
            data={data}
            margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="#252B33" vertical={false} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} width={56} />
            <Tooltip
              cursor={{ fill: "#171C23" }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => [
                `${value.toLocaleString("pt-BR")}${unit ? ` ${unit}` : ""}`,
                "",
              ]}
            />
            <Bar
              dataKey="value"
              fill="#1D4ED8"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
