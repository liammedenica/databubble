"use client";

import { useState } from "react";
import { LineChart } from "@/components/arc/line-chart/line-chart";
import { CHART_OVERHEAD, type TileRenderProps } from "./types";
import { lineChartDemo } from "./shared/demo-data";
import { TileCard } from "./shared/tile-card";

export function LineTile({ width, height, onResizeEdge }: TileRenderProps) {
  const [{ data, series }] = useState(() =>
    lineChartDemo(30, Math.floor(Math.random() * 1000)),
  );
  const [hidden, setHidden] = useState<string[]>([]);
  const chartHeight = Math.max(80, height - CHART_OVERHEAD.line);
  return (
    <TileCard width={width} onResizeEdge={onResizeEdge}>
      <div className="p-5 pt-4">
        <LineChart
          data={data}
          series={series}
          label={series[0]?.label ?? "Revenue"}
          height={chartHeight}
          curve="smooth"
          legend
          hiddenSeries={hidden}
          onHiddenSeriesChange={setHidden}
        />
      </div>
    </TileCard>
  );
}
