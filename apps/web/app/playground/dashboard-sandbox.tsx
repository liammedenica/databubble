"use client";

import { forwardRef, useImperativeHandle, useRef, useState, useLayoutEffect, useEffect } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  LineChart as LineChartIcon, BarChart3, PieChart as PieChartIcon, TrendingUp, Hash,
  Gauge as GaugeIcon, LayoutGrid, Calendar, LayoutDashboard, AreaChart as AreaChartIcon,
  PlusIcon, XIcon,
} from "lucide-react";
import { LineChart } from "@/components/arc/line-chart/line-chart";
import { BarChart } from "@/components/arc/bar-chart/bar-chart";
import { DonutChart, type DonutChartDatum } from "@/components/arc/donut-chart/donut-chart";
import { Sparkline } from "@/components/arc/sparkline/sparkline";
import { Gauge, type GaugeThreshold } from "@/components/arc/gauge/gauge";
import { MetricCard } from "@/components/arc/metric-card/metric-card";
import { WaffleChart, type WaffleCategory } from "@/components/arc/waffle-chart/waffle-chart";
import { ActivityHeatmap, type ActivityDay } from "@/components/arc/activity-heatmap/activity-heatmap";
import { Treemap, type TreemapNode } from "@/components/arc/treemap/treemap";
import { BrushChart, type BrushChartDatum, type BrushChartAnnotation } from "@/components/arc/brush-chart/brush-chart";
import { ColorPicker } from "@/components/arc/color-picker/color-picker";
import type { MetricPoint } from "@/components/arc/metric-explorer/metric-explorer";

// ── Seeded RNG ─────────────────────────────────────────────────────────────
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}

// ── Daily data ─────────────────────────────────────────────────────────────
function makeDailyData(days: number, base: number, amp: number, seed = 1): MetricPoint[] {
  const rng = seeded(seed);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date("2024-05-01");
    d.setDate(d.getDate() + i);
    return {
      date:  d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(base + Math.sin(i / 7) * amp + rng() * amp * 0.4),
    };
  });
}

const DS_REVENUE  = makeDailyData(90, 8200, 2000, 7);
const DS_SIGNUPS  = makeDailyData(90, 240,  55,   1);
const DS_SESSIONS = makeDailyData(90, 4100, 900,  13);

type Dataset = "revenue" | "signups" | "sessions";
const DATASETS: { label: string; value: Dataset }[] = [
  { label: "Revenue",  value: "revenue"  },
  { label: "Signups",  value: "signups"  },
  { label: "Sessions", value: "sessions" },
];
function getDs(d: Dataset): MetricPoint[] {
  return d === "revenue" ? DS_REVENUE : d === "sessions" ? DS_SESSIONS : DS_SIGNUPS;
}

// ── Donut data ─────────────────────────────────────────────────────────────
const P = [
  "oklch(0.62 0.22 257)", "oklch(0.60 0.22 290)", "oklch(0.68 0.18 75)",
  "oklch(0.60 0.17 195)", "oklch(0.62 0.22 10)",  "oklch(0.58 0.18 150)",
] as const;
const DONUT_TRAFFIC: DonutChartDatum[] = [
  { key: "direct",   label: "Direct",   value: 4320, color: P[0] },
  { key: "organic",  label: "Organic",  value: 3180, color: P[1] },
  { key: "referral", label: "Referral", value: 1890, color: P[2] },
  { key: "email",    label: "Email",    value: 1240, color: P[3] },
  { key: "social",   label: "Social",   value:  980, color: P[4] },
  { key: "paid",     label: "Paid",     value:  680, color: P[5] },
];
const DONUT_REVENUE: DonutChartDatum[] = [
  { key: "online",    label: "Online Store",  value: 58200, color: P[0] },
  { key: "instore",   label: "In-store",      value: 31400, color: P[1] },
  { key: "wholesale", label: "Wholesale",     value: 18700, color: P[2] },
  { key: "subs",      label: "Subscriptions", value:  9300, color: P[3] },
];
const DONUT_DEVICES: DonutChartDatum[] = [
  { key: "mobile",  label: "Mobile",  value: 5840, color: P[0] },
  { key: "desktop", label: "Desktop", value: 3210, color: P[1] },
  { key: "tablet",  label: "Tablet",  value: 1120, color: P[2] },
  { key: "other",   label: "Other",   value:  340, color: P[3] },
];
type DonutDs = "traffic" | "revenue" | "devices";
const DONUT_DATASETS: { label: string; value: DonutDs }[] = [
  { label: "Traffic", value: "traffic" },
  { label: "Revenue", value: "revenue" },
  { label: "Devices", value: "devices" },
];
function getDonutDs(d: DonutDs): DonutChartDatum[] {
  return d === "revenue" ? DONUT_REVENUE : d === "devices" ? DONUT_DEVICES : DONUT_TRAFFIC;
}

// ── Waffle data ────────────────────────────────────────────────────────────
const WAFFLE_REVENUE: WaffleCategory[] = [
  { key: "online",    label: "Online Store",  value: 58200, color: P[0] },
  { key: "instore",   label: "In-store",      value: 31400, color: P[1] },
  { key: "wholesale", label: "Wholesale",     value: 18700, color: P[2] },
  { key: "subs",      label: "Subscriptions", value:  9300, color: P[3] },
];
const WAFFLE_TEAM: WaffleCategory[] = [
  { key: "eng",    label: "Engineering", value: 24, color: P[0] },
  { key: "sales",  label: "Sales",       value: 18, color: P[1] },
  { key: "ops",    label: "Operations",  value: 12, color: P[2] },
  { key: "design", label: "Design",      value:  8, color: P[3] },
  { key: "other",  label: "Other",       value:  6, color: P[4] },
];
const WAFFLE_BUDGET: WaffleCategory[] = [
  { key: "product", label: "Product",  value: 42, color: P[0] },
  { key: "growth",  label: "Growth",   value: 28, color: P[1] },
  { key: "infra",   label: "Infra",    value: 16, color: P[2] },
  { key: "support", label: "Support",  value:  9, color: P[3] },
  { key: "admin",   label: "Admin",    value:  5, color: P[4] },
];
type WaffleDs = "revenue" | "team" | "budget";
const WAFFLE_DATASETS: { label: string; value: WaffleDs }[] = [
  { label: "Revenue", value: "revenue" },
  { label: "Team",    value: "team"    },
  { label: "Budget",  value: "budget"  },
];
function getWaffleDs(d: WaffleDs): WaffleCategory[] {
  return d === "team" ? WAFFLE_TEAM : d === "budget" ? WAFFLE_BUDGET : WAFFLE_REVENUE;
}

// ── Heatmap data ───────────────────────────────────────────────────────────
function makeHeatmapData(seed = 42): ActivityDay[] {
  const rng = seeded(seed);
  const days: ActivityDay[] = [];
  const start = new Date("2024-01-01");
  for (let i = 0; i < 365; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const date    = d.toISOString().slice(0, 10);
    const weekday = d.getDay();
    const base    = weekday === 0 || weekday === 6 ? 0.3 : 1;
    const spike   = rng() < 0.08 ? 3 : 1;
    const count   = Math.round(base * spike * rng() * 18);
    days.push({ date, count });
  }
  return days;
}
const HEATMAP_DAYS = makeHeatmapData(42);

// ── Treemap data ───────────────────────────────────────────────────────────
const TREEMAP_REVENUE: TreemapNode = {
  id: "root", label: "Revenue",
  children: [
    { id: "na", label: "North America", children: [
      { id: "us", label: "United States", value: 48200, color: 12.4 },
      { id: "ca", label: "Canada",        value:  8900, color:  8.1 },
      { id: "mx", label: "Mexico",        value:  3100, color: -2.3 },
    ]},
    { id: "eu", label: "Europe", children: [
      { id: "uk",     label: "UK",      value: 18400, color:  5.2 },
      { id: "de",     label: "Germany", value: 14200, color:  9.8 },
      { id: "fr",     label: "France",  value:  9800, color:  3.1 },
      { id: "eu_oth", label: "Other",   value:  8100, color:  1.4 },
    ]},
    { id: "apac", label: "Asia Pacific", children: [
      { id: "jp", label: "Japan",     value: 12300, color: 18.2 },
      { id: "au", label: "Australia", value:  7200, color: 11.5 },
      { id: "sg", label: "Singapore", value:  4100, color: 24.8 },
    ]},
    { id: "latam", label: "Latin America", children: [
      { id: "br", label: "Brazil",    value: 5400, color: -1.2 },
      { id: "ar", label: "Argentina", value: 2100, color: -8.4 },
    ]},
  ],
};
const TREEMAP_PRODUCTS: TreemapNode = {
  id: "root", label: "Revenue by product",
  children: [
    { id: "starter",  label: "Starter",    value: 42800, color:  8.4 },
    { id: "pro",      label: "Pro",        value: 31200, color: 22.1 },
    { id: "ent",      label: "Enterprise", value: 18900, color: 14.6 },
    { id: "addon_ai", label: "AI add-on",  value:  7400, color: 41.2 },
    { id: "addon_wh", label: "Webhooks",   value:  2900, color: 18.8 },
    { id: "addon_ss", label: "SSO",        value:  1600, color:  6.2 },
  ],
};
const TREEMAP_SPEND: TreemapNode = {
  id: "root", label: "Operating spend",
  children: [
    { id: "eng", label: "Engineering", children: [
      { id: "eng_sal",  label: "Salaries", value: 38000, color: 4.2 },
      { id: "eng_tool", label: "Tools",    value:  4200, color: 9.1 },
      { id: "eng_inf",  label: "Infra",    value:  8100, color: 2.8 },
    ]},
    { id: "sales", label: "Sales & Marketing", children: [
      { id: "sal_sal", label: "Salaries", value: 22000, color:  6.1 },
      { id: "sal_ads", label: "Ads",      value: 14000, color: 18.4 },
      { id: "sal_evt", label: "Events",   value:  3200, color: -4.2 },
    ]},
    { id: "ops", label: "Operations", children: [
      { id: "ops_sal", label: "Salaries",   value: 12000, color: 3.1 },
      { id: "ops_leg", label: "Legal",      value:  4800, color: 1.0 },
      { id: "ops_fac", label: "Facilities", value:  3600, color: 0.2 },
    ]},
  ],
};
type TreemapDs = "revenue" | "products" | "spend";
const TREEMAP_DATASETS: { label: string; value: TreemapDs }[] = [
  { label: "Revenue",  value: "revenue"  },
  { label: "Products", value: "products" },
  { label: "Spend",    value: "spend"    },
];
function getTreemapDs(d: TreemapDs): TreemapNode {
  return d === "products" ? TREEMAP_PRODUCTS : d === "spend" ? TREEMAP_SPEND : TREEMAP_REVENUE;
}

