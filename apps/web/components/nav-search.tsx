"use client";

import { useRouter } from "next/navigation";
import { SidebarGroup, useSidebar } from "@workspace/ui/components/sidebar";
import { ExpandingSearch } from "@/components/arc/expanding-search/expanding-search";
import type { ExpandingSearchItem } from "@/components/arc/expanding-search/expanding-search";
import {
  BarChart3, LineChart, PieChart, TrendingUp, Hash, Gauge,
  LayoutGrid, Calendar, LayoutDashboard, AreaChart, Table, Type,
  CalendarDays, Calculator, Grid, TextCursor,
} from "lucide-react";

const CHART_ITEMS: ExpandingSearchItem[] = [
  { id: "chart:line",      title: "Line chart",   group: "Charts", icon: <LineChart className="w-3.5 h-3.5" />,       keywords: ["trend", "time"] },
  { id: "chart:bar",       title: "Bar chart",    group: "Charts", icon: <BarChart3 className="w-3.5 h-3.5" />,       keywords: ["column"] },
  { id: "chart:sparkline", title: "Sparkline",    group: "Charts", icon: <TrendingUp className="w-3.5 h-3.5" />,      keywords: ["mini"] },
  { id: "chart:brush",     title: "Range chart",  group: "Charts", icon: <AreaChart className="w-3.5 h-3.5" />,       keywords: ["brush", "window"] },
  { id: "chart:heatmap",   title: "Heatmap",      group: "Charts", icon: <Calendar className="w-3.5 h-3.5" />,        keywords: ["calendar", "activity"] },
  { id: "chart:donut",     title: "Donut chart",  group: "Charts", icon: <PieChart className="w-3.5 h-3.5" />,        keywords: ["pie"] },
  { id: "chart:waffle",    title: "Waffle",       group: "Charts", icon: <LayoutGrid className="w-3.5 h-3.5" />,      keywords: ["grid"] },
  { id: "chart:treemap",   title: "Treemap",      group: "Charts", icon: <LayoutDashboard className="w-3.5 h-3.5" />, keywords: ["tiles"] },
  { id: "chart:metric",    title: "Metric",       group: "Charts", icon: <Hash className="w-3.5 h-3.5" />,            keywords: ["kpi", "number"] },
  { id: "chart:gauge",     title: "Gauge",        group: "Charts", icon: <Gauge className="w-3.5 h-3.5" />,           keywords: ["dial"] },
  { id: "chart:table",     title: "Table",        group: "Charts", icon: <Table className="w-3.5 h-3.5" />,           keywords: ["grid", "rows"] },
  { id: "chart:text",      title: "Text block",   group: "Charts", icon: <Type className="w-3.5 h-3.5" />,            keywords: ["note", "markdown"] },
];

const FIELD_ITEMS: ExpandingSearchItem[] = [
  { id: "field:date",     title: "Date",     meta: "2024-07-29",          group: "Fields", icon: <CalendarDays className="w-3.5 h-3.5" /> },
  { id: "field:revenue",  title: "Revenue",  meta: "$8,420 avg",          group: "Fields", icon: <Calculator className="w-3.5 h-3.5" /> },
  { id: "field:signups",  title: "Signups",  meta: "254 avg",             group: "Fields", icon: <Calculator className="w-3.5 h-3.5" /> },
  { id: "field:sessions", title: "Sessions", meta: "4,180 avg",           group: "Fields", icon: <Calculator className="w-3.5 h-3.5" /> },
  { id: "field:channel",  title: "Channel",  meta: "Online, In-store",    group: "Fields", icon: <Grid className="w-3.5 h-3.5" /> },
  { id: "field:product",  title: "Product",  meta: "Croissant, Sourdough",group: "Fields", icon: <Grid className="w-3.5 h-3.5" /> },
  { id: "field:region",   title: "Region",   meta: "N, E, S, W",          group: "Fields", icon: <Grid className="w-3.5 h-3.5" /> },
  { id: "field:notes",    title: "Notes",    meta: "Freeform text",       group: "Fields", icon: <TextCursor className="w-3.5 h-3.5" /> },
];

const ITEMS = [...CHART_ITEMS, ...FIELD_ITEMS];

export function NavSearch() {
  const router = useRouter();
  const { state } = useSidebar();
  if (state === "collapsed") return null;

  return (
    <SidebarGroup
      className="pt-2 pb-1"
      style={{
        "--surface": "color-mix(in oklab, var(--sidebar-accent) 60%, transparent)",
        "--border": "color-mix(in oklab, var(--sidebar-accent) 80%, transparent)",
      } as React.CSSProperties}
    >
      <ExpandingSearch
        label="Search charts and fields"
        placeholder="Search charts, fields…"
        items={ITEMS}
        suggestions={CHART_ITEMS.slice(0, 4)}
        suggestionsLabel="Popular charts"
        emptyHint="Try a chart type or a column name"
        anchor="start"
        onSelect={item => {
          if (item.id.startsWith("chart:")) {
            const type = item.id.slice(6);
            window.dispatchEvent(new CustomEvent("sidebar-drag-chart", { detail: { type } }));
          }
          if (item.id === "field:date") router.push("/dashboard");
        }}
      />
    </SidebarGroup>
  );
}
