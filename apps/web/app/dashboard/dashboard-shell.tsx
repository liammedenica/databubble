"use client";

import { useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { CanvasFab } from "@/components/canvas-fab";
import { ToastHost, type ToastMessage } from "@/components/toast-host";
import { DashboardCanvas } from "@/components/dashboard-canvas";
import { DashboardSheetFrame } from "@/components/dashboard-sheet-frame";
import {
  SidebarInset, SidebarProvider,
} from "@workspace/ui/components/sidebar";

export function DashboardShell({ user, initialName = "Untitled dashboard" }: {
  user: SupabaseUser | null;
  initialName?: string;
}) {
  const router = useRouter();
  const [dashboardName, setDashboardName] = useState(initialName);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [zoom, setZoom] = useState(0.7);
  const notify = (title: string, description?: string) =>
    setToast({ id: Date.now(), title, description });

  return (
    <SidebarProvider style={{
      "--sidebar-width": "calc(var(--spacing) * 72)",
      "--header-height": "calc(var(--spacing) * 16)",
    } as React.CSSProperties}>
      <AppSidebar variant="inset" user={user} />
      <SidebarInset className="min-w-0 overflow-hidden">
        <DashboardTopbar
          name={dashboardName}
          onRename={setDashboardName}
          onRefresh={() => { router.refresh(); notify("Data refreshed"); }}
          onShare={() => notify("Link copied", "Anyone with the link can view this dashboard")}
          onSave={() => notify("Dashboard saved", `"${dashboardName}" is up to date`)}
        />
        <DashboardSheetFrame zoom={zoom} onZoomChange={setZoom}>
          <DashboardCanvas />
        </DashboardSheetFrame>
        <CanvasFab zoom={zoom} onZoomChange={setZoom} />
      </SidebarInset>
      <ToastHost toast={toast} />
    </SidebarProvider>
  );
}
