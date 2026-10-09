"use client";

import { m as motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { abaNoTab, aoTeclarNasAbas } from "./abas";

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
  const noTab = abaNoTab(opcoes.map((o) => o.id), valor);
  return (
    <div
      role="tablist"
      aria-label={rotulo}
      onKeyDown={aoTeclarNasAbas}
      className={cn(
        "flex gap-2",
        quebrar ? "flex-wrap toque:gap-y-3" : "sem-scrollbar -mx-4 overflow-x-auto px-4 pb-0.5 snap-x sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0 toque:-my-[6.25px] toque:py-[6.25px]",
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
            tabIndex={op.id === noTab ? 0 : -1}
            onClick={() => onChange(op.id)}
            className={cn(
              // Área de toque de 44 px no celular (a extensão é invisível; sem sobrepor a fileira vizinha).
              "alvo-toque shrink-0 snap-start whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-150 active:scale-[0.97]",
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
