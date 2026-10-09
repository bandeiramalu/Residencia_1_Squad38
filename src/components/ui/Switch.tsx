"use client";

import { m as motion } from "motion/react";
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
        // No celular a área de toque chega a 44 × 44 px sem mudar o visual.
        "alvo-toque flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors duration-150 active:scale-95",
        ativo ? "justify-end bg-verde" : "justify-start bg-borda",
      )}
    >
      <motion.span layout transition={{ type: "spring", stiffness: 520, damping: 46 }} className="size-5 rounded-full bg-white shadow-sm" />
    </button>
  );
}
