"use client";

import { AnimatePresence, motion } from "motion/react";
import { useUI } from "@/store/ui";

const CORES = ["#1e7149", "#288f5d", "#c4e1d3", "#e3f4eb", "#1050a6", "#f59e0b"];

/** Partículas pré-calculadas: mesma explosão sempre, sem aleatoriedade no render. */
const PARTICULAS = Array.from({ length: 28 }, (_, i) => {
  const angulo = (i / 28) * Math.PI * 2 + (i % 3) * 0.2;
  const distancia = 110 + (i % 5) * 26;
  return {
    x: Math.cos(angulo) * distancia,
    y: Math.sin(angulo) * distancia - 60,
    rot: (i * 47) % 360,
    cor: CORES[i % CORES.length],
    forma: i % 3 === 0 ? "rounded-full" : "rounded-[2px]",
    tamanho: 6 + (i % 4) * 2,
  };
});

/** Pequena explosão de confete para conquistas (compra, medalha, nível). */
export function Celebracao() {
  const { celebracao } = useUI();
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] grid place-items-center overflow-hidden" aria-hidden>
      <AnimatePresence>
        {celebracao > 0 && (
          <motion.div key={celebracao} className="relative" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 0.9, duration: 0.5 }}>
            {PARTICULAS.map((p, i) => (
              <motion.span
                key={i}
                className={`absolute ${p.forma}`}
                style={{ width: p.tamanho, height: p.tamanho, background: p.cor }}
                initial={{ x: 0, y: 0, scale: 0.3, rotate: 0 }}
                animate={{ x: p.x, y: [0, p.y, p.y + 140], scale: 1, rotate: p.rot + 180 }}
                transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
