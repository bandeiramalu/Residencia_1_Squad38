"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { ABAS, indiceDaAba } from "./abas";

/**
 * Barra de navegação inferior fixa (DS §10). Item ativo: fundo verde claro,
 * ícone e texto verdes. A pílula ativa desliza entre as abas.
 */
export function BottomNav() {
  const ativa = indiceDaAba(usePathname());

  return (
    <nav
      aria-label="Navegação principal"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] border-t border-borda bg-white/92 backdrop-blur-md"
    >
      <ul className="grid grid-cols-5 px-1.5 pt-1.5 pb-1.5">
        {ABAS.map((aba, i) => {
          const Icone = aba.icone;
          const ativo = i === ativa;
          return (
            <li key={aba.href}>
              <Link
                href={aba.href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-2xl px-1 py-2 transition-colors duration-200 active:scale-95",
                  ativo ? "text-verde" : "text-texto-2 hover:text-verde-2",
                )}
              >
                {ativo && (
                  <motion.span
                    layoutId="aba-ativa"
                    className="absolute inset-0 rounded-2xl bg-verde-claro"
                    transition={{ type: "spring", stiffness: 520, damping: 40 }}
                  />
                )}
                <Icone className="relative size-[22px]" strokeWidth={ativo ? 2.4 : 1.9} />
                <span className={cn("relative text-[11px] leading-none", ativo ? "font-bold" : "font-medium")}>{aba.rotulo}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
