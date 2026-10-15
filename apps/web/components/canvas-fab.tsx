"use client";

import { useEffect, useRef, useState } from "react";
import { MinusIcon, PlusIcon, SparklesIcon, SendHorizonalIcon, XIcon } from "lucide-react";
import { FloatingButtonGroup } from "@/components/arc/floating-button-group/floating-button-group";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const STEP = 0.1;

export function CanvasFab({ onZoomChange }: { onZoomChange?: (zoom: number) => void }) {
  const [zoom, setZoom] = useState(1);
  const [chatOpen, setChatOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const setZoomTo = (next: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(next * 100) / 100));
    setZoom(clamped);
    onZoomChange?.(clamped);
  };

  useEffect(() => {
    if (!chatOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) setChatOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setChatOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [chatOpen]);

  useEffect(() => { if (chatOpen) inputRef.current?.focus(); }, [chatOpen]);

  const percent = Math.round(zoom * 100);

  return (
    <>
      {chatOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-24 right-6 z-50 w-[360px] rounded-2xl border border-border/60
            bg-background shadow-2xl shadow-black/20 ring-1 ring-black/5 overflow-hidden
            animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60
            bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/40 dark:to-background">
            <span className="relative inline-flex">
              <span className="absolute inset-0 rounded-full bg-brand/35 blur-md" />
              <span className="relative inline-flex items-center justify-center size-7 rounded-full bg-brand text-white">
                <SparklesIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
              </span>
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground leading-tight">Ask AI</p>
              <p className="text-[11px] text-muted-foreground">Describe the chart or layout you want</p>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground
                hover:text-foreground hover:bg-sidebar-accent/60 transition-colors"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 py-6 min-h-[160px] flex items-center justify-center text-center">
            <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
              AI generation is coming soon. Try a prompt like <span className="text-foreground font-medium">&quot;Build me a monthly revenue overview&quot;</span>.
            </p>
          </div>

          <div className="px-3 pb-3">
            <div className="relative rounded-xl border border-border/60 bg-sidebar-accent/30
              focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/20 transition">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (draft.trim()) setDraft("");
                  }
                }}
                placeholder="Ask AI to build a chart…"
                rows={2}
                className="w-full resize-none bg-transparent px-3 py-2.5 pr-11 text-sm text-foreground
                  placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="button"
                disabled={!draft.trim()}
                className="absolute right-1.5 bottom-1.5 inline-flex items-center justify-center size-8 rounded-lg
                  bg-brand text-white hover:brightness-110 transition-[filter,background]
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <SendHorizonalIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50">
        <FloatingButtonGroup
          label="Canvas controls"
          variant="floating"
          size="md"
          tooltipSide="top"
          items={[
            {
              id: "zoom-out",
              label: "Zoom out",
              icon: <MinusIcon className="w-4 h-4" strokeWidth={2.25} />,
              iconOnly: true,
              onSelect: () => setZoomTo(zoom - STEP),
              disabled: zoom <= MIN_ZOOM,
              shortcut: "⌘-",
            },
            {
              id: "zoom-value",
              label: `${percent}%`,
              reserveLabels: ["200%"],
              onSelect: () => setZoomTo(1),
            },
            {
              id: "zoom-in",
              label: "Zoom in",
              icon: <PlusIcon className="w-4 h-4" strokeWidth={2.25} />,
              iconOnly: true,
              onSelect: () => setZoomTo(zoom + STEP),
              disabled: zoom >= MAX_ZOOM,
              shortcut: "⌘+",
            },
            { type: "separator" },
            {
              id: "ai",
              label: "Ask AI",
              icon: <SparklesIcon className="w-4 h-4" strokeWidth={2.25} />,
              iconOnly: true,
              pressed: chatOpen,
              onSelect: () => setChatOpen(o => !o),
            },
          ]}
        />
      </div>
    </>
  );
}
