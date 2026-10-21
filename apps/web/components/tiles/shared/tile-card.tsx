"use client";

/**
 * Shared card chrome used by every tile. Produces the same visual frame the
 * old sandbox did (rounded-xl bordered card with overflow-hidden + hover tint),
 * and hosts resize handles when the canvas provides a resize callback.
 */

import type { CSSProperties, MouseEvent as RMouseEvent, ReactNode } from "react";
import { ResizeHandles, type ResizeDir } from "./resize-handles";

export function TileCard({
  width,
  style,
  className = "",
  onResizeEdge,
  heightResize = true,
  children,
}: {
  width: number;
  style?: CSSProperties;
  className?: string;
  onResizeEdge?: (e: RMouseEvent, dir: ResizeDir) => void;
  heightResize?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{ width, ...style }}
      className={`group relative rounded-xl border bg-card overflow-hidden
        hover:border-blue-300 dark:hover:border-blue-800
        transition-[border-color,box-shadow] ${className}`}
    >
      {children}
      {onResizeEdge && <ResizeHandles onEdge={onResizeEdge} heightResize={heightResize} />}
    </div>
  );
}
