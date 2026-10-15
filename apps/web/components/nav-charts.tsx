"use client";

// A single "Charts" dropdown. When expanded, shows all chart types grouped by
// category with always-visible uppercase section labels (no second-level click).
// Rows are draggable — intended for dropping onto the canvas.

import { useEffect, useState } from "react";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@workspace/ui/components/sidebar";
import {
  ChevronRightIcon, ChartNoAxesColumn, GripVerticalIcon,
  BarChart3, LineChart, PieChart, TrendingUp, Hash, Gauge,
  LayoutGrid, Calendar, LayoutDashboard, AreaChart, Table, Type,
} from "lucide-react";

type ChartType =
  | "line" | "bar" | "donut" | "sparkline" | "metric" | "gauge"
  | "waffle" | "heatmap" | "treemap" | "brush" | "table" | "text";

type Tone = "blue" | "violet" | "emerald" | "amber" | "rose";

type ChartDef = { type: ChartType; label: string; Icon: React.ComponentType<{ className?: string }> };
type Group = { name: string; tone: Tone; charts: ChartDef[] };

const GROUPS: Group[] = [
  {
    name: "Time series", tone: "blue", charts: [
      { type: "line",      label: "Line chart",   Icon: LineChart },
      { type: "bar",       label: "Bar chart",    Icon: BarChart3 },
      { type: "sparkline", label: "Sparkline",    Icon: TrendingUp },
      { type: "brush",     label: "Range chart",  Icon: AreaChart },
      { type: "heatmap",   label: "Heatmap",      Icon: Calendar },
    ],
  },
  {
    name: "Composition", tone: "violet", charts: [
      { type: "donut",   label: "Donut chart", Icon: PieChart },
      { type: "waffle",  label: "Waffle",      Icon: LayoutGrid },
      { type: "treemap", label: "Treemap",     Icon: LayoutDashboard },
    ],
  },
  {
    name: "KPIs", tone: "emerald", charts: [
      { type: "metric", label: "Metric", Icon: Hash },
      { type: "gauge",  label: "Gauge",  Icon: Gauge },
    ],
  },
  {
    name: "Data & content", tone: "amber", charts: [
      { type: "table", label: "Table",      Icon: Table },
      { type: "text",  label: "Text block", Icon: Type },
    ],
  },
];

const TONE_CHIP: Record<Tone, string> = {
  blue:    "bg-brand/10 text-brand",
  violet:  "bg-violet-500/10 text-violet-500",
  emerald: "bg-emerald-500/10 text-emerald-500",
  amber:   "bg-amber-500/10 text-amber-500",
  rose:    "bg-rose-500/10 text-rose-500",
};
const TONE_DOT: Record<Tone, string> = {
  blue:    "bg-brand",
  violet:  "bg-violet-500",
  emerald: "bg-emerald-500",
  amber:   "bg-amber-500",
  rose:    "bg-rose-500",
};

const totalCharts = GROUPS.reduce((n, g) => n + g.charts.length, 0);

export function NavCharts() {
  const { state } = useSidebar();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (state === "collapsed") setOpen(false); }, [state]);

  return (
    <SidebarGroup>
      <SidebarMenu>
        <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible" render={<SidebarMenuItem />}>
          <CollapsibleTrigger render={<SidebarMenuButton tooltip="Charts"
            className="font-semibold group-data-[collapsible=icon]:[&_svg]:size-5" />}>
            <ChartNoAxesColumn strokeWidth={2.25} />
            <span>Charts</span>
            <span className="ml-auto mr-1 text-[10px] text-muted-foreground">{totalCharts}</span>
            <ChevronRightIcon className="transition-transform duration-200 group-data-open/collapsible:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-1.5 space-y-3">
              {GROUPS.map(group => (
                <div key={group.name}>
                  <div className="flex items-center gap-1.5 px-2 pb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT[group.tone]}`} />
                    <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      {group.name}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {group.charts.map(({ type, label, Icon }) => (
                      <div
                        key={type}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData("application/x-databubble-tile", type);
                          e.dataTransfer.effectAllowed = "copy";
                        }}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("sandbox-add-chart", { detail: { type } }));
                        }}
                        className="group/row relative flex items-center gap-2.5 pl-2 pr-2 h-10 rounded-lg cursor-grab active:cursor-grabbing
                          select-none text-foreground/90 hover:text-foreground
                          transition-[background-color,transform] duration-200 ease-out
                          hover:bg-sidebar-accent/70 hover:translate-x-0.5"
                      >
                        <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                          transition-transform duration-200 ease-out
                          group-hover/row:scale-[1.08] group-hover/row:-rotate-3 group-active/row:scale-95
                          ${TONE_CHIP[group.tone]}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-[13px] font-medium truncate flex-1">{label}</span>
                        <GripVerticalIcon
                          className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0
                            opacity-0 -translate-x-1 transition-[opacity,transform] duration-200 ease-out
                            group-hover/row:opacity-100 group-hover/row:translate-x-0"
                          strokeWidth={2}
                        />
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
