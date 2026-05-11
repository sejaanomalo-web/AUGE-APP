"use client";

import dynamic from "next/dynamic";

const Impl = dynamic(() => import("./EvolutionChartImpl"), {
  ssr: false,
  loading: () => <div className="h-64 skeleton rounded-md" aria-hidden />,
});

export interface ChartPoint {
  label: string;
  value: number;
}

export function EvolutionChart({
  data,
  unit,
  variant = "line",
}: {
  data: ChartPoint[];
  unit?: string;
  variant?: "line" | "bar";
}) {
  return <Impl data={data} unit={unit} variant={variant} />;
}
