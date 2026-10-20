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
import { ChevronRightIcon, ClockIcon, ArrowRightIcon } from "lucide-react";

type RecentDashboard = {
  id: string;
  name: string;
  tileCount: number;
  lastViewed: string;
};

const DEMO_RECENT: RecentDashboard[] = [
  { id: "d1", name: "Monthly Sales Report",    tileCount: 12, lastViewed: "2 hours ago"  },
  { id: "d2", name: "Marketing Campaign Q3",   tileCount:  8, lastViewed: "Yesterday"    },
  { id: "d3", name: "The Crumb — Bakery KPIs", tileCount: 15, lastViewed: "3 days ago"   },
  { id: "d4", name: "Pipeline overview",       tileCount:  6, lastViewed: "Last week"    },
  { id: "d5", name: "Signups funnel",          tileCount:  9, lastViewed: "2 weeks ago"  },
];

export function NavRecentDashboards({ items = DEMO_RECENT }: { items?: RecentDashboard[] }) {
  const router = useRouter();
  const { state } = useSidebar();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (state === "collapsed") setOpen(false); }, [state]);

  return (
    <SidebarGroup>
      <SidebarMenu>
        <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible" render={<SidebarMenuItem />}>
          <CollapsibleTrigger render={<SidebarMenuButton tooltip="Recent dashboards" />}>
            <ClockIcon className="!size-5 text-brand" strokeWidth={2.5} />
            <span className="font-semibold">Recent</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="relative border-l-0
              before:absolute before:left-0 before:top-4 before:bottom-4 before:w-px before:bg-border">
              {items.map(d => (
                <SidebarMenuSubItem key={d.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard?id=${d.id}`)}
                    className="w-full text-left flex items-center gap-2 min-w-0 h-8 px-2 rounded-md
                      text-sm font-medium text-muted-foreground hover:text-sidebar-foreground
                      hover:bg-sidebar-accent/70 transition-colors cursor-pointer"
                  >
                    <span className="truncate">{d.name}</span>
                  </button>
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
