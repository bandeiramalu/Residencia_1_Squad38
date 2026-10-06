"use client";

import { m as motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  /** 0 → 1 */
  progresso: number;
  tamanho?: number;
  espessura?: number;
  /** Cor do traço (CSS). Padrão: verde do tema. */
  cor?: string;
  /** Cor do trilho (CSS). */
  trilho?: string;
  children?: ReactNode;
  className?: string;
  rotulo?: string;
  /** Anima a mudança de valor (desligue em timers que atualizam a cada segundo). */
  animar?: boolean;
}

/** Anel de progresso (meta diária, timer de foco, domínio). */
export function Anel({ progresso, tamanho = 120, espessura = 10, cor = "var(--color-verde)", trilho = "var(--color-borda)", children, className, rotulo, animar = true }: Props) {
  const r = (tamanho - espessura) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progresso));
  return (
    <div
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: tamanho, height: tamanho }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
      aria-label={rotulo}
    >
      <svg width={tamanho} height={tamanho} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={trilho} strokeWidth={espessura} />
        {animar ? (
          <motion.circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={r}
            fill="none"
            stroke={cor}
            strokeWidth={espessura}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={false}
            animate={{ strokeDashoffset: c * (1 - p) }}
            transition={{ type: "spring", stiffness: 90, damping: 20 }}
          />
        ) : (
          <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={cor} strokeWidth={espessura} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} />
        )}
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}
