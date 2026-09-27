"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { indiceDaAba } from "@/components/shell/abas";

// Última aba visitada: define se a nova tela entra pela direita ou pela esquerda.
let ultimaAba = -1;

/** Transição de entrada entre as abas, no sentido da barra inferior. */
export default function Template({ children }: { children: React.ReactNode }) {
  const aba = indiceDaAba(usePathname());
  const [direcao] = useState(() => (ultimaAba < 0 || aba < 0 ? 0 : Math.sign(aba - ultimaAba)));

  useEffect(() => {
    ultimaAba = aba;
  }, [aba]);

  return (
    <motion.div
      initial={{ opacity: 0, x: direcao * 32, y: direcao ? 0 : 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.8 }}
    >
      {children}
    </motion.div>
  );
}
