"use client";

import { animate, m as motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import { fmt } from "@/lib/format";

/** Número que "rola" até o novo valor quando pontos/XP mudam. */
export function AnimatedNumber({ valor, className }: { valor: number; className?: string }) {
  const mv = useMotionValue(valor);
  const texto = useTransform(mv, (v) => fmt(Math.round(v)));

  useEffect(() => {
    const controle = animate(mv, valor, { duration: 0.5, ease: [0.2, 0, 0, 1] });
    return () => controle.stop();
  }, [mv, valor]);

  return <motion.span className={className}>{texto}</motion.span>;
}
