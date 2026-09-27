"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Opcao<T extends string> {
  id: T;
  rotulo: ReactNode;
}

interface Props<T extends string> {
  opcoes: readonly Opcao<T>[];
  valor: T | null;
  onChange: (valor: T) => void;
  /** Identificador único do grupo — a pílula ativa desliza entre as opções. */
  grupo: string;
  rotulo: string;
  quebrar?: boolean;
  className?: string;
}

/** Carrossel de pílulas selecionáveis (filtros, abas, disciplinas). */
export function ChipGroup<T extends string>({ opcoes, valor, onChange, grupo, rotulo, quebrar, className }: Props<T>) {
  return (
    <div
      role="tablist"
      aria-label={rotulo}
      className={cn(
        "flex gap-2",
        quebrar ? "flex-wrap" : "sem-scrollbar -mx-4 overflow-x-auto px-4 pb-0.5 snap-x",
        className,
      )}
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
              "relative shrink-0 snap-start whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-200 active:scale-95",
              ativo ? "text-white" : "bg-white text-texto-2 ring-1 ring-inset ring-borda hover:text-verde hover:ring-verde-suave",
            )}
          >
            {ativo && (
              <motion.span
                layoutId={`chip-${grupo}`}
                className="absolute inset-0 rounded-full bg-verde shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5 [&_svg]:size-3.5">{op.rotulo}</span>
          </button>
        );
      })}
    </div>
  );
}
