"use client";

import { useState } from "react";
import { Gauge } from "@/components/arc/gauge/gauge";
import type { TileRenderProps } from "./types";
import { TileCard } from "./shared/tile-card";

const PRESETS = [
  { value: 72, label: "Server load",   detail: "of capacity" },
  { value: 48, label: "Storage used",  detail: "of 500GB"    },
  { value: 86, label: "SLA uptime",    detail: "this quarter" },
  { value: 23, label: "Error budget",  detail: "burned"       },
] as const;

export function GaugeTile({ width, onResizeEdge }: TileRenderProps) {
  const [preset] = useState(() => PRESETS[Math.floor(Math.random() * PRESETS.length)]!);
  return (
    <TileCard width={width} onResizeEdge={onResizeEdge} heightResize={false}>
      <div className="p-8 flex justify-center">
        <Gauge
          value={preset.value}
          label={preset.label}
          detail={preset.detail}
          thresholds={[
            { from: 0,  tone: "success", label: "Normal"   },
            { from: 70, tone: "warning", label: "High"     },
            { from: 90, tone: "danger",  label: "Critical" },
          ]}
        />
      </div>
    </TileCard>
  );
}
