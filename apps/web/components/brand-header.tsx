"use client";

import { useRouter } from "next/navigation";
import { BubbleLogo } from "@/components/bubble-logo";

export function BrandHeader() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push("/")}
      className="flex items-center justify-center gap-2 w-full h-full px-2 rounded-md
        hover:bg-sidebar-accent/40 cursor-pointer
        transition-[padding,gap] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:gap-0"
    >
      <BubbleLogo className="size-9 shrink-0 text-brand" />
      <span className="text-lg font-bold tracking-tight text-brand whitespace-nowrap overflow-hidden
        transition-[max-width,opacity] duration-200 ease-out
        max-w-[160px] opacity-100
        group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
        DataBubble
      </span>
    </button>
  );
}
