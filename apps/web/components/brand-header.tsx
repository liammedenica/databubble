"use client";

import { useRouter } from "next/navigation";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@workspace/ui/components/sidebar";

export function BrandHeader() {
  const router = useRouter();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => router.push("/")}
          className="justify-center hover:bg-sidebar-accent/60">
          <span className="text-base font-semibold tracking-tight text-brand
            group-data-[collapsible=icon]:hidden">
            DataBubble
          </span>
          <span className="hidden text-base font-semibold tracking-tight text-brand
            group-data-[collapsible=icon]:inline">
            DB
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
