"use client";

import { useRouter } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@workspace/ui/components/sidebar";
import {
  ChevronsUpDownIcon, BadgeCheckIcon, CreditCardIcon, LayoutGridIcon, LogOutIcon,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export function NavUser({ user }: { user: SupabaseUser }) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const name    = user.user_metadata?.full_name ?? user.email ?? "Account";
  const email   = user.email ?? "";
  const initial = (name[0] ?? "?").toUpperCase();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
          }>
            <span className="size-8 rounded-lg bg-brand text-white text-sm font-semibold flex items-center justify-center shrink-0">{initial}</span>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-60"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <span className="size-8 rounded-lg bg-brand text-white text-sm font-semibold flex items-center justify-center shrink-0">{initial}</span>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/dashboards")} className="cursor-pointer gap-2.5">
                <LayoutGridIcon className="size-3.5 text-muted-foreground" />
                <span>My Dashboards</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/account")} className="cursor-pointer gap-2.5">
                <BadgeCheckIcon className="size-3.5 text-muted-foreground" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/billing")} className="cursor-pointer gap-2.5">
                <CreditCardIcon className="size-3.5 text-muted-foreground" />
                <span>Billing</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}
              className="cursor-pointer gap-2.5 text-destructive focus:text-destructive">
              <LogOutIcon className="size-3.5" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
