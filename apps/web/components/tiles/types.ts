/**
 * Shared tile types.
 *
 * A `Tile` is one dashboard card instance. The canvas owns an array of them;
 * each one has a unique id so a user can drop 4 metric cards and they stay
 * independent.
 *
 * Each tile component owns its own data/config state internally — the canvas
 * only tracks position, size, and type. This keeps the orchestrator thin and
 * each tile self-contained (AI-composable).
 */

export type TileType =
  | "line"
  | "bar"
  | "donut"
  | "sparkline"
  | "metric"
  | "gauge"
  | "waffle"
  | "heatmap"
  | "treemap"
  | "brush";

export const TILE_TYPES: TileType[] = [
  "line", "bar", "donut", "sparkline", "metric",
  "gauge", "waffle", "heatmap", "treemap", "brush",
];

/** Canvas tile instance. One per card on the dashboard. */
export interface Tile {
  id: string;
  type: TileType;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Props every tile component receives from the frame. */
export interface TileRenderProps {
  width: number;
  height: number;
  /** Supplied by the canvas when a resize handle is mousedowned. */
  onResizeEdge?: (e: React.MouseEvent, dir: "e" | "s" | "se") => void;
}

/** Default footprint used for drop preview + initial sizing. */
export const DEFAULT_SIZE: Record<TileType, { w: number; h: number }> = {
  line:      { w: 500, h: 370 },
  bar:       { w: 500, h: 350 },
  donut:     { w: 480, h: 350 },
  sparkline: { w: 420, h: 160 },
  metric:    { w: 380, h: 140 },
  gauge:     { w: 340, h: 300 },
  waffle:    { w: 500, h: 370 },
  heatmap:   { w: 740, h: 220 },
  treemap:   { w: 680, h: 510 },
  brush:     { w: 680, h: 340 },
};

/** Minimum size when resizing. Height=0 means height is not user-resizable. */
export const MIN_SIZE: Record<TileType, { w: number; h: number }> = {
  line:      { w: 280, h: 180 },
  bar:       { w: 280, h: 180 },
  donut:     { w: 300, h:   0 },
  sparkline: { w: 240, h: 100 },
  metric:    { w: 220, h:   0 },
  gauge:     { w: 260, h:   0 },
  waffle:    { w: 320, h:   0 },
  heatmap:   { w: 400, h:   0 },
  treemap:   { w: 320, h: 240 },
  brush:     { w: 400, h: 220 },
};

/** Pixels of card chrome around the chart body (padding + headers). */
export const CHART_OVERHEAD: Record<TileType, number> = {
  line:      90,
  bar:       90,
  donut:      0, // not height-resizable
  sparkline: 80,
  metric:     0, // not height-resizable
  gauge:      0, // not height-resizable
  waffle:     0, // not height-resizable
  heatmap:    0, // not height-resizable
  treemap:   90,
  brush:    140,
};

let nextId = 0;
export function createTileId(): string {
  nextId += 1;
  return `tile-${Date.now().toString(36)}-${nextId}`;
}