// ── Brush data ─────────────────────────────────────────────────────────────
function makeBrushData(days: number, base: number, amp: number, seed = 1): BrushChartDatum[] {
  const rng = seeded(seed);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date("2024-01-01");
    d.setDate(d.getDate() + i);
    const trend = 1 + (i / days) * 0.4;
    return { date: d, value: Math.max(0, Math.round((base + Math.sin(i / 14) * amp + rng() * amp * 0.5) * trend)) };
  });
}
const BRUSH_SIGNUPS  = makeBrushData(730, 180,  60,   1);
const BRUSH_REVENUE  = makeBrushData(730, 6000, 2000, 7);
const BRUSH_SESSIONS = makeBrushData(730, 3200, 800,  13);
const BRUSH_ANNOTATIONS: BrushChartAnnotation[] = [
  { date: new Date("2024-03-10"), label: "Beta launch",   description: "Public beta opened"    },
  { date: new Date("2024-07-22"), label: "v2.0",          description: "Dashboard v2 released" },
  { date: new Date("2024-11-29"), label: "Black Friday",  description: "Promo campaign"        },
  { date: new Date("2025-01-06"), label: "New year push", description: "January campaign"      },
  { date: new Date("2025-06-01"), label: "Series A",      description: "Funding announced"     },
];
type BrushDs = "signups" | "revenue" | "sessions";
const BRUSH_DATASETS: { label: string; value: BrushDs }[] = [
  { label: "Signups",  value: "signups"  },
  { label: "Revenue",  value: "revenue"  },
  { label: "Sessions", value: "sessions" },
];
const BRUSH_WINDOW_OPTS = [
  { label: "30d", days: 30  },
  { label: "90d", days: 90  },
  { label: "6m",  days: 182 },
  { label: "1y",  days: 365 },
  { label: "All", days: 730 },
];
function getBrushDs(d: BrushDs): BrushChartDatum[] {
  return d === "revenue" ? BRUSH_REVENUE : d === "sessions" ? BRUSH_SESSIONS : BRUSH_SIGNUPS;
}

// ── Range filter ───────────────────────────────────────────────────────────
const RANGE_OPTS = [
  { label: "7d",  days: 7  },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "60d", days: 60 },
  { label: "90d", days: 90 },
];

const ANIM_EASE = [0.4, 0, 0.2, 1] as const;

