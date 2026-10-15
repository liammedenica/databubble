"use client";

import { useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { CanvasFab } from "@/components/canvas-fab";
import { ToastHost, type ToastMessage } from "@/components/toast-host";
import {
  SidebarInset, SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { BubbleLogo } from "@/components/bubble-logo";

export function DashboardShell({ user, initialName = "Untitled dashboard" }: {
  user: SupabaseUser | null;
  initialName?: string;
}) {
  const router = useRouter();
  const [dashboardName, setDashboardName] = useState(initialName);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const notify = (title: string, description?: string) =>
    setToast({ id: Date.now(), title, description });

  return (
    <SidebarProvider style={{
      "--sidebar-width": "calc(var(--spacing) * 72)",
      "--header-height": "calc(var(--spacing) * 16)",
    } as React.CSSProperties}>
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <DashboardTopbar
          name={dashboardName}
          onRename={setDashboardName}
          onRefresh={() => { router.refresh(); notify("Data refreshed"); }}
          onShare={() => notify("Link copied", "Anyone with the link can view this dashboard")}
          onSave={() => notify("Dashboard saved", `"${dashboardName}" is up to date`)}
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BubbleLogo className="w-14 h-14 text-brand mx-auto mb-5" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Fresh canvas</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
              Drag a chart from the sidebar to get started.
            </p>
          </div>
        </main>
        <CanvasFab />
      </SidebarInset>
      <ToastHost toast={toast} />
    </SidebarProvider>
  );
}
