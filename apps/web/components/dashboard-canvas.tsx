"use client";

/**
 * Dashboard canvas. Hosts tile instances positioned absolutely inside the
 * sheet. Replaces the old `DashboardSandbox` — all rendering is delegated to
 * the tile registry so adding a new chart type is a one-file change.
 *
 * Responsibilities:
 *  - Owns `tiles: Tile[]` state (unique id per instance → multi-instance support)
 *  - Listens for sidebar drag events + drop to create new tiles
 *  - Pointer-based drag to reposition (with swap + push collision resolution)
 *  - Pointer-based resize via tile edge handles (min size + collision clamping)
 *  - Right-click opens a context menu (delete, bring forward / send back)
 *  - Click-outside deselects
 */

import {
  useCallback, useEffect, useRef, useState,
  type MouseEvent as RMouseEvent,
  type PointerEvent as RPointerEvent,
} from "react";
import { ArrowDownToLineIcon, ArrowUpToLineIcon, TrashIcon } from "lucide-react";
import { TILE_REGISTRY } from "@/components/tiles/registry";
import {
  type Tile, type TileType, TILE_TYPES, createTileId,
  DEFAULT_SIZE, MIN_SIZE,
} from "@/components/tiles/types";
import {
  SNAP, GAP, snapCeil, snapFloor,
  overlaps, trySwap, tryPush, findNearestFree, type Box,
} from "@/components/tiles/shared/collision";

const DRAG_DATA_TYPE = "application/x-databubble-tile";
const TILE_TYPES_SET = new Set<string>(TILE_TYPES);

function isTileType(v: unknown): v is TileType {
  return typeof v === "string" && TILE_TYPES_SET.has(v);
}

interface DropPreview { type: TileType; x: number; y: number }
interface ContextMenu  { tileId: string; x: number; y: number }

const toBoxes = (tiles: Tile[]): Box[] =>
  tiles.map(t => ({ id: t.id, x: t.x, y: t.y, w: t.w, h: t.h }));