// ── UI primitives ──────────────────────────────────────────────────────────
function FilterPills({ days, onDaysChange }: { days: number; onDaysChange: (d: number) => void }) {
  return (
    <div className="flex gap-0.5 p-0.5 rounded-full bg-muted">
      {RANGE_OPTS.map(r => (
        <button key={r.label} onClick={e => { e.stopPropagation(); onDaysChange(r.days); }}
          className={`px-2.5 py-[3px] rounded-full text-xs font-medium transition-colors whitespace-nowrap
            ${days === r.days ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          {r.label}
        </button>
      ))}
    </div>
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-5 mb-2 first:mt-0">{children}</p>;
}
function SDivider() { return <div className="border-t my-4" />; }

function SToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-1.5 cursor-pointer select-none">
      <span className="text-sm text-foreground">{label}</span>
      <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative w-8 h-[18px] rounded-full transition-colors shrink-0 ${checked ? "bg-blue-500" : "bg-muted-foreground/25"}`}>
        <span className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[14px]" : ""}`} />
      </button>
    </label>
  );
}

function SSlider({ label, value, min, max, step = 1, unit = "px", onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="py-1">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none bg-border cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-sm" />
    </div>
  );
}

function SInput({ label, value, onChange }: { label: string; value: string | number; onChange: (v: string) => void }) {
  return (
    <div className="py-1">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-sm text-foreground
          outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors" />
    </div>
  );
}

function SSegment<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { label: string; value: T }[]; onChange: (v: T) => void;
}) {
  return (
    <div className="py-1">
      {label && <p className="text-xs text-muted-foreground mb-1.5">{label}</p>}
      <div className="flex gap-1">
        {options.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors
              ${value === o.value ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function kpiFmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

// ── Resize handles ─────────────────────────────────────────────────────────
function ResizeHandles({ onEdge, heightResize = true }: {
  onEdge: (e: React.MouseEvent, dir: "e" | "s" | "se") => void;
  heightResize?: boolean;
}) {
  const stop = (e: React.MouseEvent | React.PointerEvent) => e.stopPropagation();
  return (
    <>
      <div onClick={stop} onPointerDown={stop} onMouseDown={e => onEdge(e, "e")}
        className="absolute top-4 bottom-4 -right-1 w-5 z-10 cursor-ew-resize group/h flex items-center justify-end pr-1">
        <div className="flex flex-col gap-[3px] opacity-0 group-hover/h:opacity-100 transition-opacity">
          {[0,1,2,3].map(i => <div key={i} className="w-[3px] h-[3px] rounded-full bg-border" />)}
        </div>
      </div>
      {heightResize && (
        <div onClick={stop} onPointerDown={stop} onMouseDown={e => onEdge(e, "s")}
          className="absolute -bottom-1 left-4 right-4 h-5 z-10 cursor-ns-resize group/h flex items-end justify-center pb-1">
          <div className="flex gap-[3px] opacity-0 group-hover/h:opacity-100 transition-opacity">
            {[0,1,2,3].map(i => <div key={i} className="h-[3px] w-[3px] rounded-full bg-border" />)}
          </div>
        </div>
      )}
      <div onClick={stop} onPointerDown={stop} onMouseDown={e => onEdge(e, heightResize ? "se" : "e")}
        className={`absolute -bottom-1 -right-1 w-6 h-6 z-20 ${heightResize ? "cursor-nwse-resize" : "cursor-ew-resize"} opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-1`}>
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="text-border">
          <path d="M1 8H8V1M4.5 8H8V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </>
  );
}

// ── ChartId ────────────────────────────────────────────────────────────────
type ChartId = "line" | "bar" | "donut" | "sparkline" | "metric" | "gauge" | "waffle" | "heatmap" | "treemap" | "brush";

const CHART_LABELS: Record<ChartId, string> = {
  line: "Line Chart", bar: "Bar Chart", donut: "Donut Chart", sparkline: "Sparkline",
  metric: "Metric Card", gauge: "Gauge", waffle: "Waffle Chart",
  heatmap: "Activity Heatmap", treemap: "Treemap", brush: "Brush Chart",
};

const CHART_ICONS: Record<ChartId, React.ComponentType<{ className?: string }>> = {
  line: LineChartIcon, bar: BarChart3, donut: PieChartIcon, sparkline: TrendingUp,
  metric: Hash, gauge: GaugeIcon, waffle: LayoutGrid,
  heatmap: Calendar, treemap: LayoutDashboard, brush: AreaChartIcon,
};

const SNAP = 20;
const GAP  = 16; // uniform gap between all cards, used for both drop and resize collision
const ALL_IDS: ChartId[] = ["line", "bar", "donut", "sparkline", "metric", "gauge", "waffle", "heatmap", "treemap", "brush"];
const ROW_GROUPS: ChartId[][] = [
  ["line", "bar", "donut"],
  ["heatmap", "treemap"],
  ["sparkline", "gauge", "metric"],
  ["waffle", "brush"],
];
const INITIAL_POSITIONS: Record<ChartId, {x:number;y:number}> = {
  // X values spaced by GAP=16 between card widths. Y is overwritten by masonry packing.
  line:      { x: 0,    y: 0 },
  bar:       { x: 516,  y: 0 },  // 0 + 500 + 16
  donut:     { x: 1032, y: 0 },  // 516 + 500 + 16
  heatmap:   { x: 0,    y: 0 },
  treemap:   { x: 756,  y: 0 },  // 0 + 740 + 16
  sparkline: { x: 0,    y: 0 },
  gauge:     { x: 436,  y: 0 },  // 0 + 420 + 16
  metric:    { x: 792,  y: 0 },  // 436 + 340 + 16
  waffle:    { x: 0,    y: 0 },
  brush:     { x: 516,  y: 0 },  // 0 + 500 + 16
};

// ── DashboardSandbox ───────────────────────────────────────────────────────
export type DashboardSandboxHandle = { addChart: (id: ChartId) => void };

export const DashboardSandbox = forwardRef<DashboardSandboxHandle, {
  hidePicker?: boolean;
  initialVisible?: ChartId[];
}>(function DashboardSandbox({ hidePicker = false, initialVisible }, ref) {
  const [selected, setSelected] = useState<ChartId | null>(null);
  const resizingRef = useRef(false);

  // ── Line ──────────────────────────────────────────────────────────────
  const [lineDs,         setLineDs]         = useState<Dataset>("revenue");
  const [lineTitle,      setLineTitle]      = useState("Revenue");
  const [lineShowTitle,  setLineShowTitle]  = useState(false);
  const [lineShowFilter, setLineShowFilter] = useState(false);
  const [lineDays,       setLineDays]       = useState(30);
  const [lineWidth,      setLineWidth]      = useState(500);
  const [lineHeight,     setLineHeight]     = useState(280);
  const [lineColor,      setLineColor]      = useState("oklch(0.62 0.22 257)");
  const [lineArea,       setLineArea]       = useState(true);
  const [lineCurve,      setLineCurve]      = useState<"smooth" | "linear">("smooth");
  const [lineS1Label,    setLineS1Label]    = useState("This period");
  const [lineShowS2,     setLineShowS2]     = useState(false);
  const [lineS2Color,    setLineS2Color]    = useState("oklch(0.55 0.04 240)");
  const [lineS2Label,    setLineS2Label]    = useState("Prev. period");
  const [lineShowKpi,    setLineShowKpi]    = useState(false);
  const [lineShowLegend, setLineShowLegend] = useState(true);
  const [lineHidden,     setLineHidden]     = useState<string[]>([]);

  // ── Bar ───────────────────────────────────────────────────────────────
  const [barDs,         setBarDs]         = useState<Dataset>("signups");
  const [barTitle,      setBarTitle]      = useState("Signups");
  const [barShowTitle,  setBarShowTitle]  = useState(false);
  const [barShowFilter, setBarShowFilter] = useState(false);
  const [barDays,       setBarDays]       = useState(14);
  const [barWidth,      setBarWidth]      = useState(500);
  const [barHeight,     setBarHeight]     = useState(260);
  const [barShowKpi,    setBarShowKpi]    = useState(true);
  const [barShowAvg,    setBarShowAvg]    = useState(true);
  const [barUnit,       setBarUnit]       = useState("signups");

  // ── Donut ─────────────────────────────────────────────────────────────
  const [donutDs,           setDonutDs]           = useState<DonutDs>("revenue");
  const [donutTitle,        setDonutTitle]        = useState("Traffic sources");
  const [donutShowTitle,    setDonutShowTitle]    = useState(false);
  const [donutCardWidth,    setDonutCardWidth]    = useState(480);
  const [donutSize,         setDonutSize]         = useState(220);
  const [donutThickness,    setDonutThickness]    = useState(28);
  const [donutUnit,         setDonutUnit]         = useState("visits");
  const [donutTotalLabel,   setDonutTotalLabel]   = useState("Total");
  const [donutLegend,       setDonutLegend]       = useState(true);
  const [donutLegendAction, setDonutLegendAction] = useState<"toggle" | "select">("toggle");

  // ── Sparkline ─────────────────────────────────────────────────────────
  const [sparkTitle,       setSparkTitle]       = useState("Revenue Trend");
  const [sparkShowTitle,   setSparkShowTitle]   = useState(false);
  const [sparkDs,          setSparkDs]          = useState<Dataset>("revenue");
  const [sparkWidth,       setSparkWidth]       = useState(420);
  const [sparkHeight,      setSparkHeight]      = useState(80);
  const [sparkTone,        setSparkTone]        = useState<"success" | "danger" | "warning">("success");
  const [sparkArea,        setSparkArea]        = useState(true);
  const [sparkInteractive, setSparkInteractive] = useState(true);
  const [sparkDisplayVal,  setSparkDisplayVal]  = useState("$112K");
  const [sparkDisplayChg,  setSparkDisplayChg]  = useState("+19.2%");
  const [sparkDays,        setSparkDays]        = useState(30);

  // ── MetricCard ────────────────────────────────────────────────────────
  const [metricLabel,       setMetricLabel]       = useState("Monthly Revenue");
  const [metricValue,       setMetricValue]       = useState(81420);
  const [metricChange,      setMetricChange]      = useState("+9.2%");
  const [metricContext,     setMetricContext]     = useState("August 2024");
  const [metricSuffix,      setMetricSuffix]      = useState("");
  const [metricShowLabel,   setMetricShowLabel]   = useState(true);
  const [metricShowChange,  setMetricShowChange]  = useState(true);
  const [metricShowContext, setMetricShowContext] = useState(true);
  const [metricWidth,       setMetricWidth]       = useState(380);

  // ── Gauge ─────────────────────────────────────────────────────────────
  const [gaugeCardTitle,     setGaugeCardTitle]     = useState("Server Load");
  const [gaugeCardShowTitle, setGaugeCardShowTitle] = useState(false);
  const [gaugeValue,  setGaugeValue]  = useState(72);
  const [gaugeLabel,  setGaugeLabel]  = useState("Server load");
  const [gaugeDetail, setGaugeDetail] = useState("of capacity");
  const [gaugeWidth,  setGaugeWidth]  = useState(340);
  const [gaugeT2,     setGaugeT2]     = useState(70);
  const [gaugeT3,     setGaugeT3]     = useState(90);
  const [gaugeL1,     setGaugeL1]     = useState("Normal");
  const [gaugeL2,     setGaugeL2]     = useState("High");
  const [gaugeL3,     setGaugeL3]     = useState("Critical");

  // ── Waffle ────────────────────────────────────────────────────────────
  const [waffleTitle,     setWaffleTitle]     = useState("Revenue Mix");
  const [waffleShowTitle, setWaffleShowTitle] = useState(false);
  const [waffleDs,     setWaffleDs]     = useState<WaffleDs>("revenue");
  const [waffleRows,   setWaffleRows]   = useState(10);
  const [waffleCols,   setWaffleCols]   = useState(10);
  const [waffleLegend, setWaffleLegend] = useState(true);
  const [waffleUnit,   setWaffleUnit]   = useState("");
  const [waffleWidth,  setWaffleWidth]  = useState(500);

  // ── Heatmap ───────────────────────────────────────────────────────────
  const [heatmapTitle,     setHeatmapTitle]     = useState("Contributions in 2024");
  const [heatmapShowTitle, setHeatmapShowTitle] = useState(false);
  const [heatmapUnitOne,   setHeatmapUnitOne]   = useState("contribution");
  const [heatmapUnitOther, setHeatmapUnitOther] = useState("contributions");
  const [heatmapWeekStart, setHeatmapWeekStart] = useState<"0" | "1">("1");
  const [heatmapColor,     setHeatmapColor]     = useState("oklch(0.62 0.22 257)");
  const [heatmapWidth,     setHeatmapWidth]     = useState(740);
  const [heatmapSelected,  setHeatmapSelected]  = useState<string | null>(null);

  // ── Treemap ───────────────────────────────────────────────────────────
  const [treemapTitle,     setTreemapTitle]     = useState("Revenue Breakdown");
  const [treemapShowTitle, setTreemapShowTitle] = useState(false);
  const [treemapDs,        setTreemapDs]        = useState<TreemapDs>("products");
  const [treemapShowColor, setTreemapShowColor] = useState(true);
  const [treemapWidth,     setTreemapWidth]     = useState(680);
  const [treemapHeight,    setTreemapHeight]    = useState(420);
  const [treemapFocus,     setTreemapFocus]     = useState("root");

  // ── Brush ─────────────────────────────────────────────────────────────
  const [brushTitle,     setBrushTitle]     = useState("Daily Signups");
  const [brushShowTitle, setBrushShowTitle] = useState(false);
  const [brushDs,          setBrushDs]          = useState<BrushDs>("signups");
  const [brushShowAnnot,   setBrushShowAnnot]   = useState(true);
  const [brushUnit,        setBrushUnit]        = useState("signups");
  const [brushWidth,       setBrushWidth]       = useState(680);
  const [brushHeight,      setBrushHeight]      = useState(200);
  const [brushOverviewH,   setBrushOverviewH]   = useState(48);
  const [brushWindowDays,  setBrushWindowDays]  = useState(90);

  // ── Canvas drag ───────────────────────────────────────────────────────────
  const [positions,  setPositions]  = useState<Record<ChartId, {x:number;y:number}>>(INITIAL_POSITIONS);
  const [zOrder,     setZOrder]     = useState<ChartId[]>([...ALL_IDS]);
  const [draggingId, setDraggingId] = useState<ChartId | null>(null);
  const [visible,    setVisible]    = useState<Set<ChartId>>(() => new Set(initialVisible ?? []));
  const stageRef = useRef<HTMLDivElement>(null);

  function clampToStage(x: number, y: number, w: number, h: number) {
    const stage = stageRef.current;
    if (!stage) return { x: Math.max(0, x), y: Math.max(0, y) };
    const maxX = Math.max(0, stage.clientWidth  - w);
    const maxY = Math.max(0, stage.clientHeight - h);
    return { x: Math.max(0, Math.min(maxX, x)), y: Math.max(0, Math.min(maxY, y)) };
  }
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: ChartId } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Dismiss context menu on outside click or Escape.
  useLayoutEffect(() => {
    if (!contextMenu) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setContextMenu(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [contextMenu]);

  function openContextMenu(e: React.MouseEvent, id: ChartId) {
    e.preventDefault();
    setSelected(id);
    setZOrder(prev => [...prev.filter(x => x !== id), id]);
    const PANEL_W = 260;
    const PANEL_H_MAX = 520;
    const x = e.clientX + PANEL_W + 8 > window.innerWidth ? Math.max(8, e.clientX - PANEL_W) : e.clientX + 4;
    const y = e.clientY + PANEL_H_MAX + 8 > window.innerHeight ? Math.max(8, window.innerHeight - PANEL_H_MAX - 8) : e.clientY + 4;
    setContextMenu({ x, y, id });
  }

  function addChart(id: ChartId) {
    if (visible.has(id)) {
      // Already on canvas — select + bring to front for feedback.
      setSelected(id);
      setZOrder(prev => [...prev.filter(x => x !== id), id]);
      return;
    }
    // Place at the initial position but clamped to the stage. When embedded in
    // the smaller dashboard sheet, this also prevents tiles landing off-screen.
    const initial = INITIAL_POSITIONS[id];
    const stage = stageRef.current;
    // Approximate tile size with a conservative default so we never overshoot.
    const APPROX = 500;
    const clamped = stage
      ? { x: Math.max(0, Math.min(stage.clientWidth - APPROX, initial.x)), y: Math.max(0, Math.min(stage.clientHeight - 200, initial.y)) }
      : initial;
    setPositions(prev => ({ ...prev, [id]: clamped }));
    setVisible(prev => { const next = new Set(prev); next.add(id); return next; });
    setZOrder(prev => [...prev.filter(x => x !== id), id]);
    setSelected(id);
  }

  function removeChart(id: ChartId) {
    setVisible(prev => { const next = new Set(prev); next.delete(id); return next; });
    setSelected(prev => prev === id ? null : prev);
  }

  // External handle so the dashboard shell can drop tiles via sidebar drag.
  useImperativeHandle(ref, () => ({ addChart }), [addChart]);

  // Also listen for a global event (back-compat for drag events the dashboard sidebar fires).
  useEffect(() => {
    const SIDEBAR_IDS = new Set<ChartId>(["line", "bar", "donut", "sparkline", "metric", "gauge", "waffle", "heatmap", "treemap", "brush"]);
    const onAddEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail as { type?: string } | undefined;
      const type = detail?.type;
      if (type && SIDEBAR_IDS.has(type as ChartId)) addChart(type as ChartId);
    };
    window.addEventListener("sandbox-add-chart", onAddEvent as EventListener);
    return () => window.removeEventListener("sandbox-add-chart", onAddEvent as EventListener);
  }, [addChart]);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const cardRefs = useRef<Partial<Record<ChartId, HTMLDivElement | null>>>({});

  // Masonry packing: each card lands at the lowest y above anything in its x-span.
  // Eliminates the "huge empty space" below short cards that sit next to tall ones.
  useLayoutEffect(() => {
    const next = { ...INITIAL_POSITIONS } as Record<ChartId, { x: number; y: number }>;
    const placed: { x: number; y: number; w: number; h: number }[] = [];
    for (const id of ROW_GROUPS.flat()) {
      const el = cardRefs.current[id];
      if (!el) continue;
      const x = INITIAL_POSITIONS[id].x;
      const w = el.offsetWidth, h = el.offsetHeight;
      let y = 0;
      for (const p of placed) {
        if (x < p.x + p.w + GAP && x + w + GAP > p.x) {
          y = Math.max(y, p.y + p.h + GAP);
        }
      }
      next[id] = { x, y };
      placed.push({ x, y, w, h });
    }
    setPositions(next);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-push neighbours when a card grows (e.g., title/KPI toggle makes it taller).
  // Debounced so Motion's height animation doesn't thrash the layout every frame.
  useLayoutEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const doCompact = () => {
      timer = null;
      const items = ALL_IDS
        .map(id => {
          const el = cardRefs.current[id];
          if (!el) return null;
          return { id, w: el.offsetWidth, h: el.offsetHeight };
        })
        .filter((v): v is { id: ChartId; w: number; h: number } => v !== null);

      const old = { ...positionsRef.current };
      const next = { ...positionsRef.current };
      items.sort((a, b) => (next[a.id].y - next[b.id].y) || (next[a.id].x - next[b.id].x));

      for (let i = 0; i < items.length; i++) {
        const a = items[i]!, aPos = next[a.id];
        for (let j = i + 1; j < items.length; j++) {
          const b = items[j]!, bPos = next[b.id];
          const overlap =
            aPos.x < bPos.x + b.w + GAP && aPos.x + a.w + GAP > bPos.x &&
            aPos.y < bPos.y + b.h + GAP && aPos.y + a.h + GAP > bPos.y;
          if (overlap) {
            const newY = aPos.y + a.h + GAP;
            if (newY > bPos.y) next[b.id] = { x: bPos.x, y: newY };
          }
        }
      }

      let changed = false;
      for (const id of ALL_IDS) {
        if (next[id].x !== old[id].x || next[id].y !== old[id].y) { changed = true; break; }
      }
      if (!changed) return;

      flushSync(() => setPositions(next));
      for (const id of ALL_IDS) {
        const o = old[id], n = next[id];
        if (o.x !== n.x || o.y !== n.y) animateCard(id, o.x, o.y);
      }
    };
    const schedule = () => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(doCompact, 120);
    };
    const observer = new ResizeObserver(schedule);
    for (const id of ALL_IDS) {
      const el = cardRefs.current[id];
      if (el) observer.observe(el);
    }
    return () => { observer.disconnect(); if (timer !== null) clearTimeout(timer); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: line ──────────────────────────────────────────────────────
  const lineSorted = [...getDs(lineDs)].sort((a, b) => a.date.localeCompare(b.date));
  const lineCurr   = lineSorted.slice(-lineDays);
  const linePrev   = lineSorted.slice(Math.max(0, lineSorted.length - lineDays * 2), lineSorted.length - lineDays);
  const lineStep   = Math.max(1, Math.floor(lineCurr.length / 5));
  const lineData = lineCurr.map((d, i) => ({
    key: d.date, label: d.label,
    axisLabel: i === 0 || i === lineCurr.length - 1 || i % lineStep === 0 ? d.label : undefined,
    values: { s1: d.value, ...(lineShowS2 ? { s2: linePrev[i]?.value ?? 0 } : {}) },
  }));
  const lineSeries = [
    { key: "s1", label: lineS1Label, area: lineArea, color: lineColor },
    ...(lineShowS2 ? [{ key: "s2", label: lineS2Label, dashed: true, color: lineS2Color }] : []),
  ];
  const lineKpiTotal    = lineCurr.reduce((s, d) => s + d.value, 0);
  const lineKpiPrev     = linePrev.reduce((s, d) => s + d.value, 0);
  const lineKpiPct      = lineKpiPrev > 0 ? ((lineKpiTotal - lineKpiPrev) / lineKpiPrev) * 100 : 0;
  const lineKpiIsUp     = lineKpiPct >= 0;
  const lineHasTitle    = lineShowTitle && !!lineTitle;
  const lineMergeFilter = lineShowFilter && !lineHasTitle && lineShowKpi;
  const lineFloatFilter = lineShowFilter && !lineHasTitle && !lineShowKpi;

  // ── Derived: bar ───────────────────────────────────────────────────────
  const barSorted      = [...getDs(barDs)].sort((a, b) => a.date.localeCompare(b.date));
  const barSlice       = barSorted.slice(-barDays);
  const barStep        = Math.max(1, Math.floor(barSlice.length / 6));
  const barData        = barSlice.map((d, i) => ({
    key: d.date, label: d.label,
    axisLabel: i === 0 || i === barSlice.length - 1 || i % barStep === 0 ? d.label : undefined,
    value: d.value,
  }));
  const barPeriod      = barSlice.length ? `${barSlice[0]!.label} – ${barSlice[barSlice.length - 1]!.label}` : "";
  const barHasTitle    = barShowTitle && !!barTitle;
  const barMergeFilter = barShowFilter && !barHasTitle && barShowKpi;
  const barFloatFilter = barShowFilter && !barHasTitle && !barShowKpi;

  // ── Derived: sparkline ─────────────────────────────────────────────────
  const sparkSorted = [...getDs(sparkDs)].sort((a, b) => a.date.localeCompare(b.date));
  const sparkSlice  = sparkSorted.slice(-sparkDays);
  const sparkValues = sparkSlice.map(d => d.value);
  const sparkLabels = sparkSlice.map(d => d.label);

  // ── Derived: gauge ────────────────────────────────────────────────────
  const gaugeThresholds: GaugeThreshold[] = [
    { from: 0,      tone: "success", label: gaugeL1 },
    { from: gaugeT2, tone: "warning", label: gaugeL2 },
    { from: gaugeT3, tone: "danger",  label: gaugeL3 },
  ];

  // ── Derived: treemap ──────────────────────────────────────────────────
  const treemapData = getTreemapDs(treemapDs);

  // ── Derived: brush ────────────────────────────────────────────────────
  const brushData    = getBrushDs(brushDs);
  const brushLastMs  = (brushData[brushData.length - 1]!.date as Date).getTime();
  const brushRange: [number, number] = brushWindowDays === 730
    ? [(brushData[0]!.date as Date).getTime(), brushLastMs]
    : [brushLastMs - brushWindowDays * 24 * 60 * 60 * 1000, brushLastMs];

  // ── Resize ────────────────────────────────────────────────────────────
  function startResize(e: React.MouseEvent, target: ChartId, dir: "e" | "s" | "se") {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = true;

    const startX = e.clientX;
    const startY = e.clientY;

    const stateH: Record<ChartId, number>              = { line: lineHeight, bar: barHeight, donut: donutSize, sparkline: sparkHeight, metric: 0, gauge: 0, waffle: 0, heatmap: 0, treemap: treemapHeight, brush: brushHeight };
    const stateW: Record<ChartId, number>              = { line: lineWidth, bar: barWidth, donut: donutCardWidth, sparkline: sparkWidth, metric: metricWidth, gauge: gaugeWidth, waffle: waffleWidth, heatmap: heatmapWidth, treemap: treemapWidth, brush: brushWidth };
    const minW:   Record<ChartId, number>              = { line: 280, bar: 280, donut: 280, sparkline: 200, metric: 200, gauge: 220, waffle: 280, heatmap: 320, treemap: 300, brush: 320 };
    const minH:   Record<ChartId, number>              = { line: 80, bar: 80, donut: 120, sparkline: 40, metric: 0, gauge: 0, waffle: 0, heatmap: 0, treemap: 200, brush: 120 };
    const setWs:  Record<ChartId, (v: number) => void> = { line: setLineWidth, bar: setBarWidth, donut: setDonutCardWidth, sparkline: setSparkWidth, metric: setMetricWidth, gauge: setGaugeWidth, waffle: setWaffleWidth, heatmap: setHeatmapWidth, treemap: setTreemapWidth, brush: setBrushWidth };
    const setHs:  Record<ChartId, (v: number) => void> = { line: setLineHeight, bar: setBarHeight, donut: setDonutSize, sparkline: setSparkHeight, metric: () => {}, gauge: () => {}, waffle: () => {}, heatmap: () => {}, treemap: setTreemapHeight, brush: setBrushHeight };

    // Use state width as base — prevents "shrinky tiny" bug if offsetWidth is 0
    const startW      = stateW[target];
    const startCardH  = cardRefs.current[target]?.offsetHeight ?? 0;
    const startStateH = stateH[target];
    // Overhead = padding + KPI + title above/below the chart; constant during resize
    const overhead    = startCardH - startStateH;

    const cursor = (dir === "e" || minH[target] === 0) ? "ew-resize" : dir === "s" ? "ns-resize" : "nwse-resize";
    document.body.style.cursor     = cursor;
    document.body.style.userSelect = "none";

    function onMove(ev: MouseEvent) {
      const dx  = ev.clientX - startX;
      const dy  = ev.clientY - startY;
      const pos = positionsRef.current[target];

      let newW      = Math.max(minW[target], startW + dx);
      let newCardH  = Math.max(minH[target] + overhead, startCardH + dy);

      // Clamp against every other card to enforce GAP
      for (const other of ALL_IDS) {
        if (other === target) continue;
        const otherEl = cardRefs.current[other];
        if (!otherEl) continue;
        const oPos = positionsRef.current[other];
        const oW   = otherEl.offsetWidth;
        const oH   = otherEl.offsetHeight;

        // East resize: clamp width so we don't eat into a card to our right
        if ((dir === "e" || dir === "se") && oPos.x > pos.x) {
          const vertAdj = oPos.y < pos.y + startCardH + GAP && oPos.y + oH > pos.y - GAP;
          if (vertAdj) newW = Math.min(newW, oPos.x - pos.x - GAP);
        }

        // South resize: clamp height so we don't eat into a card below us
        if ((dir === "s" || dir === "se") && minH[target] > 0 && oPos.y > pos.y) {
          const horizAdj = oPos.x < pos.x + newW + GAP && oPos.x + oW > pos.x - GAP;
          if (horizAdj) newCardH = Math.min(newCardH, oPos.y - pos.y - GAP);
        }
      }

      newW     = Math.max(minW[target], newW);
      newCardH = Math.max(minH[target] + overhead, newCardH);

      if (dir === "e" || dir === "se") setWs[target](newW);
      if (minH[target] > 0 && (dir === "s" || dir === "se")) {
        setHs[target](Math.max(minH[target], newCardH - overhead));
      }
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

  const toggle = (type: ChartId) => {
    if (resizingRef.current) return;
    setSelected(prev => (prev === type ? null : type));
  };

  function overlaps(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
    return ax < bx + bw + GAP && ax + aw + GAP > bx && ay < by + bh + GAP && ay + ah + GAP > by;
  }

  function findNearestFree(
    dropX: number, dropY: number, dw: number, dh: number,
    excludeId: ChartId, fallback: { x: number; y: number }
  ): { x: number; y: number } {
    const neighbours = ALL_IDS
      .filter(id => id !== excludeId)
      .map(id => {
        const el = cardRefs.current[id];
        if (!el) return null;
        const p = positionsRef.current[id];
        return { x: p.x, y: p.y, w: el.offsetWidth, h: el.offsetHeight };
      })
      .filter((n): n is { x: number; y: number; w: number; h: number } => n !== null);

    const isFree = (x: number, y: number) =>
      neighbours.every(o => !overlaps(x, y, dw, dh, o.x, o.y, o.w, o.h));

    if (isFree(dropX, dropY)) return { x: dropX, y: dropY };

    // Ring expansion: expand outward in SNAP steps, trying each cardinal shift.
    // First free spot wins — this keeps the card close to where the user dropped
    // instead of warping across the canvas to another card's edge.
    for (let d = SNAP; d <= 400; d += SNAP) {
      const options = [
        { x: dropX,     y: dropY + d },
        { x: dropX + d, y: dropY     },
        { x: dropX,     y: dropY - d },
        { x: dropX - d, y: dropY     },
      ];
      for (const o of options) {
        const cx = Math.max(0, o.x), cy = Math.max(0, o.y);
        if (isFree(cx, cy)) return { x: cx, y: cy };
      }
    }
    return fallback;
  }

  // Try to SWAP positions with a single dominant overlap target.
  // Only swaps if sizes are within ~30% of each other (weighting).
  function trySwap(
    dropX: number, dropY: number, dw: number, dh: number, excludeId: ChartId
  ): { targetId: ChartId; targetPos: { x: number; y: number } } | null {
    let best: { id: ChartId; area: number; pos: { x: number; y: number }; w: number; h: number } | null = null;
    const draggedArea = dw * dh;
    for (const other of ALL_IDS) {
      if (other === excludeId) continue;
      const el = cardRefs.current[other];
      if (!el) continue;
      const p = positionsRef.current[other];
      const ow = el.offsetWidth, oh = el.offsetHeight;
      const ox = Math.max(0, Math.min(dropX + dw, p.x + ow) - Math.max(dropX, p.x));
      const oy = Math.max(0, Math.min(dropY + dh, p.y + oh) - Math.max(dropY, p.y));
      const area = ox * oy;
      if (area <= 0) continue;
      if (!best || area > best.area) best = { id: other, area, pos: { x: p.x, y: p.y }, w: ow, h: oh };
    }
    if (!best) return null;
    // Dominant: dragged must cover ≥50% of target OR target must cover ≥50% of dragged.
    const coverage = Math.max(best.area / draggedArea, best.area / (best.w * best.h));
    if (coverage < 0.5) return null;
    // Weighting: cards must be similar size to swap cleanly (both axes within 30%).
    const wr = Math.min(dw, best.w) / Math.max(dw, best.w);
    const hr = Math.min(dh, best.h) / Math.max(dh, best.h);
    if (wr < 0.7 || hr < 0.7) return null;
    return { targetId: best.id, targetPos: best.pos };
  }

  // Push overlapping neighbours away by the minimum amount to make room.
  // Returns a full positions map on success, null if any push can't resolve cleanly.
  function tryPush(
    dragX: number, dragY: number, dw: number, dh: number, excludeId: ChartId
  ): Record<ChartId, { x: number; y: number }> | null {
    const working: Record<ChartId, { x: number; y: number }> = { ...positionsRef.current };
    working[excludeId] = { x: dragX, y: dragY };
    // Snap AWAY from the dragged card — otherwise Math.round can leave <GAP of space.
    const snapFloor = (v: number) => Math.max(0, Math.floor(v / SNAP) * SNAP);
    const snapCeil  = (v: number) => Math.max(0, Math.ceil (v / SNAP) * SNAP);
    const MAX_PUSH = 200;

    const neighbours = ALL_IDS.filter(other => {
      if (other === excludeId) return false;
      const el = cardRefs.current[other];
      if (!el) return false;
      const p = working[other];
      return overlaps(dragX, dragY, dw, dh, p.x, p.y, el.offsetWidth, el.offsetHeight);
    });

    for (const nb of neighbours) {
      const el = cardRefs.current[nb];
      if (!el) return null;
      const p = working[nb];
      const w = el.offsetWidth, h = el.offsetHeight;

      // Push direction = away from dragged card's center
      const nCx = p.x + w / 2, nCy = p.y + h / 2;
      const dCx = dragX + dw / 2, dCy = dragY + dh / 2;
      // Floor when pushing left/up (smaller value = further from dragged),
      // ceil when pushing right/down. Guarantees ≥ GAP of real spacing.
      const pushX = nCx < dCx ? snapFloor(dragX - w - GAP) : snapCeil(dragX + dw + GAP);
      const pushY = nCy < dCy ? snapFloor(dragY - h - GAP) : snapCeil(dragY + dh + GAP);

      const trials: { x: number; y: number; shift: number }[] = [];
      if (pushX >= 0 && Math.abs(pushX - p.x) <= MAX_PUSH) trials.push({ x: pushX, y: p.y, shift: Math.abs(pushX - p.x) });
      if (pushY >= 0 && Math.abs(pushY - p.y) <= MAX_PUSH) trials.push({ x: p.x, y: pushY, shift: Math.abs(pushY - p.y) });
      trials.sort((a, b) => a.shift - b.shift);

      let moved = false;
      for (const t of trials) {
        // Reject trials that didn't actually clear the dragged card
        // (snapFloor clamps negative to 0, so push can be a no-op).
        if (overlaps(t.x, t.y, w, h, dragX, dragY, dw, dh)) continue;
        const clash = ALL_IDS.some(other => {
          if (other === nb || other === excludeId) return false;
          const oEl = cardRefs.current[other];
          if (!oEl) return false;
          const op = working[other];
          return overlaps(t.x, t.y, w, h, op.x, op.y, oEl.offsetWidth, oEl.offsetHeight);
        });
        if (!clash) {
          working[nb] = { x: t.x, y: t.y };
          moved = true;
          break;
        }
      }
      if (!moved) return null;
    }
    return working;
  }

  // Animate a card from (fromX, fromY) to its CURRENT state position via a
  // compensating transform that springs to zero. Used for swap/push displacement.
  function animateCard(cid: ChartId, fromX: number, fromY: number) {
    const el = cardRefs.current[cid];
    if (!el) return;
    const to = positionsRef.current[cid];
    const dx = fromX - to.x, dy = fromY - to.y;
    if (dx === 0 && dy === 0) return;
    el.style.transition = "none";
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(() => {
      el.style.transition = "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)";
      el.style.transform = "translate(0, 0)";
      setTimeout(() => { el.style.transition = ""; el.style.transform = ""; }, 420);
    });
  }

  function startDrag(e: React.PointerEvent, id: ChartId) {
    const target = e.target as HTMLElement;
    if (target.closest("button, input, select, [role=slider]")) return;
    if (resizingRef.current) return;
    e.preventDefault();

    const startX = e.clientX, startY = e.clientY;
    const startPos = { ...positionsRef.current[id] };
    let moved = false;
    const el = cardRefs.current[id];

    setDraggingId(id);
    setZOrder(prev => [...prev.filter(x => x !== id), id]);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    if (el) {
      el.style.willChange = "transform";
      el.style.transition = "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease";
      el.style.transform = "scale(1.025)";
      el.style.boxShadow = "0 24px 64px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.10)";
    }

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      if (el) {
        el.style.transition = "box-shadow 0.15s ease";
        el.style.transform = `translate(${dx}px,${dy}px) scale(1.025)`;
      }
    }

    function settle(el: HTMLDivElement, tx: number, ty: number) {
      el.style.transition = "none";
      el.style.transform = `translate(${tx}px,${ty}px) scale(1.025)`;
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease";
        el.style.transform = "scale(1)";
        el.style.boxShadow = "";
        setTimeout(() => { el.style.willChange = ""; setDraggingId(null); }, 400);
      });
    }

    function onUp(ev: PointerEvent) {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      if (!moved) {
        if (el) {
          el.style.transition = "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease";
          el.style.transform = "scale(1)";
          el.style.boxShadow = "";
          setTimeout(() => { el.style.willChange = ""; }, 200);
        }
        setDraggingId(null);
        toggle(id);
        return;
      }

      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      const rawX = Math.round((startPos.x + dx) / SNAP) * SNAP;
      const rawY = Math.round((startPos.y + dy) / SNAP) * SNAP;
      const dw = el?.offsetWidth  ?? 0;
      const dh = el?.offsetHeight ?? 0;
      // Clamp release position so tiles can't drift past the sheet edge.
      const clamped = clampToStage(rawX, rawY, dw, dh);
      const snappedX = clamped.x;
      const snappedY = clamped.y;

      const hasOverlap = ALL_IDS.filter(other => other !== id).some(other => {
        const otherEl = cardRefs.current[other];
        if (!otherEl) return false;
        const p = positionsRef.current[other];
        return overlaps(snappedX, snappedY, dw, dh, p.x, p.y, otherEl.offsetWidth, otherEl.offsetHeight);
      });

      // Resolution strategy: 1) swap, 2) push neighbours, 3) nudge, 4) bounce.
      let finalX = snappedX, finalY = snappedY;
      let swap: { targetId: ChartId; targetPos: { x: number; y: number } } | null = null;
      let pushed: Record<ChartId, { x: number; y: number }> | null = null;

      if (hasOverlap) {
        swap = trySwap(snappedX, snappedY, dw, dh, id);
        if (swap) {
          finalX = swap.targetPos.x;
          finalY = swap.targetPos.y;
        } else {
          pushed = tryPush(snappedX, snappedY, dw, dh, id);
          if (!pushed) {
            const nudged = findNearestFree(snappedX, snappedY, dw, dh, id, startPos);
            finalX = nudged.x;
            finalY = nudged.y;
          }
        }
      }

      // Capture previous positions of displaced cards so we can animate them.
      const prevPositions: Partial<Record<ChartId, { x: number; y: number }>> = {};
      if (swap) {
        prevPositions[swap.targetId] = { ...positionsRef.current[swap.targetId] };
      } else if (pushed) {
        for (const key of ALL_IDS) {
          if (key === id) continue;
          const was = positionsRef.current[key];
          const now = pushed[key];
          if (was.x !== now.x || was.y !== now.y) prevPositions[key] = { ...was };
        }
      }

      flushSync(() => setPositions(prev => {
        if (swap) return {
          ...prev,
          [id]: { x: swap!.targetPos.x, y: swap!.targetPos.y },
          [swap!.targetId]: { x: startPos.x, y: startPos.y },
        };
        if (pushed) return pushed;
        return { ...prev, [id]: { x: finalX, y: finalY } };
      }));

      // Animate displaced cards from their old visible position to the new one.
      for (const key of Object.keys(prevPositions) as ChartId[]) {
        const was = prevPositions[key]!;
        animateCard(key, was.x, was.y);
      }

      if (el) {
        settle(el, startPos.x + dx - finalX, startPos.y + dy - finalY);
      } else {
        setDraggingId(null);
      }
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  const cardBase = "group relative shrink-0 rounded-xl border bg-card overflow-hidden cursor-grab active:cursor-grabbing transition-[border-color,box-shadow]";
  const cardIdle = "hover:border-blue-300 dark:hover:border-blue-800";
  const ring     = "ring-2 ring-blue-500 ring-offset-2 ring-offset-muted/20";

  // ── Shared title header ────────────────────────────────────────────────
  function TitleHeader({ id, title, showFilter, days, setDays }: {
    id: ChartId; title: string; showFilter: boolean; days: number; setDays: (d: number) => void;
  }) {
    return (
      <AnimatePresence initial={false}>
        {!!title && (
          <motion.div key={`${id}-hdr`}
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [...ANIM_EASE] }} style={{ overflow: "hidden" }}>
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-0 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{title}</span>
              {showFilter && <FilterPills days={days} onDaysChange={setDays} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <>
      {/* Chart picker (left) — hidden when embedded inside the /dashboard shell */}
      {!hidePicker && (
      <aside className="w-56 shrink-0 border-r bg-card flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Charts
          </p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">Click to add to canvas</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {ALL_IDS.map(id => {
            const Icon = CHART_ICONS[id];
            const onCanvas = visible.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => addChart(id)}
                className={`group w-full flex items-center gap-2.5 pl-2 pr-2 h-10 rounded-lg
                  select-none transition-colors
                  ${onCanvas
                    ? "bg-blue-500/10 text-foreground hover:bg-blue-500/15"
                    : "text-foreground/80 hover:text-foreground hover:bg-muted"}`}
              >
                <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                  ${onCanvas ? "bg-blue-500/15 text-blue-500" : "bg-muted text-muted-foreground group-hover:text-foreground"}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-[13px] font-medium truncate flex-1 text-left">
                  {CHART_LABELS[id]}
                </span>
                {onCanvas ? (
                  <span className="text-[10px] text-blue-500 font-semibold">ON</span>
                ) : (
                  <PlusIcon className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>
      </aside>
      )}

      <div className={`flex-1 p-5 bg-muted/20
          ${hidePicker ? "overflow-hidden" : "overflow-auto"}`}
        onPointerDown={e => { if (e.target === e.currentTarget) setSelected(null); }}>
        {(() => {
          function renderCard(id: ChartId, isDragging: boolean): React.ReactNode {
                    if (id === "line") return (
                      <div style={{ width: lineWidth }}
                        className={`${cardBase} ${!isDragging && selected === "line" ? ring : cardIdle}`}>
                <TitleHeader id="line" title={lineHasTitle ? lineTitle : ""} showFilter={lineShowFilter} days={lineDays} setDays={setLineDays} />
                <div className="p-5 pt-4">
                  <AnimatePresence initial={false}>
                    {lineFloatFilter && (
                      <motion.div key="line-float"
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [...ANIM_EASE] }} style={{ overflow: "hidden" }}>
                        <div className="flex justify-end mb-3"><FilterPills days={lineDays} onDaysChange={setLineDays} /></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence initial={false}>
                    {lineShowKpi && (
                      <motion.div key="line-kpi"
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [...ANIM_EASE] }} style={{ overflow: "hidden" }}>
                        <div className="mb-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">{lineS1Label}</p>
                            {lineMergeFilter && <FilterPills days={lineDays} onDaysChange={setLineDays} />}
                          </div>
                          <p className="text-2xl font-semibold tabular-nums text-foreground leading-none mt-0.5">{kpiFmt(lineKpiTotal)}</p>
                          <p className={`text-xs font-medium mt-1 ${lineKpiIsUp ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                            {lineKpiIsUp ? "+" : ""}{lineKpiPct.toFixed(1)}% vs prev {lineDays}d
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <LineChart data={lineData} series={lineSeries} label={lineS1Label} height={lineHeight}
                    curve={lineCurve} legend={lineShowLegend} hiddenSeries={lineHidden} onHiddenSeriesChange={setLineHidden} />
                </div>
                <ResizeHandles onEdge={(e, dir) => startResize(e, "line", dir)} />
                      </div>
                    );

                    if (id === "bar") return (
                      <div style={{ width: barWidth }}
                        className={`${cardBase} ${!isDragging && selected === "bar" ? ring : cardIdle}`}>
                        <TitleHeader id="bar" title={barHasTitle ? barTitle : ""} showFilter={barShowFilter} days={barDays} setDays={setBarDays} />
                        <div className="p-5 pt-4">
                          <AnimatePresence initial={false}>
                            {barFloatFilter && (
                              <motion.div key="bar-float"
                                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: [...ANIM_EASE] }} style={{ overflow: "hidden" }}>
                                <div className="flex justify-end mb-3"><FilterPills days={barDays} onDaysChange={setBarDays} /></div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <BarChart data={barData} label={barTitle || barDs} period={barPeriod} unit={barUnit}
                            height={barHeight} showAverage={barShowAvg} showHeader={barShowKpi}
                            headerRight={barMergeFilter ? <FilterPills days={barDays} onDaysChange={setBarDays} /> : undefined} />
                        </div>
                        <ResizeHandles onEdge={(e, dir) => startResize(e, "bar", dir)} />
                      </div>
                    );

                    if (id === "donut") return (
                      <div style={{ width: donutCardWidth }}
                        className={`${cardBase} ${!isDragging && selected === "donut" ? ring : cardIdle}`}>
                        <TitleHeader id="donut" title={donutShowTitle ? donutTitle : ""} showFilter={false} days={0} setDays={() => {}} />
                        <div className="p-6">
                          <DonutChart
                            data={getDonutDs(donutDs)}
                            label={donutDs === "revenue" ? "Revenue by channel" : donutDs === "devices" ? "Visits by device" : "Visits by source"}
                            unit={donutUnit} size={donutSize} thickness={donutThickness}
                            legend={donutLegend} legendAction={donutLegendAction} totalLabel={donutTotalLabel}
                          />
                        </div>
                        <ResizeHandles onEdge={(e, dir) => startResize(e, "donut", dir)} />
                      </div>
                    );

                    if (id === "sparkline") return (
                      <div style={{ width: sparkWidth }}
                        className={`${cardBase} ${!isDragging && selected === "sparkline" ? ring : cardIdle}`}>
                        <TitleHeader id="sparkline" title={sparkShowTitle ? sparkTitle : ""} showFilter={false} days={0} setDays={() => {}} />
                        <div className="p-5 pt-4">
                          <Sparkline data={sparkValues} labels={sparkLabels}
                            label="Revenue trend" value={sparkDisplayVal} change={sparkDisplayChg}
                            tone={sparkTone} area={sparkArea} interactive={sparkInteractive} height={sparkHeight} />
                        </div>
                        <ResizeHandles onEdge={(e, dir) => startResize(e, "sparkline", dir)} />
                      </div>
                    );

                    if (id === "metric") return (
                      <div style={{ width: metricWidth, "--surface": "var(--card)" } as React.CSSProperties}
                        className={`group relative shrink-0 cursor-grab active:cursor-grabbing rounded-xl transition-all ${
                          !isDragging && selected === "metric"
                            ? "ring-2 ring-inset ring-blue-500"
                            : "ring-1 ring-inset ring-transparent hover:ring-blue-300 dark:hover:ring-blue-700"
                        }`}>
                        <MetricCard
                          label={metricShowLabel ? metricLabel : ""}
                          value={metricValue}
                          suffix={metricSuffix || undefined}
                          context={metricShowContext ? metricContext : ""}
                          change={metricShowChange && metricChange ? metricChange : undefined}
                        />
                        <ResizeHandles heightResize={false} onEdge={(e, dir) => startResize(e, "metric", dir)} />
                      </div>
                    );

                    if (id === "gauge") return (
                      <div style={{ width: gaugeWidth }}
                        className={`${cardBase} ${!isDragging && selected === "gauge" ? ring : cardIdle}`}>
                        <TitleHeader id="gauge" title={gaugeCardShowTitle ? gaugeCardTitle : ""} showFilter={false} days={0} setDays={() => {}} />
                        <div className="p-8 flex justify-center">
                          <Gauge value={gaugeValue} label={gaugeLabel} detail={gaugeDetail} thresholds={gaugeThresholds} />
                        </div>
                        <ResizeHandles heightResize={false} onEdge={(e, dir) => startResize(e, "gauge", dir)} />
                      </div>
                    );

                    if (id === "waffle") return (
                      <div style={{ width: waffleWidth }}
                        className={`${cardBase} ${!isDragging && selected === "waffle" ? ring : cardIdle}`}>
                        <TitleHeader id="waffle" title={waffleShowTitle ? waffleTitle : ""} showFilter={false} days={0} setDays={() => {}} />
                        <div className="p-8">
                          <WaffleChart
                            data={getWaffleDs(waffleDs)}
                            label={waffleDs === "team" ? "Team headcount" : waffleDs === "budget" ? "Budget allocation" : "Revenue by channel"}
                            unit={waffleUnit} rows={waffleRows} columns={waffleCols} legend={waffleLegend}
                          />
                        </div>
                        <ResizeHandles heightResize={false} onEdge={(e, dir) => startResize(e, "waffle", dir)} />
                      </div>
                    );

                    if (id === "heatmap") return (
                      <div style={{ width: heatmapWidth, "--accent": heatmapColor, "--heatmap-surface": "var(--card)" } as React.CSSProperties}
                        className={`${cardBase} ${!isDragging && selected === "heatmap" ? ring : cardIdle}`}>
                        <TitleHeader id="heatmap" title={heatmapShowTitle ? heatmapTitle : ""} showFilter={false} days={0} setDays={() => {}} />
                        <div className="p-6">
                          <ActivityHeatmap
                            days={HEATMAP_DAYS}
                            label="Contributions in 2024"
                            period="2024"
                            unit={{ one: heatmapUnitOne, other: heatmapUnitOther }}
                            weekStartsOn={heatmapWeekStart === "0" ? 0 : 1}
                            selectedDate={heatmapSelected}
                            onSelectDate={setHeatmapSelected}
                          />
                        </div>
                        <ResizeHandles heightResize={false} onEdge={(e, dir) => startResize(e, "heatmap", dir)} />
                      </div>
                    );

                    if (id === "treemap") return (
                      <div style={{ width: treemapWidth }}
                        className={`${cardBase} ${!isDragging && selected === "treemap" ? ring : cardIdle}`}>
                        <TitleHeader id="treemap" title={treemapShowTitle ? treemapTitle : ""} showFilter={false} days={0} setDays={() => {}} />
                        {(treemapData.children ?? []).length > 0 && (
                          <div className="flex items-center gap-2 px-4 pt-3 pb-0 flex-wrap">
                            <button onClick={e => { e.stopPropagation(); setTreemapFocus("root"); }}
                              className={`px-2.5 py-[3px] rounded-full text-xs font-medium transition-colors whitespace-nowrap
                                ${treemapFocus === "root" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                              All
                            </button>
                            {(treemapData.children ?? []).map(b => (
                              <button key={b.id} onClick={e => { e.stopPropagation(); setTreemapFocus(b.id); }}
                                className={`px-2.5 py-[3px] rounded-full text-xs font-medium transition-colors whitespace-nowrap
                                  ${treemapFocus === b.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                                {b.label}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="px-4 pt-3 pb-4">
                          <Treemap
                            data={treemapData}
                            label={treemapData.label}
                            height={treemapHeight}
                            focus={treemapFocus}
                            onFocusChange={setTreemapFocus}
                            colorLabel={treemapShowColor ? (treemapDs === "products" ? "MoM growth %" : "YoY growth %") : undefined}
                            formatValue={v => `$${(v / 1000).toFixed(0)}K`}
                            formatColor={v => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
                          />
                        </div>
                        <ResizeHandles onEdge={(e, dir) => startResize(e, "treemap", dir)} />
                      </div>
                    );

                    if (id === "brush") return (
                      <div style={{ width: brushWidth }}
                        className={`${cardBase} ${!isDragging && selected === "brush" ? ring : cardIdle}`}>
                        <TitleHeader id="brush" title={brushShowTitle ? brushTitle : ""} showFilter={false} days={0} setDays={() => {}} />
                        <div className="p-5">
                          <div className={`flex ${(!brushShowTitle || !brushTitle) ? "items-center justify-between" : "justify-end"} mb-3`}>
                            {(!brushShowTitle || !brushTitle) && (
                              <p className="text-sm font-semibold text-foreground">
                                {brushDs === "revenue" ? "Daily revenue" : brushDs === "sessions" ? "Daily sessions" : "Daily signups"}
                              </p>
                            )}
                            <div className="flex gap-0.5 p-0.5 rounded-full bg-muted">
                              {BRUSH_WINDOW_OPTS.map(o => (
                                <button key={o.label} onClick={e => { e.stopPropagation(); setBrushWindowDays(o.days); }}
                                  className={`px-2.5 py-[3px] rounded-full text-xs font-medium transition-colors whitespace-nowrap
                                    ${brushWindowDays === o.days ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                                  {o.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                            <BrushChart
                              data={brushData}
                              label={brushDs === "revenue" ? "Daily revenue" : brushDs === "sessions" ? "Daily sessions" : "Daily signups"}
                              unit={brushUnit}
                              height={brushHeight}
                              overviewHeight={brushOverviewH}
                              range={brushRange}
                              annotations={brushShowAnnot ? BRUSH_ANNOTATIONS : undefined}
                            />
                          </div>
                        </div>
                        <ResizeHandles onEdge={(e, dir) => startResize(e, "brush", dir)} />
                      </div>
                    );

                    return null;
          }
          const visibleIds = ALL_IDS.filter(id => visible.has(id));
          return (
            <div ref={stageRef} className="relative"
              style={hidePicker ? { width: "100%", height: "100%" } : { minWidth: 1620, minHeight: 1620 }}
              onPointerDown={e => { if (e.target === e.currentTarget) setSelected(null); }}>
              {visibleIds.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="mx-auto mb-4 inline-flex items-center justify-center size-14 rounded-2xl border-2 border-dashed border-border/70">
                      <PlusIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Click a chart on the left to add it</p>
                  </div>
                </div>
              )}
              {visibleIds.map(id => (
                <div key={id} ref={el => { cardRefs.current[id] = el; }} style={{ position: "absolute", left: positions[id].x, top: positions[id].y, zIndex: zOrder.indexOf(id) + 1 }}
                  onPointerDown={e => { if (e.button === 0) startDrag(e, id); }}
                  onContextMenu={e => openContextMenu(e, id)}>
                  {renderCard(id, draggingId === id)}
                  {selected === id && (
                    <button
                      type="button"
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); removeChart(id); }}
                      title="Remove from canvas"
                      className="absolute -top-2.5 -right-2.5 size-6 rounded-full bg-background border border-border shadow-sm
                        text-muted-foreground hover:text-foreground hover:border-blue-500/60 hover:bg-sidebar-accent
                        transition flex items-center justify-center z-30"
                    >
                      <XIcon className="w-3.5 h-3.5" strokeWidth={2.25} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Right-click settings popover */}
      {contextMenu && (() => {
        const selected = contextMenu.id;
        return (
        <div
          ref={panelRef}
          style={{ position: "fixed", left: contextMenu.x, top: contextMenu.y, width: 260, maxHeight: 520, zIndex: 100 }}
          className="rounded-xl border border-border bg-card shadow-2xl shadow-black/20 ring-1 ring-black/5 overflow-hidden flex flex-col
            animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {CHART_LABELS[selected]}
            </p>
            <button
              type="button"
              onClick={() => setContextMenu(null)}
              className="size-6 inline-flex items-center justify-center rounded-md text-muted-foreground
                hover:text-foreground hover:bg-muted transition-colors"
              title="Close"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">

            {selected === "line" && (
              <>
                <SLabel>Card</SLabel>
                <SInput label="Title" value={lineTitle} onChange={setLineTitle} />
                <SToggle label="Show title"        checked={lineShowTitle}  onChange={setLineShowTitle}  />
                <SToggle label="Date range filter" checked={lineShowFilter} onChange={setLineShowFilter} />
                <SDivider />
                <SLabel>Dataset</SLabel>
                <SSegment label="" value={lineDs} onChange={setLineDs} options={DATASETS} />
                <SDivider />
                <SLabel>Series 1</SLabel>
                <SInput label="Label" value={lineS1Label} onChange={setLineS1Label} />
                <SToggle label="Area fill" checked={lineArea} onChange={setLineArea} />
                <ColorPicker className="w-full" label="Colour" value={lineColor} onValueChange={setLineColor} />
                <SDivider />
                <SLabel>Series 2</SLabel>
                <SToggle label="Show comparison" checked={lineShowS2} onChange={setLineShowS2} />
                {lineShowS2 && (
                  <>
                    <SInput label="Label" value={lineS2Label} onChange={setLineS2Label} />
                    <ColorPicker className="w-full" label="Colour" value={lineS2Color} onValueChange={setLineS2Color} />
                  </>
                )}
                <SDivider />
                <SLabel>Display</SLabel>
                <SToggle label="KPI readout" checked={lineShowKpi}    onChange={setLineShowKpi} />
                <SToggle label="Legend"      checked={lineShowLegend} onChange={v => { setLineShowLegend(v); if (!v) setLineHidden([]); }} />
                <SSegment label="Curve" value={lineCurve} onChange={setLineCurve}
                  options={[{ label: "Smooth", value: "smooth" as const }, { label: "Linear", value: "linear" as const }]} />
                <SDivider />
                <SLabel>Size</SLabel>
                <SSlider label="Width"  value={lineWidth}  min={280} max={900} onChange={setLineWidth}  />
                <SSlider label="Height" value={lineHeight} min={80}  max={480} onChange={setLineHeight} />
              </>
            )}

            {selected === "bar" && (
              <>
                <SLabel>Card</SLabel>
                <SInput label="Title" value={barTitle} onChange={setBarTitle} />
                <SToggle label="Show title"        checked={barShowTitle}  onChange={setBarShowTitle}  />
                <SToggle label="Date range filter" checked={barShowFilter} onChange={setBarShowFilter} />
                <SDivider />
                <SLabel>Dataset</SLabel>
                <SSegment label="" value={barDs} onChange={setBarDs} options={DATASETS} />
                <SDivider />
                <SLabel>Display</SLabel>
                <SToggle label="KPI headline" checked={barShowKpi} onChange={setBarShowKpi} />
                <SToggle label="Average line" checked={barShowAvg} onChange={setBarShowAvg} />
                <SDivider />
                <SLabel>Labels</SLabel>
                <SInput label="Unit" value={barUnit} onChange={setBarUnit} />
                <SDivider />
                <SLabel>Size</SLabel>
                <SSlider label="Width"  value={barWidth}  min={280} max={900} onChange={setBarWidth}  />
                <SSlider label="Height" value={barHeight} min={80}  max={480} onChange={setBarHeight} />
              </>
            )}

            {selected === "donut" && (
              <>
                <SLabel>Card</SLabel>
                <SInput label="Title" value={donutTitle} onChange={setDonutTitle} />
                <SToggle label="Show title" checked={donutShowTitle} onChange={setDonutShowTitle} />
                <SDivider />
                <SLabel>Dataset</SLabel>
                <SSegment label="" value={donutDs} onChange={setDonutDs} options={DONUT_DATASETS} />
                <SDivider />
                <SLabel>Labels</SLabel>
                <SInput label="Unit"         value={donutUnit}       onChange={setDonutUnit}       />
                <SInput label="Center label" value={donutTotalLabel} onChange={setDonutTotalLabel} />
                <SDivider />
                <SLabel>Display</SLabel>
                <SToggle label="Legend" checked={donutLegend} onChange={setDonutLegend} />
                {donutLegend && (
                  <SSegment label="Legend action" value={donutLegendAction} onChange={setDonutLegendAction}
                    options={[{ label: "Toggle", value: "toggle" as const }, { label: "Select", value: "select" as const }]} />
                )}
                <SDivider />
                <SLabel>Size</SLabel>
                <SSlider label="Card width" value={donutCardWidth} min={280} max={900} onChange={setDonutCardWidth} />
                <SSlider label="Diameter"   value={donutSize}      min={120} max={400} onChange={setDonutSize}      />
                <SSlider label="Thickness"  value={donutThickness} min={12}  max={60}  onChange={setDonutThickness} />
              </>
            )}

            {selected === "sparkline" && (
              <>
                <SLabel>Card</SLabel>
                <SInput label="Title" value={sparkTitle} onChange={setSparkTitle} />
                <SToggle label="Show title" checked={sparkShowTitle} onChange={setSparkShowTitle} />
                <SDivider />
                <SLabel>Dataset</SLabel>
                <SSegment label="" value={sparkDs} onChange={setSparkDs} options={DATASETS} />
                <SSlider label="Days" value={sparkDays} min={7} max={90} unit="d" onChange={setSparkDays} />
                <SDivider />
                <SLabel>Labels</SLabel>
                <SInput label="Value"  value={sparkDisplayVal} onChange={setSparkDisplayVal} />
                <SInput label="Change" value={sparkDisplayChg} onChange={setSparkDisplayChg} />
                <SDivider />
                <SLabel>Tone</SLabel>
                <SSegment label="" value={sparkTone} onChange={setSparkTone}
                  options={[{ label: "Success", value: "success" as const }, { label: "Warning", value: "warning" as const }, { label: "Danger", value: "danger" as const }]} />
                <SDivider />
                <SLabel>Display</SLabel>
                <SToggle label="Area fill"   checked={sparkArea}        onChange={setSparkArea}        />
                <SToggle label="Interactive" checked={sparkInteractive} onChange={setSparkInteractive} />
                <SDivider />
                <SLabel>Size</SLabel>
                <SSlider label="Width"  value={sparkWidth}  min={200} max={600} onChange={setSparkWidth}  />
                <SSlider label="Height" value={sparkHeight} min={40}  max={200} onChange={setSparkHeight} />
              </>
            )}

            {selected === "metric" && (
              <>
                <SLabel>Content</SLabel>
                <SInput label="Label"             value={metricLabel}   onChange={setMetricLabel}   />
                <SInput label="Change (e.g. +9%)" value={metricChange}  onChange={setMetricChange}  />
                <SInput label="Context"           value={metricContext} onChange={setMetricContext}  />
                <SInput label="Suffix (e.g. %)"   value={metricSuffix} onChange={setMetricSuffix}   />
                <SDivider />
                <SLabel>Display</SLabel>
                <SToggle label="Show label"   checked={metricShowLabel}   onChange={setMetricShowLabel}   />
                <SToggle label="Show change"  checked={metricShowChange}  onChange={setMetricShowChange}  />
                <SToggle label="Show context" checked={metricShowContext} onChange={setMetricShowContext} />
                <SDivider />
                <SLabel>Size</SLabel>
                <SSlider label="Width" value={metricWidth} min={200} max={600} onChange={setMetricWidth} />
                <SDivider />
                <SLabel>Try it</SLabel>
                <SSlider label="Value" value={metricValue} min={0} max={500000} step={1000} unit="" onChange={setMetricValue} />
              </>
            )}

            {selected === "gauge" && (
              <>
                <SLabel>Card</SLabel>
                <SInput label="Title" value={gaugeCardTitle} onChange={setGaugeCardTitle} />
                <SToggle label="Show title" checked={gaugeCardShowTitle} onChange={setGaugeCardShowTitle} />
                <SDivider />
                <SLabel>Labels</SLabel>
                <SInput label="Title"  value={gaugeLabel}  onChange={setGaugeLabel}  />
                <SInput label="Detail" value={gaugeDetail} onChange={setGaugeDetail} />
                <SDivider />
                <SLabel>Value</SLabel>
                <SSlider label="Current %" value={gaugeValue} min={0} max={100} unit="%" onChange={setGaugeValue} />
                <SDivider />
                <SLabel>Thresholds</SLabel>
                <SInput label="Normal label"   value={gaugeL1} onChange={setGaugeL1} />
                <SSlider label="High from"     value={gaugeT2} min={0} max={100} unit="%" onChange={setGaugeT2} />
                <SInput label="High label"     value={gaugeL2} onChange={setGaugeL2} />
                <SSlider label="Critical from" value={gaugeT3} min={0} max={100} unit="%" onChange={setGaugeT3} />
                <SInput label="Critical label" value={gaugeL3} onChange={setGaugeL3} />
                <SDivider />
                <SLabel>Size</SLabel>
                <SSlider label="Width" value={gaugeWidth} min={220} max={500} onChange={setGaugeWidth} />
              </>
            )}

            {selected === "waffle" && (
              <>
                <SLabel>Card</SLabel>
                <SInput label="Title" value={waffleTitle} onChange={setWaffleTitle} />
                <SToggle label="Show title" checked={waffleShowTitle} onChange={setWaffleShowTitle} />
                <SDivider />
                <SLabel>Dataset</SLabel>
                <SSegment label="" value={waffleDs} onChange={setWaffleDs} options={WAFFLE_DATASETS} />
                <SDivider />
                <SLabel>Labels</SLabel>
                <SInput label="Unit (e.g. TWh)" value={waffleUnit} onChange={setWaffleUnit} />
                <SDivider />
                <SLabel>Display</SLabel>
                <SToggle label="Legend" checked={waffleLegend} onChange={setWaffleLegend} />
                <SDivider />
                <SLabel>Grid</SLabel>
                <SSlider label="Rows"    value={waffleRows} min={4} max={20} unit="" onChange={setWaffleRows} />
                <SSlider label="Columns" value={waffleCols} min={4} max={20} unit="" onChange={setWaffleCols} />
                <SDivider />
                <SLabel>Size</SLabel>
                <SSlider label="Width" value={waffleWidth} min={280} max={700} onChange={setWaffleWidth} />
              </>
            )}

            {selected === "heatmap" && (
              <>
                <SLabel>Card</SLabel>
                <SInput label="Title" value={heatmapTitle} onChange={setHeatmapTitle} />
                <SToggle label="Show title" checked={heatmapShowTitle} onChange={setHeatmapShowTitle} />
                <SDivider />
                <SLabel>Labels</SLabel>
                <SInput label="Unit (singular)" value={heatmapUnitOne}   onChange={setHeatmapUnitOne}   />
                <SInput label="Unit (plural)"   value={heatmapUnitOther} onChange={setHeatmapUnitOther} />
                <SDivider />
                <SLabel>Display</SLabel>
                <SSegment label="Week starts on" value={heatmapWeekStart} onChange={setHeatmapWeekStart}
                  options={[{ label: "Sunday", value: "0" as const }, { label: "Monday", value: "1" as const }]} />
                {heatmapSelected && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Selected: <span className="font-medium text-foreground">{heatmapSelected}</span>
                  </p>
                )}
                <SDivider />
                <ColorPicker className="w-full" label="Accent colour" value={heatmapColor} onValueChange={setHeatmapColor} />
                <SDivider />
                <SLabel>Size</SLabel>
                <SSlider label="Width" value={heatmapWidth} min={320} max={900} onChange={setHeatmapWidth} />
              </>
            )}

            {selected === "treemap" && (
              <>
                <SLabel>Card</SLabel>
                <SInput label="Title" value={treemapTitle} onChange={setTreemapTitle} />
                <SToggle label="Show title" checked={treemapShowTitle} onChange={setTreemapShowTitle} />
                <SDivider />
                <SLabel>Dataset</SLabel>
                <SSegment label="" value={treemapDs} onChange={v => { setTreemapDs(v); setTreemapFocus("root"); }} options={TREEMAP_DATASETS} />
                <SDivider />
                <SLabel>Display</SLabel>
                <SToggle label="Growth shading" checked={treemapShowColor} onChange={setTreemapShowColor} />
                <SDivider />
                <SLabel>Size</SLabel>
                <SSlider label="Width"  value={treemapWidth}  min={300} max={900} onChange={setTreemapWidth}  />
                <SSlider label="Height" value={treemapHeight} min={200} max={600} onChange={setTreemapHeight} />
              </>
            )}

            {selected === "brush" && (
              <>
                <SLabel>Card</SLabel>
                <SInput label="Title" value={brushTitle} onChange={setBrushTitle} />
                <SToggle label="Show title" checked={brushShowTitle} onChange={setBrushShowTitle} />
                <SDivider />
                <SLabel>Dataset</SLabel>
                <SSegment label="" value={brushDs} onChange={v => {
                  setBrushDs(v);
                  setBrushUnit(v === "revenue" ? "revenue" : v === "sessions" ? "sessions" : "signups");
                }} options={BRUSH_DATASETS} />
                <SDivider />
                <SLabel>Labels</SLabel>
                <SInput label="Unit" value={brushUnit} onChange={setBrushUnit} />
                <SDivider />
                <SLabel>Display</SLabel>
                <SToggle label="Event annotations" checked={brushShowAnnot} onChange={setBrushShowAnnot} />
                <SDivider />
                <SLabel>Size</SLabel>
                <SSlider label="Width"           value={brushWidth}    min={320} max={900} onChange={setBrushWidth}    />
                <SSlider label="Chart height"    value={brushHeight}   min={120} max={400} onChange={setBrushHeight}   />
                <SSlider label="Overview height" value={brushOverviewH} min={28} max={100} onChange={setBrushOverviewH} />
              </>
            )}

          </div>
        </div>
        );
      })()}
    </>
  );
});
