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
        quebrar ? "flex-wrap" : "sem-scrollbar -mx-4 overflow-x-auto px-4 pb-0.5 snap-x sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0",
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
              "relative shrink-0 snap-start whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-150 active:scale-[0.97]",
              ativo ? "text-superficie" : "bg-superficie text-texto ring-1 ring-inset ring-borda hover:bg-superficie-2",
            )}
          >
            {ativo && (
              <motion.span
                layoutId={`chip-${grupo}`}
                className="absolute inset-0 rounded-full bg-tinta"
                transition={{ type: "spring", stiffness: 520, damping: 46 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5 [&_svg]:size-3.5">{op.rotulo}</span>
          </button>
        );
      })}
    </div>
  );
}
