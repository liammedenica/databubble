"use client";

/**
 * East / South / South-East resize handles shown on hover of a TileCard.
 * The handles call back with a direction; the parent canvas owns the resize
 * state machine (pointer tracking, min/max clamping, collision).
 *
 * Set `heightResize={false}` for tiles that only support width changes
 * (metric, gauge, waffle, heatmap).
 */

import type { MouseEvent as RMouseEvent, PointerEvent as RPointerEvent } from "react";

export type ResizeDir = "e" | "s" | "se";

export function ResizeHandles({ onEdge, heightResize = true }: {
  onEdge: (e: RMouseEvent, dir: ResizeDir) => void;
  heightResize?: boolean;
}) {
  const stop = (e: RMouseEvent | RPointerEvent) => e.stopPropagation();
  return (
    <>
      <div
        onClick={stop}
        onPointerDown={stop}
        onMouseDown={e => onEdge(e, "e")}
        className="absolute top-4 bottom-4 -right-1 w-5 z-10 cursor-ew-resize group/h flex items-center justify-end pr-1"
      >
        <div className="flex flex-col gap-[3px] opacity-0 group-hover/h:opacity-100 transition-opacity">
          {[0, 1, 2, 3].map(i => <div key={i} className="w-[3px] h-[3px] rounded-full bg-border" />)}
        </div>
      </div>
      {heightResize && (
        <div
          onClick={stop}
          onPointerDown={stop}
          onMouseDown={e => onEdge(e, "s")}
          className="absolute -bottom-1 left-4 right-4 h-5 z-10 cursor-ns-resize group/h flex items-end justify-center pb-1"
        >
          <div className="flex gap-[3px] opacity-0 group-hover/h:opacity-100 transition-opacity">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-[3px] w-[3px] rounded-full bg-border" />)}
          </div>
        </div>
      )}
      <div
        onClick={stop}
        onPointerDown={stop}
        onMouseDown={e => onEdge(e, heightResize ? "se" : "e")}
        className={`absolute -bottom-1 -right-1 w-6 h-6 z-20 ${heightResize ? "cursor-nwse-resize" : "cursor-ew-resize"} opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-1`}
      >
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="text-border">
          <path d="M1 8H8V1M4.5 8H8V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
}