export function DashboardCanvas() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef(false);

  const tilesRef = useRef(tiles);
  tilesRef.current = tiles;

  function stageSize() {
    const stage = stageRef.current;
    return stage
      ? { w: stage.clientWidth, h: stage.clientHeight }
      : { w: Infinity, h: Infinity };
  }

  function stageLocal(clientX: number, clientY: number) {
    const stage = stageRef.current;
    if (!stage) return { x: clientX, y: clientY };
    const rect = stage.getBoundingClientRect();
    const scaleX = rect.width  / stage.clientWidth;
    const scaleY = rect.height / stage.clientHeight;
    return {
      x: (clientX - rect.left) / scaleX,
      y: (clientY - rect.top)  / scaleY,
    };
  }

  function clampToStage(x: number, y: number, w: number, h: number) {
    const { w: sw, h: sh } = stageSize();
    return {
      x: Math.max(0, Math.min(Math.max(0, sw - w), x)),
      y: Math.max(0, Math.min(Math.max(0, sh - h), y)),
    };
  }

  const bringToFront = useCallback((id: string) => {
    setTiles(prev => {
      const i = prev.findIndex(t => t.id === id);
      if (i === -1 || i === prev.length - 1) return prev;
      const next = [...prev];
      const [t] = next.splice(i, 1);
      next.push(t!);
      return next;
    });
  }, []);

  const sendToBack = useCallback((id: string) => {
    setTiles(prev => {
      const i = prev.findIndex(t => t.id === id);
      if (i <= 0) return prev;
      const next = [...prev];
      const [t] = next.splice(i, 1);
      next.unshift(t!);
      return next;
    });
  }, []);

  function addTile(type: TileType, centerX: number, centerY: number) {
    const { w, h } = DEFAULT_SIZE[type];
    const { w: sw, h: sh } = stageSize();
    const base = clampToStage(centerX - w / 2, centerY - h / 2, w, h);
    const existing = toBoxes(tilesRef.current);
    const spot = findNearestFree(base.x, base.y, w, h, "<new>", existing, sw, sh);
    const tile: Tile = {
      id: createTileId(), type,
      x: snapCeil(spot.x), y: snapCeil(spot.y),
      w, h,
    };
    setTiles(prev => [...prev, tile]);
    setSelectedId(tile.id);
  }

  function removeTile(id: string) {
    setTiles(prev => prev.filter(t => t.id !== id));
    setSelectedId(prev => (prev === id ? null : prev));
    setContextMenu(prev => (prev?.tileId === id ? null : prev));
  }

  // ── Sidebar drag coordination ─────────────────────────────────────────
  useEffect(() => {
    const onDragStart = (e: Event) => {
      const detail = (e as CustomEvent).detail as { type?: string } | undefined;
      if (isTileType(detail?.type)) {
        setDropPreview({ type: detail.type, x: -9999, y: -9999 });
      }
    };
    const onDragEnd = () => setDropPreview(null);
    window.addEventListener("sandbox-drag-start", onDragStart as EventListener);
    window.addEventListener("sandbox-drag-end", onDragEnd);
    return () => {
      window.removeEventListener("sandbox-drag-start", onDragStart as EventListener);
      window.removeEventListener("sandbox-drag-end", onDragEnd);
    };
  }, []);

  // ── Dismiss context menu on outside click / Escape ────────────────────
  useEffect(() => {
    if (!contextMenu) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-tile-menu]")) setContextMenu(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setContextMenu(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [contextMenu]);

  // ── Drop target handlers ─────────────────────────────────────────────
  function onDragOver(e: React.DragEvent) {
    if (!dropPreview) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const { x, y } = stageLocal(e.clientX, e.clientY);
    setDropPreview(prev => (prev ? { ...prev, x, y } : prev));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const type = e.dataTransfer.getData(DRAG_DATA_TYPE);
    if (!isTileType(type)) return;
    const { x, y } = stageLocal(e.clientX, e.clientY);
    addTile(type, x, y);
    setDropPreview(null);
  }

  // ── Tile reposition drag with swap / push collision ──────────────────
  function startDrag(e: RPointerEvent, id: string) {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, select, textarea, [data-no-drag]")) return;
    if (resizingRef.current) return;

    const stage = stageRef.current;
    if (!stage) return;

    e.preventDefault();
    const tile = tilesRef.current.find(t => t.id === id);
    if (!tile) return;

    setDraggingId(id);
    setSelectedId(id);
    bringToFront(id);

    const rect = stage.getBoundingClientRect();
    const scaleX = rect.width  / stage.clientWidth;
    const scaleY = rect.height / stage.clientHeight;
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startX = tile.x;
    const startY = tile.y;

    function onMove(ev: PointerEvent) {
      const dx = (ev.clientX - startClientX) / scaleX;
      const dy = (ev.clientY - startClientY) / scaleY;
      const current = tilesRef.current.find(t => t.id === id);
      if (!current) return;
      const { x, y } = clampToStage(startX + dx, startY + dy, current.w, current.h);
      setTiles(prev => prev.map(t => (t.id === id ? { ...t, x, y } : t)));
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDraggingId(null);

      // Resolve overlaps on release: swap → push → nudge.
      const dropped = tilesRef.current.find(t => t.id === id);
      if (!dropped) return;
      const { w: sw, h: sh } = stageSize();
      const others = tilesRef.current.filter(t => t.id !== id);
      const otherBoxes = toBoxes(others);

      const swap = trySwap(dropped.x, dropped.y, dropped.w, dropped.h, id, otherBoxes);
      if (swap) {
        setTiles(prev => prev.map(t =>
          t.id === id ? { ...t, x: swap.targetPos.x, y: swap.targetPos.y } :
          t.id === swap.targetId ? { ...t, x: dropped.x, y: dropped.y } : t,
        ));
        return;
      }

      const pushed = tryPush(dropped.x, dropped.y, dropped.w, dropped.h, id, otherBoxes, sw, sh);
      if (pushed) {
        setTiles(prev => prev.map(t => {
          const p = pushed.get(t.id);
          return p ? { ...t, x: p.x, y: p.y } : t;
        }));
        return;
      }

      // Fallback: snap the dragged tile to the nearest free slot.
      const spot = findNearestFree(dropped.x, dropped.y, dropped.w, dropped.h, id, otherBoxes, sw, sh);
      setTiles(prev => prev.map(t => (t.id === id ? { ...t, x: spot.x, y: spot.y } : t)));
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  // ── Resize ───────────────────────────────────────────────────────────
  function startResize(e: RMouseEvent, id: string, dir: "e" | "s" | "se") {
    e.preventDefault();
    e.stopPropagation();
    const tile = tilesRef.current.find(t => t.id === id);
    if (!tile) return;
    const min = MIN_SIZE[tile.type];
    resizingRef.current = true;
    setSelectedId(id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = tile.w;
    const startH = tile.h;

    const cursor =
      dir === "e" || min.h === 0 ? "ew-resize" :
      dir === "s" ? "ns-resize" : "nwse-resize";
    document.body.style.cursor     = cursor;
    document.body.style.userSelect = "none";

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const current = tilesRef.current.find(t => t.id === id);
      if (!current) return;

      let nextW = Math.max(min.w, startW + dx);
      let nextH = min.h > 0 ? Math.max(min.h, startH + dy) : current.h;

      // Clamp to stage
      const { w: sw, h: sh } = stageSize();
      nextW = Math.min(nextW, sw - current.x);
      if (min.h > 0) nextH = Math.min(nextH, sh - current.y);

      // Clamp against every other tile for GAP preservation
      for (const other of tilesRef.current) {
        if (other.id === id) continue;
        const vertAdj = other.y < current.y + nextH + GAP && other.y + other.h > current.y - GAP;
        if ((dir === "e" || dir === "se") && other.x > current.x && vertAdj) {
          nextW = Math.min(nextW, other.x - current.x - GAP);
        }
        if (min.h > 0 && (dir === "s" || dir === "se")) {
          const horizAdj = other.x < current.x + nextW + GAP && other.x + other.w > current.x - GAP;
          if (other.y > current.y && horizAdj) {
            nextH = Math.min(nextH, other.y - current.y - GAP);
          }
        }
      }

      nextW = Math.max(min.w, nextW);
      if (min.h > 0) nextH = Math.max(min.h, nextH);

      setTiles(prev => prev.map(t =>
        t.id === id ? { ...t, w: nextW, h: min.h > 0 ? nextH : t.h } : t,
      ));
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
      document.body.style.cursor     = "";
      document.body.style.userSelect = "";
      setTimeout(() => { resizingRef.current = false; }, 0);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  }

  // ── Context menu ─────────────────────────────────────────────────────
  function openContextMenu(e: RMouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    bringToFront(id);
    const PANEL_W = 220;
    const PANEL_H = 160;
    const x = e.clientX + PANEL_W + 8 > window.innerWidth ? Math.max(8, e.clientX - PANEL_W) : e.clientX + 4;
    const y = e.clientY + PANEL_H + 8 > window.innerHeight ? Math.max(8, window.innerHeight - PANEL_H - 8) : e.clientY + 4;
    setContextMenu({ tileId: id, x, y });
  }

  function onStagePointerDown(e: RPointerEvent) {
    if (e.target === stageRef.current) {
      setSelectedId(null);
      setContextMenu(null);
    }
  }

  const menuTile = contextMenu ? tiles.find(t => t.id === contextMenu.tileId) : null;

  return (
    <div
      ref={stageRef}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onPointerDown={onStagePointerDown}
      className="relative w-full h-full overflow-hidden"
    >
      {tiles.length === 0 && !dropPreview && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-muted-foreground">
            Drag a chart from the sidebar to start building
          </p>
        </div>
      )}

      {tiles.map((tile, idx) => {
        const entry = TILE_REGISTRY[tile.type];
        const Component = entry.Component;
        const isSelected = selectedId === tile.id;
        const isDragging = draggingId === tile.id;
        return (
          <div
            key={tile.id}
            onPointerDown={e => startDrag(e, tile.id)}
            onContextMenu={e => openContextMenu(e, tile.id)}
            onClick={e => { e.stopPropagation(); setSelectedId(tile.id); }}
            style={{
              position: "absolute",
              left: tile.x,
              top: tile.y,
              cursor: isDragging ? "grabbing" : "grab",
              zIndex: isSelected ? 1000 : idx + 1,
            }}
            className={`group ${isSelected ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-muted/20 rounded-xl" : ""}`}
          >
            <Component
              width={tile.w}
              height={tile.h}
              onResizeEdge={(e, dir) => startResize(e, tile.id, dir)}
            />
          </div>
        );
      })}

      {dropPreview && (() => {
        const size = DEFAULT_SIZE[dropPreview.type];
        const x = snapFloor(dropPreview.x - size.w / 2);
        const y = snapFloor(dropPreview.y - size.h / 2);
        if (x < -size.w || y < -size.h) return null;
        return (
          <div
            className="absolute pointer-events-none rounded-xl border-2 border-dashed border-blue-500/60 bg-blue-500/5 flex items-center justify-center"
            style={{ left: x, top: y, width: size.w, height: size.h }}
          >
            <span className="px-2 py-1 rounded-md bg-blue-500 text-white text-xs font-medium shadow-sm">
              {TILE_REGISTRY[dropPreview.type].label}  ·  {size.w}×{size.h}
            </span>
          </div>
        );
      })()}

      {contextMenu && menuTile && (
        <div
          data-tile-menu
          className="fixed z-[2000] w-[220px] rounded-xl border bg-popover shadow-lg py-1 text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onPointerDown={e => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {TILE_REGISTRY[menuTile.type].label}
            </p>
            <p className="text-xs text-muted-foreground/80 mt-0.5">
              {menuTile.w} × {menuTile.h} px
            </p>
          </div>
          <button
            type="button"
            onClick={() => { bringToFront(menuTile.id); setContextMenu(null); }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left"
          >
            <ArrowUpToLineIcon className="size-4 text-muted-foreground" />
            Bring to front
          </button>
          <button
            type="button"
            onClick={() => { sendToBack(menuTile.id); setContextMenu(null); }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left"
          >
            <ArrowDownToLineIcon className="size-4 text-muted-foreground" />
            Send to back
          </button>
          <div className="border-t my-1" />
          <button
            type="button"
            onClick={() => removeTile(menuTile.id)}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-destructive/10 text-destructive text-left"
          >
            <TrashIcon className="size-4" />
            Delete
          </button>
          <p className="px-3 py-1.5 text-[10px] text-muted-foreground/70 border-t mt-1">
            Full settings coming soon
          </p>
        </div>
      )}
    </div>
  );
}
