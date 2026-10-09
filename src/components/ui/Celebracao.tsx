"use client";

import { AnimatePresence, m as motion, useReducedMotion } from "motion/react";
import { useUI } from "@/store/ui";

const CORES = ["#16a34a", "#22c55e", "#f59e0b", "#3b82f6"];

/** Partículas pré-calculadas: mesma explosão sempre, sem aleatoriedade no render. */
const PARTICULAS = Array.from({ length: 18 }, (_, i) => {
  const angulo = (i / 18) * Math.PI * 2 + (i % 3) * 0.2;
  const distancia = 80 + (i % 5) * 18;
  return {
    x: Math.cos(angulo) * distancia,
    y: Math.sin(angulo) * distancia - 60,
    rot: (i * 47) % 360,
    cor: CORES[i % CORES.length],
    forma: i % 3 === 0 ? "rounded-full" : "rounded-[2px]",
    tamanho: 5 + (i % 3) * 2,
  };
});

/** Pequena explosão de confete para conquistas (compra, medalha, nível). Com "reduzir movimento" não há confete. */
export function Celebracao() {
  const { celebracao } = useUI();
  const reduzir = useReducedMotion();
  if (reduzir) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] grid place-items-center overflow-hidden" aria-hidden>
      <AnimatePresence>
        {celebracao > 0 && (
          <motion.div key={celebracao} className="relative" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 0.7, duration: 0.4 }}>
            {PARTICULAS.map((p, i) => (
              <motion.span
                key={i}
                className={`absolute ${p.forma}`}
                style={{ width: p.tamanho, height: p.tamanho, background: p.cor }}
                initial={{ x: 0, y: 0, scale: 0.3, rotate: 0 }}
                animate={{ x: p.x, y: [0, p.y, p.y + 140], scale: 1, rotate: p.rot + 180 }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
