/**
 * Collision + push helpers for the dashboard canvas.
 *
 * Rules of engagement (ported from the old sandbox):
 *  - Two rects collide if they overlap on both axes with less than GAP space.
 *  - On drop/drag, we try (in order):
 *      1. `trySwap` — if a dragged tile covers ≥ 50% of another similar-sized
 *         tile, swap positions.
 *      2. `tryPush`  — displace neighbours by the minimum distance that resolves
 *         the overlap, propagating transitively.
 *      3. `findNearestFree` — ring-expand around the drop point and return the
 *         first clear slot.
 */

export const SNAP = 20;
export const GAP  = 16;

export interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function overlaps(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw + GAP && ax + aw + GAP > bx
      && ay < by + bh + GAP && ay + ah + GAP > by;
}

export function snapCeil(v: number): number  { return Math.ceil(v / SNAP) * SNAP; }
export function snapFloor(v: number): number { return Math.floor(v / SNAP) * SNAP; }

/** Highest-overlap target over 50% dragged-box area — candidate for position swap. */
export function trySwap(
  dropX: number, dropY: number, dw: number, dh: number,
  excludeId: string,
  boxes: Box[],
): { targetId: string; targetPos: { x: number; y: number } } | null {
  let best: { id: string; area: number; pos: { x: number; y: number }; w: number; h: number } | null = null;
  for (const b of boxes) {
    if (b.id === excludeId) continue;
    const ox = Math.max(0, Math.min(dropX + dw, b.x + b.w) - Math.max(dropX, b.x));
    const oy = Math.max(0, Math.min(dropY + dh, b.y + b.h) - Math.max(dropY, b.y));
    const area = ox * oy;
    if (area <= 0) continue;
    if (!best || area > best.area) {
      best = { id: b.id, area, pos: { x: b.x, y: b.y }, w: b.w, h: b.h };
    }
  }
  if (!best) return null;
  const dropArea = dw * dh;
  if (best.area / dropArea < 0.5) return null;
  // Target footprint has to roughly match the dragged tile for a clean swap.
  if (Math.abs(best.w - dw) > SNAP * 2 || Math.abs(best.h - dh) > SNAP * 2) return null;
  return { targetId: best.id, targetPos: best.pos };
}

/**
 * Push neighbours away by the minimum displacement (horizontal or vertical)
 * that resolves each pairwise overlap. Returns the full set of positions on
 * success, or null if a push would leave something past the stage bounds.
 */
export function tryPush(
  dragX: number, dragY: number, dw: number, dh: number,
  excludeId: string,
  boxes: Box[],
  stageWidth: number,
  stageHeight: number,
): Map<string, { x: number; y: number }> | null {
  const working = new Map<string, { x: number; y: number }>();
  for (const b of boxes) working.set(b.id, { x: b.x, y: b.y });
  const sizes = new Map<string, { w: number; h: number }>();
  for (const b of boxes) sizes.set(b.id, { w: b.w, h: b.h });

  const queue: Array<{ x: number; y: number; w: number; h: number; id: string }> = [
    { x: dragX, y: dragY, w: dw, h: dh, id: excludeId },
  ];
  let safety = boxes.length * 4;

  while (queue.length && safety-- > 0) {
    const cur = queue.shift()!;
    for (const b of boxes) {
      if (b.id === cur.id) continue;
      const pos = working.get(b.id)!;
      const sz  = sizes.get(b.id)!;
      if (!overlaps(cur.x, cur.y, cur.w, cur.h, pos.x, pos.y, sz.w, sz.h)) continue;

      const pushRight = snapCeil(cur.x + cur.w + GAP);
      const pushDown  = snapCeil(cur.y + cur.h + GAP);
      const costRight = pushRight - pos.x;
      const costDown  = pushDown  - pos.y;

      let nx = pos.x, ny = pos.y;
      if (costRight > 0 && (costRight <= costDown || costDown <= 0)) {
        nx = pushRight;
      } else if (costDown > 0) {
        ny = pushDown;
      } else continue;

      if (nx + sz.w > stageWidth || ny + sz.h > stageHeight) return null;
      working.set(b.id, { x: nx, y: ny });
      queue.push({ x: nx, y: ny, w: sz.w, h: sz.h, id: b.id });
    }
  }
  if (safety < 0) return null;
  return working;
}

/** Spiral outward from the drop point looking for a non-overlapping slot. */
export function findNearestFree(
  dropX: number, dropY: number, dw: number, dh: number,
  excludeId: string,
  boxes: Box[],
  stageWidth: number,
  stageHeight: number,
): { x: number; y: number } {
  const clamp = (x: number, y: number) => ({
    x: Math.max(0, Math.min(stageWidth  - dw, x)),
    y: Math.max(0, Math.min(stageHeight - dh, y)),
  });
  const free = (x: number, y: number) => !boxes.some(b =>
    b.id !== excludeId && overlaps(x, y, dw, dh, b.x, b.y, b.w, b.h));

  const start = clamp(dropX, dropY);
  if (free(start.x, start.y)) return start;

  for (let r = SNAP; r <= Math.max(stageWidth, stageHeight); r += SNAP) {
    for (let dx = -r; dx <= r; dx += SNAP) {
      for (let dy = -r; dy <= r; dy += SNAP) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const p = clamp(dropX + dx, dropY + dy);
        if (free(p.x, p.y)) return p;
      }
    }
  }
  return start;
}
