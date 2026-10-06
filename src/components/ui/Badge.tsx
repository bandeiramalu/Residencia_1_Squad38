import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TomBadge = "claro" | "verde" | "escuro" | "neutro" | "ambar" | "azul" | "alerta" | "contorno" | "ouro";

const TONS: Record<TomBadge, string> = {
  claro: "bg-verde-mclaro text-acento",
  verde: "bg-verde text-white",
  escuro: "bg-tinta text-superficie",
  ouro: "bg-ouro-claro text-ouro",
  neutro: "bg-superficie-2 text-texto-2 ring-1 ring-inset ring-borda",
  ambar: "bg-amber-50 text-ambar",
  azul: "bg-blue-50 text-cepi",
  alerta: "bg-red-50 text-alerta",
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
