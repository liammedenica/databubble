"use client";

import { useState, type CSSProperties } from "react";
import { ActivityHeatmap } from "@/components/arc/activity-heatmap/activity-heatmap";
import type { TileRenderProps } from "./types";
import { heatmapDemo, PALETTE } from "./shared/demo-data";
import { TileCard } from "./shared/tile-card";

export function HeatmapTile({ width, onResizeEdge }: TileRenderProps) {
  const [days] = useState(() => heatmapDemo(Math.floor(Math.random() * 1000)));
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <TileCard
      width={width}
      onResizeEdge={onResizeEdge}
      heightResize={false}
      style={{ "--accent": PALETTE[0], "--heatmap-surface": "var(--card)" } as CSSProperties}
    >
      <div className="p-6">
        <ActivityHeatmap
          days={days}
          label="Contributions in 2024"
          period="2024"
          unit={{ one: "contribution", other: "contributions" }}
          weekStartsOn={1}
          selectedDate={selected}
          onSelectDate={setSelected}
        />
      </div>
    </TileCard>
  );
}
