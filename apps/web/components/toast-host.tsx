"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/arc/toast/toast";

export type ToastMessage = { id: number; title: string; description?: string };

export function ToastHost({ toast }: { toast: ToastMessage | null }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (!toast) return;
    setCurrent(toast);
    setOpen(true);
  }, [toast]);

  if (!current) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[min(26rem,calc(100vw-24px))]">
      <Toast
        key={current.id}
        title={current.title}
        description={current.description}
        open={open}
        onOpenChange={setOpen}
        duration={3800}
      />
    </div>
  );
}
