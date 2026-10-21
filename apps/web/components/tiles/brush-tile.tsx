"use client";

import { useState } from "react";
import { BrushChart } from "@/components/arc/brush-chart/brush-chart";
import { CHART_OVERHEAD, type TileRenderProps } from "./types";
import { brushDemo } from "./shared/demo-data";
import { TileCard } from "./shared/tile-card";

const OVERVIEW_HEIGHT = 48;
const WINDOW_OPTS = [
  { label: "30d", days:  30 },
  { label: "90d", days:  90 },
  { label: "6m",  days: 182 },
  { label: "1y",  days: 365 },
  { label: "All", days: 730 },
];
const DAY_MS = 24 * 60 * 60 * 1000;

export function BrushTile({ width, height, onResizeEdge }: TileRenderProps) {
  const [{ data, annotations }] = useState(() =>
    brushDemo(Math.floor(Math.random() * 1000)),
  );
  const [windowDays, setWindowDays] = useState(90);

  const lastMs = (data[data.length - 1]!.date as Date).getTime();
  const range: [number, number] = windowDays === 730
    ? [(data[0]!.date as Date).getTime(), lastMs]
    : [lastMs - windowDays * DAY_MS, lastMs];

  const chartHeight = Math.max(120, height - CHART_OVERHEAD.brush);

  return (
    <TileCard width={width} onResizeEdge={onResizeEdge}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Daily signups</p>
          <div className="flex gap-0.5 p-0.5 rounded-full bg-muted">
            {WINDOW_OPTS.map(o => (
              <button
                key={o.label}
                onClick={e => { e.stopPropagation(); setWindowDays(o.days); }}
                className={`px-2.5 py-[3px] rounded-full text-xs font-medium transition-colors whitespace-nowrap
                  ${windowDays === o.days
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
          <BrushChart
            data={data}
            annotations={annotations}
            label="Daily signups"
            unit="signups"
            height={chartHeight}
            overviewHeight={OVERVIEW_HEIGHT}
            range={range}
          />
        </div>
      </div>
    </TileCard>
  );
}
