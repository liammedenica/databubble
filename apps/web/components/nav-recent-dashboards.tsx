"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  SidebarGroup, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import { ChevronRightIcon, ClockIcon, ArrowRightIcon, EyeIcon, LayersIcon } from "lucide-react";
import { HoverCard } from "@/components/arc/hover-card/hover-card";

type ChartShape = "bar" | "line" | "donut";

type RecentDashboard = {
  id: string;
  name: string;
  tileCount: number;
  lastViewed: string;
  shape: ChartShape;
  tone: "blue" | "violet" | "emerald" | "amber" | "rose";
};

const TONE_FILL: Record<RecentDashboard["tone"], string> = {
  blue: "oklch(0.60 0.22 255)",
  violet: "oklch(0.60 0.22 300)",
  emerald: "oklch(0.60 0.17 160)",
  amber: "oklch(0.75 0.17 70)",
  rose: "oklch(0.65 0.22 20)",
};

const DEMO_RECENT: RecentDashboard[] = [
  { id: "d1", name: "Monthly Sales Report",   tileCount: 12, lastViewed: "2 hours ago",  shape: "bar",   tone: "blue"    },
  { id: "d2", name: "Marketing Campaign Q3",  tileCount:  8, lastViewed: "Yesterday",    shape: "line",  tone: "violet"  },
  { id: "d3", name: "The Crumb — Bakery KPIs",tileCount: 15, lastViewed: "3 days ago",   shape: "donut", tone: "amber"   },
  { id: "d4", name: "Pipeline overview",      tileCount:  6, lastViewed: "Last week",    shape: "bar",   tone: "emerald" },
  { id: "d5", name: "Signups funnel",         tileCount:  9, lastViewed: "2 weeks ago",  shape: "line",  tone: "rose"    },
];

function MiniChart({ shape, tone }: { shape: ChartShape; tone: RecentDashboard["tone"] }) {
  const fill = TONE_FILL[tone];
  if (shape === "bar") {
    const bars = [38, 56, 22, 68, 45, 72, 50];
    return (
      <svg viewBox="0 0 140 44" className="w-full h-11" preserveAspectRatio="none">
        {bars.map((h, i) => (
          <rect key={i} x={i * 20 + 2} y={44 - h * 0.55} width={14} height={h * 0.55} rx={2} fill={fill} opacity={0.9} />
        ))}
      </svg>
    );
  }
  if (shape === "line") {
    const pts = [6, 18, 10, 24, 16, 32, 28, 36, 22, 40, 30, 38];
    const path = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * 136 + 2},${44 - v}`).join(" ");
    const area = `${path} L138,44 L2,44 Z`;
    return (
      <svg viewBox="0 0 140 44" className="w-full h-11">
        <path d={area} fill={fill} opacity={0.14} />
        <path d={path} fill="none" stroke={fill} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // donut
  const r = 16, cx = 70, cy = 22, c = 2 * Math.PI * r;
  const seg = (frac: number, offset: number, color: string, opacity: number) => (
    <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={6}
      strokeDasharray={`${frac * c} ${c}`} strokeDashoffset={-offset * c} opacity={opacity}
      transform={`rotate(-90 ${cx} ${cy})`} />
  );
  return (
    <svg viewBox="0 0 140 44" className="w-full h-11">
      {seg(0.45, 0,    fill, 0.9)}
      {seg(0.30, 0.45, fill, 0.6)}
      {seg(0.25, 0.75, fill, 0.35)}
    </svg>
  );
}

function RecentPreview({ item }: { item: RecentDashboard }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg bg-sidebar-accent/40 border border-border/60 p-2">
        <MiniChart shape={item.shape} tone={item.tone} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground leading-tight truncate">{item.name}</p>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <LayersIcon className="w-3 h-3" /> {item.tileCount} tiles
          </span>
          <span className="inline-flex items-center gap-1">
            <EyeIcon className="w-3 h-3" /> {item.lastViewed}
          </span>
        </div>
      </div>
    </div>
  );
}

export function NavRecentDashboards({ items = DEMO_RECENT }: { items?: RecentDashboard[] }) {
  const router = useRouter();
  const { state } = useSidebar();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (state === "collapsed") setOpen(false); }, [state]);

  return (
    <SidebarGroup>
      <SidebarMenu>
        <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible" render={<SidebarMenuItem />}>
          <CollapsibleTrigger render={<SidebarMenuButton tooltip="Recent dashboards"
            className="font-semibold group-data-[collapsible=icon]:[&_svg]:size-5" />}>
            <ClockIcon strokeWidth={2.25} />
            <span>Recent</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {items.map(d => (
                <SidebarMenuSubItem key={d.id}>
                  <HoverCard side="right" align="start" content={<RecentPreview item={d} />}>
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard?id=${d.id}`)}
                      className="w-full text-left flex items-center gap-2 min-w-0 h-8 px-2 rounded-md
                        text-sm text-sidebar-foreground/90 hover:text-sidebar-foreground
                        hover:bg-sidebar-accent/70 transition-colors cursor-pointer"
                    >
                      <span className="truncate">{d.name}</span>
                    </button>
                  </HoverCard>
                </SidebarMenuSubItem>
              ))}
              <SidebarMenuSubItem>
                <button
                  type="button"
                  onClick={() => router.push("/dashboards")}
                  className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-sm
                    text-brand hover:brightness-110 hover:bg-sidebar-accent/70 cursor-pointer transition-colors"
                >
                  <span>View all</span>
                  <ArrowRightIcon className="ml-auto size-3" />
                </button>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
