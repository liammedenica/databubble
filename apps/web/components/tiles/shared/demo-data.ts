/**
 * Seeded demo data for tile defaults.
 *
 * Each generator is pure + seeded so repeated instances of the same tile show
 * the same data unless the caller passes a different seed. In the AI-generation
 * flow this will be swapped for real Google Sheets data.
 */

import type { LineChartDatum, LineChartSeries } from "@/components/arc/line-chart/line-chart";
import type { BarChartDatum } from "@/components/arc/bar-chart/bar-chart";
import type { DonutChartDatum } from "@/components/arc/donut-chart/donut-chart";
import type { WaffleCategory } from "@/components/arc/waffle-chart/waffle-chart";
import type { ActivityDay } from "@/components/arc/activity-heatmap/activity-heatmap";
import type { TreemapNode } from "@/components/arc/treemap/treemap";
import type { BrushChartDatum, BrushChartAnnotation } from "@/components/arc/brush-chart/brush-chart";

export const PALETTE = [
  "oklch(0.62 0.22 257)",
  "oklch(0.60 0.22 290)",
  "oklch(0.68 0.18 75)",
  "oklch(0.60 0.17 195)",
  "oklch(0.62 0.22 10)",
  "oklch(0.58 0.18 150)",
] as const;

/** Mulberry-style LCG seeded RNG — deterministic for repeatable demo data. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** Daily points with a smooth sin trend + jitter. Good for line/bar/sparkline. */
export function dailySeries(
  days: number,
  base: number,
  amplitude: number,
  seed = 1,
): Array<{ date: string; label: string; value: number }> {
  const rng = seeded(seed);
  const start = new Date("2024-05-01");
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return {
      date:  d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(base + Math.sin(i / 7) * amplitude + rng() * amplitude * 0.4),
    };
  });
}

export function lineChartDemo(days = 30, seed = 7): {
  data: LineChartDatum[];
  series: LineChartSeries[];
} {
  const points = dailySeries(days, 8200, 2000, seed);
  const step = Math.max(1, Math.floor(points.length / 5));
  const data: LineChartDatum[] = points.map((d, i) => ({
    key: d.date,
    label: d.label,
    axisLabel: i === 0 || i === points.length - 1 || i % step === 0 ? d.label : undefined,
    values: { s1: d.value },
  }));
  const series: LineChartSeries[] = [
    { key: "s1", label: "Revenue", area: true, color: PALETTE[0] },
  ];
  return { data, series };
}

export function barChartDemo(days = 14, seed = 1): BarChartDatum[] {
  const points = dailySeries(days, 240, 55, seed);
  const step = Math.max(1, Math.floor(points.length / 6));
  return points.map((d, i) => ({
    key: d.date,
    label: d.label,
    axisLabel: i === 0 || i === points.length - 1 || i % step === 0 ? d.label : undefined,
    value: d.value,
  }));
}

export const DONUT_DEMO: DonutChartDatum[] = [
  { key: "direct",   label: "Direct",   value: 4320, color: PALETTE[0] },
  { key: "organic",  label: "Organic",  value: 3180, color: PALETTE[1] },
  { key: "referral", label: "Referral", value: 1890, color: PALETTE[2] },
  { key: "email",    label: "Email",    value: 1240, color: PALETTE[3] },
  { key: "social",   label: "Social",   value:  980, color: PALETTE[4] },
  { key: "paid",     label: "Paid",     value:  680, color: PALETTE[5] },
];

export const WAFFLE_DEMO: WaffleCategory[] = [
  { key: "online",    label: "Online Store",  value: 58200, color: PALETTE[0] },
  { key: "instore",   label: "In-store",      value: 31400, color: PALETTE[1] },
  { key: "wholesale", label: "Wholesale",     value: 18700, color: PALETTE[2] },
  { key: "subs",      label: "Subscriptions", value:  9300, color: PALETTE[3] },
];

export function heatmapDemo(seed = 42): ActivityDay[] {
  const rng = seeded(seed);
  const days: ActivityDay[] = [];
  const start = new Date("2024-01-01");
  for (let i = 0; i < 365; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const weekday = d.getDay();
    const base  = weekday === 0 || weekday === 6 ? 0.3 : 1;
    const spike = rng() < 0.08 ? 3 : 1;
    days.push({
      date:  d.toISOString().slice(0, 10),
      count: Math.round(base * spike * rng() * 18),
    });
  }
  return days;
}

export const TREEMAP_DEMO: TreemapNode = {
  id: "root",
  label: "Revenue by product",
  children: [
    { id: "starter",  label: "Starter",    value: 42800, color:  8.4 },
    { id: "pro",      label: "Pro",        value: 31200, color: 22.1 },
    { id: "ent",      label: "Enterprise", value: 18900, color: 14.6 },
    { id: "addon_ai", label: "AI add-on",  value:  7400, color: 41.2 },
    { id: "addon_wh", label: "Webhooks",   value:  2900, color: 18.8 },
    { id: "addon_ss", label: "SSO",        value:  1600, color:  6.2 },
  ],
};

export function brushDemo(seed = 7): {
  data: BrushChartDatum[];
  annotations: BrushChartAnnotation[];
} {
  const rng = seeded(seed);
  const data: BrushChartDatum[] = Array.from({ length: 730 }, (_, i) => {
    const d = new Date("2024-01-01");
    d.setDate(d.getDate() + i);
    const trend = 1 + (i / 730) * 0.4;
    return {
      date: d,
      value: Math.max(0, Math.round((6000 + Math.sin(i / 14) * 2000 + rng() * 1000) * trend)),
    };
  });
  const annotations: BrushChartAnnotation[] = [
    { date: new Date("2024-03-10"), label: "Beta launch",   description: "Public beta opened"    },
    { date: new Date("2024-07-22"), label: "v2.0",          description: "Dashboard v2 released" },
    { date: new Date("2024-11-29"), label: "Black Friday",  description: "Promo campaign"        },
    { date: new Date("2025-01-06"), label: "New year push", description: "January campaign"      },
    { date: new Date("2025-06-01"), label: "Series A",      description: "Funding announced"     },
  ];
  return { data, annotations };
}
