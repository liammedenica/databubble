"use client";

import { WaffleChart } from "@/components/arc/waffle-chart/waffle-chart";
import type { TileRenderProps } from "./types";
import { WAFFLE_DEMO } from "./shared/demo-data";
import { TileCard } from "./shared/tile-card";

export function WaffleTile({ width, onResizeEdge }: TileRenderProps) {
  return (
    <TileCard width={width} onResizeEdge={onResizeEdge} heightResize={false}>
      <div className="p-8">
        <WaffleChart
          data={WAFFLE_DEMO}
          label="Revenue by channel"
          rows={10}
          columns={10}
          legend
        />
      </div>
    </TileCard>
  );
}
