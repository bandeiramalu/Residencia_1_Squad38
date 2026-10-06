"use client";

import { m as motion } from "motion/react";
import { cn } from "@/lib/cn";

interface Props {
  valor: number;
  max?: number;
  fina?: boolean;
  tom?: "verde" | "suave" | "ambar";
  className?: string;
  rotulo?: string;
}

const PREENCHIMENTO = {
  verde: "bg-verde",
  suave: "bg-verde/60",
  ambar: "bg-ambar",
};

/** Trilho neutro, preenchimento verde, formato arredondado (DS §9). */
export function ProgressBar({ valor, max = 100, fina, tom = "verde", className, rotulo }: Props) {
  const pct = Math.max(0, Math.min(100, (valor / Math.max(1, max)) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(valor)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={rotulo}
      className={cn("w-full overflow-hidden rounded-full bg-borda/70", fina ? "h-1.5" : "h-2.5", className)}
    >
      <motion.div
        className={cn("h-full rounded-full", PREENCHIMENTO[tom])}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
      />
    </div>
  );
}
