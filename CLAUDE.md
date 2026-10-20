# DataBubble

"Tableau but in 2026" — paste a Google Sheets URL → auto-generate an interactive dashboard → share with team → from $9.99/month.

**Pricing:** Free ($0, 1 dashboard, no sharing) · Starter ($9.99/mo / £7.99, 10 dashboards, sharing — "Most popular") · Pro ($17.99/mo / £15.99, 20 dashboards, custom branding). Sharing is a paid feature (Starter+). Currency auto-detects via `navigator.language`.

Brand name: **DataBubble**. Domain: databubble.app. CSS classes use `db-` prefix.

## Monorepo structure

```
apps/web/          Next.js 16 App Router (primary app)
packages/ui/       Shared components (@workspace/ui/*)
```

`@/` resolves to `apps/web/` root.

## Key files

| File | Purpose |
|------|---------|
| `apps/web/app/page.tsx` | Landing page — hero, pricing, features, auth modal, create dialog |
| `apps/web/app/dashboard/page.tsx` | Server component — fetches user, renders `<DashboardShell>` |
| `apps/web/app/dashboard/dashboard-shell.tsx` | Client wrapper — SidebarProvider + AppSidebar + topbar + sheet frame + sandbox + FAB + toast host |
| `apps/web/app/dashboards/page.tsx` | My Dashboards — card grid with mini SVG chart previews, share settings |
| `apps/web/app/account/page.tsx` | Account — avatar color picker, name edit, AI usage bar, delete account |
| `apps/web/app/playground/dashboard-sandbox.tsx` | **Single source of truth for tile logic.** 10 chart types with full state + render + settings + swap/push/nudge collision. Rendered standalone at /playground; embedded at /dashboard with `hidePicker` |
| `apps/web/components/dashboard-sheet-frame.tsx` | Grey pannable workspace + fixed 1800×1120 sheet. Owns pan state; zoom controlled by parent via props |
| `apps/web/components/dashboard-topbar.tsx` | Breadcrumb + InlineEdit name + refresh + Share/Save ButtonGroup + ThemeSwitch |
| `apps/web/components/canvas-fab.tsx` | Floating button group bottom-right — zoom −/%/+ + Ask AI (chat shell) |
| `apps/web/components/toast-host.tsx` | Bottom-center toast slot driven by `{id,title,description}` state |
| `apps/web/components/app-sidebar.tsx` | Dashboard sidebar — brand wordmark + Recent + Charts (drag + click adds to canvas) + Data + user. Minimalist aesthetic — no tone chips, muted icons, soft blue indent line on open groups |
| `apps/web/components/brand-header.tsx` | Centered "DataBubble" wordmark in brand blue; collapses to "DB" when sidebar is in icon mode |
| `apps/web/components/theme-provider.tsx` | Lightweight local provider replacing next-themes. Exports `useTheme` with `{ theme, resolvedTheme, setTheme }`. FOUC-prevention script lives in server-rendered `<head>` of `app/layout.tsx` |
| `apps/web/components/nav-charts.tsx` | Chart picker rows: `onDragStart` + `onClick` both dispatch `sandbox-add-chart` window event |
| `apps/web/components/user-menu.tsx` | Shared UserMenu — hover dropdown, avatar, theme toggle, nav links, sign out |
| `apps/web/components/create-dashboard-dialog.tsx` | Shared create dialog — used on landing + dashboards pages |
| `apps/web/components/arc/*` | uiarc components (shadcn registry): charts, inline-edit, button-group, floating-button-group, breadcrumb, theme-switch, toast, tooltip, hover-card, expanding-search |
| `apps/web/lib/sheets.ts` | `extractSheetId` + `fetchSheetData` (Google Sheets CSV, no API key) |
| `apps/web/lib/analyze.ts` | Column type detection (`date / number / category / text / id`) |
| `apps/web/lib/palettes.ts` | 6 color palettes (Violet default) + `buildCustomPalette` |

## Dashboard canvas architecture (as of 2026-10-16)

The `/dashboard` middle area is a **pannable grey workspace with a fixed-size sheet floating in it**. The sheet embeds the `/playground` sandbox for all tile behaviour — don't rebuild per-tile components from scratch; always extract/embed.

