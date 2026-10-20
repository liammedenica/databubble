"use client";

// A single "Charts" dropdown. When expanded, shows all chart types grouped by
// category. Rows are plain icon + label — minimalist, no circled chips.

import { useEffect, useState } from "react";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@workspace/ui/components/sidebar";
import {
  ChevronRightIcon, ChartNoAxesColumn,
  BarChart3, LineChart, PieChart, TrendingUp, Hash, Gauge,
  LayoutGrid, Calendar, LayoutDashboard, AreaChart, Table, Type,
} from "lucide-react";

type ChartType =
  | "line" | "bar" | "donut" | "sparkline" | "metric" | "gauge"
  | "waffle" | "heatmap" | "treemap" | "brush" | "table" | "text";

type ChartDef = { type: ChartType; label: string; Icon: React.ComponentType<{ className?: string }> };
type Group = { name: string; charts: ChartDef[] };

const GROUPS: Group[] = [
  {
    name: "Time series", charts: [
      { type: "line",      label: "Line chart",   Icon: LineChart },
      { type: "bar",       label: "Bar chart",    Icon: BarChart3 },
      { type: "sparkline", label: "Sparkline",    Icon: TrendingUp },
      { type: "brush",     label: "Range chart",  Icon: AreaChart },
      { type: "heatmap",   label: "Heatmap",      Icon: Calendar },
    ],
  },
  {
    name: "Composition", charts: [
      { type: "donut",   label: "Donut chart", Icon: PieChart },
      { type: "waffle",  label: "Waffle",      Icon: LayoutGrid },
      { type: "treemap", label: "Treemap",     Icon: LayoutDashboard },
    ],
  },
  {
    name: "KPIs", charts: [
      { type: "metric", label: "Metric", Icon: Hash },
      { type: "gauge",  label: "Gauge",  Icon: Gauge },
    ],
  },
  {
    name: "Data & content", charts: [
      { type: "table", label: "Table",      Icon: Table },
      { type: "text",  label: "Text block", Icon: Type },
    ],
  },
];

export function NavCharts() {
  const { state } = useSidebar();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (state === "collapsed") setOpen(false); }, [state]);

  return (
    <SidebarGroup>
      <SidebarMenu>
        <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible" render={<SidebarMenuItem />}>
          <CollapsibleTrigger render={<SidebarMenuButton tooltip="Charts" />}>
            <ChartNoAxesColumn className="!size-5 text-brand" strokeWidth={2.5} />
            <span className="font-semibold">Charts</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="relative mx-3.5 translate-x-px pl-2.5 py-0.5 space-y-2
              before:absolute before:left-0 before:top-7 before:bottom-3.5 before:w-px before:bg-border
              group-data-[collapsible=icon]:hidden">
              {GROUPS.map(group => (
                <div key={group.name}>
                  <p className="pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-brand/80">
                    {group.name}
                  </p>
                  <div>
                    {group.charts.map(({ type, label, Icon }) => (
                      <div
                        key={type}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData("application/x-databubble-tile", type);
                          e.dataTransfer.effectAllowed = "copy";
                          window.dispatchEvent(new CustomEvent("sandbox-drag-start", { detail: { type } }));
                        }}
                        onDragEnd={() => {
                          window.dispatchEvent(new Event("sandbox-drag-end"));
                        }}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("sandbox-add-chart", { detail: { type } }));
                        }}
                        className="group/row flex items-center gap-2 pl-2 pr-2 h-7 rounded-md cursor-grab active:cursor-grabbing
                          select-none text-sm font-medium text-muted-foreground hover:text-sidebar-foreground
                          hover:bg-sidebar-accent/70 transition-colors"
                      >
                        <Icon className="w-4 h-4 shrink-0 text-muted-foreground group-hover/row:text-brand transition-colors" />
                        <span className="truncate flex-1">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
