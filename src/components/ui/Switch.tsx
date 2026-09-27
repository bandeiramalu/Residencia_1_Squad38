"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

export function Switch({ ativo, onChange, rotulo }: { ativo: boolean; onChange: (v: boolean) => void; rotulo: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ativo}
      aria-label={rotulo}
      onClick={() => onChange(!ativo)}
      className={cn(
        "flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200",
        ativo ? "justify-end bg-verde" : "justify-start bg-verde-suave",
      )}
    >
      <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 34 }} className="size-6 rounded-full bg-white shadow" />
    </button>
  );
}
