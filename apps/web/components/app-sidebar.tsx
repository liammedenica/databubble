"use client";

import * as React from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail,
  SidebarSeparator,
} from "@workspace/ui/components/sidebar";
import { BrandHeader } from "@/components/brand-header";
import { NavRecentDashboards } from "@/components/nav-recent-dashboards";
import { NavCharts } from "@/components/nav-charts";
import { NavData } from "@/components/nav-data";
import { NavUser } from "@/components/nav-user";

export function AppSidebar({
  user,
  ...props
}: {
  user: SupabaseUser | null;
} & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16 justify-center py-0">
        <BrandHeader />
      </SidebarHeader>
      <SidebarSeparator className="mx-2 bg-sidebar-border/60" />
      <SidebarContent>
        <NavRecentDashboards />
        <NavCharts />
        <NavData />
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
