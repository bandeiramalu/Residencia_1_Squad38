"use client";

import { animate, m as motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect } from "react";
import { fmt } from "@/lib/format";

/** Número que "rola" até o novo valor quando pontos/XP mudam (com "reduzir movimento", troca na hora). */
export function AnimatedNumber({ valor, className }: { valor: number; className?: string }) {
  const mv = useMotionValue(valor);
  const texto = useTransform(mv, (v) => fmt(Math.round(v)));
  // `MotionConfig reducedMotion` não alcança o `animate()` imperativo: a preferência é lida aqui.
  const reduzir = useReducedMotion();

  useEffect(() => {
    const controle = animate(mv, valor, { duration: reduzir ? 0 : 0.5, ease: [0.2, 0, 0, 1] });
    return () => controle.stop();
  }, [mv, valor, reduzir]);

  return <motion.span className={className}>{texto}</motion.span>;
}
