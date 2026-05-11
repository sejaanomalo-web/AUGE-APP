"use client";

import dynamic from "next/dynamic";

const SparklineImpl = dynamic(() => import("./WeightSparklineImpl"), {
  ssr: false,
  loading: () => (
    <div className="h-16 rounded-md skeleton" aria-hidden />
  ),
});

export interface WeightPoint {
  date: string;
  weightKg: number;
}

export function WeightSparkline({ data }: { data: WeightPoint[] }) {
  return <SparklineImpl data={data} />;
}
