"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { PlusIcon } from "lucide-react";
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
  const router = useRouter();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16 justify-center py-0 group-data-[collapsible=icon]:!px-0">
        <BrandHeader />
      </SidebarHeader>
      <SidebarSeparator className="mx-2 bg-sidebar-border/60" />

      <div className="px-2 pt-5 group-data-[collapsible=icon]:px-1">
        <button
          type="button"
          onClick={() => router.push("/dashboards")}
          className="group/new flex items-center justify-center gap-2 w-full h-9 rounded-full
            bg-brand text-white text-sm font-semibold
            hover:brightness-110 active:brightness-95
            shadow-[0_2px_8px_-3px_var(--brand)]
            transition-all cursor-pointer
            group-data-[collapsible=icon]:gap-0"
        >
          <PlusIcon className="!size-4 shrink-0" strokeWidth={2.75} />
          <span className="whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ease-out
            max-w-[160px] opacity-100
            group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
            New dashboard
          </span>
        </button>
      </div>

      <p className="px-4 pt-5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-brand/80
        overflow-hidden whitespace-nowrap
        group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:select-none
        group-data-[collapsible=icon]:px-0">
        Workspace
      </p>

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
