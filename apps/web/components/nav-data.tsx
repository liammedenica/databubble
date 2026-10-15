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
const FIELD_CHIP: Record<FieldKind, string> = {
  number:   "bg-brand/10 text-brand",
  date:     "bg-emerald-500/10 text-emerald-500",
  category: "bg-amber-500/10 text-amber-500",
  text:     "bg-rose-500/10 text-rose-500",
};

export function NavData({ fields = DEMO_FIELDS }: { fields?: DataField[] }) {
  const { state } = useSidebar();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (state === "collapsed") setOpen(false); }, [state]);

  return (
    <SidebarGroup>
      <SidebarMenu>
        <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible" render={<SidebarMenuItem />}>
          <CollapsibleTrigger render={<SidebarMenuButton tooltip="Data"
            className="font-semibold group-data-[collapsible=icon]:[&_svg]:size-5" />}>
            <DatabaseIcon strokeWidth={2.25} />
            <span>Data</span>
            <span className="ml-auto mr-1 text-[10px] text-muted-foreground">{fields.length}</span>
            <ChevronRightIcon className="transition-transform duration-200 group-data-open/collapsible:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-1.5 space-y-0.5">
              {fields.map(f => {
                const Icon = FIELD_ICONS[f.kind];
                return (
                  <div key={f.key}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData("application/x-databubble-field", f.key);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className="group flex items-center gap-2.5 pl-2 pr-2 h-10 rounded-lg cursor-grab active:cursor-grabbing
                      select-none text-foreground/90 hover:text-foreground hover:bg-sidebar-accent/70 transition-colors">
                    <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${FIELD_CHIP[f.kind]}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[13px] font-medium truncate flex-1">{f.label}</span>
                    <span className="text-[10px] text-muted-foreground/70 truncate max-w-[72px] text-right">
                      {f.sample}
                    </span>
                  </div>
                );
              })}
              <button type="button" disabled
                className="mt-2 w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-dashed border-border
                  text-xs text-muted-foreground hover:border-brand/50 hover:text-brand transition-colors
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
