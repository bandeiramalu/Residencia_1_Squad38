"use client";

import { motion } from "motion/react";
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
  verde: "bg-linear-to-r from-verde-2 to-verde",
  suave: "bg-verde-2/70",
  ambar: "bg-linear-to-r from-amber-400 to-ambar",
};

/** Trilho verde muito claro, preenchimento verde, formato arredondado (DS §9). */
export function ProgressBar({ valor, max = 100, fina, tom = "verde", className, rotulo }: Props) {
  const pct = Math.max(0, Math.min(100, (valor / Math.max(1, max)) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(valor)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={rotulo}
      className={cn("w-full overflow-hidden rounded-full bg-verde-claro", fina ? "h-1.5" : "h-2.5", className)}
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
