"use client";

import { useRouter } from "next/navigation";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@workspace/ui/components/sidebar";

export function BrandHeader() {
  const router = useRouter();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" onClick={() => router.push("/")}
          className="hover:bg-sidebar-accent/60 data-[state=open]:bg-sidebar-accent group/brand">
          <span className="relative shrink-0" aria-hidden>
            <span className="absolute inset-0 rounded-full bg-brand/35 blur-md
              scale-110 opacity-80 transition-opacity group-hover/brand:opacity-100" />
            <span className="relative block size-8 rounded-full bg-brand shadow-sm
              group-data-[collapsible=icon]:size-7" />
          </span>
          <span className="text-lg font-bold tracking-tight text-brand">
            Data Bubble
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
