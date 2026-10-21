"use client";

import { useState } from "react";
import { BarChart } from "@/components/arc/bar-chart/bar-chart";
import { CHART_OVERHEAD, type TileRenderProps } from "./types";
import { barChartDemo } from "./shared/demo-data";
import { TileCard } from "./shared/tile-card";

export function BarTile({ width, height, onResizeEdge }: TileRenderProps) {
  const [data] = useState(() => barChartDemo(14, Math.floor(Math.random() * 1000)));
  const period = data.length
    ? `${data[0]!.label} – ${data[data.length - 1]!.label}`
    : "";
  const chartHeight = Math.max(80, height - CHART_OVERHEAD.bar);
  return (
    <TileCard width={width} onResizeEdge={onResizeEdge}>
      <div className="p-5 pt-4">
        <BarChart
          data={data}
          label="Signups"
          period={period}
          unit="signups"
          height={chartHeight}
          showAverage
          showHeader
        />
      </div>
    </TileCard>
  );
}
