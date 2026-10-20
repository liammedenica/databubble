"use client";

// A single "Data" dropdown. When expanded, shows the columns from the
// connected sheet. Each column is draggable — intended for binding to a tile.

import { useEffect, useState } from "react";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@workspace/ui/components/sidebar";
import {
  ChevronRightIcon, DatabaseIcon, PlusIcon,
  CalendarDays, Calculator, Grid, TextCursor,
} from "lucide-react";

type FieldKind = "number" | "date" | "category" | "text";
type DataField = { key: string; label: string; kind: FieldKind; sample: string };

const DEMO_FIELDS: DataField[] = [
  { key: "date",     label: "Date",     kind: "date",     sample: "2024-07-29" },
  { key: "revenue",  label: "Revenue",  kind: "number",   sample: "$8,420" },
  { key: "signups",  label: "Signups",  kind: "number",   sample: "254" },
  { key: "sessions", label: "Sessions", kind: "number",   sample: "4,180" },
  { key: "channel",  label: "Channel",  kind: "category", sample: "Online, In-store" },
  { key: "product",  label: "Product",  kind: "category", sample: "Croissant, Sourdough" },
  { key: "region",   label: "Region",   kind: "category", sample: "N, E, S, W" },
  { key: "notes",    label: "Notes",    kind: "text",     sample: "Launched referrals" },
];

const FIELD_ICONS: Record<FieldKind, React.ComponentType<{ className?: string }>> = {
  number: Calculator, date: CalendarDays, category: Grid, text: TextCursor,
};

export function NavData({ fields = DEMO_FIELDS }: { fields?: DataField[] }) {
  const { state } = useSidebar();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (state === "collapsed") setOpen(false); }, [state]);

  return (
    <SidebarGroup>
      <SidebarMenu>
        <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible" render={<SidebarMenuItem />}>
          <CollapsibleTrigger render={<SidebarMenuButton tooltip="Data" />}>
            <DatabaseIcon className="!size-5 text-brand" strokeWidth={2.5} />
            <span className="font-semibold">Data</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="relative mx-3.5 translate-x-px pl-2.5 py-0.5
              before:absolute before:left-0 before:top-3.5 before:bottom-11 before:w-px before:bg-border
              group-data-[collapsible=icon]:hidden">
              {fields.map(f => {
                const Icon = FIELD_ICONS[f.kind];
                return (
                  <div key={f.key}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData("application/x-databubble-field", f.key);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className="group/row flex items-center gap-2 pl-2 pr-2 h-7 rounded-md cursor-grab active:cursor-grabbing
                      select-none text-sm font-medium text-muted-foreground hover:text-sidebar-foreground
                      hover:bg-sidebar-accent/70 transition-colors">
                    <Icon className="w-4 h-4 shrink-0 text-muted-foreground group-hover/row:text-brand transition-colors" />
                    <span className="truncate flex-1">{f.label}</span>
                    <span className="text-[11px] text-muted-foreground/70 truncate max-w-[72px] text-right">
                      {f.sample}
                    </span>
                  </div>
                );
              })}
              <button type="button" disabled
                className="mt-1.5 w-full flex items-center justify-center gap-1.5 h-8 rounded-md border border-dashed border-border
                  text-xs text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors
                  disabled:opacity-60 disabled:cursor-not-allowed">
                <PlusIcon className="w-3 h-3" /> Connect source
              </button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