- `<DashboardSheetFrame zoom onZoomChange>` — grey dot-grid workspace, 1800×1120 sheet centered. Pan via middle-click or empty-drag; zoom via Ctrl/⌘+scroll (cursor-anchored) or the FAB `−/%/+` controls. **Default zoom 0.7 is honoured regardless of window size** (no auto-fit shrink). Reset view returns to 0.7 with a grow+fade+slide-in entrance.
- `<DashboardSandbox hidePicker />` — the embedded sandbox. `hidePicker` collapses its own left picker; the dashboard's app sidebar is the chart picker instead. The sandbox owns drop handling directly — dashboard-shell is now a thin wrapper with no drop handler.
- `nav-charts.tsx` rows dispatch `sandbox-drag-start { type }` on `onDragStart`, `sandbox-drag-end` on `onDragEnd`, and `sandbox-add-chart { type }` on click. Drop position comes from the sandbox stage's own `onDrop`.
- **Drop preview**: dashed-blue ghost rectangle inside the stage, sized by `DROP_SIZES[type]`, with a chip in the corner showing the type + dims. Cursor-relative position computed scale-aware via `rect.width / stage.clientWidth`.
- `addChart(id, dropAt?)` accepts an optional `{ x, y }` and centers the tile on the cursor, clamped to stage bounds. Click (no dropAt) still uses `INITIAL_POSITIONS`.
- Sandbox stage is sized to the sheet exactly when embedded (no 1620px minimum), overflow-hidden, and **drag release is clamped to stage bounds** via `clampToStage`.
- One instance per chart type on canvas (sandbox's state hooks are shared per type). Splitting into per-tile components is a multi-day refactor — only do it if users explicitly ask for multiple instances of the same type.

### Canvas FAB (components/canvas-fab.tsx)
- Floating button-group bottom-right: zoom −, zoom %, zoom +, separator, Ask AI.
- +/− use `hideTooltip: true` (vendor-patched FBG prop) so they don't show "Zoom in"/"Zoom out" labels on hover.
- Zoom %: `onSelect` calls `startZoomEdit` → queries `button[data-fbg-item]` index 1 under `fbgRef`, grabs its rect, overlays a fixed-positioned `<input>` seeded with current %. Enter commits (clamped 25–250), Esc cancels, blur commits.

### Shortcut hints (bottom-left of sheet-frame)
- Floating `(i)` button → uiarc `HoverCard` panel listing Pan, Zoom, Save, Undo, Copy tile, Paste tile, Toggle theme with styled `<kbd>` glyphs. Opens on hover (120ms delay).

## Tech stack gotchas

**UI library**: Shadcn (Nova preset) + uiarc shadcn registry (`@uiarc/*`). Underlying primitives are mostly Radix 1.x (popover, dropdown, tooltip, hover-card are all Radix-based). Base UI (`@base-ui/react`) is only used by a few workspace/ui primitives — do not assume Base UI patterns for arc components.

**uiarc install gotchas** (re-check after any `shadcn add @uiarc/*`):
- `foundation.css` is NOT auto-imported — bridge any missing CSS vars in `packages/ui/src/styles/globals.css`.
- Tooltip ships without `asChild` → button-in-button hydration crash; patch after install.
- HoverCard ships with `render={<Surface/>}` on `PopoverPrimitive.Content` which Radix 1.x silently drops (naked content, no surface). Move `<Surface>` **inside** `<PopoverPrimitive.Content>` as a child instead.
- FloatingButtonGroup ships with no way to opt out of hover tooltips on iconOnly items. We vendor-patched a `hideTooltip?: boolean` prop on `FloatingButtonGroupAction`.

**Theme provider**: We rolled our own in `components/theme-provider.tsx` (not next-themes). React 19 + Next 16 warns about `<script>` tags inside client components, which next-themes 0.4.6 trips. The local provider exposes a compatible `useTheme` → `{ theme, resolvedTheme, setTheme }`. FOUC-prevention script is server-rendered inline in `app/layout.tsx`'s `<head>`.

**Dark mode**: CSS variable dark mode. Chart colors use the `theme` object in `ChartConfig` to set different shades per mode — `light: "oklch(0.371 0 0)"` / `dark: "oklch(0.87 0 0)"` — because `--chart-1` is a light grey in both modes and invisible against a light card background.

**Tile grid is inside the sandbox** (`app/playground/dashboard-sandbox.tsx`). The old `components/dashboard-grid.tsx` and its `computeCascade` / `push` system were deleted when `/dashboard` was rewritten to embed the sandbox. SNAP = 20px, GAP = 16px inside the sandbox. Collision follows the swap → push → nudge ladder (`trySwap` for ≥50% overlap on similar-sized tiles, `tryPush` with `snapCeil`/`snapFloor` for minimum displacement, `findNearestFree` ring-expansion as fallback). Auto-compact runs via a `ResizeObserver` debounced 120ms and only pushes neighbours DOWN on growth — never pulls up on shrink.

**Sidebar drag events (dashboard chart picker)**:
- `onDragStart`: `dataTransfer.setData("application/x-databubble-tile", type)` + `window.dispatchEvent(new CustomEvent("sandbox-drag-start", { detail: { type } }))` so the sandbox can show its drop-preview ghost at the cursor.
- `onDragEnd`: `window.dispatchEvent(new Event("sandbox-drag-end"))` to clear the ghost.
- `onClick`: `window.dispatchEvent(new CustomEvent("sandbox-add-chart", { detail: { type } }))` — click adds at `INITIAL_POSITIONS[type]`.
- `onDrop` is handled by the sandbox stage itself (not dashboard-shell). Drop → `addChart(type, { x: localX, y: localY })` with cursor-centered placement.

**Date math**: All period calculations use `dataMaxDate()` (max date in the data), NOT `new Date()`. This means "current month" = month of the most recent data row, standard BI behaviour for static datasets.

**Stale closures**: `layoutRef`, `columnsRef`, `rowsRef` are updated every render so sidebar-drag `useEffect` handlers (registered once) always read current state without re-registering.

**Portals**: Calendar date picker and context menu both render into `document.body` via `createPortal` to avoid layout disruption from parent overflow or z-index.

**Chart primitives**: Use `ChartContainer` + `ChartTooltipContent` from `@workspace/ui/components/chart` (not raw recharts). These are the shadcn/Nova chart wrappers that inject CSS variables and style the tooltip.

**Chart colors**: `SERIES_COLORS` constant in `dashboard-grid.tsx` — zero-chroma oklch for grey defaults. `primary: { light: "oklch(0.371 0 0)", dark: "oklch(0.87 0 0)" }`, `secondary: { light: "oklch(0.58 0 0)", dark: "oklch(0.62 0 0)" }`. Pie charts use `--chart-1` through `--chart-5` CSS variables for multi-slice colors.

**SVG overflow**: Recharts SVG has `overflow: visible` by default — chart paths bleed into card headers on large tiles. Fix: add `[&_.recharts-surface]:overflow-hidden` to `ChartContainer` className. This clips the SVG without affecting the tooltip sibling div.

**ResponsiveContainer in Portals**: Never use `<ResponsiveContainer width="100%">` inside a Base UI Portal (e.g. HoverCardContent). The Portal container has no CSS dimensions on first render so the chart renders at zero size. Use fixed pixel dimensions directly on the chart component instead: `<BarChart width={152} height={56} ...>`.

**Dual-series charts**: `aggregateByXMulti(rows, xCol, y1Col, y2Col, agg)` returns `{ x, y, y2 }[]`. Line/Area both support optional `yCol2`. Clearing `yCol2` auto-resets `stacked` and `showLegend`.

**Area chart gradients**: Each AreaCard uses unique SVG gradient IDs (`gy-${item.id}`, `gy2-${item.id}`) to avoid gradient conflicts between multiple area tiles on the canvas.

**Pie chart center label**: Font size is derived from the actual `innerRadius` pixel value passed by recharts to the Label content callback (`viewBox.innerRadius`), so text scales correctly as the tile is resized. Formula: `fs = clamp(ir * 0.5, 10, 22)`.

**Table primitive**: `TableCard` uses plain `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableCell` from `@workspace/ui/components/table` — NOT TanStack or dnd-kit. Sticky header via `sticky top-0 bg-muted`, scrollable body via `overflow-auto` on CardContent.

## UX principle

Value-first: users create a dashboard without an account. Auth (Clerk/NextAuth) is only prompted when they try to share or save.

## What's built

> **Note**: the drag/resize/collision bullets below describe the ORIGINAL `components/dashboard-grid.tsx` that was deleted when `/dashboard` was rewritten to embed the sandbox. The behaviours still broadly apply, but all mechanics now live inside `app/playground/dashboard-sandbox.tsx` (SNAP=20, GAP=16, swap → push → nudge ladder). Keep this list for reference of the feature surface, not for file-level details.

- [x] Landing page with URL paste modal
- [x] Server-side Google Sheets CSV fetch + parse
- [x] Column type detection (date / number / category / text / id)
- [x] Tile canvas via embedded sandbox — 10 chart types, drag/resize, swap+push+nudge collision, snap-to-grid
- [x] Drop from sidebar shows a sized dashed-blue ghost at the cursor; drop places tile centered on the cursor
- [x] Click the zoom % to type a custom value (25–250)
- [x] (i) in bottom-left opens hover shortcuts panel
- [x] Reset view returns to 70% default with grow+fade+slide-in entrance
- [x] **Stat cards** — drag from sidebar → config dialog (metric, aggregation, period, trend comparison)
  - Plain-div layout (not Card/CardHeader) — matches landing page KpiCard style exactly
  - Uppercase label, bold 3xl number, sign-based badge (emerald for `+`, rose for `-`), accent bar in palette primary color
  - Period filter system: `FilterPeriod` presets + custom date range (calendar portal)
  - Data-relative dates: "current month" = month of latest data point, not today
  - Trend comparison: computes current vs previous equivalent calendar period
  - Human-readable filter label displayed on card ("April 2024", "Q1 2024", etc.)
- [x] **Bar charts** — config dialog (X axis, Y axis, aggregation, period)
  - `aggregateByX()` groups rows by X value, applies chosen aggregation, sorts by date or alphabetically
  - Orientation toggle (vertical bars ↔ horizontal bars) stored in layout state
  - Theme-aware bar color: dark grey in light mode, light grey in dark mode
- [x] **Line charts** — smooth/linear toggle, optional second series, data labels toggle
  - Dual `LabelList`: y on `position="top"`, y2 on `position="bottom"` to prevent overlap
- [x] **Area charts** — optional second series, stack toggle (y2 only), legend toggle (y2 only)
  - SVG gradient fills with unique IDs per tile, `domain={[0,'auto']}` on YAxis to floor at zero
- [x] **Pie charts** — donut style, config dialog (slice column, value column, aggregation)
  - Center label shows total + column name, font size scales with innerRadius
  - Toggleable center total and color legend (both default on)
  - Up to 6 slices using `--chart-1` through `--chart-5` CSS variables
- [x] **Tables** — config dialog with column checkboxes (select/deselect all) and period filter
  - Sticky header, scrollable body, 100-row limit with "Showing N of M rows" footer
- [x] Sidebar hover previews for all tile types (fixed pixel dimensions, no ResponsiveContainer in portals)
- [x] **Text box tiles** — `type: "text"` tile with Tiptap v3 rich text editor. Drag from sidebar, double-click to edit.
  - Edit dialog: transparent `DialogContent` overlay, tile rendered at exact canvas dimensions, Tiptap toolbar above, Save/Cancel centred below
  - Toolbar uses `bg-background` (not `bg-muted`) — muted is near-white in light mode
  - Inactive toolbar buttons: `text-foreground/70` (not `text-muted-foreground`) for light-mode visibility
  - `useEditorState` hook required for reactive `isActive()` in toolbar — plain `useEditor` doesn't trigger re-renders
- [x] **Live edit previews** — all chart/table/stat edit dialogs show a two-column layout: form left, live preview right
  - `DialogContent` max-width must be overridden with inline `style={{ maxWidth: '56rem' }}` — base class `sm:max-w-sm` beats Tailwind utilities
  - Footer is a plain `<div>` not `<DialogFooter>` (which has `-mb-4` that clips content in `p-0` parents)
  - Preview chart mounts via `chartPreviewReady` gate (120ms timeout after dialog opens) — prevents Recharts line animation stuttering against the dialog's CSS open transition
  - All chart card components have `isPreview?: boolean` prop; bar chart preview wires `onToggleOrientation` to `chartConfigOrientation` state
  - Line/Area curves use `type="monotone"` — `"natural"` cubic splines can oscillate below zero into axis text
- [x] **Demo dashboard** — `/dashboard?demo=true` renders a fake bakery dataset ("The Crumb") with a pre-built layout. `buildDemoLayout(canvasW)` is called client-side after canvas width is measured so tiles fill the full width at any resolution. `ResizeObserver` re-runs it on window resize. Stat cards show August 2024 values with MoM trend vs July 2024, computed by `monthStats(prefix)` helper in `demo-data.ts`.
- [x] **Color palettes** — 6 palettes (Violet, Blue, Indigo, Rose, Teal, Coral). "Blue" (`id: "sky"`) is the default (`DEFAULT_PALETTE_ID = "sky"`) — rich brand blue matching `#3b82f6` (`oklch(0.58 0.22 257)`). Custom HSV color picker in the header.
  - `--ring` CSS variable is blue (`oklch(0.60 0.22 255)`) — all Input and NativeSelect focus rings are blue.
  - Checkboxes use `accent-blue-500`. Save/primary buttons use `bg-blue-500 hover:bg-blue-600 text-white`.
  - Badge color in StatCard is **sign-based**: `!trend.startsWith("-")` → emerald, else rose. This matches the landing page KpiCard convention and avoids confusion with semantically-inverted metrics (e.g. waste reduction is rose even though lower is better).
- [x] **AI dashboard generation** — "Generate dashboard →" on the landing page dialog calls Claude Haiku server-side with column schema + 20 sample rows. Haiku returns a `LayoutItem[]` JSON array in SNAP units; server scales to pixels, validates bounds/column references, right-aligns rows, computes stat values and trend comparisons, then passes as `initialLayout` to the canvas. Falls back to empty canvas on failure. `ANTHROPIC_API_KEY` in `apps/web/.env.local`.
  - Granularity detection: inspects median gap between unique dates → daily/weekly/monthly/yearly → drives trend label ("vs last week" etc.) and is included in the Haiku prompt so chart titles match.
- [x] **Cross-chart filters / slicers** — `FilterContext` holding `{ filters: SlicerFilters, dateFrom, dateTo, setFilter, setDateRange, clearAll }`. Clicking a bar or pie slice sets a categorical slicer. All card components call `applyGlobalFilter(rows, columns, filters, dateFrom, dateTo)` via context — bypasses `GridItem` React.memo.
  - Pie chart excludes its own xCol from `applyGlobalFilter` so all slices stay visible; selection shown via `fillOpacity` (0.35 for unselected)
  - Bar chart onClick uses `d.payload.x` (not `d.x` which is pixel position); date-type x columns skip click-to-filter
  - All charts remount on filter change via `key={filterKey}` → clean Recharts enter animation, no partial-draw glitch
- [x] **Filter panel** — floating popup (`absolute top-14 right-3`, `w-72`, `rounded-xl`, scale+opacity animation). Filters button top-right, palette-accent border/text, badge shows active count.
  - Date range: preset pills (All/7D/30D/3M/YTD/1Y) + custom dual-handle `DateRangeSlider` (document mousemove/mouseup, handles in closure)
  - Categorical slicers: one `<select>` per category/text column with 2–100 unique values
  - Footer: **Clear all** (disabled when no active filters) + **Done** (accent colour, closes panel)
  - Click-outside backdrop (`z-30`) behind the popup closes it on mousedown
- [x] **KPI count-up animation** — `useCountUp(target, duration=650)` hook. Animates from 0 on mount, between old/new values on filter change. `fromRef = null` reset in cleanup so React 18 Strict Mode double-invocation re-animates correctly. Ease-out cubic via RAF.
- [x] **Auth modal** — Supabase Auth (`@supabase/supabase-js` + `@supabase/ssr`). Email/password + Google OAuth (fully configured). Confirmation email screen on sign up. `UserMenu` hover dropdown — avatar color reads from `user_metadata.avatar_color` via `AVATAR_COLOR_HEX` map (inline styles, not dynamic Tailwind). Auth state via `getSession()` (fast, reads cookie) then `onAuthStateChange`. Session refreshed in `proxy.ts` (Next.js 16 name — NOT `middleware.ts`). Client: `utils/supabase/client.ts`. Server: `utils/supabase/server.ts`. Admin: `utils/supabase/admin.ts` (uses `SUPABASE_SECRET_KEY`).
- [x] **Supabase DB schema** — `profiles` (id, full_name, avatar_url, plan default 'free', stripe_customer_id, plan_expires_at, ai_generations_used) + `dashboards` (id, user_id, name, sheet_url, layout jsonb, share_slug, share_password_hash). RLS enabled. Auto-create profile trigger on `auth.users` insert.
- [x] **`/account` page** — Avatar color picker (6 colors, stored in `user_metadata.avatar_color`), name edit (`supabase.auth.updateUser`), AI usage progress bar, security section (email verified, 2FA coming soon), delete account (server action in `app/account/actions.ts` using admin client).
- [x] **`/dashboards` page** — Card grid (3 cols desktop). Each card has an SVG mini chart preview (bar/line/area with axis grid lines + tick labels), tile count, last viewed, visibility badge. "New dashboard" dashed card at grid end. Share settings dialog: public toggle, copy link, password protect checkbox. Blue border tint + lift on hover.
- [x] **`/terms` and `/privacy`** — Placeholder legal pages. Linked from footer Legal section.
- [x] **Shared `UserMenu`** (`components/user-menu.tsx`) — hover-to-open dropdown. Centered avatar/name/email header. Nav links (My Dashboards, Account, Billing). **Appearance toggle** (dark/light) with pill switch — theme toggle lives here, NOT in the nav. Sign out. Used on landing page and all inner pages.
- [x] **Shared `CreateDashboardDialog`** (`components/create-dashboard-dialog.tsx`) — no labels, tall inputs (h-12), URL field with Link icon prefix, "Add notes for AI" collapsible with CSS grid-row animation (0fr→1fr), "Start blank · Cancel" on one line. Used on landing page + dashboards page.
- [x] **Page transitions** — `animate-in fade-in-0 slide-in-from-bottom-3 duration-300` on content wrappers. Landing page hero fades in. Dashboards + account pages slide up on navigation.

## What's next (priority order)

### SaaS — build this to make money

1. **Save dashboard** ← START HERE. Schema is live. Wire canvas "Save" button → insert into `dashboards` table → enforce plan limits → replace fake rows in `/dashboards` with real data.
2. **Wire AI generation usage** — increment `profiles.ai_generations_used` in `generate-layout.ts` after each Haiku call. Gate on plan limits (Free: 5, Starter: 50, Pro: 200).
3. **Share link** — `share_slug` + `share_password_hash` columns exist. UI to generate slug, copy link. Route: `/dashboard/[id]` read-only public page. Starter+ only.
4. **Stripe billing** — `stripe_customer_id` + `plan_expires_at` on profiles. Wire Stripe Checkout + webhook to update `profiles.plan`.

### Launch readiness

**SEO / meta**
- [ ] Meta title on every page
- [ ] Meta description on every page
- [ ] Open Graph image
- [ ] Favicon set
- [ ] robots.txt
- [ ] sitemap.xml

**UX / UI**
- [ ] Custom 404 page
- [ ] Mobile breakpoints
- [ ] Loading states
- [ ] Cookie banner

**Legal / compliance**
- [x] Privacy policy page (`/privacy`)
- [x] Terms and conditions page (`/terms`)
- [ ] Cookie banner
- [ ] Real contact address

**Growth**
- [ ] Analytics installed

**AI generation gotchas**:
- Positions are in SNAP units (integers) in the prompt, multiplied by 24 server-side after parsing
- `rightAlignRows()` nudges the rightmost tile in each row to flush with `MAX_RIGHT` (only if gap ≤ 2 SNAP units)
- Stat card `value` is always computed server-side from real data — never trusted from AI response
- Trend uses `detectGranularity()` (median gap between unique dates) to pick daily/weekly/monthly/yearly comparison period
- `.env.local` is gitignored; `.env.example` documents the required `ANTHROPIC_API_KEY`

## Dev

```bash
cd C:/Users/LiamM/Desktop/Dashly/databubble
npm run dev
```

Add `ANTHROPIC_API_KEY=sk-ant-...` to `apps/web/.env.local` to enable AI dashboard generation.

## Dev workflow

- **Test after every change** — boot the dev server and manually verify the affected behaviour before reporting a fix as done.
- **Push only on user confirmation** — commit and push to GitHub only after the user has confirmed they're happy with how things are working.

Test data CSVs are in `test-data/` — use `ecommerce_sales.csv` or `sales_pipeline.csv` with a local server, or upload to Google Sheets and paste the share URL.
