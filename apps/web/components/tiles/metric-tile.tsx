"use client";

import { useState, type CSSProperties } from "react";
import { MetricCard } from "@/components/arc/metric-card/metric-card";
import type { TileRenderProps } from "./types";
import { ResizeHandles } from "./shared/resize-handles";

/**
 * Metric cards don't use the shared TileCard chrome — they have their own
 * styling from MetricCard. We mirror the sandbox pattern: outer positioning
 * div with `--surface: var(--card)` so the inner card picks up the right bg.
 */

const PRESETS = [
  { label: "Monthly Revenue",   value: 81420, change: "+9.2%",  context: "August 2024" },
  { label: "Active Users",      value: 12480, change: "+4.1%",  context: "This month" },
  { label: "New Signups",       value:  2340, change: "+18.4%", context: "Last 30 days" },
  { label: "Conversion Rate",   value:   3.8, change: "-0.4%",  context: "This week", suffix: "%" },
  { label: "Avg. Session Time", value:   4.6, change: "+1.2%",  context: "This week", suffix: "m" },
] as const;

export function MetricTile({ width, onResizeEdge }: TileRenderProps) {
  const [preset] = useState(() => PRESETS[Math.floor(Math.random() * PRESETS.length)]!);
  return (
    <div
      style={{ width, "--surface": "var(--card)" } as CSSProperties}
      className="group relative rounded-xl transition-all"
    >
      <MetricCard
        label={preset.label}
        value={preset.value}
        suffix={"suffix" in preset ? preset.suffix : undefined}
        context={preset.context}
        change={preset.change}
      />
      {onResizeEdge && <ResizeHandles onEdge={onResizeEdge} heightResize={false} />}
    </div>
  );
}
