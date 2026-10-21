"use client";

import { useState } from "react";
import { Sparkline } from "@/components/arc/sparkline/sparkline";
import { CHART_OVERHEAD, type TileRenderProps } from "./types";
import { dailySeries } from "./shared/demo-data";
import { TileCard } from "./shared/tile-card";

export function SparklineTile({ width, height, onResizeEdge }: TileRenderProps) {
  const [points] = useState(() =>
    dailySeries(30, 8200, 2000, Math.floor(Math.random() * 1000)),
  );
  const values = points.map(d => d.value);
  const labels = points.map(d => d.label);
  const chartHeight = Math.max(40, height - CHART_OVERHEAD.sparkline);
  return (
    <TileCard width={width} onResizeEdge={onResizeEdge}>
      <div className="p-5 pt-4">
        <Sparkline
          data={values}
          labels={labels}
          label="Revenue trend"
          value="$112K"
          change="+19.2%"
          tone="success"
          area
          interactive
          height={chartHeight}
        />
      </div>
    </TileCard>
  );
}
