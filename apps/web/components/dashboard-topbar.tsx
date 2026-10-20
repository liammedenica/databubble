"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import {
  RefreshCwIcon, Share2Icon, SaveIcon, CheckIcon, ChevronRightIcon,
} from "lucide-react";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";
import { ButtonGroup } from "@/components/arc/button-group/button-group";
import { InlineEdit } from "@/components/arc/inline-edit/inline-edit";
import { ThemeSwitch } from "@/components/arc/theme-switch/theme-switch";
import { Breadcrumb } from "@/components/arc/breadcrumb/breadcrumb";
import { HoverCard } from "@/components/arc/hover-card/hover-card";

export function DashboardTopbar({
  name,
  onRename,
  onRefresh,
  onShare,
  onSave,
}: {
  name: string;
  onRename: (next: string) => void;
  onRefresh?: () => void;
  onShare?: () => void;
  onSave?: () => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  useEffect(() => { setThemeMounted(true); }, []);
  const theme: "light" | "dark" = resolvedTheme === "dark" ? "dark" : "light";

  const [refreshing, setRefreshing] = useState(false);
  const triggerRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    onRefresh?.();
    window.setTimeout(() => setRefreshing(false), 600);
  };

  const [sharedAt, setSharedAt] = useState(0);
  const [savedAt, setSavedAt] = useState(0);
  const shareLabel = sharedAt && Date.now() - sharedAt < 1600 ? "Copied" : "Share";
  const saveLabel  = savedAt  && Date.now() - savedAt  < 1600 ? "Saved"  : "Save";
  const shareIcon  = sharedAt && Date.now() - sharedAt < 1600
    ? <CheckIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
    : <Share2Icon className="w-3.5 h-3.5" strokeWidth={2.25} />;
  const saveIcon   = savedAt  && Date.now() - savedAt  < 1600
    ? <CheckIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
    : <SaveIcon className="w-3.5 h-3.5" strokeWidth={2.25} />;

  useEffect(() => {
    if (!sharedAt) return;
    const t = window.setTimeout(() => setSharedAt(0), 1700);
    return () => window.clearTimeout(t);
  }, [sharedAt]);
  useEffect(() => {
    if (!savedAt) return;
    const t = window.setTimeout(() => setSavedAt(0), 1700);
    return () => window.clearTimeout(t);
  }, [savedAt]);

  const handleShare = () => { setSharedAt(Date.now()); onShare?.(); };
  const handleSave  = () => { setSavedAt(Date.now());  onSave?.();  };

  const handleRename = async (next: string) => {
    await new Promise(resolve => window.setTimeout(resolve, 220));
    onRename(next);
  };

  const NAME_MAX = 50;
  const validateName = (next: string) => {
    if (!next.trim()) return "Name can't be empty";
    if (next.length > NAME_MAX) return `Keep it under ${NAME_MAX} characters`;
    return null;
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/60 px-4
      transition-[width,height] ease-linear">
      <SidebarTrigger className="-ml-1 [&_svg]:[stroke-width:2.5]" />

      <div className="h-5 w-px bg-border/60 mx-1.5" />

      <div className="[&_a]:font-medium" style={{ "--text-sm": "0.9375rem" } as React.CSSProperties}>
        <Breadcrumb items={[{ label: "My Dashboards", href: "/dashboards" }]} />
      </div>

      <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground mx-1.5" strokeWidth={2} />

      <div
        className="min-w-0 max-w-[22rem] flex items-center"
        style={{
          "--text-secondary": "var(--foreground)",
          "--inline-accent": "var(--brand)",
        } as React.CSSProperties}
      >
        <InlineEdit
          className="![--size:0.9375rem] ![--weight:600]"
          value={name}
          onSave={handleRename}
          label="Dashboard name"
          validate={validateName}
          variant="body"
          placeholder="Untitled dashboard"
        />
      </div>

      <HoverCard
        side="bottom"
        align="center"
        openDelay={200}
        content={
          <span className="text-xs font-medium text-foreground px-0.5">Refresh data</span>
        }
      >
        <button
          type="button"
          onClick={triggerRefresh}
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg
            text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors"
        >
          <RefreshCwIcon className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} strokeWidth={2.25} />
          <span className="sr-only">Refresh data</span>
        </button>
      </HoverCard>

      <div className="flex-1" />

      <ButtonGroup
        label="Dashboard actions"
        variant="solid"
        size="sm"
        collapseLabels={false}
        style={{
          background: "var(--brand)",
          borderColor: "var(--brand)",
          color: "white",
          "--bg-highlight": "color-mix(in oklch, var(--brand) 85%, black)",
          "--bg-highlight-pressed": "color-mix(in oklch, var(--brand) 72%, black)",
          "--bg-divider": "rgba(255,255,255,0.28)",
          "--bg-muted-ink": "rgba(255,255,255,0.9)",
        } as React.CSSProperties}
        items={[
          {
            id: "share",
            label: shareLabel,
            reserve: ["Share", "Copied"],
            icon: shareIcon,
            onSelect: handleShare,
          },
          {
            id: "save",
            label: saveLabel,
            reserve: ["Save", "Saved"],
            icon: saveIcon,
            onSelect: handleSave,
          },
        ]}
      />

      <div className="h-5 w-px bg-border/60 mx-1" />

      {themeMounted ? (
        <ThemeSwitch
          theme={theme}
          variant="reveal"
          iconOnly
          onThemeChange={next => setTheme(next)}
        />
      ) : (
        <div className="size-9 shrink-0" aria-hidden />
      )}
    </header>
  );
}
