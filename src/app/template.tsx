"use client";

import { m as motion } from "motion/react";

/**
 * Entrada entre telas: só opacidade (sem transform no wrapper, para não deslocar
 * elementos fixos nem causar salto de rolagem). Curta e nunca bloqueia o clique.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}>
      {children}
    </motion.div>
  );
}
