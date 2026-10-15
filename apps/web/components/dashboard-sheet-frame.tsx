"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const SHEET_W = 1800;
const SHEET_H = 1120;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;

/** Pannable, zoomable grey workspace with a fixed-size sheet in the middle.
 *  Children render inside the sheet at natural size. The sheet is translated
 *  and scaled; the dot grid stays on the workspace behind. */
export function DashboardSheetFrame({
  zoom,
  onZoomChange,
  children,
}: {
  zoom: number;
  onZoomChange: (z: number) => void;
  children: ReactNode;
}) {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const panning = useRef<null | { sx: number; sy: number; px: number; py: number }>(null);

  // On first mount, only shrink the default zoom further if the sheet doesn't
  // even fit at the explicit initial zoom supplied by the parent.
  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const needed = Math.min((rect.width - 80) / SHEET_W, (rect.height - 80) / SHEET_H);
    if (needed < zoom && needed > MIN_ZOOM) onZoomChange(Math.round(needed * 100) / 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    // Never hijack clicks on interactive elements (buttons, inputs, etc) or anything inside the sheet.
    if (t.closest("button, a, input, textarea, select, [data-interactive]")) return;
    const onSheet = sheetRef.current?.contains(t);
    if (e.button === 1 || (e.button === 0 && !onSheet)) {
      e.preventDefault();
      workspaceRef.current?.setPointerCapture(e.pointerId);
      panning.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panning.current) return;
    setPan({
      x: panning.current.px + (e.clientX - panning.current.sx),
      y: panning.current.py + (e.clientY - panning.current.sy),
    });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panning.current) return;
    workspaceRef.current?.releasePointerCapture(e.pointerId);
    panning.current = null;
  };

  // Wheel: pan plain, Ctrl/⌘ + wheel zoom around cursor.
  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // Let scrollable children (like the sandbox's canvas) handle their own scroll
      // unless the user is explicitly zooming.
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const step = e.deltaY < 0 ? 0.1 : -0.1;
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((zoom + step) * 100) / 100));
        if (next === zoom) return;
        const sx = SHEET_W / 2 + (dx - pan.x) / zoom;
        const sy = SHEET_H / 2 + (dy - pan.y) / zoom;
        onZoomChange(next);
        setPan({
          x: dx - (sx - SHEET_W / 2) * next,
          y: dy - (sy - SHEET_H / 2) * next,
        });
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoom, pan.x, pan.y, onZoomChange]);

  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    onZoomChange(1);
  }, [onZoomChange]);

  return (
    <div
      ref={workspaceRef}
      className={`relative flex-1 min-w-0 min-h-0 overflow-hidden dot-grid
        bg-neutral-100 dark:bg-background
        ${panning.current ? "cursor-grabbing" : "cursor-grab"}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bg-card rounded-xl ring-1 ring-border/60 shadow-2xl shadow-black/15 overflow-hidden flex flex-row"
        style={{
          left: "50%",
          top: "50%",
          width: SHEET_W,
          height: SHEET_H,
          transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>

      {/* Hints */}
      <div className="absolute bottom-3 left-4 pointer-events-none text-[11px] text-muted-foreground/70 select-none">
        Drag empty space to pan · Ctrl/⌘ + scroll to zoom
      </div>

      {/* Reset view pill */}
      {(pan.x !== 0 || pan.y !== 0 || zoom !== 1) && (
        <button
          type="button"
          data-interactive
          onClick={resetView}
          className="absolute top-3 right-3 inline-flex items-center gap-1.5 h-7 px-2.5
            rounded-md border border-border/60 bg-background/80 backdrop-blur text-xs font-medium
            text-foreground hover:bg-sidebar-accent/80 transition-colors shadow-sm"
        >
          Reset view
        </button>
      )}
    </div>
  );
}
