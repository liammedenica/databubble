"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [saveSignal, setSaveSignal] = useState(0);
  const notify = useCallback((title: string, description?: string) =>
    setToast({ id: Date.now(), title, description }), []);

  // Latest-name ref so the keybind handler (registered once) always reads current state.
  const nameRef = useRef(dashboardName);
  useEffect(() => { nameRef.current = dashboardName; }, [dashboardName]);

  const handleRefresh = useCallback(() => {
    router.refresh();
    notify("Data refreshed");
  }, [router, notify]);
  const handleSave = useCallback(() => {
    notify("Dashboard saved", `"${nameRef.current}" is up to date`);
  }, [notify]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod || e.altKey || e.shiftKey) return;
      // Skip when typing in editable fields so the user can still save/select in inputs.
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        setSaveSignal(n => n + 1);
        handleSave();
      } else if (key === "r") {
        e.preventDefault();
        setRefreshSignal(n => n + 1);
        handleRefresh();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRefresh, handleSave]);

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
          onRefresh={handleRefresh}
          onShare={() => notify("Link copied", "Anyone with the link can view this dashboard")}
          onSave={handleSave}
          refreshSignal={refreshSignal}
          saveSignal={saveSignal}
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
