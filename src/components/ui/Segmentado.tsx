"use client";

import { m as motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { abaNoTab, aoTeclarNasAbas } from "./abas";

interface Opcao<T extends string> {
  id: T;
  rotulo: ReactNode;
  /** Texto para leitores de tela quando o rótulo é só ícone. */
  aria?: string;
}

interface Props<T extends string> {
  opcoes: readonly Opcao<T>[];
  valor: T;
  onChange: (valor: T) => void;
  /** Identificador único — a pílula ativa desliza entre as opções. */
  grupo: string;
  rotulo: string;
  tamanho?: "sm" | "md";
  /** Versão sobre fundo sempre escuro (Modo Sombra, foco). */
  escuro?: boolean;
  className?: string;
}

/** Controle segmentado (abas de largura igual) com pílula deslizante. */
export function Segmentado<T extends string>({ opcoes, valor, onChange, grupo, rotulo, tamanho = "md", escuro, className }: Props<T>) {
  const noTab = abaNoTab(opcoes.map((o) => o.id), valor);
  return (
    <div
      role="tablist"
      aria-label={rotulo}
      onKeyDown={aoTeclarNasAbas}
      className={cn(
        "grid gap-1 rounded-xl p-1",
        escuro ? "bg-white/8 ring-1 ring-inset ring-white/10" : "bg-superficie-2 ring-1 ring-inset ring-borda",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${opcoes.length}, minmax(0, 1fr))` }}
    >
      {opcoes.map((op) => {
        const ativo = op.id === valor;
        return (
          <button
            key={op.id}
            type="button"
            role="tab"
            aria-selected={ativo}
            aria-label={op.aria}
            tabIndex={op.id === noTab ? 0 : -1}
            onClick={() => onChange(op.id)}
            className={cn(
              "relative flex min-w-0 items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150 active:scale-[0.97] [&_svg]:size-4 [&_svg]:shrink-0",
              // Área de toque de 44 px no celular, sem mudar o visual (a extensão vai para a folga do trilho).
              tamanho === "sm"
                ? "h-8 px-2 text-xs alvo-toque"
                : "h-10 px-3 text-[13px] alvo-toque",
              ativo ? (escuro ? "text-sombra" : "text-tinta") : escuro ? "text-white/60 hover:text-white" : "text-texto-2 hover:text-tinta",
            )}
          >
            {ativo && (
              <motion.span
                layoutId={`seg-${grupo}`}
                className={cn("absolute inset-0 rounded-lg", escuro ? "bg-white" : "bg-superficie ring-1 ring-borda")}
                transition={{ type: "spring", stiffness: 520, damping: 46 }}
              />
            )}
            <span className="relative inline-flex min-w-0 items-center gap-1.5 truncate">{op.rotulo}</span>
          </button>
        );
      })}
    </div>
  );
}
