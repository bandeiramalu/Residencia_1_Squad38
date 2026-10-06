"use client";

import { m as motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Opcao<T extends string> {
  id: T;
  rotulo: ReactNode;
}

interface Props<T extends string> {
  opcoes: readonly Opcao<T>[];
  valor: T;
  onChange: (valor: T) => void;
  /** Identificador único — o sublinhado desliza entre as abas do mesmo grupo. */
  grupo: string;
  rotulo: string;
  /** Abas dividem a largura toda (poucas opções). */
  esticar?: boolean;
  className?: string;
}

/** Abas com sublinhado (padrão de rede social). Rola na horizontal quando não cabem. */
export function Abas<T extends string>({ opcoes, valor, onChange, grupo, rotulo, esticar, className }: Props<T>) {
  return (
    <div
      role="tablist"
      aria-label={rotulo}
      className={cn("sem-scrollbar flex overflow-x-auto shadow-[inset_0_-1px_0_var(--color-borda)]", className)}
    >
      {opcoes.map((op) => {
        const ativo = op.id === valor;
        return (
          <button
            key={op.id}
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange(op.id)}
            className={cn(
              "relative shrink-0 whitespace-nowrap rounded-t-md px-3 py-3 text-[14px] font-medium outline-offset-[-2px] transition-colors duration-150",
              esticar && "flex-1",
              ativo ? "text-tinta" : "text-texto-2 hover:bg-superficie-2 hover:text-tinta",
            )}
          >
            {op.rotulo}
            {ativo && (
              <motion.span
                layoutId={`aba-${grupo}`}
                aria-hidden
                className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-tinta"
                transition={{ type: "spring", stiffness: 600, damping: 48 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
