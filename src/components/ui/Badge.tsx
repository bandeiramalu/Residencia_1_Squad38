import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/*
 * Contraste (DS §16, texto ≥ 4,5:1): o tom verde usa --color-acao; o âmbar de TEXTO é sempre
 * --color-ouro (#B45309 / #FBBF24) — nunca --color-ambar, que fica só para ícones e barras;
 * o alerta usa red-700 no tema claro (o #DC2626 sobre red-50 dá 4,41:1).
 */
export type TomBadge = "claro" | "verde" | "escuro" | "neutro" | "ambar" | "azul" | "alerta" | "contorno" | "ouro";

const TONS: Record<TomBadge, string> = {
  claro: "bg-verde-mclaro text-acento",
  verde: "bg-acao text-white",
  escuro: "bg-tinta text-superficie",
  ouro: "bg-ouro-claro text-ouro",
  neutro: "bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda",
  ambar: "bg-amber-50 text-ouro",
  azul: "bg-blue-50 text-cepi",
  alerta: "bg-red-50 text-red-700 dark:text-alerta",
  contorno: "bg-superficie text-texto ring-1 ring-inset ring-borda",
};

/** Etiqueta pequena e arredondada (PERGUNTA, Nível 3 – Estudante, Raro...). */
export function Badge({
  tom = "claro",
  maiuscula,
  className,
  children,
}: {
  tom?: TomBadge;
  maiuscula?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium leading-4 [&_svg]:size-3",
        maiuscula && "text-[10.5px]",
        TONS[tom],
        className,
      )}
    >
      {children}
    </span>
  );
}
