"use client";

import { DonutChart } from "@/components/arc/donut-chart/donut-chart";
import type { TileRenderProps } from "./types";
import { DONUT_DEMO } from "./shared/demo-data";
import { TileCard } from "./shared/tile-card";

const DONUT_SIZE = 220;
const DONUT_THICKNESS = 28;

export function DonutTile({ width, onResizeEdge }: TileRenderProps) {
  return (
    <TileCard width={width} onResizeEdge={onResizeEdge} heightResize={false}>
      <div className="p-6">
        <DonutChart
          data={DONUT_DEMO}
          label="Visits by source"
          unit="visits"
          size={DONUT_SIZE}
          thickness={DONUT_THICKNESS}
          totalLabel="Total"
          legend
          legendAction="toggle"
        />
      </div>
    </TileCard>
  );
}
