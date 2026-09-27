"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import { fmt } from "@/lib/format";

/** Número que "rola" até o novo valor quando pontos/XP mudam. */
export function AnimatedNumber({ valor, className }: { valor: number; className?: string }) {
  const mv = useMotionValue(valor);
  const texto = useTransform(mv, (v) => fmt(Math.round(v)));

  useEffect(() => {
    const controle = animate(mv, valor, { duration: 0.7, ease: [0.22, 1, 0.36, 1] });
    return () => controle.stop();
  }, [mv, valor]);

  return <motion.span className={className}>{texto}</motion.span>;
}
