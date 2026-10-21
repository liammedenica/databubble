/**
 * Tile registry. Single source of truth mapping `TileType` → component +
 * metadata. The canvas renders tiles by looking up `TILE_REGISTRY[tile.type]`.
 *
 * To add a new tile: create `components/tiles/<name>-tile.tsx` and register
 * it here. Nothing else changes.
 */

import type { ComponentType } from "react";
import {
  LineChart as LineIcon, BarChart3, PieChart as PieIcon, TrendingUp, Hash,
  Gauge as GaugeIcon, LayoutGrid, Calendar, LayoutDashboard, AreaChart,
} from "lucide-react";

import type { TileRenderProps, TileType } from "./types";
import { DEFAULT_SIZE } from "./types";

import { LineTile }      from "./line-tile";
import { BarTile }       from "./bar-tile";
import { DonutTile }     from "./donut-tile";
import { SparklineTile } from "./sparkline-tile";
import { MetricTile }    from "./metric-tile";
import { GaugeTile }     from "./gauge-tile";
import { WaffleTile }    from "./waffle-tile";
import { HeatmapTile }   from "./heatmap-tile";
import { TreemapTile }   from "./treemap-tile";
import { BrushTile }     from "./brush-tile";

export interface TileEntry {
  Component: ComponentType<TileRenderProps>;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  defaultSize: { w: number; h: number };
}

export const TILE_REGISTRY: Record<TileType, TileEntry> = {
  line:      { Component: LineTile,      label: "Line chart",   Icon: LineIcon,         defaultSize: DEFAULT_SIZE.line },
  bar:       { Component: BarTile,       label: "Bar chart",    Icon: BarChart3,        defaultSize: DEFAULT_SIZE.bar },
  donut:     { Component: DonutTile,     label: "Donut chart",  Icon: PieIcon,          defaultSize: DEFAULT_SIZE.donut },
  sparkline: { Component: SparklineTile, label: "Sparkline",    Icon: TrendingUp,       defaultSize: DEFAULT_SIZE.sparkline },
  metric:    { Component: MetricTile,    label: "Metric card",  Icon: Hash,             defaultSize: DEFAULT_SIZE.metric },
  gauge:     { Component: GaugeTile,     label: "Gauge",        Icon: GaugeIcon,        defaultSize: DEFAULT_SIZE.gauge },
  waffle:    { Component: WaffleTile,    label: "Waffle chart", Icon: LayoutGrid,       defaultSize: DEFAULT_SIZE.waffle },
  heatmap:   { Component: HeatmapTile,   label: "Heatmap",      Icon: Calendar,         defaultSize: DEFAULT_SIZE.heatmap },
  treemap:   { Component: TreemapTile,   label: "Treemap",      Icon: LayoutDashboard,  defaultSize: DEFAULT_SIZE.treemap },
  brush:     { Component: BrushTile,     label: "Range chart",  Icon: AreaChart,        defaultSize: DEFAULT_SIZE.brush },
};
