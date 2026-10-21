"use client";

import { useState } from "react";
import { Treemap } from "@/components/arc/treemap/treemap";
import { CHART_OVERHEAD, type TileRenderProps } from "./types";
import { TREEMAP_DEMO } from "./shared/demo-data";
import { TileCard } from "./shared/tile-card";

export function TreemapTile({ width, height, onResizeEdge }: TileRenderProps) {
  const [focus, setFocus] = useState("root");
  const branches = TREEMAP_DEMO.children ?? [];
  const chartHeight = Math.max(200, height - CHART_OVERHEAD.treemap);
  return (
    <TileCard width={width} onResizeEdge={onResizeEdge}>
      {branches.length > 0 && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-0 flex-wrap">
          <button
            onClick={e => { e.stopPropagation(); setFocus("root"); }}
            className={`px-2.5 py-[3px] rounded-full text-xs font-medium transition-colors whitespace-nowrap
              ${focus === "root"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"}`}
          >
            All
          </button>
          {branches.map(b => (
            <button
              key={b.id}
              onClick={e => { e.stopPropagation(); setFocus(b.id); }}
              className={`px-2.5 py-[3px] rounded-full text-xs font-medium transition-colors whitespace-nowrap
                ${focus === b.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
      <div className="px-4 pt-3 pb-4">
        <Treemap
          data={TREEMAP_DEMO}
          label={TREEMAP_DEMO.label}
          height={chartHeight}
          focus={focus}
          onFocusChange={setFocus}
          colorLabel="MoM growth %"
          formatValue={v => `$${(v / 1000).toFixed(0)}K`}
          formatColor={v => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
        />
      </div>
    </TileCard>
  );
}
